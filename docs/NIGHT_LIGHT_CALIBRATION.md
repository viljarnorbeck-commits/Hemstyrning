# Gårdens nattbelysning, första fotokalibreringen

## Underlag

Fyra oförändrade originalfotografier och användarens beskrivningar finns separat i
`../Nattkalibrering/2026-11-03/`. Originalen på D: har inte ändrats. Där finns även
SHA256, EXIF, preliminär bildkamera, strålträffar mot modellen och separata
3D-renderingar. Bilderna läggs inte i Git eller i appens texturer.

| Filslut | Användarens uppgift | Hantering |
| --- | --- | --- |
| 0608 | Båda kökslamporna | Sparade som underlag; två fysiska positioner kan inte fastställas genom fönstren |
| 0609 | Trappen i hallen | Trolig trapp-/hallentitet identifierad, men armaturen är dold inne i huset |
| 0611 | Stolparna | En synlig stolpe till höger om bostadshuset placerad provisoriskt |
| 0612 | Utebelysning, förtydligat till Skymning | Tre synliga armaturer vid garagedelen och entrén placerade provisoriskt |

Användaren bekräftade att de provade lamporna släcktes mellan bilderna. Annan
bakgrundsbelysning och ljus inne i huset syns fortfarande; de behandlas inte som
fler identifierade gårdslampor. Distant gatubelysning tilldelas inte gården.

## Kalibrering och återanvändning

Kanonisk profil:
`In/hemkontroll_3d_komplett/src/system/calibration/kyrkas-night-2026-11-03.json`.
Den innehåller positioner, riktmål, ljusfördelning, färg, referensstyrka,
bildreferenser, entitetskopplingar och uppskattningsstatus. Positionerna ligger i
`yard380-gltf-v1`, inte i bildpixlar eller den gamla fastighetens koordinater.
Gårdsmodellens aktuella visningstransform appliceras på hela ljusgruppen.

Modellen v000011 matchades med manuella byggnadslandmärken och en separat
kamerauppskattning för nattbilden. Kameran eller modellens transform i appen har
inte ändrats. Strålar från de identifierade armaturpunkterna gav träffar på
modellens fasader. Stolpens topp uppskattades från dess synliga fotpunkt på marken
och en lodlinje. Det är en visuell placering i en ofullständig rekonstruktion,
inte inmätta koordinater. Osäkra landmärken sparas som avvisade korrespondenser.

Ljuset skapas av riktiga Three.js SpotLight/PointLight, utan att målas in i
texturer. För väggarmaturerna delas referenseffekten mellan en mjuk huvudkon och
ett svagare brett ljus från samma position; effekterna summeras till profilens
referensvärde. En första separat rendering jämfördes visuellt med fotografierna.
Spridningen ändrades därefter från enbart markriktade koner till att även ge
fasadljus. Jämförelserna är förhandsbilder, inte bevis på slutlig fotometrisk passning.

Färg, lumen och räckvidd är startvärden för fortsatt injustering. Kameran använder
automatisk vitbalans, ISO varierar mellan 2310 och 3200 och exponeringstiden mellan
1/3 och 0,4 sekund. Ljuspunkterna är delvis utfrätta. Det går därför inte att mäta
verkligt lumen, lux eller exakt Kelvin ur dessa JPEG-filer. Uppskattade
positionsmarginaler är visuella arbetsmarginaler, inte statistiska konfidensintervall.
Profilen anger uttryckligen `physicalAlignmentVerified:false` och
`absolutePhotometryVerified:false`.

## Home Assistant

En läsande kontroll bekräftade följande verkliga entiteter:

- `switch.skymning`: användarens förtydligade grupp för sista bilden.
- `switch.aktora1_b1_port10_ute_stolpar_belysning`: separat stolpbelysning.
- `switch.aktora1_b1_port2_taklampa_trapp_hall`: kandidat för hallens trappa.
- `light.koksbord`, `light.bankbelysning_kok` och
  `switch.aktora1_b2_port4_kok_koksbord_belysning`: kökskandidater, inte två säkert
  identifierade fysiska armaturer. Ingen dubblerad automatisk placering gjordes.

