# Projektminne – Hemstyrning

Senast uppdaterad: 2026-10-28

## Riktig Home Assistant – förberedd anslutning 2026-10-28

- Ubuntu når 192.168.0.130:8123/api/ och får 401 utan token. Ingen riktig token har mottagits, inga riktiga entiteter inventerats och ingen verklig utrustning styrts.
- Backend stöder nu HA_MODE=simulator|real, HA_URL och HA_TOKEN (äldre HA_REAL_* stöds). Explicit real utan token stoppar starten; ingen tyst simulatorfallback. Real kräver backend på 127.0.0.1.
- Verkliga POST-kommandon blockeras som standard; HA_ALLOW_CONTROL=true är lokal operatörsgräns efter verifiering. Fleranvändarautentisering är inte implementerad. Exponera inte utvecklingsservern via nätverk/tunnel.
- scripts/configure-ha.py tar token med dold lokal inmatning, sparar ignorerad .env med 600 och real/läsläge. Lokal .env är tills vidare simulatorläge med tom token.
- Befintlig REST/WS-brygga, återanslutning och simulatorisolering återanvänds. /connection-api/status verifierar REST och räknar entiteter utan tokenutskrift; /services läser riktig tjänstekatalog.
- Redigerarens Koppla Home Assistant öppnar sökbar lista från samma anslutnings snapshot; visar namn/domän/state/attribut och kopplar huvud-entitet eller separat bindningsfält. Befintlig permanent scenlagring används.
- Nästa steg: användaren kör python3 scripts/configure-ha.py och meddelar token sparad. Starta om gemensam npm run dev, verifiera REST, inventera riktiga entiteter och WS innan en specifik lampas styrning provas. Se docs/HOME_ASSISTANT_CONNECTION.md.
- 87 enhets-/integrationstester (34 backend + 53 dashboard), typkontroll och frontendbygge godkända. Nytt test blockerar samtliga kommandorutter i real-lägets standardkonfiguration; befintlig testdubbel verifierar tillåten styrning samt isolerade simulatorscenarier.
- Playwright: sökbar entitetslista, attributvisning, val och permanent koppling godkända (26,7 s). Lokal dashboard/redigerare svarar 200 och simulatorn ok/simulation efter arbetet. Inga riktiga token eller enheter har använts.

## Git och överlämning – 2026-10-28

- GLB-filer versionshanteras med Git LFS (`.gitattributes`); installera Git LFS före kloning/hämtning av modellerna. Original och referensmodell överskrider GitHubs gräns för vanliga Git-filer.
- Lokala data, hemligheter, byggresultat och Windows Zone.Identifier-filer ignoreras.
- Inför första pushen godkändes 86 tester och typkontroll. Dashboard och simulator verifierades på localhost med HTTP 200 respektive ok/simulation.

Läs rotens AGENTS.md och `In/hemkontroll_3d_komplett/AGENTS.md`. Projektplanen finns i
`In/hemkontroll_3d_komplett/PROJEKTPLAN_hemkontroll.md`; den äldre hänvisningen till
`PLAN_HOME_ASSISTANT_3D.md` saknar motsvarande fil.

## Städning efter avbruten himmelsetapp – 2026-10-28

- Avbrutna webbläsartester avslutades. Inga övergivna Chromium-processer finns kvar.
- Simulatorns SIGTERM/SIGINT stänger nu klienter, timer och HTTP-server före omstart. En stängd server får inte starta en simulationstimer efter en sen asynkron konfigurationsläsning.
- Panoramor återläggs inte dolt i renderingen efter att användaren raderat dem. Sparad konfiguration är sanningskälla. Befintliga fyra CC0-himlar är kvar och tydligt tillfälliga; mulen himmel/skymning roteras inte automatiskt med solen.
- Engångsskript som kunde skriva om kalibreringen eller simulatorinställningar har tagits bort från /tmp. Stora tillfälliga originalnedladdningar togs bort; lokala runtime-texturer, användarimporter och säkerhetskopior behölls.
- Vädertestets tidsjämförelse använder nu tidpunkter, inte olika men likvärdiga ISO-strängformat. Testets egna himmelsresurser väljs uttryckligen i testet.
- Typkontroll, produktionsbygge och 86 enhets-/integrationstester (33 backend + 53 dashboard) är godkända. Fyra riktade Playwright-flöden är godkända (3,4 minuter): väder/måne/panoraman, verklig modell, enhetsstyrning/reconnect/mobil och fyra årstidsval. Kontrollerad omstart av gemensam npm run dev frigjorde båda portarna och startade utan portfel. localhost:5173 svarar HTTP 200, localhost:8123/health svarar ok/simulation. 13 sparade objekt, fyra panoraman och Varbergsreferensen kvarstår efter omstart. Originalets SHA-256 är fortsatt oförändrad.

