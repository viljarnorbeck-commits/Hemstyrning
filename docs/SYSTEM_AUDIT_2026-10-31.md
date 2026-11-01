# Systemgranskning 2026-10-31

Påbörjad 31 oktober, slutverifierad 1 november 2026. Elva felgrupper har rättats. Riktig HA kan inte liveverifieras eftersom Windows nekar nätåtkomst.

## Underlag och avgränsning

Granskningen utgår från den lokala implementationen på `codex/design-shell`, bascommit `772035e7d83420f1dc191dd4c305d3613910ce0b`. De tidigare uppdragens kod och senaste referensdesign finns i denna version. Ingen äldre GitHub-version har återställts. Tidigare dokumentationsnoteringar om att tester inte körts beskriver respektive tidigare uppdrag, inte denna granskning.

Lästa underlag: projektets båda AGENTS-filer, PROJECT_MEMORY, inventeringen, APP_SHELL_DESIGN, SHARED_VIEW och HA_FUNCTION_COVERAGE samt aktuell implementation och Git-diff. Den äldre referensen PLAN_HOME_ASSISTANT_3D.md finns inte på den anvisade platsen.

## Faktisk arkitektur

| Del | Aktuell implementation |
| --- | --- |
| Navigation | AppShell byter sidmodul via History API. Moduler har ready/activate/dispose. Föregående vy behålls tills nästa är klar. Samma sidas Hem-länk återställer gemensam visning. |
| 3D | En beständig GardenScene/canvas. Hem är huvudvy, övriga sidor använder diskret bakgrund med begränsad bildfrekvens. Objekt, sparade bindningar och originalmodell återanvänds. |
| HA | app-session äger en gemensam Connection. PageScope äger sidans lyssnare/timers. Backend håller token och proxy, statusström, registerläsning och domänspecifika kommandon med behörighetskontroll. |
| Entiteter | State-ström och begränsad entity/device/area-metadata sammanförs i katalogen. entityPreferences och sensorkopplingar sparas i befintlig SceneConfig. Objekt kan registreras utan 3D-position. |
| Spotify | En gemensam MusicPanel, separat från HA-media. Samma server-API/OAuth/tokenhantering/BrowserSpeaker används i Hem, kompakt kontrollpanel och full musikvy. |
| Skärmar | ScreenLink och serverns ViewCoordinator. Versions-/epochstyrda HOME/FOCUS/FOLLOW/FREE-lägen, femminuterstimeout för tillfälliga lägen och lokalt permanent kameratittarläge. Ingen manuell parkopplingskod. |
| Design | Gemensam navigation, panelmaterial, Moving Border och switch.css. Kontrollpanelens reference-right har tre separata ytor: förinställningar, dynamisk detalj och kompakt musik. |

## Säker testmiljö

Den vanliga utvecklingsprocessen stoppades inför testerna. `.env` och verklig `data/scene.json` hashades. En separat `npm run dev` startades med processvariablerna `HA_MODE=simulator`, `HA_DATA_DIRECTORY=data/system-audit` och `HEM_VIEW_TEST_CLOCK=true`. HA_ALLOW_CONTROL ändrades inte. Inga tokenvärden har skrivits ut.

Playwrights globala uppstart verifierar simulatorläge innan något styrprov tillåts. Simulatorns scen återställs mellan konfigurationsprov, och gemensam skärmvisning återställs inför varje test. Spotify-API/SDK mockas i styrproven. HA-registerprovet använder en lokal falsk WebSocket-server. Inga riktiga lampor, lås, termostater, laddboxar, fordon eller robotar styrs. Ingen verklig Spotify-uppspelning startas.

## Upptäckta fel och rättningar

