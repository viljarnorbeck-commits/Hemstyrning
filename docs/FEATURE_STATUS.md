# Städning och aktuell drift – 2026-10-28

Den avbrutna himmelsetappen är genomgången. Tillfälliga fotografiska himlar och
NASA-månkarta ligger lokalt; egna 360-bilder använder samma importflöde.
Raderade panoraman återställs inte automatiskt. Simulatorns omstart avvecklar
WebSocket-klienter och timer. Aktuell kartinpassning och verifieringsresultat finns i
[PROJECT_MEMORY.md](PROJECT_MEMORY.md) och [YARD_CALIBRATION.md](YARD_CALIBRATION.md).
Originalmodellens saknade färgtextur och fotogrammetrins geometrifel kvarstår.

# Senaste utökning

Se [RealityScan, geografi och egna resurser](REALITYSCAN_GEO_AND_ASSETS.md) för den senaste etappen. Denna beskrivning kompletterar och vid konflikt ersätter äldre status nedan.

# Hemkontroll 3D – leveransstatus och verifierade begränsningar

Senare tillägg för redigerare, bilbox, snabbpanel, kalender, skymda markörer och natt/himmel
beskrivs i [UI_SKY_AND_CALENDAR.md](UI_SKY_AND_CALENDAR.md). Den beskrivningen har företräde
för de vidareutvecklade delarna.

## Användargränssnitt

- `/`: helskärms-3D, diskret Lista, klickbara objektmarkörer och inspektörer för sex lampor, flera bilar, solpaneler, energi, LUBA och robotdammsugare.
- `/editor`: separat befintlig modell-/objektredigerare med import, kalibrering, gizmon, materialytor, entitetskopplingar och beständig sparning.
- `/dev/simulator`: separat utvecklingsgränssnitt med samtliga simulatorentiteter, tids-/väderparametrar, sensorfel, individuella bilar och färdiga scenarier.
- Normalvyn har inga val mellan simulator och verkliga givare. Serverns centrala anslutningskonfiguration gäller hela appen. Simulerade värden markeras diskret med DEMO.
- Befintliga sparade objekt behålls. Versionerad migrering kompletterar äldre startscener med saknade standardenheter utan att skriva över redan placerade objekt.
- Bil-/energimått visas bara om motsvarande attribut eller redigerarkoppling finns. W och Wh konverteras korrekt till kW och kWh. Saknade värden visas som Saknar data.

## Simulator och anslutningsgräns

Den befintliga state-storen, tjänsthanteringen och `state_changed`-strömmen återanvänds.
Utvecklingsgränssnittet använder alltid `/dev-api` och `/dev-ws`, vilka enbart läser/
ändrar simulatorns lokala store. De går aldrig genom den riktiga HA-bryggan. Ett
integrationstest konfigurerar en separat HA-testdubbel som live-mål och verifierar
att utvecklingssidans ändringar inte når den.

Normalappen använder samma `/connection-api` och `/connection-ws` mot båda datakällorna.
Riktig HA aktiveras bara med serverns `HA_REAL_URL` och `HA_REAL_TOKEN`. Inga riktiga
uppgifter har lagts in eller någon verklig utrustning styrts under utvecklingen.
Servicegränsen tillåter bara konfigurerade objekt och kända åtgärder. Bilkommandon
mot riktig HA kräver explicit mappning av klimat- och laddningsentitet i redigeraren.

