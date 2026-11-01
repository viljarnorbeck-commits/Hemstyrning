# Systemtest av Hemstyrning – 1 november 2026

Status: slutlig webb-/backendtestning godkänd. 242/242 testfall godkända, 0 misslyckade, 0 överhoppade. Fysisk utrustning och native-paket omfattas av begränsningarna nedan.

## Underlag och isolering

Utgångspunkt är den senaste lokala implementationen, commit 7a125fb. AGENTS.md, frontendens AGENTS.md, PROJECT_MEMORY.md, aktuella skript och testfixturer har granskats. Inga tidigare uppdrag hade okommitterade ändringar vid start. PLAN_HOME_ASSISTANT_3D.md finns inte i denna checkout.

Den vanliga utvecklingsprocessen stoppas under testningen. Ordinarie npm run dev startas med processlokalt HA_MODE=simulator, HA_DATA_DIRECTORY=data/qa-20261101 (senare nya separata qa-final-*/qa-release-*-kataloger) och HEM_VIEW_TEST_CLOCK=true. .env skrivs inte om. Real .env och data/scene.json jämförs med SHA-256 före/efter. Inga verkliga HA-kommandon eller Spotify-kommandon tillåts. Spotify-funktioner testas med mockade tjänster och simulatorn har en separat kontolagring utan användarens sparade Spotify-token.

## Kommandon och resultat

| Kontroll | Inledande resultat | Slutligt resultat |
|---|---|---|
| npm test | 161/161 godkända | 175/175 godkända (71 backend + 104 frontend), 0 misslyckade, 0 överhoppade |
| npm run typecheck | Ett typfel i Spotify-popupen | Slutlig kontroll godkänd efter alla kodrättningar |
| npm run build:web | Godkänd | Slutligt bygge godkänt; bakgrundsbilden är byteidentisk i dist |
| npm run build --workspace @hemkontroll/ha-simulator | Godkänd | Godkänd |
| npm run test:e2e | 50 godkända, 12 misslyckade, 0 överhoppade av 62 | 67/67 godkända, 0 misslyckade, 0 överhoppade, 0 flaky (13,0 minuter) |
| npm run verify:model | Alla tre GLB-varianter godkända | Godkänd |
| npm run check:versions | Gemensam version 2.0.0 | Godkänd |

npm är inte globalt tillgängligt i denna Codex-process; projektets befintliga .build-tools/npm.cmd används genom en processlokal PATH-utökning. Detta kräver ingen installations- eller projektändring.

## Upptäckta fel och rättningar

1. Typkontrollen underkände jämförelsen mellan en knapp och en div i SpotifyDevicePicker.focusItem. Den variabel som kan innehålla båda är nu uttryckligen HTMLElement.
2. Spotify-panelen på 844 × 390 hade scrollHeight 146 px men clientHeight 130 px. Den korta liggande kontrollpanelens radfördelning justeras så att den responsiva spelaren får plats samtidigt med förinställningarna och enhetskontrollen.
3. Äldre webbläsartester väntade på control-status, view-status och Översikt-knappen, vilka användaren uttryckligen låtit ta bort. Testerna behålls men kontrollerar nu anslutning via den permanenta navigationen, Hem-återställning via huvudnavigationen samt återanslutning via WebSocket ready och faktisk skärmsynk.

4. Spotify-popupen inkluderades felaktigt bland hemskärmens data-home-ui-element och doldes av funktionssidornas CSS. Overlayn undantas nu från hemskärmens elementklassificering i app-shell.ts.
5. updateMarkup behandlade bara HTMLElement och hoppade över SVG-träd. Därför kunde en gammal lampillustration och gamla spela/pausa-ikoner ligga kvar. Element-attribut och barn synkroniseras nu också för SVG, med bibehållet interaktionsskydd för HTML-reglage. Dammsugar- och transportikoner verifieras i webbläsaren.
6. Om Connect-listan laddades efter öppning kunde tangentbordsfokus bli kvar på tommenyn. Den första tillgängliga raden får nu fokus när data anländer, bara om fokus redan finns inne i menyn. Vanlig statusuppdatering får inte flytta ett befintligt radfokus.
7. Markanalysen kunde ge 409 efter att resultatet hade sparats men före worker-processens exit. Cache/resultat kontrolleras nu före spärren för pågående jobb. Ett deterministiskt test håller worker-processen kvar efter sparning och verifierar att ett färdigt resultat returneras utan ett nytt analysjobb.