| Fel | Orsak | Rättning / berörda filer |
| --- | --- | --- |
| TypeScript-kontrollen misslyckades | Domändel kunde typmässigt vara undefined och en ljusgren jämfördes igen efter en tidig return | bridge.ts och control.ts: typavgränsning efter validering, borttagna onåbara grenar |
| Upptäckt lampa kunde inte registreras från nya detaljen | Registreringsknappen saknades i den ersatta lampvyn | control.ts: återinförd knapp, samma befintliga registreringsväg och behörigheter |
| Knappstilen påverkade synlighet och fasta positioner | Generell skin-regel satte display och position med för hög specificitet | moving-border.css: layout lämnas till komponenterna; positionens standard får låg specificitet, hidden respekteras |
| Kompakt musik klipptes på små skärmar | Globala label-marginaler/kolumnlayout och för breda kolumner | control-right.css: lokal volymrad, panelbaserade container queries och anpassade radhöjder |
| Sparning i entitetskatalog kunde nollställa vyn | Katalogens data-save bubblde till inställningssidans äldre handler | entity-catalog.ts: katalogens knapphändelse avslutas lokalt |
| Numerisk hjälpare accepterade otillåtna steg | Servern validerade min/max men inte annonserat step | bridge.ts: stegvalidering inklusive tolerans för flyttal; negativt integrationsprov |
| Bilens vänsterkort kunde visa äldre batteridata | Statusraden saknade detaljvyns kontroll av aktuell verifierad bilanslutning | control.ts: verklig källa kräver verifierad aktuell anslutning; laddbox och bil hålls isär |
| Spotify kunde sakna spellistor/enheter efter sidbyte | mountPage återanvände ansluten spelare men laddade bara kön | music-panel.ts: ladda också enheter och spellistor när fullvyn monteras |
| Produktionsserverns direktlänkar gav Cannot GET | Serverns explicita SPA-lista saknade de nya funktionsrutterna | server.ts: energi, bilar, klimat, belysning, robotar, säkerhet och musik får samma SPA-ingång. spa-routes.test.ts testar direktlänkar och att okända URL:er fortfarande ger 404 |
| Enhetsrubrik och brytare klipptes på surfplatta | Centrerad flexlayout kunde placera överflöd ovanför ett scrollområdes nåbara överkant | control-right.css: safe center med flex-start som reserv; geometriskt regressionstest kontrollerar att rubriken nås vid scrollposition noll |
| Orienteringstipset täckte information permanent | Stående reservlayout behöll ett överlägg under hela sessionen | app-shell.ts: tipset visas kort och döljs automatiskt efter sex sekunder; responsiv stående layout och orienteringslås behålls |

Äldre testselektorer har uppdaterats till senaste kontrollpanelen. Stoppbara skript testas via samma bekräftade brytare som start, inte en borttagen separat stoppknapp. Tester för funktionskontroller använder en liten GLB-fixtur även på sidor som nu har beständig 3D-bakgrund. Separata modell-/texturtester använder fortfarande originalmaterialet. Inga tester har tagits bort eller hoppats över för att dölja fel.

## Testresultat

Slutresultat: **159 enhets-/integrationstester och 62 Playwright-tester godkända, 0 misslyckade och 0 överhoppade**. Inga automatiska styrprov gick mot riktig utrustning. Lokala körloggar finns under den ignorerade katalogen `.build-tools/`.

| Kontroll | Godkända fall | Misslyckade | Överhoppade | Resultat |
| --- | ---: | ---: | ---: | --- |
| npm run typecheck | – | 0 | – | Godkänd, strict/legacy TypeScript |
| npm test, backend | 63 | 0 | 0 | 20 testfiler |
| npm test, frontend | 96 | 0 | 0 | 33 testfiler |
| npm run build:web | – | 0 | – | Produktionsbygge godkänt |
| HEM_E2E_BASE_URL=http://localhost:8123 npm run test:e2e | 62 | 0 | 0 | Hela sviten, 13,3 minuter |
| npm run verify:model | 3 modellvarianter | 0 | – | Originalhash, PNG, UV och geometri godkända |
| npm run check:versions | – | 0 | – | Gemensam version 2.0.0 verifierad |

Slutloggar: audit-final-typecheck.log, audit-final-unit.log, audit-final-build.log och audit-production-final-e2e.log. Referensens specialharness använder Vite; ordinarie applikationsprov använder det nybyggda produktionspaketet. Native APK-/IPA-/Windows-byggen och fysisk TV-/touchpadkörning har inte körts. Java/Gradle/adb/Xcode hittades inte i denna Windows-miljö; dotnet fanns. iOS kräver separat macOS/Xcode-miljö.

- Inledande enhetstestkörning: 156 godkända.
- Efter ny katalog-/registertäckning: 158 godkända (62 backend, 96 frontend), inga misslyckade eller överhoppade.
- Inledande TypeScript-kontroll hittade sex fel; rättade före bygge.
- Första fullständiga Playwright-körningen efter inledande rättningar: 50 godkända, 12 misslyckade, 0 överhoppade (62 totalt). Felen analyserades och berörda prov kördes om.
- En senare full körning mot Vite gav 56 godkända, 6 misslyckade, 0 överhoppade. Den visade kvarvarande kalla modulstarter, gammal simulatormätning i bindningsfixturen och en testklocka som kunde försöka gå bakåt. Ett riktat produktionsprov hittade därefter de saknade SPA-rutterna. Dessa resultat ersätts inte i historiken av ett påstående om godkänd slutkörning.
- Efter de visuella rättningarna gav en full produktionskörning 61 godkända, 1 misslyckat, 0 överhoppade. Texturreferensprovet försökte importera Vites `/@fs`-moduler från produktionsservern. Provets isolerade referenssida har därefter fått en explicit Vite-adress; produktionsservern ska inte exponera dessa källmoduler. De båda verkliga modellprofilproven körs fortsatt mot produktionspaketet.
- En tidigare baslinjekörning avbröts efter nio prov när föråldrade layoutantaganden identifierades. Den räknas inte som en fullständig körning.
- Bygget ger Vites befintliga varning om stora JavaScript-chunkar. Det är inte ett byggfel; ytterligare koduppdelning är en framtida prestandaförbättring.

