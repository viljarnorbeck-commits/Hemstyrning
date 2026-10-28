# Markunderlag, kamera och LUBA-inlärning

Starta `npm run dev` med Node >=22.13. App: http://localhost:5173,
redigerare: `/editor`, isolerad simulator: `/dev/simulator`.

## Kamera och godkänd mark

Kamerans kollision använder separat markdata, aldrig en vertikal raycast som kan
träffa ett tak. Manuella, godkända markpolygoner prioriteras. Därefter används
analysens lägre sammanhängande markhölje. Hål/hinder/ytterkanter använder en
konservativ reserv ovanför högsta identifierade mark; utan analys används
modellens övre begränsning. Detta kan ge en hög kameravy tills marken granskats.
Både fokus och kamera begränsas efter OrbitControls, även vid följning och zoom.
Den separata himmelsvyn finns kvar. Originalets geometri/texturer ändras inte.

## Analysera gården

Öppna **Redigera gård → Karta, modelljämförelse och import → Analysera gården**.
Starta analysen och hämta resultatet efteråt. En separat Node-process rasteriserar
lokal GLB-geometri med modellens kalibrering, normalt 0,5 m celler, högst 240×240.
Lutning, vertikala ytor, höjdspann och lägre sammanhängande ytor ger **förslag**:
grönt sannolik mark, rött hinder, gult osäkert. Ingen texturfärg används som
bevis på gräs. Resultatet sparas i ignorerade `data/analysis/<hash>.json`.
Filinnehåll och modellkalibrering ingår i cacheidentiteten; beräkningen görs inte
per bildruta eller GPS-uppdatering. Mobilen hämtar färdig data.

Visa överlagringen i 3D, byt föreslagen klass och godkänn eller avvisa enskilda
förslag. Listan har sidbläddring. Osäkra områden kräver uttrycklig omklassificering
och kontroll. Godkännandet skapar ett separat ytobjekt i befintliga objektlistan;
där kan form, höjd och funktion ändras eller objektet raderas. Besluten sparas.
Manuella ytor skrivs inte över. En ändrad godkänd yta märks som manuell.
Kollisionsytor och analysfärger visas endast i redigeraren.

LUBA använder **godkänd** mark, dess triangulerade höjd/lutning och hela rörelsens
kollisionskontroll, inklusive stöd längs sträckan och orimliga höjdsteg. Robotens bredd/längd kan ändras under Mark och robotljus;
standard 0,65×0,90 m är uppskattad teststorlek. En omskrivande cirkel ger
konservativa marginaler. Saknad godkänd mark döljer den dynamiska modellen i
användarläget; enhetslistan visar fortfarande telemetri och varning. Blockerade
sträckor hålls kvar, ingen omväg uppfinns. Detta är visualisering, **inte robotens
säkerhets- eller navigeringssystem**. Inga körvägar skickas till roboten.

## Beständig telemetri och inlärning

`data/luba.sqlite` med WAL sparar mättid, mottagningstid, WGS84, lokala koordinater,
kalibreringsreferens, tillgänglig noggrannhet/hastighet/riktning samt aktivitet,
område och uppdrag. Saknade värden blir null. Lokala simulerade koordinater kan
omvandlas till WGS84; `basis` skiljer härledd geografi och entitetstid från
explicit GPS och provtagningstid. Om bara entitetstid finns förnyar oförändrade
koordinater inte GPS-åldern vid andra attributuppdateringar. Felaktiga rapporter sparas med avvisningsorsak
men tränar inte grafen. Historiken är separat från klientens treminutersbuffert.

Backend registrerar konfigurerade positionsentiteter utan öppen webbläsare.
Riktig HA använder en separat läsprenumeration med återanslutning, utan
serviceanrop. Simulatorns och verklighetens historik har skilda källnycklar.
**Ingen riktig LUBA-integration har ännu inventerats med token**; GPS-stöd eller
mätattribut får inte betraktas som verifierade. Position kan kopplas separat i
redigeraren. Saknad position innebär ingen inlärning.

