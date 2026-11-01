# Projektminne – Hemstyrning

Uppdaterat 2026-10-31. Detta är aktuell arkitektur och verifieringsprinciper; äldre installationsspecifika mätningar och miljöuppgifter ska hållas i lokal inventering, inte i denna publicerade utvecklingsöversikt.

## Körning och säkerhet

- Windows/PowerShell, Node och projektets npm-skript används. Om global npm saknas finns den lokala utvecklingswrappen i ignorerade `.build-tools`; lägg den katalogen i PATH.
- `npm run dev` startar frontend och backend. Frontend finns normalt på localhost:5173 och backend på localhost:8123.
- Riktig HA konfigureras endast i ignorerad `.env`. Visa eller publicera aldrig token. Spotify-inställningar ska bevaras. Ändra inte lokal styrbehörighet utan användarens instruktion.
- Automatiska styrtester körs enbart i simulatorläge och separat HA_DATA_DIRECTORY. `tests/setup.ts` avbryter om servern använder riktig HA. Läsande granskning får inte skicka riktiga enhetskommandon.
- Befintlig autentisering använder betrodd HTTPS-proxy, session och viewer/controller/admin. Verkliga enhetskommandon använder explicit tillåtna tjänster och registrerade bindningar. Upplåsning kräver bekräftelse.
- Efter större ändringar: full `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run build:web`. Rapportera faktiska fel och överhoppade tester. Kontrollera Git-status/hemligheter, committa egna kodändringar, publicera och verifiera localhost.

## Gemensam visning – ersätter TV-parkoppling

- `ViewCoordinator` i backend äger HOME, FOCUS_OBJECT, FOLLOW_OBJECT och FREE_3D. Tillfälliga lägen har en central timeout på 300 sekunder efter senaste verkliga visningsaktivitet.
- `/screen-ws` använder befintlig autentisering och roller. Alla hemskärmar prenumererar automatiskt; inga koder, klienthemligheter, enskild mål-TV eller sparade parkopplingsregister används.
- Serverepoch och stigande sekvensnummer hindrar gamla meddelanden från att skriva över nya. Servern ordnar även asynkrona kommandon. Återanslutning får aktuell giltig snapshot; serveromstart börjar HOME.
- `ScreenLink` hanterar återanslutning/heartbeat och begränsad användaraktivitet. Sensoruppdateringar, rendering och heartbeat förlänger aldrig timeouten. Kanalen kan inte utföra HA-tjänster.
- Objektval i kontrollpanelen skickar fokus/följning. På/av och dimmer gör det inte. Oplacerade lampor får ingen fabricerad kamerarörelse. LUBA-följning använder befintlig verifierad trackerposition.
- Hem återställer även vid upprepade tryck på startsidan, avbryter följning och presentation, stänger visningspaneler och återställer informationskorten. Ingen onödig sidomladdning på Hem.
- VIEW_CAMERA och VIEW_MOWER_CAMERA är permanenta lokala tittarlägen. De skyddas från andra skärmars vanliga kommandon och återansluter till senaste gemensamma läge när användaren lämnar dem. Bakgrundens 3D-rendering pausas.
- Real-läge har ännu ingen ansluten strömadapter. Kamera-ID måste valideras av servern. Simulatorn har ett uttryckligt tomt kameratittarläge utan påhittad stream.
- Android TV kan automatiskt öppna sparad betrodd HTTPS-server i HOME. Webbfunktioner levereras från servern; ändrat native-startbeteende kräver nytt APK. Fjärrkontroll, grafikprofiler och helskärm bevaras.
- Se `docs/SHARED_VIEW.md`. `/dev/screens` öppnar TV, hem, surfplattepanel och mobil utan parkoppling. Testklocka och testfrånkoppling kräver både simulator och HEM_VIEW_TEST_CLOCK=true.

## 3D och hemskärm

- Befintlig Three.js/GardenScene, originaltextur, geometri, UV och modeller ska bevaras. Inga godtyckliga ljus-/skaländringar för att få tester gröna.
- Hem visar levande 3D med tio informationsgrupper. Innehåll/databindningar/layout är separerade i home-overview, overview-data och overview-layout. Fri 3D och lätt listvy återanvänder samma scen.
- GardenScene sköter kameraanimation, markgränser, objektramar och följning. MowerTrackingService filtrerar telemetri, ålder och orimliga hopp. Saknad säker position ska visas som saknad.
- Foto-/energipresentation och editor finns kvar. Hem kan avbryta en pågående presentationsövergång. Kameraeffekter ska inte skicka enhetskommandon.
- Se `docs/PHOTOGRAPHIC_3D_AND_ENERGY.md`, `docs/UI_SKY_AND_CALENDAR.md`, `docs/YARD_CALIBRATION.md` och `docs/START_SCREEN_STAGE2.md`.