## Gällande kartinpassning och himmelsresurser

- Gårdens sparade referens är nu 57.172268 N, 12.223273 E, Europe/Stockholm. Den tidigare platsen 63.18/14.64 är endast en äldre simulatorstandard.
- Kartinpassningen bygger på fyra handvalda takhörn från Hitta/Lantmäteriets bild och en lodrät modellrendering. RMS 0,252 m är passningsfel, inte absolut noggrannhet; bedömd absolut kartnoggrannhet 1–3 m. Höjddatum är inte inmätt. Se `docs/YARD_CALIBRATION.md` och JSON-underlaget. Originalet är oförändrat. Alla modellplatser och befintliga objekt räknades om med samma transform.
- Simulatorn läser sparad geografisk referens och `geography.simulatorRoute` vid start, så sol/måne och robotrutt följer gården efter omstart.
- Fyra lokala 4096×2048 fotografiska CC0-himlar från Poly Haven finns för dag, solnedgång, skymning och mulet. Egna matchande panoraman prioriteras. NASA/LROC-karta används för månytan; fas/position beräknas astronomiskt. Exakt libration ingår inte. Krediter/licenser finns i `docs/THIRD_PARTY_DATA.md`.
- SDR-foton tonemappas inte dubbelt. Sunmasken följer panoramats nordrotation. 360-importen återanvänder samma lagring/redigerare. Regn och snö använder närliggande markprover och fasta partikelbuffertar; detta är visuell approximation, inte exakt partikelkollision.
- Visa himmel är en ren himmelsvy; Återställ vy visar gården igen. Originalets felaktiga utstickande trianglar ändras inte i filen.

## Ny etapp – RealityScan, geografi, egna objekt och panorama

Se `docs/REALITYSCAN_GEO_AND_ASSETS.md` för handhavande, underlag och begränsningar.