8. Långa KNX-namn och entity_id:n skapade horisontellt överflöd i mobilens enhetsruta: 477 px innehåll i en 272 px bred yta. Rubriker och kodidentifierare kan nu brytas var som helst; ommätning gav 272/272 px. Mobilregressionen använder ett långt KNX-namn.

9. Vid 1024 × 768 klipptes temperaturreglaget i den mellersta enhetsrutan. Surfplattans radfördelning och detaljpadding justeras; ommätning gav 395/395 px. Layoutprovet kontrollerar även denna ytas höjd.

10. Dammsugarens batteri kunde visa simulatorns råa många decimaler. Procenten formateras nu som ett lokaliserat heltal; webbläsarprovet verifierar formatet.

Totalt nio kodfel (punkt 1–2 och 4–10) rättade; punkt 3 är en uppdatering av äldre testförväntningar till uttryckligen ändrad produktfunktion. Den första browserkörningens 12 fel var 11 borttagna-UI-förväntningar och ett faktiskt layoutfel. De nya regressionerna hittade popup-, SVG- och tangentbordsfelen. En enhetsomkörning med 174 tester gav 173 godkända och ett intermittent yard-api-fel; efter rättning och nytt deterministiskt prov går alla 175 igenom.

Två påbörjade browser-mellanomkörningar avbröts innan de blev fullständiga: efter det nyupptäckta backendfelet respektive korrigering av testets väg till Hem i TV-scenariot. De räknas inte som godkända fullkörningar. Ett senare katalogprov visade också att en avbruten körning hade lämnat kvar en registrering av just dess testhjälpare. Provet tar nu uttryckligen bort endast denna testregistrering före start och återställer originalkonfigurationen efteråt. Slutverifieringen använder dessutom en ny simulator-datakatalog. Den rena katalogen exponerade ett gammalt hårdkodat bil-ID i premium-provet; testet använder nu ID:t från den faktiskt laddade scenen. Den kompletta rena omkörningen gav 66 godkända och detta enda testfel av 67. Det rättade markeringsramstestet passerade därefter separat; ännu en full omkörning görs efter samtliga rättningar. Tidiga fokuserade regressioner gav först 1/4, sedan 3/4 och slutligen 4/4; hela utökade sviten körs därefter på nytt. Geometrikontrollen av nederkanten väntar på sidans befintliga ankomstanimation i stället för att mäta dess tillfälliga 3 px förskjutning.

## Berörda filer

| Filer | Ändring |
|---|---|
| src/system/app-shell.ts | Undantar Spotify-overlayn från hemskärmens döljning |
| src/system/card-design.ts | Synkroniserar även SVG i den befintliga DOM-uppdateraren |
| src/system/spotify-device-picker.ts | Korrekt fokus efter asynkron laddning och rätt DOM-typ |
| src/system/control-background.css och control-right.css | Kort liggande skärm, surfplattans reglage och långa mobilrubriker |
| services/ha-simulator/src/yard-api.ts | Returnerar ett sparat analysresultat innan worker-processen hunnit avslutas |
| Frontendens recent-data-regression.test.ts och weather-source.test.ts | Sex nya datakopplings- och väderprov |
| Backendens smhi-weather.test.ts, vacuum-controls.test.ts och yard-api-cache.test.ts | Åtta nya serverregressioner |
| tests/recent-regressions.spec.ts | Fem nya webbläsarprov, inklusive 50 layoutbilder |
| Befintliga navigation-, control-, shared-view-, audit-system- och v2-apps-tester | Uppdaterade borttagna UI-förväntningar och isolering av testdata; inga testfall borttagna |