## Enheter, data och funktionssidor

- Gemensam vänstermeny leder till Hem, Kontrollpanel, Energi, Bilar, Klimat, Belysning, Gräsklippare, Säkerhet, Spotify och Inställningar.
- device-registry används för upptäckta och sparade enheter samt handleruppslag. Oplacerade lampor registreras i befintlig SceneConfig med placementConfirmed=false. Ingen separat 3D-placering krävs för lampstyrning.
- Kontrollpanelen har vertikal kompakt lamplista och horisontell lamprad med samma kommandoväg. Tillstånd uppdateras på plats för bevarat fokus och pågående dragning. Enhetens bekräftade state är sanningskälla.
- Sensorväljaren i inställningar söker aktuella HA-entiteter och sparar/återställer bindningar i samma beständiga scenkonfiguration. Läs lokal HOME_ASSISTANT_INVENTERING.md för verifierade bindningar; gissa inte ersättningsmätare.
- Skilj W/kW från Wh/kWh, aktuell effekt från historik, dagskostnad från månad/kumulativ kostnad och aktuellt pris från periodsnitt. Saknade eller overifierade data får inte ersättas med verklighetsliknande simulerade värden.
- Bilar och laddboxar har separata bindningar. LUBA får inte förväxlas med en äldre klipparintegration. Varmvatten och rumstemperaturer är separata. Kameror ska använda säker serverförmedlad ström, inte interna direktadresser.
- Se `docs/FUNCTION_PAGES_STAGE3.md`, `docs/CONTROL_TABLET_REFERENCE.md` och `docs/CONTROL_AND_DESIGN_CORRECTION.md`.

## Spotify och appar

- Spotify har separat sida och direkt Web API/SDK/OAuth via backend. Bevara sökning, kö, spellistor, enhetsval, Jam och tokenskydd. Användarens nya designuppdrag återinför Spotify i kontrollpanelens nedre högeryta genom samma beständiga spelarinstans.
- Uppspelningsöverföring kräver bekräftad målenhet. Gamla behörigheter kräver återauktorisering. Testerna använder falsk API/SDK och får inte påverka verklig musik.
- Nativeappar är tunna klienter mot samma betrodda HTTPS-server, utan HA-token eller modellkopior. Paket ska inte presenteras som ombyggda eller signerade utan faktisk verifiering.
- Se `docs/SPOTIFY_DIRECT.md` och `docs/INSTALLABLE_APPS.md`.

## Verifieringsläge

- Slutkontroll: TypeScript, 156 enhets-/integrationstester (60 backend + 96 frontend), produktionsbygge och samtliga 59 Playwright-test godkända. Flerfliktsprovet verifierade fokus, följning, serverstyrd timeout, upprepad Hem, lokal kameravy, återanslutning och snapshot efter sidomladdning utan HA-kommandon.
- Playwright återställer gemensamt HOME före varje test. Använd en ren separat simulator-scenkonfiguration: en avbruten editorprovning kan lämna en importerad testmodell. Spotify-proven väntar på asynkron bekräftelse/SDK-registrering; återanslutningsstatus provas med kontrollerad webbläsarklocka. TV-provet väntar på färdig hemskärm före D-pad. Inga produktionsfunktioner ändrades för dessa testväntetider.
- Ingen fysisk Google TV har verifierats i detta uppdrag. Windowsmiljön saknar Java/Gradle för nytt APK-bygge.

## Pågående stor designuppdatering

- AppShell håller GardenScene och HA-anslutningen beständiga. Funktionssidor monteras i ett outlet och städar egna lyssnare/timers med PageScope. Klientnavigation stöder historik och direktlänkar. Editor och OAuth använder fortsatt separat dokumentnavigation.
- Kontrollpanelen har en lamplista och två högerytor: detaljer/förinställningar samt återanvänd Spotify. Den dubbla lampraden och Runt huset är borttagna. Belysningssidan behåller sina filter.
- Gemensamma panelvariabler använder mörkgrått transparent material. Bakgrundsrendering på funktionssidor begränsas till 8 fps.
- Android anger sensorLandscape, PWA-manifest landscape. Webbläsare får diskret rotationsuppmaning; orienteringslås begärs bara i standalone/helskärm och avslag hanteras.
- VIKTIGT: användaren har uttryckligen bett att vänta med testkörningarna. Resultaten ovan gäller föregående commit, inte dessa designändringar. TypeScript, tester, bygge och visuell verifiering återstår för designuppdateringen.

## Gemensamma knappar