- Modellberedningen skapar nu även en oförenklad `daniels-reference.glb`: 5 310 780 trianglar, ingen Meshopt-förenkling/kvantisering. Originalets SHA-256 är oförändrad. Extern `Daniels_u0_v0_diffuse.png` saknas fortfarande. Ingen atlas skapas i vår pipeline; tidigare RealityScan-atlas/export går inte att fastställa utan källprojekt/texturer. `docs/MODEL_AUDIT.json` innehåller granskningen av alla fyra filer.
- `AdvancedEditor` öppnas från befintlig redigerare. Neutral jämförelse stänger av extra rendering och växlar mellan mobil/detalj/referens utan att spara diagnostikläget. Originalmaterial återställs vid avslut och modellbyte.
- `geography.ts`: WGS84/ECEF/ENU i meter, X öst/Y upp/−Z nord med gemensam nordrotation, invers omvandling, minst tre icke kollineära referenser och horisontell likformighet + medelhöjd/RMS. Endast modelltransform ändras vid passning, inte objektkoordinater. Höjdreferens måste kalibreras. IANA-tidszon i `location` används i översikt/kalender.
- MapLibre-kartan laddas dynamiskt först vid öppning. Kart- och 3D-vy är separata med gemensamma koordinater; originalrenderer byts inte ut mot en kartcustomlayer. OSM-raster är standard (internet/attribution); inmätta koordinater fungerar utan karttiles. Adressökning/satellitunderlag ingår inte.
- `ObjectAssets` återanvänder GLB-uppladdning med inbäddade resurser och sparar modellrotation/origo/skala/markkontakt separat. Async-laddningar avvecklas om scenen ändras. Saknade bil-/robotresurser är testgeometri, markerad i panelen. Fotograferade bilar förblir i originalskanningen tills en fordonsfri skanning levereras.
- Bilar utan HA-koppling döljs i produktläget. Explicit hemma/borta eller manuell närvaro stöds; kabelstatus och unavailable är aldrig frånvarobevis. Sidolistans funktionalitet bevaras.
- Materialytor kan fungera som gräsmatta/klippområde/transport/passage/förbjudet/hinder/körbar mark. Hörn ändras med 3D-gizmo, JSON eller kartdragning. Separat triangulerat underlag ger markhöjd/normal; klipparens orientering följer riktning/lutning. Segmentkontroll stoppar osäkra rörelser; ingen närmaste-gräspunkt-snappning. Utan explicit underlag är raycastad originalhöjd endast en reservlösning som kan träffa tak.
- Befintlig trackingmotor behålls: tre minuters historik, recent medianriktning, begränsad extrapolering och stale/offline-stopp. WGS84-telemetri går genom gemensamma ENU-funktionen. `trackingOffset` ger manuell korrigering. Verklig LUBA 3-position är ännu inte verifierad.
- `robot-light.ts` prioriterar färsk mätning, annars valbar uppskattning från arbete/lux/mörker. Spotlight följer roboten. Inga robotljuskommandon skickas. Testprofilens 4500 K/180 lm/65° är INTE uppmätt LUBA-ljus; egna nattbilder saknas.
- GPU-panoraman begränsas till 8192 px dator/4096 px smal mobil och högst två texturer; originalbilder lagras oförändrade.
- `telemetry-time.ts` skiljer simulatorns telemetriklocka från astronomiskt datum. Stale åldras med verklig tid efter senaste uppdatering även efter manuellt simulatortidssteg. Framtida orimliga mättider avvisas relativt vald telemetriklocka.
- `panoramas.ts` och backend `/workspace-api/panoramas` ger innehållsadresserad JPEG/PNG-import (2:1), nord/fototid/färg, matchningsintervall, manuell/procedur/automatik och mjuk övertoning. Fotograferade moln flyttas inte. Konfigurerbar fotograferad solmask tonar till procedurhimmel; kontrollera masken visuellt. Astronomiska himlakroppar behålls. Inga riktiga panoramabilder har tillförts.
- `appearance.ts` kombinerar globala, säsongsspecifika och ljus-/väderprofiler, med mjuk övergång i renderingen. Standardtillägg är neutrala.
- Klick i normal 3D-lampa använder direkt toggle med pendingindikator och bekräftat state, utan panel. Drag spärras. Sidomenyn behåller inspektör/avancerad styrning.
- Simulatorn har nu 17 scenarier, inklusive testsluttning, uppfartspassage och åter till docka. `mowerRoute`/`mowerLight` redigeras lokalt. API-/WS-isoleringen mot verklig utrustning är oförändrad.
- All ny konfiguration ingår i samma schema/atomiska scenfil. Nya bildbytes lagras i `data/panoramas/`; säkerhetskopiera hela `data/`.
- Enhets-/integrationstester: 33 backend + 50 dashboard = 83 godkända efter denna etapps kärnändringar. Slutlig sammanhängande Playwright-körning: alla nio flöden godkända (5,4 minuter). Testet för direkt lampklick fångade drag utanför markörens klickyta; global pekarspårning korrigerar detta. Även felsvar, återladdning, kartparning och beständig import är verifierade. Slutlig typkontroll och produktionsbygge är godkända. localhost:5173 svarar HTTP 200 och localhost:8123/health svarar ok/simulation. Originalets SHA-256 verifierades oförändrad efter arbetet.
- Playwrights globala uppstart vägrar alla styrande webbläsartester om centralbryggan inte är i simulatorläge eller den lokala health-adressen inte är frisk.
- Beroendegranskning hittade äldre utvecklingsberoenden i Vitest 3 (mocker/tinypool); ingen osäkert bred majoruppgradering gjordes i denna funktionsetapp. Produktionsberoendena hade inga rapporterade npm-audit-fynd vid granskningen. Separat uppgradering av testverktygen återstår.

