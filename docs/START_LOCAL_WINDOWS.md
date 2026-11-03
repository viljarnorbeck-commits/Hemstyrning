# Starta Hemstyrning i Windows

Dubbelklicka pa `Starta Hemstyrning.cmd` i projektmappen i Utforskaren.
Starta filen fran din vanliga Windows-session, inte fran en Codex-terminal.
Skriptet behover normalt inte administratorsbehorighet och andrar inga brandvaggsregler
eller permanenta PowerShell-/Codex-behorigheter. Launcherns ExecutionPolicy galler
endast den nya PowerShell-processen.

Git och Node.js behover inte finnas i Utforskarens PATH. Skriptet letar aven i vanliga
installationsmappar och den befintliga Codex-runtime-mappen under anvandarprofilen.
Om npm endast finns som lokal npm-cli.js skapas en npm.cmd i den ignorerade loggmappen.
Endast startprocessens PATH kompletteras; Windows permanenta PATH andras inte.

Starten gor foljande:

1. Kontrollerar Git, Node.js 22.13+ och projektets repository.
2. Hamtar aktuell information fran `origin` och foljer den nuvarande grenens upstream.
   En ren arbetskopia uppdateras med enbart fast-forward. Lokala andringar och commits
   behalls. Om GitHub har nya commits som kraver sammanfogning avbryts starten utan
   reset, stash eller overskrivning. Om GitHub inte kan nas startas lokal kod med en
   tydlig varning om att GitHub-versionen inte kunde verifieras.
3. Stanger Node-/Python-processer med en absolut sokvag in i detta repository, inklusive
   deras barnprocesser. Andra projekts processer stoppas inte. Om nagon annan process
   fortfarande anvander 5173 eller 8123 avbryts starten i stallet for att doda den.
4. Kor `npm ci` vid forsta starten och nar package-lock.json har andrats. Forsta starten
   kan darfor ta langre tid och kraver atkomst till paketregistret.
5. Startar befintlig backend och Vite med projektets utvecklingsskript. Frontend anvander
   strikt port 5173. Modellbevakningen forblir pausad; inga tester eller byggen kors.
6. Kontrollerar appen, backendens `/health` och lasande Home Assistant-status. En startad
   app ar inte samma sak som en fungerande HA-anslutning; dessa rapporteras separat.

App: http://localhost:5173/
Kontrollpanel: http://localhost:5173/control
Skarmhantering: http://localhost:5173/dev/screens

Servrarna fortsatter i bakgrunden nar startfonstret stangs. Kor samma fil igen for att
starta om dem. Samtidiga starter i samma Windows-session sparras med en mutex.
Wifi-proxyn pa 5174 startas inte av detta skript.

Loggar och versions-/processkvitto ligger lokalt i `.build-tools/local-server/`.
`.env`, Spotify-inloggning, HA-styrbehorighet och appens data andras inte av skriptet.
Statuskontrollen skickar inga HA-styrkommandon. Om HA fortfarande inte nas fran en vanlig
Windows-start behover natverks-/anslutningsfelet felsokas; skriptet kringgar inga sparrar.
