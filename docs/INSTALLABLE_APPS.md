# Hemstyrning 2.0 – appar, server och installation

## Vad som faktiskt finns

Gemensam frontend och backend har återanvänts. `/` är Hem med levande 3D och sparad
startkamera, `?view=3d` är fri 3D, `?view=list` är hela enhetslistan, `/control`
är modellfri kontrollpanel, `/settings` konfigurerar förinställningar/energi och
`/install` visar installationsalternativ. `/editor` och `/dev/simulator` finns kvar.

| Plattform | Projekt | Byggt här | Exekverat på målplattform |
|---|---|---|---|
| Web/PWA | befintlig Vite-app + manifest/service worker | Ja | Chromium, desktop/mobilstorlekar |
| Android | `apps/android`, flavor mobile | Debug-APK + osignerad release-AAB | Nej, ingen ansluten enhet/emulator |
| Google TV | samma Android-kod, flavor tv | Debug-APK + osignerad release-AAB | Nej, ingen TV/KVM-emulator här |
| Windows | `apps/windows`, Tauri 2 | Inget EXE/MSI | Rust/MSVC/Windows SDK saknas; .NET-runtime på Windows-värden räcker inte |
| iOS | `apps/ios/Hemstyrning.xcodeproj` | Ingen signerad IPA | Kräver macOS/Xcode och Apple-team/signering |

Verkliga lokala paket:

- `artifacts/android/Hemstyrning-Android-2.0.0-debug.apk`
- `artifacts/tv/Hemstyrning-TV-2.0.0-debug.apk`
- `apps/android/app/build/outputs/bundle/mobileRelease/app-mobile-release.aab`
- `apps/android/app/build/outputs/bundle/tvRelease/app-tv-release.aab`

APK:erna verifieras med Android `apksigner` och är **debugsignerade**, inte
produktionssignerade. AAB:erna är byggunderlag, inte installerbara signerade
Play-releasepaket. Installationssidan annonserar endast existerande publicerade
filer; Windows och iOS får ingen falsk nedladdningsknapp.

## Varför dessa tunna appar

Android/iOS använder systemets WebView/WKWebView utan JavaScript-nativebrygga,
vilket undviker Capacitor-pluginbehörigheter åt fjärrinnehåll. Windows använder
Tauri/WebView2: endast den paketerade lokala anslutningsguiden har native-IPC;
serverfönstren får inga nativebehörigheter. Inga appar innehåller simulator,
HA-token, personhistorik eller stora modellkopior. Alla vyer hämtas från den
valda HTTPS-servern och återanvänder samma Connection, objekt och skärmkanal.

URL, roll och senast använda vy är inte hemligheter. Dessa sparas i
SharedPreferences/UserDefaults/webblagring. Inloggningssessionen är serverns
Secure/HttpOnly-cookie, inte en HA-token i localStorage. Android/Apple använder
plattformens beständiga cookielager. Windows kan öppna flera separata fönster
från anslutningsguiden. Den lokala guiden kommer ihåg adress/roll; servervyerna
kommer ihåg sin senaste vy. Automatiskt återöppnande av senaste Windows-fönster
är ännu inte implementerat.

## Lokal HTTPS och behörigheter

Utveckling: `npm run dev` på **localhost:5173**, simulator **localhost:8123**.
Utvecklingsservern ska inte exponeras på LAN. Nativeappar accepterar HTTPS,
inte generellt oskyddad HTTP. Mobilen kan inte använda datorns localhost-adress.

För en fysisk enhet behövs serverdrift via exempelvis Caddy:

1. Bygg frontend med `npm run build:web`.
2. Kör `node scripts/create-user.mjs tv viewer`, skapa även controller och admin.
   Lösenord anges dolt, minst12 tecken. Filen `data/users.json` innehåller saltad
   scrypt-hash och har600-rättigheter. Den är Git-ignorerad.
3. Ange lokalt i serverns ignorerade `.env`:

   ```env
   HEM_PUBLIC_ORIGIN=https://hemstyrning.local
   HEM_USERS_FILE=/absolut/sökväg/data/users.json
   HEM_PROXY_SECRET=<slumpmässig hemlighet på minst 32 tecken>
   HA_SIM_HOST=127.0.0.1
   HA_MODE=simulator
   ```

4. Starta Node-backend lokalt med `npm run start:simulator`. Backend serverar den
   byggda frontendens filer och API-aliaser direkt. Konfigurera `deployment/Caddyfile`
   med `HEM_HOST=hemstyrning.local` och samma proxyhemlighet. Caddy är LAN-ingången.
