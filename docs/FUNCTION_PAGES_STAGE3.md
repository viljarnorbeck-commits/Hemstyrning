# Funktionssidor – etapp 3

Sidorna återanvänder Configuration, Connection, state-bekräftelser, navigation och befintliga 3D-objekt. `function-pages.ts` renderar energi/bilar/klimat/robotar/säkerhet. `/lights` återanvänder kontrollpanelens kort, switchar och detaljreglage, med områdesgrupper och statusfilter. Ingen ny kontrollkanal skapades för 3D eller parkoppling.

## Data och perioder

`function-data.ts` samlar verifierade mätare, termostater, uttryckliga rumsgivare och generiska fordonskopplingar. Fordonsmodell, årsmodell, laddbox, 3D-objekt och tillförlitliga bilsensorer kan ändras under Anpassa fordon och laddbox. Inställningen sparas per skärm i localStorage, utan autentiseringsuppgifter; modellnamnet används även på hemskärmen. Ett laddboxvärde blir aldrig ett bilbatteri. EV6:s osäkra Tibber-värden och e-Golfs saknade integration ersätts inte med data från simulatorbilen.

Energidiagrammet använder GET /connection-api/history med start/end för Idag, 24 timmar, 7 dagar och 30 dagar. Backend validerar max 31 dagar och hämtar HA recorder-historik med motsvarande gränser. Simulatorn returnerar sin begränsade verkliga StateStore-historik, inte frontend-genererade sampel. Full 30-dagarstäckning kräver att HA har sparat historiken; långtidstatistik och automatisk syntetisering av förlorade punkter används inte. Ogiltiga mätningar ger luckor. Historiken hämtas vid periodval och högst en gång per minut automatiskt.

Husets effekt och Hus 2 summeras inte, eftersom mätarnas inbördes omfattning saknar verifiering. Laddenergi märks laddsession respektive totalräknare. Solenergi är kWh, effekt W konverteras till kW. Dagskostnad och dagsgenomsnitt kvarstår som Saknar data tills korrekt periodunderlag konfigurerats enligt etapp 2. Ferroamps installerade teckenkonvention är fortfarande overifierad; ingen flödespil gissas från tecknet.

## Styrning och rättigheter

/bridge/api/equipment tillåter endast inventerade Entrédörr/Verkstadsdörr samt VVB-termostaterna och VVB-brytaren. Inga fria domäner, tjänster eller adresser skickas vidare. Befintlig rollmiddleware, Origin-kontroll, X-Hemkontroll-Mode och HA_ALLOW_CONTROL gäller. Viewer kan inte skriva. Upplåsning kräver separat dialog och confirmed-payload. Servern validerar enhetstillstånd, faktiska HVAC-lägen, feature-flaggor, numeriska börvärden och temperaturintervall. Accepterat kommando visas som väntande tills Connection sett bekräftat tillstånd; fel/timeout visas.

LUBA använder en tom explicit overviewBindings.luba tills riktig Mammotion-HA kopplats. `mammotion-adapter.ts` accepterar enbart mätta lokala koordinater eller lat/lon med konfigurerat scenorigo; ogiltiga och alltför osäkra rapporter avvisas. MowerTrackingService återanvänds och ingen gammal Husqvarna väljs som reserv. Position äldre än sex sekunder visas inte som aktuell. Kamerasektionen har en typad konfigurationsmodell och validerar framtida same-origin /camera-api/.../stream, men ingen verifierad kameraserver finns; inga interna kameraadresser spelas upp. Streaming/helskärmsuppspelning behöver kopplas till en behörighetskontrollerad backend när riktiga kameror finns.

## Spotify

Samma direktanslutna Spotify Web API-, OAuth-, token-, Premium-/SDK- och rollhantering återanvänds. MusicPanel kan visas som inbäddad sida och som befintlig modal. Albumyta, större spelknappar, progress, volym, enhetslista, sökning, spellistor, kö och Jam finns kvar. Kölistan hämtas via en ny läsande serverproxy. Sökresultat kan läggas i kö. Mobilen har flikar och större tryckytor. Bakgrundens färger bestäms stabilt av albumets namn, med långsam transformanimation och mjuk övergång mellan album; reduced-motion stänger av rörelsen. Ingen bildanalys av omslaget påstås. DOM uppdateras på plats så att fokus och fältinmatning bevaras.

## Verifiering och återstående underlag

Automatiska tester kördes i Windows mot isolerad simulator; Spotify Web API och SDK mockades i webbläsartester. Inga verkliga HA-kommandon skickades. Fysisk LUBA, bilintegrationer, kameror och verklig Spotify-uppspelning behöver verifieras med respektive verkliga anslutning. Byggets befintliga varning om stora Three.js/MapLibre-bundles kvarstår.
`Simulatorns explicit definierade nätmätare har positiv import och negativ export. Endast i det tydligt markerade simulatorläget används den kända teckenkonventionen; verklig Ferroamp förblir overifierad.`