## Funktionstäckning och kvarstående gränser

| Funktion | Bedömning | Vad verifieringen betyder |
| --- | --- | --- |
| Gemensam navigation och 3D | Implementerad och verifierad i simulator | Canvas-/modellidentitet, en HA-ström, bakåt/framåt, F5, direktlänkar och väntande sidbyte testas. |
| Hem / tio informationsgrupper | Implementerad och verifierad i simulator | Bindningar, saknad data, responsiv placering och levande 3D. Ingen fysisk sensorprecision bevisas. |
| Lampor / scener / skript | Implementerad; simulatorprov finns | Registrering, bekräftat tillstånd, externa uppdateringar, RGB/dimmer, nekade kommandon och stoppbart skript. |
| Katalog / metadata / hjälpare | Implementerad och verifierad i simulator/mock | Sökning, område, disabled, sparning/omladdning, explicit registrering, min/max/step/options och skrivskydd. |
| Energi / klimat / VVB | Implementerad och verifierad datamodell i simulator | Enheter, perioder, historik, kostnadsunderlag, temperaturbindningar och tillåtna styrfunktioner. Hus 2 summeras inte genom gissning. Ferroamps tecken riktas inte utan verifierad konvention. |
| Lås | Implementerad; simulatorprov finns | Bekräftelsedialog och serverbehörighet. Ingen fysisk upplåsning testas. |
| Skärmekosystem | Implementerad och verifierad i simulator | Fokus/följning, upprepad Hem, timeout, reconnect och permanenta lokala tittarlägen. Fysiska TV-apparater inte provade. |
| Spotify / Jam | Implementerad och verifierad med mockade API/SDK | Sökning, spellistor, kö, transport, seek, volym, Connect, browser speaker, Jam-URL/QR och behörigheter. Verkligt konto/OAuth/ljud kräver extern verifiering. |
| RealityScan / editor / kalibrering / energirutter | Implementerad och verifierad med regressionsprov | Modell-/UV-/texturprov, sparning/undo, kameravy och kartkalibrering. Originalmodellen ändras inte. |
| LUBA | Väntar på extern integration | Positionsadapter/tracking/3D är testbara med simulator; verklig LUBA 3-telemetri och firmware måste verifieras. Husqvarna presenteras inte som LUBA. |
| Kia / e-Golf | Väntar på aktuell fordonsintegration | Easee-data är separata. Äldre Kia/Tibber-data är inte bevis på ansluten bil. Inga påhittade bilvärden. |
| Kameror | Delvis implementerad | Katalog, tomma tillstånd och tittarlägesstruktur finns. Säker verifierad streamingproxy saknas. Inga interna direktadresser eller falska streams. |
| Covers/fans/timers och speciallägen | Delvis implementerad | Informationskatalog finns; full domänspecifik styrning saknas. Ingen godtycklig serviceproxy introduceras. |
| Native Android/TV/iOS/Windows | Inte fullständigt verifierad | Chromium/PWA-layout är inte ett installerat APK-/IPA-/Windows-program. Plattformarnas byggverktyg och fysisk touchpad/TV behöver separat provning. |

## Visuell granskning

Den lokala bilden `C:/Users/vilja/Downloads/Svensk smart hemkontroll i mörkt glas UI.png` har öppnats och jämförts visuellt med Chromium-bilder från kontrollpanelen. Den senaste kompositionen behålls: horisontella färgade förinställningar, stor illustrerad enhetskontroll och horisontell Spotify. Endast verkligt konfigurerade simulatorförinställningar visas; bildens fem exempel har inte skapats som påhittade HA-scener.

Kontrollpanelen fotograferas och mäts vid 1920×1080, 2560×1440, 1280×800, 1024×768, 844×390 och 390×844. Bilder finns i `.build-tools/audit-control-*.png`. Textklippning och volym-/musiköverflöde har rättats. Mobilens meny och fullskärmsknapp kontrolleras med faktiska klick/touch och geometrimått, inte enbart CSS-läsning.

Visuellt granskade sidor: Hem, kontrollpanel, energi, bilar, klimat, belysning, robotar, säkerhet, Spotify och inställningar. Funktionssidornas bilder omfattar desktop 1440×1000, surfplatta 900×1100 och mobil 390×844. Därutöver har Hem, kontrollpanel och inställningar fotograferats med den verkliga originalmodellen vid 1920×1080, 1024×768 och 390×844: nio vyer, inget horisontellt överflöde och inga pageerror-händelser. Dessa lokala bilder heter `.build-tools/audit-visual-*.png`; mätningen finns i `audit-visual-result.json`.