control.ts formaterar dessutom batteriprocenten.

Frontendfilerna ligger under In/hemkontroll_3d_komplett. Rapporter och PROJECT_MEMORY uppdateras separat. Inga modeller, privata konfigurationer eller tokens ingår i ändringarna.

## Ny regressionstäckning

- Aktuell KNX-katalog över alla domäner, saknade tillstånd, avaktiverade poster, deduplicering och sökning.
- Utomhusgivarens −0,7 °C, oförändrade rådata, simulatorundantag och tydligt hanterade äldre/okända/otillgängliga värden.
- SMHI SNOW1gv1, enhetsnormalisering, cache, gammal prognos, saknade numeriska data och att simulatorläge aldrig hämtar SMHI.
- Dammsugarens registrerade kommandon, suglägesval, avvisade okända objekt/lägen/funktioner och total spärr i skrivskyddat verkligt läge.
- Lokal Spotify Connect-popup: fokus och scroll vid statusuppdatering, Escape, utanförklick, touch och mockat enhetsbyte.
- Kontrollpanelens bakgrund och nederkant, skarp hemscen, kraftigt suddiga funktionsbakgrunder och skarpa reglage.

## Funktionstäckning och visuell granskning

Den befintliga fulla Playwright-sviten omfattar navigation, historik, F5, beständig canvas/modell/HA-anslutning, tio hemgrupper, enhetsstyrning, registrering, behörigheter, energisidor, klimat, lås, Spotify/Jam/SDK, kamerafokus, följning, gemensam visningsstatus, testklocka, tittarlägen, redigerare, geografisk kalibrering, modelltexturer, väder och årstider. Samtliga 67 webbläsarprov passerade i den sista fullständiga omkörningen. Tillsammans med 175 enhets-/integrationsprov är detta 242 godkända testfall; modell-/versionskontroller och byggen redovisas separat.

Layoutprovet har passerat för samtliga tio sidor vid 1920 × 1080, 2560 × 1440, 1280 × 800, 1024 × 768 och 390 × 844, dessutom den låga liggande spelaren vid 844 × 390. Skärmbilder sparas lokalt under .build-tools/qa-visual-*.png. Automatiskt: 50 bilder och kontroller av horisontellt överflöd, kontrollpanelens tre områden och innehållshöjd. Manuell bildgranskning omfattar Hem, kontrollpanel, energi, bilar, klimat, belysning, gräsklippare, säkerhet, Spotify och inställningar fördelade över alla fem storlekar, samt popup, dammsugare och surfplattans temperaturreglage. Det är inte en manuell pixelgranskning av varje bild. UI-prov använder liten GLB-fixtur; verkliga modellfiler granskas separat med modell-/texturproven och verify:model, utan att originalfiler ändras.

### Kontrollerade områden

| Område | Automatisk täckning |
|---|---|
| Hem | Tio informationsgrupper, tillgänglighet, enheter, skarp canvas, navigering och saknade data |
| Kontrollpanel | Brytare, dimring, RGB/Kelvin, externa tillstånd, beständig katalog, KNX, dammsugare och förinställningar |
| Energi | Effekt-/energienheter, import/export, historikkontrakt, kostnadsperioder och saknade värden |
| Bilar | Separata bil-/laddboxdata, konfigurerbara bindningar och frånvarande integrationer |
| Klimat | Rumsgivare, varmvattenlager, simulatorstyrning och behörigheter |
| Belysning | Filtrering, gruppering, samma reglage som kontrollpanelen |
| Gräsklippare | Ärlig ej ansluten LUBA, positionsadapter, simulatorföljning, inga påhittade GPS-data |
| Säkerhet | Bekräftad upplåsning i simulator, backendbehörigheter, tom kamerasektion |
| Spotify | Mockad OAuth/API/SDK, sökning, kö, spellistor, Jam, Connect, transport och volym |
| Inställningar | Sökning, entitetsregistrering, bindningar, spara/ladda/återställ, redigerare |
| Gemensamt TV-system | Fyra webbläsarkontexter, fokus/följning, HOME, inaktivitet, återanslutning, permanenta tittarlägen |

