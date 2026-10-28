# RealityScan, geografisk kalibrering och egna enhetsmodeller

## Användning

Starta med `npm run dev`. Hemkontroll ligger på `http://localhost:5173`, redigeraren på
`/editor` och den isolerade simulatorn på `/dev/simulator`. I **Redigera gård** öppnar
**Karta, modelljämförelse och import** de nya administrationsverktygen. När ett objekt
är valt finns samma verktyg via **Egen 3D-modell, markyta och robotljus**.

### Original och diagnostik

- `In/Daniels.glb` är orörd. SHA-256:
  `f6cfc3c0cbe8896a09cdb8f9ee456245e666083882a816d0ed8f55aba6e3e6fe`.
- Original och oförenklad referens: **5 310 780 trianglar**. Detaljmodell:
  **1 858 652**. Mobilmodell: **637 292**. Referensen förenklas eller kvantiseras inte.
- Originalets **Daniels_u0_v0_diffuse.png** är återfunnen: 8192 × 8192, RGBA8 PNG,
  sRGB utan ICC-profil. Samma PNG-bytes bäddas in i alla tre GLB-nivåer.
- Fototexturen används med vit basfaktor; duplicerade fotografiska COLOR_0 tas bort
  enbart ur genererade texturerade primitiver. Originalfilerna ändras inte.
- Ingen atlas skapas och bilden skalas inte ned eller omkomprimeras. Förenklade
  modeller använder Meshopt med 16-bitars positioner/UV. Referensens positioner,
  index och UV är exakt bevarade. `npm run verify:model` kontrollerar detta.
- RealityScan-projekt/exportinställningar och data före export saknas fortfarande;
  eventuell tidigare atlas-sammanslagning eller nedskalning kan inte avgöras.
- Se [TEXTURE_RESTORATION.md](TEXTURE_RESTORATION.md) för filstorlekar och GPU-minne.

Under **Modelljämförelse** kan samma kameravy växlas mellan nivåerna och ett neutralt,
obelyst källfärgsläge. Det stänger av extra ljus, väta, färggradering, tonemapping,
himmel och interaktiva objekt. sRGB-utmatning och antialiasing behålls. Läget är
lokalt och tillfälligt; **Återgå till normalläge** återställer normal rendering.
För andra importerade modeller används deras egen oförändrade geometri.

`node scripts/audit-model.mjs` granskar original och alla nivåer, inklusive
bilddimensioner när bilddata finns. Resultat: [MODEL_AUDIT.json](MODEL_AUDIT.json).
`npm run prepare:model` återskapar härledda nivåer, aldrig originalet. Renderer använder
mipmaps, linjär förstoring, GPU:ns maximala anisotropi för gården, pixelkvot upp till
2 på dator/1,5 mobil och högst 30 bilder/s. Referensen är minneskrävande och laddas
endast på uttryckligt val. Inbakad belysning går inte att avlägsna med nya ljuskällor.

