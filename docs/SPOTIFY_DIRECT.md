# Direkt Spotify i Hemstyrning (utan Home Assistant)

Hemstyrning använder nu **Spotifys officiella Web API direkt från sin egen backend**.
Home Assistant behövs fortfarande för husets enheter men **inte** för musik.
Webbgränssnitt, Windows/iOS/Android-klienter och Google TV delar samma centrala
Spotify-konto och musikstatus. Spotify spelas på vald Spotify Connect-enhet. Med Web Playback SDK kan även
Hemstyrnings aktuella webbläsarflik vara en sådan enhet.

## 1. Spotify Premium och utvecklarapp

Ett Spotify Premium-konto krävs för uppspelningsstyrning och för en utvecklarapp
i development mode. Spotify tillåter högst fem auktoriserade användare per
development-app. Du behöver skapa en egen app under
https://developer.spotify.com/dashboard och tillåta ditt Spotify-konto där.

Skapa en app med **Web API och Web Playback SDK**, kopiera Client ID och Client Secret.
Hemstyrning har inga färdiga Spotify-nycklar.

### Viktigt: redirect-URI

Registrera följande **exakt** som Spotify Redirect URI vid lokal utveckling:

```text
http://127.0.0.1:5173/spotify-api/callback
```

Spotify accepterar inte `localhost` som redirect-URI. Starta därför
Hemstyrning och öppna den via `http://127.0.0.1:5173` när kontot kopplas.

För en installerad app på LAN används i stället din lokala **HTTPS-adress**,
t.ex. `https://hemstyrning.local/spotify-api/callback`; registrera denna
exakt i Spotify Dashboard. Den adressen ska gå via samma betrodda HTTPS-proxy
till Hemstyrning-backend.

## 2. Konfigurera servern

I projektets rot, skapa/komplettera den **Git-ignorerade** `.env`:

```env
SPOTIFY_CLIENT_ID=din_client_id
SPOTIFY_CLIENT_SECRET=din_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify-api/callback
```

För produktionsinstallation ändras sista raden till den registrerade HTTPS-URI:n.
Starta om backend (vid lokal utveckling `npm run dev` i repots rot).

**Inga hemligheter ska anges i webbläsaren, i en installerbar app, i Git eller
i ChatGPT.** Client Secret och Spotify-tokens ska stanna på backend.

## 3. Anslut kontot

1. Öppna `http://127.0.0.1:5173`.
2. Klicka på Spotify-panelen till höger eller välj Musik på mobilen.
3. Öppna musikdialogen och välj **Anslut mitt Spotify-konto**.
4. Logga in hos Spotify och ge behörighet till uppspelning och spellistor.
5. Spotify skickar dig tillbaka till Hemstyrning.

En administratör måste ansluta eller koppla bort kontot. Länken kan bara
påbörjas som administratör; OAuth-callbacken kontrolleras med ett oförutsägbart,
kortlivat och engångsanvänt `state`-värde på servern.

Enheten som visar Hemstyrning kan sedan vara TV, mobil, Windows eller surfplatta.
Alla hämtar status genom `/spotify-api`. **Ingen HA-media_player-bindning behövs.**

## 4. Funktioner

- Låt, artist, album, omslag, aktuell position och aktiv enhet.
- Spela/pausa, nästa/föregående.
- Volym och byte mellan Spotify Connect-enheter.
- Sök efter låtar och lägg i spelkö eller spela direkt.
- Visa dina första 20 spellistor och spela dem på vald enhet.
- Den separata kontrollpanelen `/control` har nu också Spotify-panel.
- En Jam-länk kan fortfarande läggas in manuellt och delas som QR-kod.
  Spotify Web API kan inte starta eller administrera en Jam.

En uppspelningsenhet måste vara igång/aktiv för vissa Spotify-kommandon.
Vissa Spotify-enheter tillåter inte överföring eller volymstyrning.
Spellistor och sökning förutsätter tillgängliga Spotify API-endpoints och rätt
konto-/apputvecklarbehörigheter.

Backend hämtar avspelning högst ungefär var femte sekund, samordnar flera
flikar via kort servercache och respekterar `429 Retry-After` när Spotify
begränsar antal anrop. Sporadiska uppdateringar innebär inte att musiken
stannat. Web Playback SDK registrerar dessutom den här fliken när streamingbehörighet finns.

## 5. Säkerhet och tokenhantering

- OAuth Authorization Code Flow körs på backend med Client Secret.
- Uppspelnings- och refresh-tokens sparas i `data/spotify-account.json` med
  filrättigheter 0600 och ingår inte i Git.
