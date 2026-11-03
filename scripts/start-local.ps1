# Run using Starta Hemstyrning.cmd from Explorer, outside Codex.
# ExecutionPolicy in the launcher applies only to that PowerShell process.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDirectory = Join-Path $projectRoot '.build-tools\local-server'
$serverProcess = $null
$ownsMutex = $false
$mutex = $null

function Find-LocalTool {
    param([string]$Name, [string[]]$Candidates)
    $command = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) { return $command.Source }
    foreach ($candidate in $Candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) { return [IO.Path]::GetFullPath($candidate) }
    }
    return $null
}

function Initialize-LocalTools {
    $userHome = [Environment]::GetFolderPath('UserProfile')
    $runtimeDependencies = Join-Path $userHome '.cache\codex-runtimes\codex-primary-runtime\dependencies'
    $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    $gitCandidates = @(
        (Join-Path $env:ProgramFiles 'Git\cmd\git.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Git\cmd\git.exe'),
        (Join-Path $userHome 'AppData\Local\Programs\Git\cmd\git.exe'),
        (Join-Path $runtimeDependencies 'native\git\cmd\git.exe')
    )
    if ($programFilesX86) { $gitCandidates += Join-Path $programFilesX86 'Git\cmd\git.exe' }
    $gitPath = Find-LocalTool -Name 'git.exe' -Candidates $gitCandidates
    $nodePath = Find-LocalTool -Name 'node.exe' -Candidates @(
        (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
        (Join-Path $userHome 'AppData\Local\Programs\nodejs\node.exe'),
        (Join-Path $runtimeDependencies 'node\bin\node.exe')
    )
    if (-not $gitPath) { throw 'Hittar ingen Git-installation, varken i PATH, vanliga Windows-mappar eller Codex runtime.' }
    if (-not $nodePath) { throw 'Hittar ingen Node.js-installation, varken i PATH, vanliga Windows-mappar eller Codex runtime.' }
    # Only the launcher's environment and its child servers receive these PATH entries.
    $env:Path = (Split-Path $gitPath) + ';' + (Split-Path $nodePath) + ';' + $env:Path
    $npmPath = Find-LocalTool -Name 'npm.cmd' -Candidates @(
        (Join-Path (Split-Path $nodePath) 'npm.cmd'),
        (Join-Path $env:APPDATA 'npm\npm.cmd'),
        (Join-Path $userHome 'AppData\Roaming\npm\npm.cmd'),
        (Join-Path $runtimeDependencies 'bin\npm.cmd')
    )
    if ($npmPath) {
        $env:Path = (Split-Path $npmPath) + ';' + $env:Path
    } else {
        $npmCli = Find-LocalTool -Name 'npm-cli.js' -Candidates @(
            (Join-Path (Split-Path $nodePath) 'node_modules\npm\bin\npm-cli.js'),
            (Join-Path $runtimeDependencies 'node\node_modules\npm\bin\npm-cli.js'),
            (Join-Path $projectRoot 'node_modules\npm\bin\npm-cli.js'),
            (Join-Path $projectRoot '.build-tools\package\bin\npm-cli.js')
        )
        if (-not $npmCli) { throw 'Git och Node.js hittades, men npm saknas. Installera Node.js med npm inkluderat.' }
        # The existing local npm distribution may have no Windows shim. Generate one
        # in the ignored runtime folder; never edit the bundled tools themselves.
        $toolsDirectory = Join-Path $runtimeDirectory 'tools'
        $null = New-Item -ItemType Directory -Path $toolsDirectory -Force
        $shim = '@echo off' + "`r`n" + '"' + $nodePath + '" "' + $npmCli + '" %*' + "`r`n"
        Set-Content -LiteralPath (Join-Path $toolsDirectory 'npm.cmd') -Value $shim -Encoding Default
        $env:Path = $toolsDirectory + ';' + $env:Path
    }
    Write-Host "Git: $gitPath"
    Write-Host "Node.js: $nodePath"
}

function Invoke-GitChecked {
    param([string[]]$GitArguments)
    # Windows PowerShell 5 treats redirected native stderr as ErrorRecords.
    # Capture those without mistaking harmless git warnings for fatal errors.
    $ErrorActionPreference = 'Continue'
    $output = @(& git @GitArguments 2>&1)
    if ($LASTEXITCODE -ne 0) { throw 'Git-kommandot misslyckades. Inga lokala filer har aterstallts eller raderats.' }
    return ($output -join "`n").Trim()
}

function Get-ProjectProcessIds {
    $processes = @(Get-CimInstance Win32_Process)
    $ids = [Collections.Generic.HashSet[uint32]]::new()
    $normalizedRoot = $projectRoot.Replace('/', '\').TrimEnd('\') + '\'
    foreach ($process in $processes) {
        if ($process.Name -notmatch '^(node|python|pythonw)\.exe$' -or -not $process.CommandLine) { continue }
        $command = $process.CommandLine.Replace('/', '\')
        # Absolute project path is required: never kill every node.exe on the PC.
        if ($command.IndexOf($normalizedRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            [void]$ids.Add([uint32]$process.ProcessId)
        }
    }
    # Include wrappers and subprocesses of the verified project processes.
    do {
        $added = $false
        foreach ($process in $processes) {
            if ($ids.Contains([uint32]$process.ParentProcessId) -and $ids.Add([uint32]$process.ProcessId)) { $added = $true }
        }
    } while ($added)
    return @($ids | ForEach-Object { $_ })
}

function Stop-ProjectServers {
    $ids = @(Get-ProjectProcessIds)
    foreach ($processId in $ids) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }
    $deadline = [DateTime]::UtcNow.AddSeconds(10)
    do {
        $remaining = @(Get-ProjectProcessIds)
        if ($remaining.Count -eq 0) { break }
        Start-Sleep -Milliseconds 300
    } while ([DateTime]::UtcNow -lt $deadline)
    if ($remaining.Count -gt 0) { throw 'Gamla projektprocesser kunde inte stangas. Ingen ny server startades.' }
    Write-Host "Stangda projektprocesser: $($ids.Count)"
}

function Test-HttpReady {
    param([string]$Address)
    try {
        $response = Invoke-WebRequest -Uri $Address -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch { return $false }
}

try {
    Set-Location -LiteralPath $projectRoot
    Initialize-LocalTools
    $nodeVersion = [version]((& node.exe --version).Trim().TrimStart('v'))
    if ($nodeVersion -lt [version]'22.13.0') { throw 'Hemstyrning kraver Node.js 22.13 eller senare.' }
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'package-lock.json'))) { throw 'package-lock.json saknas. Starten avbryts.' }
    $repoRoot = Invoke-GitChecked -GitArguments @('rev-parse', '--show-toplevel')
    if ([IO.Path]::GetFullPath($repoRoot) -ne $projectRoot) { throw 'Startskriptet maste ligga i Hemstyrnings repository.' }
    $digest = [Security.Cryptography.SHA256]::Create()
    try { $mutexKey = ([BitConverter]::ToString($digest.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot.ToLowerInvariant())))).Replace('-', '') }
    finally { $digest.Dispose() }
    $mutex = [Threading.Mutex]::new($false, "Local\HemstyrningStart-$mutexKey")
    try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { throw 'En annan Hemstyrning-start pagar redan. Vanta tills den ar klar.' }

    $branch = Invoke-GitChecked -GitArguments @('branch', '--show-current')
    if (-not $branch) { throw 'Git ar i detached HEAD. Valj en arbetsgren innan servern startas.' }
    Write-Host "Projekt: $projectRoot"
    Write-Host "Gren: $branch"
    Write-Host 'Kontrollerar senaste kod pa GitHub...'
    $previousPrompt = $env:GIT_TERMINAL_PROMPT
    $env:GIT_TERMINAL_PROMPT = '0'
    try {
        # Capture git output: credentials/remote URLs are never printed by this launcher.
        $ErrorActionPreference = 'Continue'
        $fetchOutput = @(& git fetch --quiet origin 2>&1)
        $fetchSucceeded = $LASTEXITCODE -eq 0
    } finally { $env:GIT_TERMINAL_PROMPT = $previousPrompt; $ErrorActionPreference = 'Stop' }
    if ($fetchSucceeded) {
        try { $upstream = Invoke-GitChecked -GitArguments @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}') }
        catch { throw 'Grenen saknar upstream. Starten avbryts eftersom senaste GitHub-version inte kan faststallas.' }
        $counts = (Invoke-GitChecked -GitArguments @('rev-list', '--left-right', '--count', "HEAD...$upstream")) -split '\s+'
        $ahead = [int]$counts[0]
        $behind = [int]$counts[1]
        $dirty = Invoke-GitChecked -GitArguments @('status', '--porcelain')
        if ($behind -gt 0) {
            if ($dirty -or $ahead -gt 0) { throw 'GitHub har ny kod men lokala andringar/commits maste forst sammanfogas. Starten avbryts; inget skrivs over.' }
            Write-Host "Hamtar $behind nya commits med fast-forward..."
            $null = Invoke-GitChecked -GitArguments @('merge', '--ff-only', $upstream)
        } elseif ($dirty) {
            Write-Host 'Senaste GitHub-kod finns lokalt. Egna osparade Git-andringar behalls och anvands.' -ForegroundColor Yellow
        }
        if ($ahead -gt 0) { Write-Host "Startar aven $ahead lokala commits som annu inte pushats." -ForegroundColor Yellow }
    } else {
        Write-Host 'GitHub kunde inte nas. Startar senast sparade lokala kod; GitHub-versionen kunde inte verifieras.' -ForegroundColor Yellow
    }
    $commit = Invoke-GitChecked -GitArguments @('rev-parse', '--short', 'HEAD')
    Write-Host "Kodversion: $commit (plus eventuella lokala andringar)"

    Stop-ProjectServers
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(5173, 8123) })
    if ($listeners.Count -gt 0) { throw 'Port 5173 eller 8123 anvands fortfarande av en annan process. Den stoppas inte automatiskt.' }
    $null = New-Item -ItemType Directory -Path $runtimeDirectory -Force
    $fingerprintPath = Join-Path $runtimeDirectory 'dependencies.sha256'
    $lockHash = (Get-FileHash -LiteralPath 'package-lock.json' -Algorithm SHA256).Hash
    $installedHash = if (Test-Path -LiteralPath $fingerprintPath) { (Get-Content -LiteralPath $fingerprintPath -Raw).Trim() } else { '' }
    $runner = Join-Path $projectRoot 'node_modules\concurrently\dist\bin\concurrently.js'
    if ($installedHash -ne $lockHash -or -not (Test-Path -LiteralPath $runner)) {
        Write-Host 'Synkroniserar beroenden med package-lock.json (npm ci)...'
        & npm.cmd ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'npm ci misslyckades. Ingen server startades.' }
        Set-Content -LiteralPath $fingerprintPath -Value $lockHash -Encoding ASCII
    }
    $stdout = Join-Path $runtimeDirectory 'server.log'
    $stderr = Join-Path $runtimeDirectory 'server-error.log'
    $nodePath = (Get-Command node.exe).Source
    # Use the existing dev scripts, but intentionally leave the paused model watcher off.
    # The frontend must fail on a busy port instead of silently choosing another one.
    $arguments = @(('"' + $runner + '"'), '--kill-others', '--names', 'HA,APP', '"npm run dev:simulator"', '"npm run dev --workspace @hemkontroll/dashboard -- --strictPort"')
    $serverProcess = Start-Process -FilePath $nodePath -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    @{ pid = $serverProcess.Id; startedAt = [DateTime]::UtcNow.ToString('o'); branch = $branch; commit = $commit; modelWatcher = 'paused' } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeDirectory 'process.json') -Encoding UTF8
    $deadline = [DateTime]::UtcNow.AddSeconds(75)
    $ready = $false
    do {
        $serverProcess.Refresh()
        if ($serverProcess.HasExited) { throw 'Serverprocessen avslutades under starten. Se loggarna i .build-tools\local-server.' }
        if ((Test-HttpReady 'http://127.0.0.1:8123/health') -and (Test-HttpReady 'http://127.0.0.1:5173/')) { $ready = $true; break }
        Start-Sleep -Milliseconds 600
    } while ([DateTime]::UtcNow -lt $deadline)
    if (-not $ready) { throw 'Servrarna blev inte redo inom 75 sekunder. Se loggarna i .build-tools\local-server.' }
    Write-Host "`nHemstyrning ar igang: http://localhost:5173/" -ForegroundColor Green
    Write-Host 'Kontrollpanelen: http://localhost:5173/control'
    Write-Host 'Modellbevakning och tester startas inte. Befintlig .env och Spotify-konfiguration behalls.'
    try {
        $status = Invoke-RestMethod -Uri 'http://127.0.0.1:5173/connection-api/status' -TimeoutSec 15
        if ($status.mode -eq 'real' -and $status.authenticated) { Write-Host "Home Assistant ansluten: $($status.entityCount) entiteter." -ForegroundColor Green }
        elseif ($status.mode -eq 'simulator') { Write-Host 'OBS: .env anvander simulator, inte riktig Home Assistant.' -ForegroundColor Yellow }
        else { Write-Host 'Home Assistant ar inte verifierad. Kontrollera anslutningsstatus i appen.' -ForegroundColor Yellow }
    } catch {
        Write-Host 'Appen ar igang men Home Assistant kunde inte verifieras. Kontrollera anslutningsstatus i appen.' -ForegroundColor Yellow
    }
    Write-Host "Loggar: $runtimeDirectory"
    Write-Host 'Servrarna fortsatter i bakgrunden nar du stanger detta fonster. Kor skriptet igen for att starta om.'
    exit 0
} catch {
    Write-Host "`nStarten misslyckades: $($_.Exception.Message)" -ForegroundColor Red
    if ($serverProcess) {
        # Only clean up this launch's process tree; do not kill unrelated listeners.
        $allProcesses = @(Get-CimInstance Win32_Process)
        $newIds = [Collections.Generic.HashSet[uint32]]::new()
        [void]$newIds.Add([uint32]$serverProcess.Id)
        do {
            $added = $false
            foreach ($process in $allProcesses) {
                if ($newIds.Contains([uint32]$process.ParentProcessId) -and $newIds.Add([uint32]$process.ProcessId)) { $added = $true }
            }
        } while ($added)
        foreach ($processId in $newIds) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }
    }
    exit 1
} finally {
    if ($ownsMutex -and $mutex) { $mutex.ReleaseMutex() }
    if ($mutex) { $mutex.Dispose() }
}