Riktade segment grupperas i en meters celler, per aktivitet/område. Minst tre
olika körningssegment och tillräckligt bra telemetri krävs; alternativa stråk
behålls och förtroende avtar med ålder. Uppdragsbyte eller tidslucka delar körning.
Ett enstaka GPS-hopp skapar ingen användbar rutt. Grafen byggs om automatiskt
ungefär varje minut under telemetrimottagning och manuellt i redigeraren.

Klienten använder ett spatialt index, närhet, riktning, förtroende och godkända
kollisionsytor. Otydliga vägval ger ingen historisk hjälp. Nya uppmätta svängar
prioriteras. Prediktion är fortfarande högst **sex sekunder och tre meter**.
Därefter fryses visualiseringen och märks gammal/osäker. Uppmätt, interpolerad,
uppskattad och uppskattad längs inlärt stråk har skilda statusvärden. Historiska
stråk är aldrig nya GPS-mätningar.

Byte av årstidsmodell raderar ingen historik. WGS84 återprojiceras till aktuell
referens; ändrad geografisk kalibrering gör grafen inaktuell tills ombyggnad.
Automatiska ytor från annan modellkalibrering används inte för LUBA. Godkänd
mark och hinder kontrolleras även när ett inlärt stråk föreslås.

## Historik, uppspelning och simulator

Fliken **LUBA – Positionering och inlärning** visar senaste mätning, mätålder,
noggrannhet, ruttmatchning, förtroende, statistik och historiska körningar.
Körstråk kan visas, valda körningar spelas upp med en separat orange markör i
4× hastighet och visualiseringarna stängas av. Uppspelningen ändrar inte aktuell
telemetri. Radering kräver uttrycklig bekräftelse. Rensa inlärning behåller rådata;
ombyggnad använder sparade godkända rapporter.

Simulatorns scenariolista innehåller LUBA A–F: normal, upprepad, förändrad rutt,
dålig GPS, hinder/sluttning och körning inför omstart. B/F fortsätter flera varv;
C byter väg efter 200 s. D växlar mellan normal, hopp, fördröjning, bortfall och
förlust. För F: kör flera varv, notera statistiken, starta om `npm run dev` och
hämta historiken igen. Scenarierna är helt lokala.

## Verifiering och kvarstående begränsningar

Kör `npm test`, `npm run typecheck`, `npm run build --workspaces --if-present`
och `npm run test:e2e`. Testsviten täcker sluttning/tak/hål, kamera/ytterkant,
manuell prioritet, robotmarginaler, SQLite-omstart, alternativa rutter, GPS-fel,
ändrad riktning, tids-/avståndsgränser och desktop/mobil. Browserregressionerna
omfattar riktiga Chromium-pekgester, följläge, Spotify, listläge och lampklick.

Analysen är avsiktligt försiktig: buskar, tunna strukturer och fotogrammetribrus
kan bli felklassificerade. Godkänn inte förslag utan granskning. Den identifierar
inte säkert gräs eller alla hinder. Högst 3 000 rektangelförslag genereras;
mycket komplexa områden behöver manuella polygoner. Historikvyn har sidor med 200 körningar; ombyggnaden använder upp till 100 000
körningssegment och 20 000 rapporter per körning. Äldre rådata finns kvar i SQLite.
Gula streckade historiksegment markerar luckor eller avvisade rapporter. Full
kartvisualisering av rutterna, mer avancerad korsnings-/vändpunktsanalys och
hårdvarumätning av minne/FPS på fysisk telefon återstår. Förslag är rektangulära
och kan kräva manuell uppdelning på ojämn mark. Ingen säker GPS-precision kan
utlovas från kartinpassningen (cirka 1–3 m absolut fel enligt kalibreringsguiden).

Verifierat 2026-10-28:120 enhets-/integrationstester, typkontroll, backend-/frontendbygge
och27 samlade Playwright-flöden godkända. Efter sista telemetriändringen passerade
även14 riktade webbläsarflöden. Fysiska telefoner har inte testats.
