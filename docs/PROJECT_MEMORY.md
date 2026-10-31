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