5. Installera och lita uttryckligen på Caddys privata rot-CA på varje klient,
   eller använd certifikat från en redan betrodd CA med rätt DNS-namn. Androids
   nätverkssäkerhet tillåter systemets och användarens betrodda CA, men förbjuder
   cleartext och kringgår aldrig TLS-kontrollen. Certifikatfel stoppas.
6. Välj servern i appguiden och logga in på serverns sida.

Proxyhemligheten måste finnas för alla HTTP- och WebSocket-anrop i distributions-
läge; den skickas inte till frontend. Sessioner gäller7 dagar och sparas hashade i en privat600-fil bredvid användarfilen.
De överlever serveromstart, men ändrat lösenord/roll eller utgången giltighet kräver
ny inloggning. Roll/URL/parkopplingsregister finns kvar.
Viewer får läsa och registrera visningsskärm, controller får kontrollerade
HA-kommandon och styra parkopplad skärm, admin får även konfigurera/developera.
Parkopplingskod ersätter aldrig inloggning eller `HA_ALLOW_CONTROL`-spärren.

HTTPS-servern fungerar på LAN utan Nabu Casa eller publik internetåtkomst.
Ett Avahi-exempel finns i `deployment/hemstyrning.service`; justera värdnamnet
så det matchar certifikatet. Androidguiden söker `_hemstyrning._tcp`. iOS- och
Windowsguiden använder tills vidare manuell adress; Bonjour-discovery i dessa
appar återstår. iOS innehåller lokalnätverksbeskrivning och Bonjour-service i plist.

## Installation och byggning

### PWA

Windows/Android: webbläsarens **Installera app**. iPhone/iPad: Safari → Dela →
**Lägg till på hemskärmen**, öppna som webbapp. Manifestet har eget namn, ikoner,
fristående visning och genvägar. Service worker ger en tydlig frånkopplingssida;
API, personlig konfiguration, telemetri och modeller lagras aldrig i dess cache.
Offlinekommandon köas inte. Faktisk Safari-installation behöver verifieras på iOS.

### Android och TV

Verktyg som användes här: JDK17, SDK35/Build Tools35, Gradle8.9, AGP8.7.3.
Lokalt ligger verktyg och debugnyckel i ignorerade `.build-tools/`.

```bash
npm run build:android
npm run build:tv
bash scripts/build-android.sh bundleMobileRelease bundleTvRelease
adb install -r artifacts/android/Hemstyrning-Android-2.0.0-debug.apk
adb install -r artifacts/tv/Hemstyrning-TV-2.0.0-debug.apk
```

Sätt `JAVA_HOME`, `ANDROID_HOME` och installera Gradle enligt scriptets lokala
sökväg, eller använd det reproducerbara CI-jobbet med samma versionsval.
För signerad release används enbart miljövariabler:
`HEM_ANDROID_KEYSTORE`, `HEM_ANDROID_STORE_PASSWORD`, `HEM_ANDROID_KEY_ALIAS`,
`HEM_ANDROID_KEY_PASSWORD`. Nycklar/lösenord ska aldrig committas. Kör därefter
`assembleMobileRelease`, `assembleTvRelease` eller motsvarande bundle-task.
Target SDK35 är för direktinstallation; kontrollera aktuellt Play-targetkrav före
butikspublicering och uppgradera verktygen vid behov.

TV-flavorn har Leanback Launcher, touchscreen ej obligatorisk, egen320×180-banner,
landskapsläge och TV-profil som standard. Pilknappar flyttar fokus; Enter/OK
aktiverar endast vald kontroll. Back navigerar tillbaka. Långtryck Back eller
Menu öppnar native appinställningar. Vanlig mobilversion stöder rotation och
systemfält. Ingen fysisk installation/rotations-/TV-starttest är gjord här.

### Windows

```bash
npm run build:windows
```

Kör på Windows med Rust, MSVC och WebView2-förutsättningar. Tauri bygger NSIS EXE
eller MSI med avinstallation och Startmenygenväg i
`apps/windows/target/release/bundle/`. WebView2 offline-installationskomponent
konfigureras för distribution utan krav på internet hos slutanvändaren.
CI-jobbet **Native applications / windows** är förberett. Ingen kodsignering eller
updaternyckel är påhittad; unsigned paket kan ge SmartScreen-varning. Windows-
installation och native fullskärmsbeteende återstår att köra på Windows.

### iOS