För en fullständig jämförelse behövs en export med **alla texturer inkluderade**, UV,
ursprunglig detaljnivå och gärna RealityScans exportinställningar/skärmbild.
RealityScans dokumentation beskriver att sammanslagning till en textur kan minska
detaljer om maximal texturstorlek inte räcker:
[Model Export](https://rshelp.capturingreality.com/en-US/tools/export.htm).

### Karta och kalibrering

Kartvyn använder MapLibre GL JS och rasterkarta i Web Mercator. Navigera genom att
panorera/zooma eller ange latitud/longitud och välj **Navigera till koordinat**.
Standardkartan kommer från OpenStreetMap med attribution; internet behövs bara för
kartunderlaget. Egna rastertiles kan anges i `geography.mapTiles` i konfigurationen.
Inmätta koordinater kan användas utan fungerande kartunderlag. Adressökning och
ett satellit-/ortofotoabonnemang ingår inte.

1. Bestäm gårdens gemensamma referenspunkt innan modeller kalibreras. Ange WGS84
   latitud/longitud och höjd med gemensamt höjdsystem.
2. Välj en känd punkt på kartan, eller skriv inmätta koordinater. Välj därefter
   **Välj motsvarande punkt i 3D** och klicka på originalgeometrin.
3. Upprepa med minst tre väl spridda, icke kollineära punkter.
4. **Beräkna och tillämpa** uppdaterar endast den aktiva årstidsmodellens transform.
   Objektens gemensamma meterkoordinater ändras inte. Kontrollera RMS och de
   synliga lägena. Fler punkter minskar känsligheten för enstaka fel.
5. Finjustera position, skala och rotation med befintliga numeriska/gizmo-verktyg.

WGS84 → ECEF → lokalt ENU används; scenen har X öst, Y upp, −Z nord före den
sparade nordrotationen. Inversen används för kartpolygoner. `geography.altitude`
är origoets ellipsoidhöjd; blanda inte ellipsoidhöjd och havshöjd utan omräkning.
Kalibreringen passar horisontell likformighet (translation, yaw, enhetlig skala)
och medelhöjd, med RMS i meter. Pitch/roll korrigeras manuellt; verktyget är inte
en full 3D-geodetisk utjämning. RMS mäter passningen, inte kartans absoluta fel.
Att ändra referenspunkt ändrar alla GPS-positioners geografiska tolkning, därför
ska ursprunget fastställas först. Simulatorns latitud/longitud och HA:s SMHI-integration måste konfigureras på samma
plats som gårdens sparade referens; 3D-astronomin använder alltid gårdens referens. Frontend ändrar inte verklig HA-konfiguration.

MapLibre och Three.js kan dela WebGL via en custom layer, men här används en
separat kartvy med gemensamma koordinater för att behålla befintlig renderer och
undvika dubbelladdning av den stora skanningen. Se
[MapLibres Three.js-exempel](https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-3d-objects-and-models-using-threejs/).

### Egna modeller, bilar och markytor

Välj objekt i objektlistan och importera en GLB med inbäddade resurser. Kalibrera
filens origo, skala, rotation och markkontakt/hjulhöjd. Objektets placering och
HA-koppling är fortsatt separata. **Förhandsgranska vald enhet** fokuserar kameran.
Felaktiga eller avbrutna modelladdningar lämnar testgeometrin och avvecklar resurser.

En bil utan HA-koppling visas inte i normalläge. Explicit hemma/borta och manuell
närvaro stöds. Kabelstatus används aldrig som närvaro. Otillgänglighet är inte
bevis på frånvaro. Vid okänd status behålls senaste kända synlighet i sessionen.
Fotograferade bilar kan fortfarande finnas i originalskanningen: de går inte att
radera genom att dölja ett separat objekt. En skanning utan bilar behövs.

Skapa **Materialyta** genom hörnklick i 3D och välj gräsmatta, klippområde, transport,
passage, förbjudet område, hinder eller körbar mark under **Mark och robotljus**.
Hörnen kan flyttas med redigerarens **Flytta hörn**-gizmo, numerisk JSON eller dras i
kartvyn. Markpolygoner behöver inte vara plana; dela komplicerade ytor i flera delar.
De är separat kollisionsgeometri, synlig endast vid redigering, inte ny gårdsmodell.

Markhöjd och normal interpoleras över triangulerade polygoner, inklusive konkava
former. Klipparen följer höjd/lutning och rörelseriktning. Utan definierad mark används
originalmodellens raycastade höjd; då kan ett tak eller skanningsfel ge fel markträff.
Korrekt avgränsat underlag måste därför kalibreras. Transport och passager tillåts;
roboter flyttas inte till närmaste gräspunkt. Segment kontrolleras mot tillåtna och
förbjudna områden med 20 cm provsteg; mycket smala hinder måste ges tillräcklig marginal.

Positionsmotorn återanvänds: högst tre minuters historik, avvisade GPS-hopp/äldre
rapporter, recent riktningsestimat, mjuk utjämning och högst sex sekunder/tre meters
extrapolering. Vid stale/offline stannar den renderade positionen. Blockerad sträcka
stannar och märks osäker. `trackingOffset` ger manuell positionskorrigering.
Verkliga LUBA 3-attribut/GPS har inte verifierats; inga verkliga token används.

### Robotljus

En separat spotlight följer robotens position, rotation och lutning. Inställningarna
omfattar monteringspunkt, kelvin, lumen, vinkel, luxtröskel och uppskattning tillåten/av.
Explicit färsk HA-lampstatus prioriteras. Annars kan arbete + lux/astronomiskt mörker
ge en **uppskattad** visuell status. Panelen skiljer uppmätt/uppskattat/okänt.
Virtuellt ljus skickar aldrig kommandon till en riktig robotlampa.

**Referensmaterial saknas:** inga LUBA-nattfoton finns i projektet. Webbsökningen gav
produktbilder och material om andra modeller, men ingen tillräckligt verifierbar
LUBA 3-nattserie för ljuskalibrering. Testprofilens 4 500 K/180 lm/65° är därför
justerbara testvärden, inte tillverkaruppgifter eller uppmätta LUBA-egenskaper.
Behov: egna mörkerbilder framifrån/sidan, ljusfläck på känd mark, avstånd, exponering
och robotens lampinställning samt faktisk integrationsstate.

### Fotografisk himmel

Importera equirectangular JPEG/PNG med 2:1-förhållande (512–16 384 px bredd,
högst 80 MB). Originalbilden sparas oförändrad och innehållsadresserad. För GPU-visning begränsas den till 8 192 px på dator/4 096 px i smal mobilvy; högst två panoramatexturer behålls under övergångar. Välj
nordrotation, fotograferingstid med tidszon, exponering, mättnad och intervall för
solhöjd/molnighet. Automatisk matchning väljer första passande panorama; om inget
passar används procedurhimlen. Manuell/procedurgenererad himmel kan alltid väljas.

**Förhandsgranska i 360°** aktiverar panoramat och låter kameran rotera. Återställ vy
återgår till gården. Övergångstid sparas och ger övertoning; fotograferade moln
animeras inte. Dynamiska himlakroppar behåller astronomiska positioner. Markera
**Fotografiet innehåller solen** och ange dess fotograferade riktning/höjd samt
maskradie. Masken tonar till procedurhimlen; den tar inte bort solen ur originalbilden.
Kontrollera hela solglöden visuellt. Automatisk bildanalys/inpainting eller fysisk
morfning av olika molnbilder ingår inte. Välj procedurhimmel när övertoning eller
fotograferad måne/stjärnor inte kan kombineras trovärdigt.

Globala färginställningar finns kvar. **Ljusprofiler** ger varsamma tillägg för dag,
solnedgång, skymning, månljus, mulet, regn och snö samt per årstidsmodell.

### Simulator och lagring

Sjutton scenarier omfattar nu testsluttning, transport över uppfart och återgång
till docka. `mowerRoute` är redigerbar JSON med lokala [öst, höjd, syd]-punkter;
`mowerLight` kan vara auto/on/off/unknown. Positionernas tidsstämplar använder
telemetriklockan även när väderdatum snabbspolas. Frontend åldrar positionsdata mot simulatorns explicita telemetriklocka plus verklig tid sedan senaste uppdatering; även manuella tidssteg kan därför bli stale utan att fastna i framtiden. Testsluttningens `local_y` är
syntetisk telemetri; renderer använder kalibrerat markunderlag för hjulkontakt.
Alla utvecklingsendpoints förblir hårt bundna till den lokala simulatorn.

Scen, referenspunkter, polygoner och asset-/panoramainställningar sparas atomiskt i
`data/scene.json`; filer ligger i `data/models/` och `data/panoramas/`. Säkerhetskopiera
hela `data/`. JSON-export innehåller länkar, inte filernas bytes. Simulerade states och
historik är fortfarande minnesbaserade. Fyra modellplatser delar enhetskoordinater;
endast befintlig höstskanning finns, övriga importer väntar på underlag.

## Kvar att verifiera på plats

Verifiering mot RealityScan på hårdvaruaccelererad dator; inmätta kontrollpunkter och nord/meter;
egna bil-/robotmodeller; riktiga panoramabilder; verkliga LUBA-positions-/lampattribut;
ljusprofil mot nattfoton; tre årstidsskanningar; korrekt HA/SMHI-plats och faktisk
prestanda på mobil/hårdvaruaccelererad dator. Ingen verklig installation eller
Google-anslutning har aktiverats. Automatiska snömodellbyten kräver fortsatt en
verifierad lokal observation, inte en prognos om snöfall.

## Verifiering och prestandagränser

83 enhets-/integrationstester är godkända (33 backend, 50 dashboard). De täcker även
ENU-rundtur/passningsfel, konkava markytor, passager/hinder, tidsåldring efter
simulatortidssteg, närvaro, neutral materialåterställning och panoramors resursavveckling.
Samtliga nio webbläsarflöden är godkända i den sista sammanhängande körningen (5,4 minuter), inklusive tidigare funktioner, importer, karta och direkta lampklick. Typkontroll och produktionsbygge är godkända; localhost och simulatorns health är verifierade.

Headless Chromium använder mjukvarurendering; detta är funktionell regression,
inte ett löfte om mobil FPS. Stor kartkod laddas endast vid kartöppning, och
referensmodell/panoraman laddas endast när de väljs. Vite rapporterar stora
Three.js/Meshopt- och MapLibre-chunks. Produktionsautentisering och uppgradering
av äldre Vitest-utvecklingsberoenden återstår som separata drift-/verktygsuppgifter.

## Markanalys och beständig LUBA-positionering

Separat markunderlag, kameraskydd, redigerargranskning, SQLite-historik och
inlärda körstråk beskrivs i [LUBA_TERRAIN_AND_LEARNING.md](LUBA_TERRAIN_AND_LEARNING.md).
Det ersätter tidigare takraycast för kamerans och robotens markhöjd.