## Senaste etapp – användarläge, redigering och himmel

- Tydlig **Redigera gård**-länk i huvudvyn. Separat redigerare har egen objektlista och verktyg för laddstation, dammsugare, annan enhet och skymmande volym utöver tidigare typer. Numerisk/gizmo-baserad ändring, radering och diskpersistens är bevarade.
- Den extra bilboxen var en förenklad overlay-mesh. Äldre bilar migreras till `representation: embedded`, med enbart osynlig klickgeometri ovanpå skanningen. Fristående bilar använder rundad bilgeometri; läget är valbart. Ursprungliga objektpositioner/entiteter och originalmodellen bevaras.
- Normalvyn har diskret statusrad och fällbar Snabbåtkomst för belysning, bilar, robotar, energi och kalender. Lista finns kvar. Följ i 3D stöds för klipparen; manuell kameranavigering avslutar följning.
- `home-controls.ts`, `calendar-data.ts` och serverns `calendar.ts` ger flera HA-kalendrar, heldagar, större agenda, begränsad hämtning och hantering av saknad data. Endast konfigurerade kalenderentiteter får läsas genom bryggan. Ingen Google-klient/OAuth eller kalenderhändelseskrivning finns i frontend.
- Simulatorn återanvänder samma store och har `sensor.moon_phase`, `calendar.family` och `calendar.work`. Fas/position och händelsedatum följer simulatortiden. Kalenderstate och nästa/pågående event följer klockan. Kalender-/månfixtures kan ändras från `/dev/simulator`.
- Markörer raycastas mot originalmodellen och osynliga konfigurerade occluder-volymer. Skymning utgår från enheten, inte från etikettens lyfta skärmläge. Kameraförflyttning visar/döljer dem. Listan är oberoende av skymning. Gizmon/hjälpvolymer/ytdots är enbart synliga i redigeraren.
- `astronomy.ts` använder Astronomy Engine för topocentrisk måne/fas. `sky.ts` ritar sol, fasbelyst måne, väderanpassad himmel/moln och verkliga katalogstjärnor. J2000-stjärnor precesseras/nuteras till datum och roteras till lokal horisont; egenrörelser/förmörkelser ingår inte.
- `public/config/stars.json` innehåller 2 865 stjärnor (magnitud ≤ 5,5) från HYG v4.1. Attribuering/CC BY-SA 4.0 finns i JSON och `docs/THIRD_PARTY_DATA.md`. Inga externa kataloganrop görs vid användning.
- Nattljuset är separat riktat månljus + kallt himmelsljus + nattanpassad exponering, med moln/fas/höjd och begränsad luxkorrigering. Visningsintensiteterna är kalibrerade för orienterbarhet, inte absoluta fotometriska luxmätningar. Gradering (värme/mättnad/kontrast), ACES/AgX/Neutral och exponering sparas i `appearance`.
- `terrain.ts` samplar modellkanten för en lågdetaljerad syntetisk terrängkrage och begränsar markfokus. Placering tillåts bara på den riktiga modellen. Översiktskameran är inte ett promenadläge. Robotens renderade markhöjd är en visuell terränganpassning, inte GPS-höjd.
- **Visa himmel** riktar kameran mot sol/måne/natt; Återställ vy går tillbaka till gården. Navigering tillbaka från BFCache laddar om för att inte återställa en redan avvecklad renderer.
- Alla ursprungliga GLB-filer, vertexfärger, UV och tillgängliga originaltexturer är orörda. Den externa `Daniels_u0_v0_diffuse.png` saknas fortfarande. Fotograferade bilar/skuggor, flytande fragment och dåliga kanter går inte att göra fullt dynamiska genom nya hjälpmaterial.