- moving-border.css är den gemensamma knappytan, importerad sist i bootstrap. Mörkgrå glasbakgrund, 38 px desktop/44 px touch, 9 px radie och en maskad 1 px konisk kantaccent som rör sig på 5,5 sekunder. Inga nya beroenden eller JS-timers.
- Primär/sekundär/ikon/aktiv/inaktiv/farlig variant väljs med hem-button--* eller data-button-variant; befintliga primary/aria-pressed/disabled och upplåsningsknappar mappas också. Lampbrytare, dimrar, objektramar och färgade valkort undantas.
- Kontinuerlig rörelse begränsas till primär/aktiv knapp. Kort får bara hover/fokus. Rörelsen stängs av för coarse pointer, TV och reduced-motion.
- Inspiration: https://ui.aceternity.com/components/moving-border och officiellt registry/moving-border.json. Implementationen är egen CSS, utan React/Tailwind/Motion.
- Inga testsviter eller Playwright-körningar utförda enligt användarens uttryckliga instruktion för detta designuppdrag.

## Statisk HA-funktionsgenomgång

- Se HA_FUNCTION_COVERAGE.md: inventeringen är en ögonblicksbild och fysisk funktion har inte verifierats. Inga tester eller verkliga styranrop kördes i uppdraget. HA_ALLOW_CONTROL ändrades inte.
- Inställningarnas entityCatalog förenar läsande registermetadata (entity/device/area) med befintlig state-ström, visar disabled/unavailable/unknown/saknat state och stödjer sökning/domän/område. Registerfel degraderar till state-katalog utan att fabricera metadata.
- entityPreferences i samma SceneConfig sparar val för kontrollpanel/funktionssidor och explicit tillåtna generiska kommandon. entity-action accepterar bara sparad entitet, fast domän/åtgärdslista och aktuellt state/kapabilitetsvärde; befintlig readonly- och rollmiddleware gäller. Ingen generisk serviceproxy.
- HA-media använder befintlig media-endpoint och separat explicit mediaregistrering. Mute-bit 8/booleanvalidering kompletterad även i simulatorn. Direkt Spotify ändras inte.
- Separat objektregistrering skapar placementConfirmed=false; Husqvarna får eget entity_id och får aldrig återanvändas som LUBA-telemetri. Generisk katalog är inte en komplett adapter för samtliga domäners styrning.

## Korrigerad kontrollpanel

- MusicPanel.mountCompact har egen kompakt markup (omslag/transport/tid/volym/aktiv enhet/länk till fullvy), utan inbäddad dialog eller enhetslista. Samma Spotify-instans och kommandon återanvänds; fullvyn behåller sökning/kö/Jam/konto.
- device-switch har 48×26 px ovalt spår inom 48×44 px träffyta och en 20 px knapp som flyttas translateX(20px) över 210 ms. Tillstånd kommer fortsatt från HA och Moving Border gäller inte brytaren.
- Kortgradienter ligger direkt på device-control/preset-card; gamla överlappande bakgrundspseudoelement är avstängda.
- Vänsterlistan är enda enhetsväljaren: lampor, konfigurerade bilar, Easee vänster/höger, VVB, robotar och användarvalda HA-entiteter. Ingen separat väljare/pin-lista finns till höger. control-devices skapar bara presentationsobjekt för kända datakällor, ändrar inga sparade bindningar/positioner.
- Inga tester kördes enligt korrigeringsuppdraget. Fysisk funktion och layoutverifiering återstår.

## Sammanhängande design – färdig vy före sidbyte

- Sidmoduler returnerar ready/activate/dispose. AppShell behåller tidigare vy tills data är klar, aktiverar först därefter Spotify och byter innehåll med 200 ms övergång. Vid laddfel ligger föregående vy kvar. Klientnavigation återställer scrollposition och hanterar hash, kalender, listvy och objektlänkar.
- Hem använder samma levande canvas; övriga sidor har diskret transparent överlägg och 8 fps bakgrund. Ingen modell/UV/ljussättning ändrad.
- Gemensamt panelmaterial och neutrala textfärger används på funktionssidor/formulär/dialoger; Hemkorten har 93 procent opacitet utan ändrad placering eller bindning.
- switch.css är gemensam skjutbrytare för lampor och observerat stoppbara skript. Förinställningarnas scenknappar är separata GO!-knappar i gradientkort; scriptbrytaren visar enbart bekräftat körläge.
- updateMarkup behåller data-dom-key/id/data-card och undviker value/checked/selected-ändringar under aktiv pekinteraktion. Spotify har stabila sektionsidentiteter. Dolda avancerade musikvyer suspenderas utan att uppspelningsanslutningen stoppas.
- Landskapslås begärs bara i stödd standalone/helskärm och stående läge; avslag hanteras. Android/PWA-inställningar från tidigare uppdrag bevaras.
- Inga tester, automatiserade webbläsarprov, TypeScript-körningar eller byggen utförda i detta designuppdrag. Statisk granskning är inte fysisk eller visuell verifiering.