```bash
npm run build:ios
# På macOS, riktig release med lokalt Apple-team:
xcodebuild -project apps/ios/Hemstyrning.xcodeproj -scheme Hemstyrning \
  -configuration Release -archivePath artifacts/ios/Hemstyrning.xcarchive \
  DEVELOPMENT_TEAM=<ditt team> archive
```

Öppna projektet i Xcode, välj team, bundle-ID och fysisk iPhone/iPad för installation.
Exportera arkivet med teamets lokala ExportOptions.plist för TestFlight/IPA.
CI-macOS bygger ett osignerat simulatorprojekt. Ingen signerad IPA eller App Store-
godkännande finns. Apples granskningskrav för en huvudsakligen webbaserad app måste
bedömas före butikspublicering.

## Versioner och uppdateringar

Gemensam version2.0.0, Android code20000. Paketens källrevision finns i lokala
releaseindexet. `scripts/publish-local-release.mjs <plattform> <verklig fil>`
kopierar filen till `data/releases`, beräknar SHA-256 och uppdaterar `/install`.
Det lokala indexet/paketen är utanför Git. Kör publiceringen igen efter commit
för den fastställda källrevisionen. Original-GLB/PNG ändras aldrig.

Frontend distribueras från den uttryckligen valda HTTPS-servern, som i en
webbläsare. Nativebryggor är inte tillgängliga för detta innehåll. Nativeändringar
kräver nya installerbara paket via betrodd signerad distributionskanal. Ingen
osignerad automatisk nativeuppdaterare körs. PWA-service worker använder
versionsnamngiven cache och tar inte över en öppen session automatiskt. API-
protokoll1 kontrolleras i bootstrap; inkompatibel server visar uppdateringsmeddelande.

## Grafik och kvarstående mätning

Ultra/Standard/Mobile/TV väljs per klient i `/device`. TV siktar på30 FPS och
pixelkvot högst1, använder 222998 trianglar och1024-textur. Mobile använder2048-textur med originalets mobila geometri.
Genererade modeller är cirka1,6/4 MB; originalets8192-textur finns kvar.
En1024 RGBA-textur med mipmaps kräver ungefär5,3MiB före övriga GPU-resurser,
inte originalets cirka341MiB. Text och UI påverkas inte av canvasens pixelkvot.

Diagnostiken visar profil, bildintervall, draw calls, trianglar, texturer,
renderingsupplösning och JS-heap när webbläsaren exponerar detta. Heap är inte
VRAM och bildintervall är inte GPU-tid. Ingen fysisk Streamer-mätning, långkörning
eller Android TV-emulering är genomförd: miljön saknar ansluten enhet och `/dev/kvm`.
Mät på en riktig TV eller KVM-emulator innan någon prestandagaranti lämnas.

Serverrenderad ström är endast en undersökt reservidé: exempelvis en renderings-
klient på kraftigare dator som sänder WebRTC-video, med fortsatt separat skärm-
kanal för fokus/följning. Ingen sådan ström ersätter lokal rendering och ingen
streamingserver har påståtts vara implementerad.

## Primära referenser

- [Android TV: manifest, Leanback, banner och fjärrkontroll](https://developer.android.com/training/tv/get-started/create).
- [Tauri Windows-installation](https://v2.tauri.app/distribute/windows-installer/).
- [Caddy HTTPS/reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
- [HA scener](https://www.home-assistant.io/integrations/scene) och [skript](https://www.home-assistant.io/integrations/script).

Skapa ett lokalt releasearkiv med `npm run release:package` (Python3). Endast
verkliga APK/EXE/MSI/IPA/AAB, SHA-manifest och installationsguide inkluderas; inga
nycklar eller datafiler. Kontrollera versionssamstämmighet med `npm run check:versions`.

## Utförd verifiering 2026-10-30

126 enhets-/integrationstester, typkontroll och båda webb/backendbyggen godkända.
Alla35 Playwright-flöden passerade tillsammans; därefter5 riktade appflöden efter
sista mobila visningsrättningen. PWA-manifest/ikoner och aktiv service worker har
verifierats i produktionsservern via Chromium. Två separata browserkontexter
verifierar parkoppling, bilfokus, klimatisering, LUBA-follow, Halloween/stopp och
återgång till standardvyn. Hublagring samt hashade sessionsinloggningar återläses
över instans-/serveromstart i tester. Androidpaketen är byggda och apksigner-
verifierade. Inga Android/TV-enheter eller emulatorer hittades av adb. Windows-,
iOS- och fysisk TV-testning är alltså uttryckligen inte redovisad som utförd.