Se `docs/UI_SKY_AND_CALENDAR.md` för detaljer, källor och kvarstående begränsningar.

## Aktuellt beslut och gränssnitt

- `/`: återställt produktläge med helskärms-3D, diskret Lista och klickbara objektmarkörer. Ingen källväljare eller miljösimulator i normalvyn.
- `/editor`: separat befintlig redigerare med import/kalibrering, placering, gizmon, materialytor, mätvärdes-/kommandokopplingar och permanent sparning.
- `/dev/simulator`: separat utvecklingsgränssnitt för den befintliga HA-simulatorn. Alla dess API:er och WS är hårt kopplade till den lokala simulator-storen och kan inte skicka till riktig utrustning.
- Central anslutning via serverns `HA_REAL_URL` och `HA_REAL_TOKEN`, inte per sensor i UI. DEMO markeras diskret när simulatorn används.
- Bekräftat state krävs för lampor och övriga kommandon. Okänd/otillgänglig status, saknade värden, avbrott och timeout får aldrig ersättas med fabricerade mätningar.
- Inga riktiga token eller verklig utrustning används i utveckling eller tester.

## Körsätt

```bash
npm install
npm run dev
```

Både Vite-dashboard och simulator ska lämnas igång:

- `http://localhost:5173` – Hemkontroll.
- `http://localhost:5173/dev/simulator` – separat simulator.
- `http://localhost:5173/editor` – redigerare.
- `http://localhost:8123/health` – simulatorhälsa, måste svara innan den anses körande.

`.env` i roten läses av simulatorns Node/tsx-startskript. Simulatorn är standard.
Serverns separata live-brygga aktiveras endast när både HA_REAL_URL och HA_REAL_TOKEN
anges. Dessa uppgifter stannar på servern. Nativa `/api/*` och `/simulator/*` förblir
simulerade även om live-bryggan är konfigurerad.

- Appens gemensamma kontrakt: `/connection-api` → `/bridge/api`, `/connection-ws` → `/bridge/ws`.
- Utvecklingssidan: `/dev-api` och `/dev-ws` → `/simulator/ws`, alltid lokal simulator.
- Beständig scen/import: `/workspace-api`, `data/scene.json`, `data/models/` (gitignorerade).
- Äldre canvasprototyp bevaras på `/hemkontroll_3d_fungerande.html` med äldre adapter; inte huvudappen.

## Arkitektur och färdiga funktioner

