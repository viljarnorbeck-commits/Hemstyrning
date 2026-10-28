# Hemkontroll: användarläge, redigerare, himmel och kalender

## Klart i denna etapp

- **Redigera gård** är en tydlig knapp i huvudvyn. Redigeraren ligger fortsatt separat på `/editor`.
- Objektlistan i redigeraren gör samtliga placerade objekt valbara även när de är skymda. Lampor, bilar, parkering, takpaneler/materialytor, laddstation, dammsugare, andra enheter och skymmande volymer kan placeras på modellen och finjusteras numeriskt eller med gizmo. Befintliga objekt kan ändras och tas bort. Autosparning och Spara skriver fortfarande atomiskt till disk.
- Bilboxen kom från en extra, förenklad bilmesh ovanpå skanningen. Äldre bilar migreras till **Redan fotograferad i modellen**: bara osynlig klickgeometri används. Nya fristående bilar har en separat rundad kaross med kupé/hjul. Representationen väljs i redigeraren. Originalskanningen ändras inte.
- Transformationsgizmo, skymmande hjälpkuber och ytpunkter visas enbart i redigeringsläge. De är inte synliga i normalt användarläge.
- Överkanten visar tid/datum, temperatur, väder/månfas, elpris, husets effekt och solel. Snabbåtkomst öppnar fällbara sektioner för belysning, bilar, gräsklippare, dammsugare, energi och kalender. Den kompletta enhetslistan finns kvar.
- Belysning kan tändas/släckas i grupp; bilklimat och robotåtgärder använder befintlig serverbrygga och bekräftade states. Kameran kan följa gräsklipparen; manuell kameranavigering avslutar följningen.
- Markörernas synlighet prövas med BVH-raycasting mot den verkliga gårdsgeometrin och konfigurerade skymmande volymer. En markör bakom ett hus försvinner och kommer tillbaka när kameran flyttas. Skärmlayouten separerar närliggande markörer, dämpar avlägsna symboler och visar namn vid fokus/hover/val. Listan och snabbpanelen fungerar även för skymda enheter.

## Kalender via Home Assistant