Ingen fysisk integration blir verifierad enbart genom dessa simulator-/kontraktsprov.

## Prestanda och modellintegritet

Navigationsregressionen kontrollerar att samma canvas behålls, att normal sidnavigation inte gör nya dokument- eller modellhämtningar och att exakt en HA-WebSocket är aktiv. Den befintliga renderaren använder en gemensam setAnimationLoop; bakgrundsändringarna är CSS och skapar ingen egen renderingsloop. Modellverifieringen kontrollerar alla tre verkliga GLB-varianter, originalets inbäddade PNG, UV och geometri. Originalmodellerna är orörda. Detta är ingen långvarig minnesprofilering eller prestandacertifiering av verklig TV-/mobilhårdvara.

Vite bygger utan fel men rapporterar befintliga stora lazy chunks för kartredigeraren och meshopt. De behöver eventuell separat optimering; inga nya beroenden eller bildgenereringssteg tillkommer i detta arbete.

## Externa begränsningar

Automatiska prov verifierar simulator, kontrakt, behörigheter och mockad Spotify, inte fysisk KNX/HA-utrustning, verkliga Yale-lås, bilar, klippare eller ljuduppspelning. Riktigt Spotify-konto/OAuth/Connect kräver senare manuell verifiering. Verklig LUBA-telemetri, e-Golf- och aktuell Kia-integration saknas enligt projektets nuvarande konfiguration; inga data har hittats på. Native Windows-/Android-/TV-/iOS-paket byggs inte i denna miljö: Rust/cargo, Java/Gradle och xcodebuild är inte tillgängliga i körmiljön, och iOS kräver macOS/Xcode. De ordinarie web- och backendbyggena körs. Native-paket, kamera- och mobilplattformarnas verkliga systemgester kräver separat plattformsgranskning. Chromium touch/CDP verifierar webbläsarens touchscroll; verklig tvåfingers-touchpad och TV-fjärrkontroll har inte fysiskt provats.

## Återställning och publicering

Ordinarie npm run dev är återstartad utan testmiljöns HA_MODE-, HA_DATA_DIRECTORY- eller HEM_VIEW_TEST_CLOCK-överstyrningar. Användarens befintliga real-konfiguration och styrbehörighet är bevarade. GET /connection-api/status verifierar mode=real, authenticated=true och 752 entiteter. WebSocket-autentisering och get_states verifierar också 752 entiteter, helt utan serviceanrop. /health svarar status=ok; dess mode=simulation beskriver den lokala simulatorservern, medan bryggans status är real.

Hem http://localhost:5173/, kontrollpanelen http://localhost:5173/control och visningssidan http://localhost:5173/dev/screens svarar alla HTTP 200. Utvecklingsservern lämnas igång. SHA-256 för .env och data/scene.json är oförändrade jämfört med före teststart. Spotify-inställningar och originalmodeller är bevarade.

22 egna källkods-, test- och dokumentationsfiler granskas och publiceras på codex/design-shell. Hemlighetskontrollen hittade 0 hemligheter i ändrade filer; .env, data och .build-tools är fortsatt Git-ignorerade. Slutlig publicerad commit redovisas i överlämningen; ingen force-push används. Lokala testloggar finns i .build-tools/qa-release-*.log, Playwrights maskinläsbara slutresultat i .build-tools/qa-release-e2e.json och skärmbilder i .build-tools/qa-visual-*.png.

Inga kvarstående automatiska testfel. Återstående verifieringsarbete gäller verklig utrustning/Spotify, plattformarnas native-byggen och långvarig minnes-/hårdvaruprofilering, inte ignorerade eller avstängda testfall.