- Dashboard `src/system/`: strict TypeScript och Three.js/Vite. Bootstrap laddar bara rätt ingång för home/editor/simulator. Full React/R3F-migrering har inte genomförts.
- `home.ts`, `device-data.ts`: komplett konfigurerad enhetslista, världsförankrade klickmarkörer och inspektörer för sex lampor, flera bilar, solpaneler, husenergi, LUBA och dammsugare. Saknade mått hanteras utan påhittade värden och W/Wh omvandlas korrekt till kW/kWh. Historik hämtas begränsat, status kommer via WS.
- `configuration.ts`, `workspace-api.ts`: schema-validerad atomisk lagring, autosparning och GLB-import med inbäddade resurser. Backup måste omfatta hela data/, inte bara JSON-export.
- Layoutmigrering version 2 kompletterar gamla startscener med saknade standardenheter utan att flytta befintliga objekt. Positionerna är startplaceringar, inte inmätta armatur-/fordonspositioner.
- `models.ts`: fyra modellplatser med oberoende position/rotation/skala, två-resurscache, korrekt YXZ-kalibrering och separat oförändrad objektrot. Y upp, nord −Z, öst +X.
- `environment.ts`: NOAA-sol från UTC/geografisk plats, molnighet, begränsad luxkorrigering, stale-/outlier-hantering, mjuka övergångar och observerad snöpolicy. Inga direkta SMHI-anrop per bildruta.
- `precipitation.ts`: kontinuerligt regn/snö, 6 000/12 000 partiklar beroende på kvalitet, vind/byar, varierande flingstorlek/hastighet och djup. Begränsad BVH-raycasting för stänk, mörkare/våtare uppåtytor och tätvädersanpassat ljus/sikt. Ingen full vätske- eller snöackumulationssimulering.
- `tracking.ts`: högst tre minuters accepterad historik, avvisade hopp/dålig noggrannhet/äldre rapporter, mjuk rendering och extrapolering högst sex sekunder/tre meter. Stoppar vid stale/offline/paused/docked. Uppskattat och senast känt läge märks i inspektören.
- Positionsentitet kan mappas separat. Lokala x/z används direkt; lat/lon kan transformeras relativt scenens konfigurerade geografiska origo/nord. Verklig LUBA 3/firmware-koppling är ännu inte verifierad.
- `connection.ts`: prenumeration före snapshot, reconnect, heartbeat, statebekräftelse och kommandotimeout. Tjänster till riktig HA tillåts bara för konfigurerade objekt; bilarnas klimat-/laddningsentiteter måste vara explicit mappade.
- `services/ha-simulator/src/simulation.ts`: motorn använder den befintliga StateStore, tjänsthanteringen och state_changed-events; inget parallellt simulatorsystem.
- Simulerar väder/tid/soltider, lux och sensorfel, lampgrupper/dimring/RGB/kelvin, panelantal/produktion, balanserade effektflöden och energimätare, pris/nettokostnad, flera bilar/laddning/klimat, robotjobb och GPS-fel, dammsugaruppdrag och historik/prognoser.
- Energiintegrering delas vid midnatt; dagsräknare nollställs och totalmätare förblir monotona. Bilarnas laddenergi räknas mot faktisk kapacitet och laddgräns. Ett batteri över laddgränsen laddas inte ur till gränsen.
- Fjorton startbara scenarier finns på utvecklingssidan. Manuella state-/attributöverstyrningar består tills de släpps; därmed kan även avsiktliga sensorfel simuleras.
- Historik är en begränsad minnesbuffert (720 punkter/entitet), inte permanent recorder. Simulatortillstånd återställs vid serveromstart. Scen- och modellkonfiguration består på disk.

## Verifierad modellanalys – korrigerar tidigare antagande

- Original: `In/Daniels.glb`, 157 671 028 byte, 5 310 780 trianglar, bevarat oförändrat.
- Originalet har **COLOR_0 (vertexfärger)** och TEXCOORD_0. Den tidigare beskrivningen av en helt neutral yta var missvisande: färginformationen finns i geometrin.
- Den externa `Daniels_u0_v0_diffuse.png` saknas fortfarande. Texturens upplösning/komprimering kan därför inte fastställas. Fotograferat ljus/skuggor kan finnas i vertexfärgerna; nya detaljer fabriceras inte.
- Föregående 7 %-visningsmodell hade 371 674 trianglar och saknade UV. Ny pipeline bevarar färger/UV och vit materialfaktor i stället för att mörka vertexfärgerna.
- Ny mobilmodell: 637 292 trianglar, cirka 4,2 MB. Detaljmodell: 1 858 652 trianglar, cirka 11 MB.
- `node scripts/audit-model.mjs` ger analysen. `npm run prepare:model` återskapar båda nivåerna och metadata från originalet. Inga bilder skalas ned eller omkomprimeras.
- Normaler beräknas där de saknas. Mipmaps, linjär förstoring och maximal anisotropi används för texturer. sRGB/ACES, antialiasing och pixelkvot upp till 1,5 mobil / 2 dator.
- Automatisk kvalitet växlar detaljnivå efter skärmbredd. Explicit hög kvalitet aktiverar dyra skuggkartor; auto håller dem av. 30 Hz rendering, släckta ljus tas ur ljusberäkningen och högst åtta samtidiga dynamiska lampor används.
- Fyra separata årstidsskanningar finns ännu inte. Alla tomma platser använder Daniels-referensen med tydlig verifieringsflagga i redigeraren. Manuell årstid väljs i simulatorn; automatisk snömodell kräver verifierad lokal observation, inte en SMHI-prognos.