Bilderna avslöjade även att äldre fullPage-tagning inte representerade appens interna scrollområden korrekt och att en vy kunde fotograferas före sidans readiness. Slutbilder använder färdig vy och stillbildsanpassning. Nåbarhet längre ned i innehållet provas separat med riktig scrollning. Normalmiljöns slutkontroll redovisas nedan.

## Reproducerbar webbläsarmiljö

`HEM_E2E_BASE_URL` kan välja det redan byggda paketet på `http://localhost:8123`; standarden förblir utvecklingsservern på 5173. Både global setup och varje tests gemensamma fixture kontrollerar simulatorläge före kommandon. Slutlig körning använder produktionspaketet för att också pröva produktionsrutterna och minska utvecklingsserverns modulhämtning. Den verkliga koden från senaste build:web används, inte en äldre byggprodukt. Enstaka historiska tester har dessutom explicit navigation till 5173 och kontrollerar därmed utvecklingsservern. Fyra samtidiga SwiftShader-klienter använder en fixtur med låg grafikkvalitet och procedurhimmel; originalmodellen och texturerna prövas separat. Asynkrona testvillkor får 15 sekunder; mätningars färskhetsgränser och kraven på bekräftat tillstånd ändras inte.

Katalog-/bindningsprovet injicerar en tidsaktuell simulatoravläsning i sin egen fixtur och återställer den efteråt. Ett pausat simulatorvärde som blivit äldre än mätmodellens gräns ska fortsätta visas som gammalt; gränsen försvagas inte för att göra testet grönt. Spotify-testets pauspunkt ligger framför installationstidpunkten så att värddatorns klocka inte kan orsaka bakåthopp. Readiness-väntan följer data-app-route och bekräftade tillstånd. Kontroller av värden, kommandon och behörigheter finns kvar.


## Återställd normalmiljö och livebegränsning

Efter testerna stoppades bara den identifierade egna simulatorns npm-dev-träd. Ordinarie npm run dev startades utan testprocessens HA_MODE/HA_DATA_DIRECTORY/HEM_VIEW_TEST_CLOCK-överstyrningar och lämnades igång (PID 32880 vid verifieringen).

Läsande kontroll 2026-11-01 01:40 CET:

- .env och verklig data/scene.json är **byteidentiska** med före granskningen. HA_ALLOW_CONTROL, Spotify-inställningar, sparade bindningar/positioner och originalmodell har inte skrivits över.
- Frontend 5173 och backend 8123 svarar. Alla elva kontrollerade sidlänkar svarar HTTP 200.
- /connection-api/info anger home-assistant. /connection-api/status anger real men svarar HTTP 503, authenticated=false och commandsEnabled=false när anslutningen inte kan verifieras. Konfigurationens styrmedgivande har inte ändrats.
- Läsande upstream-WebSocket-kontroll stängs med 1011 utan autentisering. **0 verkliga entiteter kunde läsas i slutkontrollen.** Simulatorns entiteter redovisas inte som riktiga.
- Direkt anslutning till 192.168.0.130:8123 nekas med **connect EACCES**. Windows Test-NetConnection över Wi-Fi ger TcpTestSucceeded=False. Datorn har adress på samma lokala subnät och även en aktiv WireGuard-adapter; orsaken är inte fastställd. Inga VPN-, brandväggs- eller nätinställningar har ändrats eller kringgåtts.
- Windows behöver åtkomst till den angivna HA-adressen innan livevärden och faktisk integrationstillgänglighet kan verifieras. Felet bevisar inte att HA-servern eller token är felaktig. Enskilda sensorers aktuella tillgänglighet kan därför inte klassificeras; inventeringens uppgifter förblir historiska.

Den blockerade livekontrollen är separat från den godkända automatiska simulator-/mocksviten. Fysisk styrning, riktig Spotify-uppspelning och verklig HA-konfiguration har inte provats eller ändrats. Säkerhetskontrollen hittade inga miljöhemligheter i de ändrade filerna. .env, data och testbilder/loggar är ignorerade av Git.

## Lokala sidor

| Sida | Adress |
| --- | --- |
| Hem | http://localhost:5173/ |
| Kontrollpanel | http://localhost:5173/control |
| Energi | http://localhost:5173/energy |
| Bilar | http://localhost:5173/cars |
| Klimat | http://localhost:5173/climate |
| Belysning | http://localhost:5173/lights |
| Robotar | http://localhost:5173/mower |
| Säkerhet | http://localhost:5173/security |
| Spotify | http://localhost:5173/music |
| Inställningar | http://localhost:5173/settings |
| Skärmar | http://localhost:5173/dev/screens |
