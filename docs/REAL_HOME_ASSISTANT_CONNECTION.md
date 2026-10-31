# Riktig Home Assistant, skrivskyddad anslutning

Verifierad 2026-10-31. Lokal serverkonfiguration använder `HA_MODE=real`, rätt LAN-adress och `HA_ALLOW_CONTROL=false`. Befintlig lokal token återanvändes; Spotify-inställningarna bevarades. `.env` är gitignorerad och har begränsad Windows-filbehörighet. Inga autentiseringsuppgifter ingår i denna ändring.

`/connection-api/status` verifierade autentisering och avstängd styrning. Först lästes 770, därefter 774 entiteter med aktuella state-objekt. Antalet är dynamiskt och skiljer sig från antalet registerposter, som även omfattar avaktiverade entiteter. Både backendens och Vites WebSocket returnerade 774 riktiga entiteter och noll simulator-markerade tillstånd. Riktiga state_changed-händelser observerades.

## Entitetskopplingar

Inställningarnas entitetsväljare använder samma befintliga `data/scene.json` och atomiska workspace-API som editorn. Fältet `sensorBindings` innehåller informationskortens val; 3D-objektens och miljöns befintliga bindningar redigeras på sina ursprungliga platser. Ingen parallell konfigurationsfil eller ny lokal lagring infördes.

- Sök bland alla entiteter med aktuellt state på namn eller entity_id, inklusive okända och otillgängliga.
- Se värde, enhet och senaste rapportering, välj informationskort eller 3D-objekt, spara och återställ. Tomt val kopplar bort sensorn; återställning av kort använder den inventerade standardkopplingen. Återställning av ett 3D-objekt kopplar bort objektet.
- Kopplingarna delas mellan skärmar och överlever backendomstart. De påverkar både startöversikt, funktionssidor och energihistorikens sensorval.
- Val av kostnad och snittpris kräver verifierat dagsunderlag; välj aldrig månadskostnad eller timpris för dessa roller. Appen byter inte automatiskt mätare.
- Fordon har separata val för batteri, räckvidd, återstående tid och verifierad anslutning. Globalt explicit sensorval har företräde framför äldre skärmspecifika fordonsval. Laddboxvärden blir aldrig bilvärden.
- LUBA är frånkopplad tills en riktig Mammotion-entitet väljs. Husqvarna används inte som ersättning.

Den verkliga lokala scenen har verifierade Ferroamp-/dammsugarkopplingar. Simulatorns tidigare ljus-/bil-/LUBA-identiteter har kopplats bort där de saknas i verklig HA. Belysningssidan listar också verkliga light-entiteter utan att hitta på placering i 3D; sådana lampor har inaktivt 3D-fokus tills de kopplats till placerade objekt.

## Mätvärden och begränsningar

Ferroamp rapporterar aktiv effekt i W; kort visar kW. Solens totalräknare och Easees energi är kWh. Tibbers aktuella pris är SEK/kWh. Wh konverteras till kWh där enheten uttryckligen anger det. Effekt och energi blandas inte. Hus 2 adderas inte till huset.

Diskreta HA-tillstånd, exempelvis ett lås som inte bytt tillstånd på flera dagar, är fortsatt HA:s senaste bekräftade tillstånd; rapporttid visas separat. Numerisk telemetri behåller sin färskhetskontroll. Okända, otillgängliga, saknade och gamla mätningar ersätts inte med simulatorvärden.

Kvarvarande databegränsningar:

- Hus 2 och robotdammsugaren rapporterar otillgängligt.
- Den nedre varmvattenproben rapporterade unknown. Övre/mellersta givaren och utomhus/badrum rapporterade temperatur.
- Kia/Tibber är inte verifierad aktuell biltelemetri. e-Golf och Mammotion LUBA saknar verifierad integration.
- Ingen weather- eller calendar-entitet finns i den aktuella state-listan. Befintlig kalenderfunktionalitet är bevarad men simulatorns kalenderkopplingar används inte i real-scenen.
- Dagens kostnad/snittpris saknar verifierat periodunderlag. Ferroamps installerade teckenkonvention är fortsatt ej verifierad; ingen riktning antas från tecknet.
- En del ljus och laddboxmätningar kan vara otillgängliga eller gamla. Väljaren visar den faktiska statusen och rapporttiden.

## Testmiljö

Automatiska webbläsartester får bara köras med simulator. Den befintliga globala startkontrollen avvisar real-läge. Under denna körning användes en separat, ignorerad datakatalog via `HA_DATA_DIRECTORY`, så testernas scener, skärmparkopplingar och Spotify-lagring inte skriver över real-miljön. Den permanenta `.env` ändras inte vid simulatorprov; processens `HA_MODE=simulator` gäller bara testservern. Ordinarie startkommando är fortsatt `npm run dev`.

Gatewayens integrationstest använder en falsk HA-server på loopback och verifierar verklig källseparation, sekretess för server-token och avvisad HTTP-/WebSocket-styrning. Inga tjänsteanrop skickades till riktig Home Assistant.

## Slutverifiering

- Real-läge efter omstart: authenticated=true, commandsEnabled=false, 772 entiteter. Antalet förändrades under arbetet; 774 var en tidigare ögonblicksbild.
- Riktig recorder: HTTP 200, en serie med 5 081 punkter i W för husets effekt idag.
- Alla tio sidvägar, inklusive inställningarna, granskades skrivskyddat i Chromium. Samtliga svarade HTTP 200, anslöt till HA och hade inga JavaScript-fel eller horisontellt överflöde. Inställningarna kontrollerades även i surfplatte- och mobilstorlek. Sökning på badrumsgivarens exakta entity_id gav en träff. Inga skrivande HA-anrop observerades.
- TypeScript och produktionsbygge godkända. Bygget har kvar den befintliga varningen om stora grafikbundles.
- Samtliga enhets-/integrationstester: 147 godkända (59 backend, 88 frontend).
- Samtliga Playwright-tester mot isolerad simulator: 50 körda, 39 godkända, 11 misslyckade, inga överhoppade; cirka 8,5 minuter. Den nya beständiga sensorkopplingen, funktionssidor, kontrollpanel, Spotify/SDK/Jam, skärmar och PWA passerade. Samma elva äldre fall som i [föregående fullrapport](FULL_TEST_REPORT_2026-10-31.md) misslyckades: atmosfärtimeout, gamla hero-/mobil-/fotostartförväntningar, LUBA-zoom och Windows-sökvägen i texturjämförelsen. Dessa kvarstår; hela sviten är inte grön.
- Spotify-konfiguration finns, men aktiv OAuth-inloggning saknas i denna Windows-miljö. Befintlig anslutningsknapp på musiksidan behöver användarens Spotify-inloggning. Ingen autentisering eller uppspelning utfördes automatiskt.

Utvecklingsservern lämnas igång med ordinarie `npm run dev` och real-konfiguration. Ingen manuell åtgärd krävs för HA:s läsanslutning. Saknade enhetsintegrationer och felande fysiska givare kan inte ersättas med verifierade data i Hemstyrning.
