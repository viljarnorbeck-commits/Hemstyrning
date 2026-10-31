# Funktion, navigation och neutral design

Korrigering 2026-10-31 i den befintliga Hemstyrning-applikationen.

## Varför knappar inte fungerade

Tre olika problem behövde hållas isär:

1. Riktig Home Assistant är avsiktligt skrivskyddad. `HA_ALLOW_CONTROL=false` är bevarad. Kontrollpanelen visar nu en förklaring och en fungerande länk till behörighetsinformationen i inställningarna. Serverns roll- och kommandoskydd gäller fortfarande; ingen aktiveringsväg förbigår administratörens serverinställning eller användarens uttryckliga godkännande.
2. Upptäckta lampor visades med `ha-`-ID, men klick- och ändringshanterarna slog bara upp sparade objekt. `device-registry.ts` används nu för både visning, val och kommandomål. En ny lampa kan sparas via den befintliga, behörighetskontrollerade workspace-konfigurationen. Den får därefter samma skyddade kommandoväg som övriga lampor. Backendens tillåtelselista har inte öppnats för godtyckliga entiteter.
3. Sidomenyn täckte vissa fasta 3D-kontroller. Återställning, himmelsvy och energivy ligger nu bredvid menyn. Mobilheadern reserverar plats för menyknappen. Mushjulet vidarebefordras från synliga enhetsmarkörer till 3D-kameran så att markörerna inte stoppar zoomningen.

Nya lampor sparas som vanliga scenobjekt med `placementConfirmed=false`. De får ingen påhittad 3D-placering eller ljuseffekt. Befintliga placerade objekt och deras bindningar bevaras. Inställningarnas befintliga entitetsväljare kan fortfarande koppla sensorer och placerade objekt.

Kontroller visar frånkopplad, otillgänglig, skrivskyddad, väntande, bekräftad och misslyckad åtgärd. Bekräftelse kommer från datakällans tillstånd. Styrbehörighet måste uttryckligen beviljas av servern; ett saknat behörighetsfält aktiverar inte styrning. En sen bekräftelse flyttar inte fokus från en annan lampa som användaren hunnit välja.

## Kontrollpanel och scrollning

- Lamporna ligger i en vertikal kolumn till vänster, cirka 28 procent av tillgänglig bredd på större skärmar. Namn, ikon, rund strömbrytare med 44 px klickyta och tunn dimmer där lampan stöder det. Texten PÅ/AV och områdesraden är borttagna från lampkorten; tillstånd finns kvar i tillgänglighetsetiketterna. Otillgängliga lampor markeras diskret.
- Högersidan är större och visar vald enhet, bekräftat tillstånd, stödda reglage och färgval. Andra enheter och scener ligger i horisontella rader. Spotify ligger kvar på sin egen sida.
- Sidomenyn har fasta delar för logotyp/minimering och anslutningsstatus. Bara den mellersta listan rullar vid låg skärmhöjd.
- På dator och större surfplatta rullar lamplistan och högersidan var för sig. Detaljer och scener har inget extra nästlat vertikalt scrollområde. På mobil används vanlig sidscrollning och en avgränsad lamplista. Mus, tangentbord och native Chromium-touch har provats.
- Dekorativa gradientlager använder `pointer-events:none`. Kortens DOM-identitet och animation bevaras när telemetri uppdateras. Scenpanelen använder också uppdatering på plats.

## Gemensamt tema

`design-language.css` äger de neutrala färgvariablerna: bakgrund #101114, sidomeny #191B1F, panel #202226, upphöjd panel #282B30, kontur #45484F och ljus neutral text. `navigation.css` äger navigationens layout och `control.css` kontrollpanelen. Överlappande och identiska regler har tagits bort ur `v2.css`; dess storlek minskade från ungefär 73 till 38 kB.

Startskärmens informationsfält har bakgrunden `rgba(30,32,36,0.97)`, tunn kontur och 5 px hörnradie. Samma tio informationsgrupper och preliminära placeringar behålls. Scenens belysning, modell och material har inte mörkats ned för att uppnå detta. Lampornas färgpaletter och musikens albumfärger är separata från det neutrala grundtemat.

## Spotify

Den direkta Spotify-integrationen, OAuth, SDK, Jam, enhetslista, sökning och uppspelning är bevarade. Efter ett enhetsbyte görs en färsk läsning efter eventuella pågående läsningar. Den valda enheten markeras aktiv först när Spotify rapporterar den. Utebliven bekräftelse ger ett beständigt felmeddelande i stället för en fabricerad aktiv enhet. Vanlig bakgrundspollning raderar inte omedelbart detta kommandofel.

Alla automatiska Spotify-prov använder simulerad Web API och SDK. Ingen verklig musikuppspelning har startats.

## Verifiering

| Kontroll | Resultat |
| --- | --- |
| TypeScript | Godkänd |
| Samtliga enhets- och integrationstester | 153 godkända: 59 backend, 94 frontend |
| Produktionsbygge | Godkänt; befintlig varning om stora grafikbundles kvarstår |
| Hela Playwright-sviten | 57 godkända, inga misslyckade eller överhoppade; cirka 4,9 minuter |
| Extra prov efter slutlig statusetikett | Sensorväljare och skrivskydd, 2 godkända |
| Native touch i Chromium | Strömbrytare, dimmer och horisontell enhetsrad bekräftade i simulatorn |

Layout och skärmbilder kontrollerades i 1920×1080, 2560×1440, 1280×800, 1024×768, 800×1280 och 390×844. Låg skärmhöjd och 35 extra lampkort användes för scrollprov. Tester omfattar mus, tangentbord, native touch, verkliga klickytor, registrering av upptäckt lampa, behörighetsfel, utebliven Spotify-bekräftelse och fokus vid fördröjd HA-bekräftelse.

Äldre testförväntningar på borttagen hero, fotostart och mobil bottennavigation är uppdaterade till den nuvarande levande startskärmen och gemensamma navigationen. Fotogenerering, energivy, objektkonturer och kalenderfunktioner verifieras fortfarande. Windows-sökvägen i texturtestet är korrigerad; texturjämförelsen rapporterade noll skillnad. Inga tester har hoppats över för att nå grönt resultat.

Råloggar och skärmbilder finns lokalt i ignorerade `.build-tools` och `test-results`. Webbläsarernas automatiska styrprov kördes bara mot isolerad simulator. Den verkliga `.env` och riktiga Home Assistant-installationen ändrades inte av testerna. Simulatorns temporära datakatalog låg separat från real-miljön.

Slutkontrollen återställde ordinarie utvecklingsserver till real-läge: autentiserad, styrning avstängd och 772 entiteter vid avläsningen. Alla tio sidor inklusive inställningarna svarade HTTP 200, utan JavaScript-fel eller horisontellt överflöde. Riktiga lampor kunde väljas medan alla strömbrytare var korrekt avaktiverade. Inga skrivande HA-anrop observerades. Den riktiga referensmodellen med originaltextur 8192×8192 laddades; tio startkort och exakt 0,97 bakgrundsopacitet verifierades. Kvällsbelysningen i 3D använder samma befintliga miljölogik.