Renderaren läser endast bekräftat on/off och eventuell ljusstyrka. Den har inga
tjänsteanrop eller styrknappar. Den befintliga stolpdefinitionens entitetskoppling
används när den finns, även om kopplingen uttryckligen tömts. Frånkoppling släcker
de virtuella ljusen direkt. Inga riktiga enheter har styrts.

## Skydd och begränsningar

- Aktivering kräver rätt källram och att den faktiskt laddade modellen motsvarar
  den aktiva importens modellfil. Fel ram, laddfel eller annan reservmodell döljer ljusgruppen.
- Samma källram kan återanvända profilen efter modelluppdatering, men fysisk
  placering bör granskas när bättre geometri kommer. Ny källram kräver ny passning.
- Diagnostikens neutrala referensläge och himmelsvyn visar inte dessa ljus.
- Befintliga objektpositioner, HA-inställningar, kamera, hemskärmens fotografi och
  alla originalmodeller är bevarade. Inga tidigare rensade placeringar återställs.
- Köks-/hallarmaturer och ytterligare stolpar är uttryckligen väntande i profilen.
  En sidovinkel och en närbild per dold armatur behövs för säker fysisk placering.
- Automatiska tester, typkontroll, bygge och push har inte körts för denna ändring.
  Separata 3D-förhandsbilder skapades som del av fotoanalysen. Full appverifiering
  återstår när användaren tillåter tester.

## Lampor även på den fotografiska hemskärmen

Hemskärmen återanvänder nu samma profil och samma läsande entitetsupplösning som
3D-riggen. yard-photo-lighting.ts projicerar armaturer samt uppskattade mark- och
fasadytor genom fotografiets befintliga kamera i källramen. Ett separat SVG-lager
följer bildens beskärning, rundning och parallax. Det visar mjukt ljus, små ljuskärnor
och diskret bloom när respektive HA-koppling är bekräftat på. Kopplingsförlust eller
fel källram döljer effekten direkt. Dagtid dämpas effekten, nattetid syns den fullt.

För den matchande aktuella modellen används nu förberäknad ljusspridning och
ocklusion från GLB-geometrin för vägglamporna; se sista avsnittet. Annars används
den tidigare förenklade bildprojektionen. De verkliga 3D-ljuskällorna används
fortsatt i fri 3D.
Ljuset är aldrig inbränt i originalfoto eller modelltexturer. Ingen ytterligare
GLB laddas på hemskärmen och ingen ny animationsloop, backendprocess eller HA-styrning
införs. Befintliga manuellt placerade bildmarkörer undviker dubbelt ljus för samma
kalibrerade entitet. Den tidigare diskreta fotolystern behålls och förstärks svagt på
natten tillsammans med lampornas ljus.

## Användarens korrigering av väggarmatur och stolpe

Profil v2 flyttar garage-wall från den smala röda dörren till den vita väggen direkt
till höger. Ljuspunkten flyttades genom skärning mellan den befintliga fotokamerans
stråle och armaturens uppskattade fasadplan, med samma förskjutning av riktmålet.
Bildankaret är cirka (756,496) i 1920x1080-underlaget. Positionen är fortfarande en
visuell uppskattning: användarens närbild visar armaturen delvis bakom ett träd.
Referenserna finns oförändrade i nattkalibreringens references-mapp utanför Git.

Wall-lantern och post-lantern ger nu enkla synliga metall-/glashöljen i fri 3D.
Stolpen går ned till profilens tidigare markpunkt. På hemskärmen ritas motsvarande
projektion i ett separat normalt blandat SVG-lager, skilt från ljusskenet. Själva
armaturen/stolpen finns därför kvar vid släckt lampa eller tappad HA-anslutning;
endast glöd och glasets emission följer bekräftat påläge. Exakt armaturmodell är
inte verifierad och formen är provisorisk. Scannad geometri och originalbilder
ändras inte. Robotkortet får en liten uppflyttning enbart på kompakta datorvyer för
att lämna stolplyktan synlig. Tester och push förblir pausade.

