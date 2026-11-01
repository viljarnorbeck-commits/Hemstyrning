# Spotify: livefelsökning 1 november 2026

## Resultat i den körande applikationen

Playwright med installerad Google Chrome användes mot localhost:5173, både /control och /music. Befintliga sparade Spotify-uppgifter behölls. Inloggningen fungerade; kontot verifierades som Premium med streaming- och uppspelningsbehörigheter. SDK-token hämtades via befintlig backend utan att token loggades.

Spotify returnerade riktiga Computer-enheter med namnet Hemstyrning · Webbläsare. Dessa var separata webbläsarsessioner. Ingen fysisk högtalare eller telefon fanns tillgänglig för prov. Den aktuella Chrome-fliken registrerades också med ett giltigt SDK-device_id och visades som Den här webbläsaren. Fullständiga enhets-ID:n behålls endast i lokala, ignorerade felsökningsfiler.

En första automatiserad Chrome-session misslyckades med SDK-felet Failed to initialize player och No supported keysystem was found. En normal beständig, separat testprofil med Chromium-sandbox och komponentuppdatering tillåten fungerade med Widevine. Dessa startalternativ ändrades tillsammans; vilket enskilt alternativ som avgjorde resultatet har inte isolerats. Användarens vanliga profil, Chrome-inställningar och konto ändrades inte. Gränssnittet förklarar nu saknat DRM-stöd när det kan verifieras.

## Den exakta 404-orsaken

Ett faktiskt tryck på spela skickade POST /spotify-api/command med action play men utan deviceId. Backend skickade då PUT https://api.spotify.com/v1/me/player/play. Spotify svarade 404 med reason NO_ACTIVE_DEVICE och meddelandet:

> Player command failed: No active device found

404 kom alltså från Spotify. Hemstyrnings tidigare backend tappade det verkliga felmeddelandet och svarade med generisk status. Nu bevaras säkra feluppgifter om metod, URL, status, enhet, reason och provider-meddelande; token och headers exponeras inte. Saknad uppspelningsenhet ger ett begripligt svenskt meddelande och lokal status 409.

En separat överföring utan någon laddad låt gav Spotify 500, Server error. Därför väljer appen ett mål för nästa låt utan att överföra en tom uppspelning. När en låt finns fungerar överföring: en verklig transfer till den aktuella Chrome-enheten gav 200 och behöll pausat läge.

## Korrigeringar

- Enhetsväljaren förenar verkliga Connect-enheter med endast den aktuella, färdiga SDK-enheten. Dubbletter och pensionerade lokala SDK-ID:n filtreras.
- Vald enhet och bekräftat aktiv enhet hålls isär. En vald enhet visas som mål för nästa låt tills Spotify bekräftat aktivitet.
- Första låten/spellistan riktas till det valda giltiga enhets-ID:t. Tom uppspelning överförs inte. Spela utan låt eller tillgänglig enhet ger vägledning i stället för ett ogiltigt kommando.
- Webbläsarljud aktiveras från den ursprungliga användargesten. Enhetslistan kan uppdateras från Spotify; överföring kontrolleras mot verklig playback- eller Connect-status.
- Befintlig OAuth, tokenhantering, sökning, spellistor, kö och Jam bevaras. Ingen kontrollpanelsdesign, Home Assistant-integration eller 3D-kod ändras.

## Praktisk verifiering

Get Lucky (Radio Edit) spelades faktiskt i den registrerade Chrome-fliken och pausades. SDK rapporterade pågående uppspelning och ökande position, sedan pausat läge; backend bekräftade samma låt, enhet och paus. Ett andra kort spela/pausa-prov lyckades också. Uppspelningen lämnades pausad.

Slutkontroll i en separat Chrome-session visade rätt låttitel, laddat albumomslag, enhetsnamn och aktiva föregående/spela/nästa-knappar. Enhetspopupen öppnades med riktiga rader utan ändrad URL eller scrollposition. Inga JavaScript-fel registrerades. Lokala skärmbilder finns i ignorerade .build-tools/spotify-live-player-fixed.png och spotify-live-popup-fixed.png.

Verifierat: Spotify-status, playback och devices, SDK-autentisering/ready, lokal enhet, sökning, första uppspelning, pausa och överföring med befintlig låt. Inte praktiskt verifierat: uppspelning på fysisk extern Connect-enhet, Jam med andra deltagare eller ändringar i spellistor. Inga spellistor eller kontoinställningar ändrades.

## Riktade kontroller

- Backend: spotify-api.test.ts och spotify-errors.test.ts, 6/6 godkända.
- Frontend: spotify-connect.test.ts och music-data.test.ts, 6/6 godkända.
- Playwright mot separat simulator: sex spotify-speaker-prov och ett popup-regressionsprov, 7/7 godkända.
- TypeScript, webbproduktionsbygge och backendbygge godkända. Befintlig varning om stora webbchunks kvarstår.
- Den stora systemtestsviten kördes inte, enligt uppdraget. Inga verkliga Home Assistant-kommandon skickades.

Ordinarie utvecklingsmiljö lämnas på localhost:5173 med backend på 8123. Separat simulator finns på localhost:15173/18123. Hemligheter och lokala kontofiler ingår inte i publiceringen. Spotify-fixen publiceras separat från de två tidigare lokala KNX-/kontrollpanelcommittarna som fortfarande väntar på användarens pushbesked.