## Tester

Kommandon: `npm test`, `npm run typecheck`, `npm run build --workspace @hemkontroll/dashboard`, `npm run test:e2e` (kräver körande dev och Playwright Chromium).

Senast godkända enhets-/integrationstestning i senaste etappen: 31 backendtester och 37 dashboardtester (68 totalt).
De täcker energi/dygnsgränser, laddning, lampor/grupper, sol/sensorer, GPS/interpolering,
partikelbuffertar, mätvärdesenheter, modellstabilitet, HA-kontrakt och att utvecklings-
simulatorn förblir isolerad även när en separat HA-testdubbel är live-mål.

Webbläsarflöden har verifierat rikliga inspektörer, externt state, lampbekräftelse,
reconnect, scenarier och fyra modellval, separat redigerare och persistent import.
Solpanelernas instansindelning testas dessutom så att antalet paneler inte ändrar
takgruppens befintliga fotavtryck eller multiplicerar dess placerade skala.
Den verkliga skanningen har även renderats utan browser-/shaderfel. Skärmbildstestet
fångade en prestandabugg: släckta ljus fanns kvar i beräkningen och renderingen saknade
taktbegränsning. Detta korrigerades; mjukvarurenderad mobilmodell klarade därefter testet.
Slutlig gemensam körning i senaste etappen: 68 enhets-/integrationstester, sex Playwright-flöden, typkontroll och produktionsbygge godkända. Det riktade skymningstestet godkändes även efter ändringen till markörens fysiska ankarpunkt. Slutlig typkontroll och produktionsbygge godkändes igen; localhost:5173 och localhost:8123/health verifierades, den senare med status ok och mode simulation. Build har
fortfarande Vites informationsvarning för den gemensamma Three.js/Meshopt-bundlen
(cirka 680 kB, 174 kB gzip); simulator-/editor-ingångar laddas separat från hemvyn.

## Verklig Home Assistant – skrivskyddad inventering

Värd: `192.168.0.130`

Verifierat utan inloggning:

- `http://192.168.0.130:8123` svarar med Home Assistant frontend.
- `/api/` och `/api/config` finns men svarar `401 Unauthorized` utan token.
- `/auth/providers` visar `Home Assistant Local`.
- `http://192.168.0.130:4357` visar Home Assistant Observer.
- Observer rapporterade Supervisor `Connected`, Support `Supported`, Health `Healthy`.
- Port 80 och 443 svarade inte vid kontrollen; HA exponeras med HTTP på LAN via 8123.
- Inga verkliga entities har inventerats eftersom ingen token har tillhandahållits.

Använd en separat och helst begränsad utvecklingsidentitet/token för fortsatt inventering. Lagra token endast i en ignorerad `.env` på serversidan. Skicka den aldrig till dashboardens JavaScript-bundle och committa den aldrig.

## Nästa steg och kvarvarande underlag

1. Tillför originaltexturen och separata årstidsmodeller; kalibrera mot samma inmätta punkter, meterskala och nord.
2. Verifiera verkliga entiteter skrivskyddat när en separat token tillhandahålls. Koppla SMHI, lux, bilar, sol/energi och LUBA-fält per faktisk integration.
3. Kalibrera sensorplacering, luxförstärkning och påverkan av gårdsbelysningen. Gårdens plats är kartbaserat satt till 57.172268/12.223273; inmätt kontroll och höjddatum återstår.
4. Verifiera prestanda på verkliga mobiler och detaljmodell på hårdvaruaccelererad dator. Automatisk LOD är diskret modellväxling, inte streaming.
5. Verkliga tariff-/prisupplösningar, långtidsrecorder, produktionsautentisering och specifika bilmärkes-/LUBA-integrationer återstår. Den lokala simulatorn ersätter inte denna verifiering.

Se `docs/FEATURE_STATUS.md` och den senare `docs/UI_SKY_AND_CALENDAR.md` för färdig-/begränsningslista och modellanalys.