HA-kontrakten använder dokumenterade
[weather.get_forecasts](https://www.home-assistant.io/integrations/weather/),
[lawn_mower-tjänster](https://www.home-assistant.io/integrations/lawn_mower/) och
[REST-history](https://contributors.home-assistant.io/core/internals/rest-api/).
Simulatorn efterliknar de delar appen använder, inte hela Home Assistant.

### Färdigt i simulatorn

- Tid, tidsfaktor, geografisk plats, solhöjd/-azimut, soluppgång/-nedgång och civil gryning/skymning. Soltider beräknas numeriskt och interpoleras; polarnatt/-dag kan sakna övergång.
- Molnighet, temperatur, steglöst regn och snö, vind, riktning, byar, sikt/dimma, prognoser och separat observerat snötäcke.
- Luxsensor med beräknat/manuellt värde, rapportintervall, frysta rapporter, unknown/unavailable och orimliga värden. Orimlig lux används inte för miljökorrigering.
- Lampor och grupper, på/av, bibehållen dimnivå efter av/på, färgtemperatur, RGB, tillgänglighet, externa ändringar och bekräftade events.
- Konfigurerbart panelantal inom oförändrat placerat takfotavtryck och W/panel, sol-/moln-/årstidsberoende produktion, per-panelvärden, växelriktare, kWh-mätare och begränsad historik.
- Huslast inklusive bilarnas laddning/klimatisering, köpt/såld effekt, egenanvänd solel, energi, pris, kostnad och historik. Effektflöden balanseras och laddenergi räknas mot batterikapacitet. Dygnsgränsen delar integrationen så dagsräknare kan nollställas utan att totalmätare minskar.
- Flera individuella bilar: batteri, räckvidd, kabel, hemma/borta, ström/spänning/faser, laddgräns/-tid, klimat och temperatur. Klimat och laddning kan styras med HA-liknande tjänster.
- LUBA: rörelse, tidsstämplar, noggrannhet, fart/riktning, historik, batteri, laddning, område/uppdrag, framsteg, fel och start/paus/återvänd. Varierande rapportintervall, fördröjningar, hopp och bortfall kan simuleras.
- Dammsugare: uppdrag, framsteg, batteri/laddning, start, paus, återvänd och dockning. Position saknas tills en integration faktiskt levererar den.
- Manuella state-/attributöverstyrningar för alla entiteter. De ligger kvar tills Återgå till modell används; därmed kan även avsiktligt inkonsekventa/felaktiga sensorer testas.
- Fjorton scenarier: sommar, solnedgång, vinterbelysning, kraftigt regn, snöfall, snöstorm, dimma, snabba väderändringar, bilankomst/laddning, klimatstart, helt klipparpass, GPS-bortfall, varierande solproduktion och otillgängliga enheter.

### Förenklingar och återstående integrationsarbete

- SMHI-liknande prognoser är syntetiska och bygger på aktuella simulatorinställningar. De är inte riktiga prognoser. Sol-/lastmodellen är en testmodell, inte en produktionsprognos för anläggningen.
- Prisupplösningen är en timme med inställbart pris; andra prisserier kan injiceras i attribut. Tariffer, nätavgifter, moms och separat exportavtal ingår inte i kostnadsmodellen.
- Historik lagras i en begränsad minnesbuffert (högst 720 punkter per entitet), inte i en komplett recorder-databas, och återställs när simulatorn startas om. Scen-/modellkonfiguration sparas fortfarande på disk.
- Tidsskalan snabbar upp väder/energi/laddning. Robottelemetri och rapportintervall använder separat verklig löptid för att kunna testa nätfördröjningar och begränsad extrapolering.
- Nya extra bilar får stabila entiteter; motsvarande 3D-objekt behöver placeras/kopplas i redigeraren.
- Verkliga bil-/robot-/SMHI-entiteter och LUBA 3-positioner har ännu inte inventerats med autentisering. Deras attribut och tillåtna kommandon måste verifieras per integration.

## Rendering och modellkvalitet

Analysen körs reproducerbart med `node scripts/audit-model.mjs`:

| Egenskap | Verifierat resultat |
|---|---|
| Original | `In/Daniels.glb`, 157 671 028 byte, 5 310 780 trianglar |
| Tillgängliga attribut | POSITION, COLOR_0 (vertexfärger), TEXCOORD_0 (UV) |
| Extern textur | `Daniels_u0_v0_diffuse.png` saknas; dess upplösning/komprimering kan därför inte granskas |
| Föregående förenkling | 371 674 trianglar (7 %), UV borttagen, vertexfärger multiplicerade med mörk materialfaktor |
| Ny mobilmodell | 637 292 trianglar, cirka 4,2 MB, färger och UV bevarade |
| Ny detaljmodell | 1 858 652 trianglar, cirka 11 MB, färger och UV bevarade |

`npm run prepare:model` återskapar båda nivåerna från originalet. Bilder skalas inte
ned eller omkomprimeras av pipelinen. Ingen geometri eller bildinformation genereras
för att fylla luckor. Materialets basfaktor är vit för att inte missfärga originalets
vertexfärger. Vertexnormaler beräknas där de saknas. Om texturen tillförs bredvid
originalet bäddas den in vid nästa bearbetning.

Texturer använder mipmaps, linjär förstoring och högsta stödda anisotropi. Renderingen
använder sRGB/ACES, antialiasing och högre pixelkvot (upp till 1,5 mobil / 2 dator).
Automatisk kvalitet väljer detaljmodell på större skärm och mobilmodell på mindre;
explicit låg/hög kvalitet kan väljas i redigeraren. Dyra skuggkartor aktiveras bara
vid explicit hög kvalitet. Bildfrekvensen begränsas till 30 Hz och släckta ljus tas
ur ljusberäkningen. Högst åtta samtidiga dynamiska lampor används.

Nederbörden har återanvända buffertar, upp till 6 000/12 000 regn- respektive
snöpartiklar beroende på kvalitet, kontinuerlig intensitet, vind/byar och varierande
flingstorlek/-hastighet. Kameran omges av en djup volym. Ett begränsat antal BVH-
raycasts projicerar stänk på modellens ytor. Våta uppåtriktade ytor mörknar och får
lägre råhet. Tät nederbörd påverkar ljus/sikt. Stänk är en begränsad visuell approximation,
inte en full vätskesimulering; snö ackumuleras inte automatiskt till nytt modellerat snötäcke.

Fotogrammetrin och vertexfärgerna kan innehålla fotograferat ljus och skuggor. Utan
originalbilder/textur går det inte att skilja alla sådana fel från renderingsfel.
Separata verifierade årstidsskanningar, korrekt meterskala/nord och inmätta
objektpositioner återstår. Fyra modellplatser finns men refererar ännu till samma
Daniels-skanning när separata filer saknas. SMHI-prognos används aldrig som säker
uppgift om lokalt snötäcke.

## Verifiering

`npm test`, `npm run typecheck`, dashboardens produktionsbygge och `npm run test:e2e`.
Testerna täcker state/tjänster, sol, energi och dygnsgräns, sensorkvalitet, laddning,
GPS-fel, bounded/markerad extrapolering, modellbyten, cache/livscykel, nederbördsbuffertar,
import/sparning, enheter, källisolering och normal-/redigerings-/simulatorvyer.
Senast körda 56 enhets-/integrationstester, fyra Playwright-flöden, typkontroll och
produktionsbygge är godkända. Den verkliga skanningen verifieras i mobil/balanserad
kvalitet i mjukvarurenderad Chromium; övriga UI-flöden använder en liten separat
GLB-fixture för att isolera funktionstester från hårdvaruprestanda. Detaljmodell och
skuggor behöver dessutom prestandaverifieras på målmaskinvara. Inga kända testfel
kvarstår; Vite visar fortsatt en stor-bundle-varning för Three.js/Meshopt (680 kB,
174 kB gzip).
