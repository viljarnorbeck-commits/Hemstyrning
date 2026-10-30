# Hemstyrning 2.0

Hem använder den levande RealityScan-världen med sparad kamera. **Öppna 3D**
aktiverar fri navigering. **Hem** återgår mjukt till standardvyn; **Lista** pausar
renderingen och visar hela hemmet. I redigerarens Modelljämförelse finns
**Spara som startvy**. Position, mål, zoom och FOV sparas i befintlig scenfil.

Designsystemet använder skogsgrönt med grönt ljus, turkos sol, orange energi,
blå bilar, lila musik och korallvarningar. Energiöversikten skiljer kW/kWh och
visar Saknar data för saknade värden. Import/export styr flödespilar, bilarnas
laddning adderas aldrig en andra gång. Kostnad kommer från kopplad sensor;
skatter/avgifter ingår bara om källan inkluderar dem. Visuella energikopplingar
finns i `/settings`. Spotify och kalender behåller gemensam högerspalt.

## Kontrollpanel och skärmar

`/control` laddar ingen Three.js-modell. Vänsterkolumnen väljer/styr enheter,
högerkolumnen visar detaljer och förinställningar. Namnval skickar aldrig en
HA-action. Separata switchar/knappar använder samma Connection/backend som hemmet.
Ljusstyrka, Kelvin och RGB valideras mot konfigurerad lampa och dess funktioner.
Bilar och robotar använder tidigare individuella bindningar och funktionsflaggor.

Öppna **Visningsskärm** på TV/3D-klienten och ange dess sexsiffriga kod i kontroll-
panelen. Koden gäller10min, kan förnyas och ger endast en specifik mottagare.
Flera skärmar påverkas inte av samma val. `/screen-ws` har en egen kamera-protokoll-
kanal: SelectObject, FocusObject, FollowObject, ShowOverview, EnterFree3D,
CancelFollow och CameraTransitionCompleted. Meddelanden innehåller objekt-ID,
inte HA-tjänster. Kontrollerade1,4s-övergångar körs av GardenScene, med befintliga
markgränser och LUBA-tracker. Saknad verifierad position ger inget påhittat följmål.
Manuell navigering avbryter övergång/följning.

Klientidentitet lagras per fönster i sessionStorage; servern sparar parkopplingar
i separata, ignorerade simulator-/real-register. WebSocket återansluter och har
heartbeat. En stängd ny flik kräver ny parkoppling; en återansluten befintlig flik
kan återuppta sitt mål efter serveromstart. Koden är inte HA-behörighet.

## Förinställningar

`/settings` skapar, ordnar, döljer och tar bort färgkodade kort kopplade till
explicit valda HA `scene`/`script`. Stopp erbjuds bara för konfigurerat skript.
Backend accepterar bara sparad preset-ID och activate/stop, inga godtyckliga
services, skriptparametrar eller automationer från klienten. Schema-validering
bevarar befintliga scenobjekt och rör aldrig GPS-historiken.

UI väntar på scenens nya aktiveringstid eller skriptets `last_triggered`/off-
bekräftelse. En scen visas inte som permanent aktiv: HA-scener är ögonblicks-
aktiveringar. Lampornas verkliga färg/ljusstyrka visas separat via state-streamen.
Alla öppna gränssnitt får samma HA-bekräftade uppdateringar.

I simulatorn kan **Välj simulatorns demoscener** lägga in Kväll, Allt släckt,
Mys, Halloween, långsam Halloween-puls och Bortaläge. RGB-effekterna växlar högst
var8s, varar120s, har stopp och återställer det definierade ingångstillståndet.
Lampor utan färgstöd väljs inte. Effekten körs i servern även om webbläsaren stängs.
Vid verklig HA körs det konfigurerade skriptet där; frontend skapar ingen ljusloop.

Simulatorn har28 scenarier inklusive normaldag, vinterkväll, Halloween, högt pris
samt kommunikationsfel. Befintliga energiflöden och integrerade mätare återanvänds.
Status/färger kombineras med text; simulerade huvudvyer märks SIMULERAT/DEMO.

## Säkerhet och appar

Lokal utveckling ska fortsatt stanna på localhost. Installerade klienter behöver
en betrodd HTTPS-server med inloggning, skilda roller och proxyspärr för administrativa
API:er. Se [INSTALLABLE_APPS.md](INSTALLABLE_APPS.md) för installation, verkliga
paket, CI, roller och tydligt kvarstående plattformstester.

Verklig Home Assistant-token förblir enbart i backend. Simulatorns utvecklings-
endpoints, scener och effekter kan inte styra riktig utrustning. Testerna avbryts
innan kommandon om bryggan inte är i simulatorläge.