- Vanliga API-svar innehåller inga Spotify-tokens. Endast behörig controller/admin
  kan POST:a `/spotify-api/sdk-token` med JSON från tillåten origin. Det svaret
  innehåller en kortlivad access-token som SDK:n behöver i arbetsminnet; det har
  `Cache-Control: no-store`. Refresh-token och Client Secret lämnar aldrig backend.
  Access-token skrivs inte till DOM, loggar, localStorage eller sessionStorage.
- **Viewer** får läsa musikstatus, **controller** kan styra uppspelning och
  **admin** får även ansluta/koppla bort Spotify.
- Endast fördefinierade kommandon och Spotify-URI-format tillåts.
- Ingen generell URL-proxy till Spotify eller andra servrar öppnas.
- Spotify kräver din egen app och Premium, och kontot kan drabbas av kvotgränser.

## 6. Test och migration

Du behöver inte ta bort Spotify-integrationen från Home Assistant om du vill
använda den på andra ställen, men **Hemstyrnings musikpanel använder den inte
längre**. Gamla `media_player`-bindningar i scenkonfigurationen ignoreras
av den nya Spotify-panelen, så inga gamla kopplingar behöver raderas.

```bash
npm install
npm run typecheck
npm test
npm run dev
```

Utan Spotify-uppgifter visas installationsanvisning i gränssnittet.
Det krävs ingen verklig Spotify-nyckel för backendens isolerade API-test.

Det finns inga verkliga användartokens eller fungerande Spotify-konton i
repositoriet. **Autentisering med Spotify och uppspelning på fysisk enhet
måste fortfarande verifieras lokalt.**

## 7. Webbläsaren som högtalare

Kontot och förnyelsetoken sparas på servern. Nästa gång du öppnar en flik behövs
normalt ingen inloggning. Tidigare anslutna konton måste **en gång** välja
**Godkänn webbläsaruppspelning** i musikpanelen för att lägga till scopes
`streaming`, `user-read-email` och `user-read-private`. Lägg också till Web Playback
SDK i Spotify-utvecklarappens API-val. **Förnya Spotify-inloggning** finns i
musikinställningarna om Spotify återkallar behörigheten.

När ett behörigt konto är anslutet laddas SDK:n från Spotifys officiella adress
och fliken registreras automatiskt som **Hemstyrning · Webbläsare**. Detta skickar
varken transfer eller play. Spelaren visas i **Spotify Connect-enheter** först
när SDK:ns `ready` bekräftat ett riktigt enhets-ID. Markeringen **den här
webbläsaren** skiljer den aktuella fliken från andra flikar och högtalare.

Välj en rad i listan för att flytta uppspelningen. Pågående musik fortsätter;
pausad musik förblir pausad. Aktiv markering kommer från Spotify-status, inte
optimistiskt från knapptrycket. Alla tillgängliga enheter som Spotify rapporterar
visas, inklusive namn, typ och begränsningar. Det är inte en lokal nätverksskanning.
Listan uppdateras när panelen öppnas och varsamt medan den visas, med servercache.

En omladdning ansluter en ny SDK-instans utan att flytta tillbaka musiken. Gamla
enhets-ID:n sparas aldrig i webbläsarlagring. Tappad SDK-anslutning tar bort den
lokala raden och ger begränsad återanslutning med backoff; ett felaktigt ID visas
inte som redo. Flera öppna flikar kan vara separata Spotify-enheter.

Spotify Premium och en webbläsare med stöd för skyddat ljud krävs. Använd HTTPS
eller localhost/127.0.0.1. Den anslutna lokala konfigurationen rapporterade
`webPlaybackAuthorized: true` vid verifieringen 2026-10-30, så en ny OAuth-runda
behövs inte för den konfigurationen just nu. Om streamingbehörigheten saknas visas
knappen för att godkänna/återansluta. Om automatisk ljudstart blockeras visas endast då
**Tillåt ljud**. Den knappen aktiverar ljudet via en verklig användargest och
riktar uppspelning till flikens bekräftade ID. En viewer får se enhetslistan men
får ingen SDK-token och registrerar ingen kontrollerbar spelare.

Dokumentation: [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/reference),
[kom igång](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started).
Automatiska browsertester använder en uttryckligen falsk SDK och Spotify-API.
De bevisar registrering/livscykel/UI, inte att DRM eller riktig ljuduppspelning
fungerar på en fysisk enhet. Verklig uppspelning kräver ditt godkännande hos Spotify.