Flera `calendar.*`-entiteter anges i redigerarens Miljö-inställningar. Appen hämtar
kalenderdata genom servern med Home Assistants [kalendergränssnitt](https://www.home-assistant.io/integrations/calendar/),
inte genom en Google-klient i webbläsaren. Google Kalender kopplas i den riktiga
Home Assistant-installationen; dess kalenderentiteter används sedan här.

Snabbpanelen visar kommande händelser. En större agendavy visar dagens schema och
kommande vecka, med kalendernamn, tid, heldag och plats. Data hämtas vid öppning,
relevanta kalenderändringar och högst en gång per minut annars. Saknade/otillgängliga
kalendrar och ofullständiga händelser hanteras utan att resten av gränssnittet kraschar.
Endast kalendrar i den sparade konfigurationen får läsas genom live-bryggan.

Simulatorn innehåller familje-/arbetskalender, tidsatta händelser och heldagar.
Händelsernas datum följer simulatortiden. Kalenderstate visar pågående händelse;
`calendar.get_events` och REST-kalenderläsning har HA-liknande format. Händelser kan
ändras i utvecklingssidans vanliga attribut-JSON och återställas med Återgå till modell.
Ingen händelseskrivning till Google eller verklig HA har implementerats eller utförts.

## Ljus, färg och natt

Månens topocentriska position och upplysta andel beräknas med
[Astronomy Engine](https://github.com/cosinekitty/astronomy), från samma datum,
position och nordkalibrering som solen. [HA:s Moon-integration](https://www.home-assistant.io/integrations/moon/)
ger en symbolisk fas som kan visas i översikten; den ersätter inte astronomisk position
eller exakt upplyst andel. Simulatorns månsensor räknas från simulerat datum.

Natten har ett separat kallt riktat månljus, svagt himmelsljus och mjukt anpassad
exponering. Moln, solhöjd, månens höjd/fas och den begränsade luxkorrigeringen påverkar
resultatet. Lampornas spotlights använder bekräftad HA-brightness/färg. Automatisk
kvalitet tillåter en begränsad lampskugga på natten; hög kvalitet har även sol-/mån-
skuggor. Balanserad låg kvalitet stänger av skuggkartor för svagare maskinvara.

Ljusstyrkor/exponering är **visningskalibrerade för orienterbarhet**, inte en mätning
av verklig månljus-lux eller en fotometrisk simulering av gårdens armaturer. Lokal lux
kompletterar modellen och får inte göra natt till dagsljus. Natt och gryning/skymning
har kontinuerliga övergångar. Värme, färgmättnad, kontrast, dag-/natt-exponering och
ACES/AgX/Neutral-tonemapping är justerbara i redigerarens Miljö-panel och sparas på disk.
Graderingen görs i renderingen; ursprungliga modeller och bilddata förblir orörda.

## Himmel och omgivning

- Solskiva och fasbelyst månskiva placeras i rätt riktning. Solens färg blir varmare nära horisonten.
- Himmelsgradient, solglöd, syntetiska moln och horisontdis reagerar på väderdata.
- Stjärnhimlen använder 2 865 verkliga stjärnor ur **HYG v4.1**, omräknade från J2000 till datumets koordinater och lokal horisont. Stjärnor dämpas av dagsljus, moln och månljus. Katalogen ligger lokalt; [källor och licens](THIRD_PARTY_DATA.md) följer med.
- **Visa himmel** riktar kameran mot sol/måne eller nattens stjärnhimmel. Återställ vy återgår till gården. Himmelsriktningarna flyttas inte godtyckligt för att passa vyn.
- En enkel syntetisk terrängkrage tar vid utanför skanningen. Kantposition/höjd/färg samplas från modellen och övergår till en lugn årstidspalett och dis. Ingen detaljrik, påstått uppmätt omgivning skapas.
- Panoreringens markfokus begränsas till den verkliga modellens område. Redigerarplacering raycastar endast mot originalmodellens yta, aldrig mot den syntetiska terrängen. Översiktskameran kan kretsa utanför gården; inget promenadläge utanför modellens område finns.
- Robotens renderade höjd kan följa terrängytan. Detta är visuell markanpassning, inte uppmätt GPS-höjd. Sparade objektkoordinater ligger fortsatt separat från alla fyra årstidsmodellerna.

## Kända begränsningar och återstående arbete

1. `Daniels_u0_v0_diffuse.png` saknas fortfarande. Originalet har vertexfärger och UV, men full texturkvalitet går inte att återställa utan filen. Kvarvarande flytande fragment/vertikala kanter och fotograferade skuggor hör till fotogrammetrin, inte debughjälpare. Terrängen minskar den abrupta avslutningen men lagar inte originalets geometri.
2. Tre separata årstidsskanningar saknas; platserna använder samma referens tills nya modeller importerats. Ingen snöfördelning eller ny originalgeometri fabriceras.
3. Enhetspositioner, verklig meterskala/nord, lokala sensorers placering och verkliga kalender-/bil-/LUBA-entiteter behöver verifieras på plats. Armaturer som placerats under mark eller inne i byggnader måste kalibreras i redigeraren.
4. Fotograferade bilar är statisk del av skanningen. Att dölja en separat bilmesh när bilen är borta tar inte bort bilen ur fotografierna. En rensad grundskanning behövs för full dynamisk ersättning.
5. Terräng, moln och månyta är visuella approximationer. Stjärnors precession/nutation beaktas, men egenrörelser, exakta måntexturer, förmörkelser och avancerad atmosfärisk spridning ingår inte.
6. Prestanda på faktisk mobil och högkvalitetsläge behöver också mätas på målmaskinvara. Historik för simulatorn förblir minnesbaserad. Ingen riktig Google-/HA-anslutning har aktiverats under arbetet.

## Verifiering

Enhets-/integrationstester täcker sparning, kalenderintervall/heldagar/otillgänglighet,
syntetisk månfas från simulatortid, NASA-referensdatum för ny/fullmåne, horisont-
koordinater, mörker/moln, markörskymning, terrängens markbegränsning och resurslivscykel.
Webbläsartester täcker redigerarplacering av laddstation/dammsugare/enhet/skymmande volym,
ändring/radering/omladdning, verklig kameraberoende markörskymning, kalender och mobilvy,
liksom tidigare lamp-/simulator-/modellbyten. Se PROJECT_MEMORY.md för slutligt körresultat.