## Referensdesign – endast kontrollpanelens högersida

- control-right.css är isolerad till reference-right: tre rader med färgade förinställningar, stor dynamisk enhetskontroll och låg horisontell Spotify-rad. Vänsterlistans markup/stilar har inte ändrats.
- Tillgänglig lampa väljs lokalt som standard utan HA-kommando eller kamerafokus. Lampdetaljen visar SVG-illustration, bekräftad ljusfärg/tillstånd, stor skjutbrytare, stödda dimmer-/färg-/Kelvinreglage. Färgsnabbval använder samma befintliga change/Connection.light-väg.
- Andra enheter använder samma illustrations-/detaljyta och befintliga kommandon. Spotify-kompaktläget har omslag/låt till vänster, stor transportknapp och seek i mitten, enhet/volym till höger. Seek använder befintlig backendåtgärd; enhetsval länkar till fullvyns enhetsflik.
- Inga tester eller automatiserade webbläsarkörningar utförda enligt uppdraget. Layout och fysisk funktion är ännu inte verifierade.

## Systemgranskning efter designuppdragen

- Se SYSTEM_AUDIT_2026-10-31.md för aktuell verifieringsstatus. Tidigare avsnitts "inga tester" gäller historiken i de enskilda uppdragen.
- Testa verklig normalmiljö utan att skriva över .env: separat npm-dev-process med HA_MODE=simulator, HA_DATA_DIRECTORY=data/system-audit och HEM_VIEW_TEST_CLOCK=true. Ändra inte HA_ALLOW_CONTROL. Jämför hash av .env och verklig data/scene.json efteråt och återstarta sedan normal npm run dev.
- Moving Border får inte styra komponenternas display eller överrida fasta positioner. Knappens relativa standardposition använder :where; komponentens fixed-layout och hidden har företräde.
- Kontrollpanelens lampstage har åter registreringsknapp för upptäckta lampor. Katalogens knappar stoppar bubbling så att dess data-save inte triggar inställningssidans äldre sparhandler.
- Numeriska entity-action-värden måste också följa annonserat step. Bilstater från verklig källa kräver aktuell separat fordonsanslutning; numeriska bilvärden använder gemensam mätvalidering med enhet och ålder.
- MusicPanel.mountPage laddar enheter, spellistor och kö även när den gemensamma anslutningen redan är klar. Kompaktvy använder panelens bredd, lokala label-stilar och anpassade radhöjder.
- Ny regressionstäckning finns i audit-system.spec.ts, entity-catalog.test.ts och ha-registry.test.ts. Funktionsprov använder GLB-fixtur; separata modell-/UV-/texturprov behåller verkliga modellfiler. Skärmbilder av SPA-vyer måste vänta på data-app-route, inte bara på tidigt monterad navigation.
- Chromium med SwiftShader är långsamt för många högupplösta bilder. Layoutprov behåller alla upplösningar men använder tydlig readiness, stillbildsanpassning och separat tidsbudget. Riktiga enhetskommandon och Spotify-uppspelning ska fortsatt inte ingå i automatiska tester.
- Produktionsserverns explicita SPA-rutter omfattar även energy/cars/climate/lights/mower/security/music. spa-routes.test.ts kontrollerar att direktlänkar väljer SPA-ingång och att okända URL:er fortfarande ger 404, utan krav på dist i en ren unit-testcheckout.
- HEM_E2E_BASE_URL kan välja nybyggda paketet på localhost:8123 för produktionsregressioner; standard är fortsatt Vite på 5173. Båda säkerhetsfixturerna verifierar simulatorn. Flera SwiftShader-skärmar använder låg grafikfixtur, och asynkrona expect-villkor får 15 sekunder. Separata texturprov använder originalmodeller.
- Detaljpanelens centrerade flexinnehåll måste ha safe center/flex-start-reserv så att rubrik och brytare inte hamnar ovanför nåbar överkant när innehållet är högt. Orienteringstipset försvinner efter sex sekunder och täcker inte information permanent.

- Slutlig systemgranskning: 159 enhets-/integrationstester, 62/62 Playwright, TypeScript, produktionsbygge, tre modellvarianter och gemensam version godkända. Se SYSTEM_AUDIT_2026-10-31.md för fulla resultat och tidigare misslyckade körningar.
- Normal real-miljö återstartad 1 november. .env och verklig data/scene.json är byteidentiska med före audit. Live-HA till 192.168.0.130:8123 blockeras av Windows connect EACCES; TCP-provet misslyckas. Status real/503 authenticated=false, upstream-WS 1011 och 0 verkliga entiteter verifierade. Ändra inte till simulator som tyst reserv och anta inte att token eller HA-server är fel. Nätåtkomst behöver lösas före fysisk/integrationsverifiering. Inga VPN-/brandväggsinställningar ändrades.