## Modellberäknat ljus och skuggor på hemskärmen

Efter användarens ritade riktningar granskades Skymning-originalet 0612 igen.
Vägglampornas tidigare ellipser/rektanglar ersätts för aktuell modell av separata
transparenta ljusöverlägg. Dessa är beräknade från GLB-geometrin, inte målade på
fotografiet: kamerans strålar hittar synliga ytor, Lambert/inverskvadrat ger
ljusavtagande och fyra strålar mot en liten ljuskälleyta ger mjuk ocklusion.
Verandastolpar, räcken, takutsprång och väggar i den verkliga modellfilen kan därmed
skymma ljuset. Ett mjukt begränsat uppåtriktat ljus följer armaturernas kåpor och
nattbildens ljus huvudsakligen nedanför takfoten. Glorian minskad för vägglamporna;
stolpens tidigare ljus och utseende behålls.

Generatorn `scripts/render-yard-photo-lighting.mjs` kan köras med
`node --import tsx scripts/render-yard-photo-lighting.mjs`. Den läser befintlig
aktiv modell/profil/kamera och skriver enbart nya ljus-PNG och separat metadata.
Den skapar ingen bevakning, ändrar inte GLB/fotografier eller HA och startar inte
modellsynk. Frontend kräver matchande modell-SHA256, bild-SHA256, källram, kamera
och armaturposition/riktmål innan dessa överlägg används. Vid annan modell eller
misslyckad bildladdning återgår den till tidigare förenklad ljusprojektion.

Både huvudbildens originalpixlar och 3D-texturer är oförändrade. På/av/ljusstyrka
kommer fortfarande från samma bekräftade HA-status. Inga ljussken visas för
släckta/frånkopplade lampor. Överläggen är förberäknade ljusbidrag, ingen extra
3D-modell eller strålspårningsloop laddas på hemskärmen. Skuggornas passning är
fortfarande ungefärlig eftersom modellen/kamerapassningen är provisoriska;
växtlighet och geometri som saknas kan inte ge exakta skuggor. Ingen absolut
fotometrisk kalibrering påstås. Tester, typkontroll, bygge och push fortsatt pausade.

### Utjämning av rekonstruerade ytor

Vägglampornas generator använder nio mjuka skuggprov och ett litet ytavstånd mot
självskuggning. Små isolerade avvikelser filtreras i ljusets alfakanal, begränsat
till samma modellyta med närliggande 3D-position och liknande normal. Arkitekturens
kanter och breda skuggor behålls. Konstant RGB under transparenta pixlar förhindrar
smutsiga färgfransar. Stolpens tidigare ljuslager påverkas inte.

## Synliga köks- och hallfönster

0608 och 0609 används även för separat fönsterrespons i fotovyn. I
`kyrkas-photo-windows.json` lagras glasytornas bildkoordinater och mjukt spill,
med hashbindning till originalfotot. Spröjsar och karmar lämnas fria. Köksfönstret
följer Köksbord (direkt KNX-brytare) och Bänkbelysning Kök, vilket användaren
bekräftat; hallfönstret följer Trapp-hall. Separata viktade ljusbidrag gör att en
eller båda kökslamporna kan bidra utan att en av dem måste vara på för den andra.
Bekräftad status och ljusstyrka används i befintlig uppdatering; frånkoppling och
okänd/otillgänglig/släckt status ger inget ljusbidrag. Färger och styrkor är
visuella uppskattningar, inte uppmätta ljusflöden.

Detta är synligt ljus genom fönstren, inte en uppmätt placering av dolda
inomhusarmaturer. Därför ligger dessa armaturpositioner fortfarande pending i
3D-profilen. Fotografi, modell och befintliga utomhusljus ändras inte.
