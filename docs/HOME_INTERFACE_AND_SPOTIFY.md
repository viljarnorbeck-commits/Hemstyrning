# Hemkontroll: två vyer och Spotify

3D-världen använder fortsatt originalets texturerade RealityScan-modell. **Lista**
öppnar en separat, rullbar dashboard. Båda använder samma `Connection`, scenobjekt
och Home Assistant-bindningar. Redigeraren `/editor` är kvar.

Se även [kompakt layout och mobilgester](MOBILE_NAVIGATION.md) för den senaste
layouten, Rotera/Flytta och fysisk telefonverifiering.

## Kontroller

På dator visas statusraden överst, direkta kontroller till vänster och musik/kommande
kalenderhändelse till höger. Gruppknappen använder bara konfigurerade `light`-objekt:
någon tänd → **Släck alla**, alla släckta → **Tänd alla**. Den väntar på mottagna
HA-tillstånd. Enskilda lampor kan fortfarande klickas direkt i 3D.

Varje konfigurerad bil har egen kontroll för batteri, laddeffekt och klimat.
Koppla dess individuella `climate`-entitet i redigeraren. Verklig klimatstatus och
HA:s funktionsflaggor används; saknat stöd/otillgänglighet/skrivskydd inaktiverar
knappen med förklaring. Robotkontroller använder standardiserade HA-featureflaggor
för start, paus och dockning; LUBA har även **Följ i 3D**.

Listläget visar belysning, bilar, robotar, energi/effekthistorik, sol, väder, Spotify
och kalender. Det stoppar `renderer.setAnimationLoop` helt och döljer canvasen;
kameran behålls. Fullskärmsknappen döljer HUD och markörer samt försöker använda
Fullscreen API. Om API:t inte är tillgängligt fungerar fortfarande ren 3D-vy.
På mobil finns kompakt status, musikrad och navigering längst ned med safe-area-stöd.

## Spotify och konfiguration

Tryck på musikpanelen → **Musikinställningar och Jam-länk**. Välj en eller flera
Home Assistant `media_player`-entiteter för Spotify; inga konto-ID:n är hårdkodade
i frontend. Valt konto och bindningar sparas i samma atomiska `data/scene.json`.
Ny installation väljer inte automatiskt ett verkligt konto.

Now Playing visar omslag, låt/artist/album, status, uppspelningsenhet, position och
längd när HA exponerar dem. Tillåtna tjänster: `media_play`, `media_pause`,
`media_next_track`, `media_previous_track`, `volume_set`, `select_source`.
Kontroller använder `supported_features`; källval begränsas till `source_list`.
UI visar mottagen status och väntar på bekräftelse. Position mellan rapporter är
en kort uppskattning (max 30 s), inte ett nytt mätvärde. Spotify kan rapportera sent.

Albumomslag för riktiga spelare går via backend. Bara HA:s egen media_player-proxy
eller Spotifys omslagsvärdar tillåts; inga godtyckliga URL:er, vidarebefordrade token
till externa värdar eller okontrollerade redirects. Ingen Spotify-OAuth byggs i frontend.

## Jam

Skapa Jam i Spotify: **Anslut enhet → Starta en Jam → Bjud in → Dela länk**.
Klistra in länken i musikinställningarna. Värden behöver Spotify Premium.
Hemkontroll skapar inte Jam via API och hittar inte på inbjudningslänkar.

En fullständig HTTPS-länk måste peka på `open.spotify.com/socialsession/...`.
`spotify.link` kan också vara en låt/spellista och räcker därför inte som bevis:
backend följer högst fyra manuellt granskade Spotify-redirects och accepterar bara
en Jam-destination. Andra värdar, credentials och andra Spotify-innehåll avvisas.
QR genereras lokalt av den sparade länken. Länken kan ersättas eller tas bort.
Tid för sparandet visas; **aktiv session kan inte verifieras**, oavsett länkens ålder.
Om länkformatet ändras i framtiden behöver valideringen uppdateras efter verifiering.

Simulatorns QR-demo kodar `https://example.invalid/hemkontroll/jam-demo`, tydligt
märkt **TESTLÄNK · Ingen riktig Spotify Jam**. Den visas bara när backendkällan är
simulator och sparas aldrig som en riktig inbjudan.

## Simulator och säkerhet

`npm run dev` startar dashboarden på localhost:5173 och simulatorn på localhost:8123.
`/dev/simulator` har media_player-entitet, musikkontroller, låtbyte, volym, källor och
felstatus. Demolåtar och lokala SVG-omslag är märkta som simulerade.
Alla utvecklingskommandon använder `/dev-api`; de kan inte nå live-bryggan.
Riktiga media-kommandon kräver både konfigurerad entitet och tillåten HA-funktion.
Den befintliga `HA_ALLOW_CONTROL=false`-spärren gäller även musik.

Lokalt OS/loopback är fortfarande behörighetsgränsen; fleranvändarinloggning ingår
inte i denna utvecklingsserver. Inga verkliga Spotify-/HA-konton har inventerats utan token.
Token, faktisk Jam-länk och användarens scenfil är lokala och Git-ignorerade.

## Verifiering

Godkänt: **99 enhets-/integrationstester**, typkontroll, produktionsbygge och
**19 Playwright-flöden i en sammanhängande körning**. Dator och mobilporträtt/
landskap täcks. Testerna verifierar separata bilkommandon, belysning/robotar,
Now Playing, paus/tom/otillgänglig spelare, källval/volym, Jam-felhantering,
avkodad QR med exakt sparad URL, stoppad animationsloop och bevarad kamera,
fullskärmsåtergång samt äldre editor-/modell-/atmosfär-/kartfunktioner.

```bash
npm test
npm run typecheck
npm run build --workspace @hemkontroll/dashboard
npm run test:e2e
```

Playwright vägrar styrande tester om centralbryggan inte använder simulatorn.
Backendtestet använder en separat HA-testdubbel och bevisar att utvecklingssidans
media-kommandon stannar lokalt även när huvudbryggan har ett annat mål.
Verkligt Spotify-konto, faktiska HA-entiteter och fysisk mobilprestanda återstår
att verifiera med lokal token och användarens hårdvara.

## Källor

- [Spotify: starta, dela och gå med i Jam](https://support.spotify.com/article/jam/).
- [Home Assistant Spotify: källor och uppspelningsbegränsningar](https://www.home-assistant.io/integrations/spotify/).
- [HA media_player-funktioner och tillstånd](https://github.com/home-assistant/core/blob/dev/homeassistant/components/media_player/const.py).
- [HA gräsklipparfunktioner](https://github.com/home-assistant/core/blob/dev/homeassistant/components/lawn_mower/const.py) och [dammsugarfunktioner](https://github.com/home-assistant/core/blob/dev/homeassistant/components/vacuum/const.py).
