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

## Beständigt döljda enheter, 1 november

- Senare läsande kontroll samma dag: riktig HA är åter åtkomlig, autentisering och WebSocket fungerar och 752 entiteter läses. Auditens tidigare nätblockering är en historisk ögonblicksbild.
- Användaren identifierade sin fungerande fönsterlampa som `switch.aktorb1_b3_port8_sovrum1_fonster`. Den ska inte förväxlas med `light.wled_viljar1`/`light.wled_viljar2`.
- På användarens begäran har endast de två gamla WLED-posternas lokala `entityPreferences.hidden` satts till true. Övrig scenkonfiguration jämfördes och bevarades. Inga HA-entiteter raderades, bindningar flyttades eller riktiga styrkommandon skickades.
- Den valfria hidden-flaggan återanvänder befintlig SceneConfig. Registrerade och automatiskt upptäckta enheter filtreras i enhetslistorna, inklusive sparade fallbackposter och hemmets lampgrupp. Sparade objekt/3D-placeringar bevaras. Kompletta enhetsöversikten behåller posterna och kan återställa visning genom att avmarkera Dölj från enhetslistan.
- Verifiering för denna mindre visningsändring: TypeScript, hela enhets-/integrationssviten (63 backend + 98 frontend = 161), produktionsbygge och läsande Chromium-prov av kontrollpanel/belysning, omladdning och återställningsval. HTTP-skrivningar blockerades i webbläsarprovet och Spotify mockades. Hela Playwright-sviten kördes inte om för denna ändring; föregående audits 62/62 är historiskt resultat.

## SMHI-väder för Kyrkås, 1 november

- Alla tester, TypeScript-kontroller, byggen och automatiserade webbläsarprov är pausade på användarens uttryckliga begäran tills användaren återupptar dem. Inga sådana körningar gjordes för väderändringen.
- Orsak: ingen weather-entitet finns i riktig HA och väderbindningen är tom. Direkt läsande SMHI-adapter använder aktuella SNOW1gv1 (PMP3gv2 är avvecklat), med timeout, validering, åldersgränser och tio minuters cache. Inga HA-konfigurationsändringar eller styrkommandon.
- Valfri SceneConfig.weather sparar källa, platsnamn och prognospunkt i befintlig lokal konfiguration. Kyrkås, Östersund sparades lokalt utifrån HA:s hemposition avrundad till tre decimaler. Befintlig location och samtliga övriga inställningar jämfördes och bevarades; inga privata koordinater committas. Inställningssidan kan ändra väderkälla och punkt.
- Vädervyn och 3D använder samma adapter. Prognos märks SMHI/prognos, verklig utomhusmätning visas separat och prioriteras när aktuell. Ingen syntetisk HA-entitet läggs i entitetskatalogen. Simulatorn behåller sitt eget väder.
- Normal läsning av /connection-api/weather gav HTTP 200, available=true och prognos för Kyrkås. Ingen testsvit eller visuell granskning körd; dessa kvarstår enligt pausen.

## KNX utomhustemperatur och kalibrering, 1 november

- Läsande HA-diagnostik visade fungerande sensor.uteknx_temperatur (5,6 °C, rapport knappt två minuter gammal). Tidigare ersattes värdet av SMHI när generell 15-minutersgräns passerades. Nu behålls just denna givares senaste giltiga mätning med rapporttid och tydlig markering när den är äldre; unavailable/unknown/frånkopplad och saknad eller ogiltig tidsstämpel förblir utan numeriskt värde. Äldre mätning betecknas aldrig som ny liveavläsning.
- Användarens korrigering −0,7 °C sparas lokalt i befintlig entityPreferences.temperatureOffsetC, ingen HA-ändring. Gemensam measurement tillämpar korrigering efter enhetskontroll, en gång, utan att ändra råstate eller SMHI/simulator. Hemöversikt, klimat och kompakta KNX-sammanfattningen använder den.
- Entitetskatalogen visar HA:s råvärde och låter administratör ändra temperaturkorrigering (−20 till +20 °C). Befintliga övriga entitetsval bevaras när inställning sparas.
- Tester, TypeScript, bygge och automatiserade webbläsarprov är fortfarande pausade enligt användaren. Endast normal läsande anslutningsdiagnostik och lokal konfigurationsändring utförd.

## Kompakt Spotify-spelare och lokal enhetsväljare, 1 november

- Kontrollpanelens enhetsval var en vanlig länk till /music?tab=devices. Därför navigerade det till den fullständiga musikvyn; ingen lokal popup fanns. Ersatt av typad knapp och SpotifyDevicePicker utan länkar, hashändring, dialogmontering eller scrollIntoView. Klick stoppas lokalt.
- Popupen använder en separat body-portal/top layer med skärmanpassad position ovanför eller nedanför knappen, inklusive visualViewport, resize och scroll. Endast Spotify API:s verkligt rapporterade enheter visas i kompakta menyn. Aktiv enhet och restricted-enheter markeras; befintlig chooseDevice/transfer/SDK-aktivering och backendbekräftelse återanvänds.
- Escape, utanförklick, enhetsval och vybyte stänger popupen. Pil/Home/End, teckensökning och Tab stöds; fokus återställs med preventScroll. Intern menyscroll kan flyttas vid tangentnavigation utan att sidans scroll ändras. Stabil DOM och radordning behåller fokus/menyscroll vid statusuppdateringar. Inga globala popup-lyssnare lämnas kvar efter stängning.
- Spelaren är en sammanhängande grå glaspanel med 75–95 px omslag på bred yta, låt/artist, central transport och tidslinje, samt lokal enhetsknapp och volym. Smal panel får två rader, utan egna spellistor/kö/sökning eller scrollbar. Hela Spotify-länken och dubblerad tidsinformation borttagna. Nödvändiga anslutnings-/felmeddelanden finns kvar. Ny CSS är isolerad till musikpanelen/popupen. Övriga kontrollpanelen är oförändrad.
- Gemensam MusicPanel-instans, Web API, SDK, OAuth, tokens, Jam och fullständiga musikvyn behålls. Ingen ny integrationsinstans eller parallell playbackhämtning. Lokal tidsindikator uppdateras varje sekund från senaste Spotify-status och slutar extrapolera efter 15 sekunder utan ny status.
- Endast kodgranskning och Git-/hemlighetskontroll. Inga tester, TypeScript-körningar, byggen, automatiska webbläsarprov eller verkliga Spotify-kommandon utförda enligt användarens uttryckliga instruktion. Layout, fokus/scroll och faktisk uppspelning/enhetsbyte behöver senare verifieras. Kontots aktuella inloggning, scope och enheter har inte kontrollerats eller ändrats.

## Easee på kontrollpanelen, 1 november

- På användarens begäran tas de två automatiskt tillagda Easee-statuskorten bort från controlDevices. Bilkorten, bilsidans laddboxdata, energikopplingar och HA-entiteter bevaras. Ingen lokal konfiguration eller fysisk enhet ändras.
- Inga tester, TypeScript-körningar eller byggen enligt den fortsatta testpausen.

## Dammsugarens stora kontrollruta, 1 november

- Läsande HA-inspektion: vacuum.xiaomi_vacuum_cleaner är dockad och rapporterar supported_features=14140 samt suglägen Silent/Standard/Medium/Turbo/Gentle/Auto. Batteriattribut saknas; visa fortsatt Saknar data. Ingen annan vacuum-entitet används som ersättare.
- Stor kontrollruta har egen robotdammsugarillustration och dammsugarikon i listan. Endast för dammsugaren tas framsteg, GPS och 3D-fokus bort; val av den skickar inte heller kamerafokus. Övriga enheter behåller sina fält/fokus.
- Visar stödda knappar Städa allt, Pausa, Stoppa, Till laddstation, Punktstäda och Var är jag?, plus val av rapporterat sugläge. Turbo finns, inget påhittat Max-läge. Funktionsbitar följer HA:s officiella vacuum/const.py och aktuell tjänstekatalog.
- Gemensamma robotSupports och registrerad-object /commands utökas med stop/locate/clean_spot/set_fan_speed. Befintliga serverbehörigheter, HA_ALLOW_CONTROL, sparad objekttyp och aktuellt funktionsstöd krävs; fan_speed kontrolleras mot aktuell fan_speed_list även i backend. Inga generella send_command eller godtyckliga tjänster öppnas.
- Tillstånd/sugläge bekräftas mot HA-state. Locate saknar tillståndsändring och visar därför endast att HA tagit emot tjänsteanropet. Simulatorns tjänster och fixtur är förberedda för motsvarande funktioner, utan att någon simulator/testkörning utförts.
- Alla tester, TypeScript, bygge och automatiserade webbläsarprov fortsatt pausade. Endast läsande states/services-anrop och kodgranskning; inga fysiska kommandon skickade. Visuell och fysisk funktion återstår att verifiera senare.

## Hela KNX-listan i kontrollpanelen, 1 november

- Läsande HA-register gav 94 verifierade KNX-entiteter: 54 switch, 4 light, 21 sensor och 15 binary_sensor; 91 hade aktuellt state i statekatalogen. Samtliga aktor-entiteter som hittades i states fanns i KNX-registret. Tidigare automatisk upptäckt omfattade bara light, vilket utelämnade flertalet aktorer.
- Kontrollpanelen hämtar befintlig /connection-api/catalog och lägger automatiskt till alla plattform=knx i sin presentationslista, utan dubbletter och utan att spara några nya 3D-objekt eller konfigurationsposter. Saknade/avaktiverade tillstånd märks uttryckligen. Separat KNX-grupp sorteras naturligt på namn; sökning omfattar namn och entity_id. Sparade Dölj-val bevaras.
- Uppdateras vid montering och högst en gång per minut; avbrutna vyer avbryter registeranrop och timers. Befintlig backendcache återanvänds. Sensorer och binära sensorer har läsande detaljvy med entity_id, område och rapporttid. Ingen påhittad lamp-/GPS-/batteristyrning för dessa funktioner. KNX-temperaturvisning respekterar sparad lokal korrigering, inklusive utomhusgivarens −0,7 °C.
- Listvisning ger inga nya styrbehörigheter. Befintliga sparade enheter och uttryckliga allowCommands-val använder tidigare kommandovägar; avaktiverade registerposter är spärrade. Inga Home Assistant-ändringar eller styrkommandon skickades. Easee-kortens borttagning, WLED-döljning, Spotify och övrig design bevaras.
- Tester, TypeScript, bygge och automatiska webbläsarprov fortsatt pausade enligt användaren. Endast läsande inventering och kodgranskning; visuell granskning och fullständighet i renderad vy återstår att verifiera senare.

## Kontrollpanel utan övre verktygsrad, 1 november

- På användarens begäran tas hela control-toolbar bort: Ansluten, Gemensam visning, Översikt och Avsluta följning. Tillhörande DOM-uppdateringar och CSS tas bort, så raden inte lämnar kvar utrymme. Sidans övre padding minskas till 8 px.
- Förinställningslistan inklusive Halloween, vänsterlistan, enhetsrutan, Spotify och ScreenLink/config-synk är bevarade. Nödvändiga fel- och behörighetsmeddelanden finns kvar.
- Inga tester, TypeScript-körningar, byggen eller automatiserade webbläsarprov enligt den fortsatta testpausen.

## Kontrollpanelens lista till nederkanten, 1 november

- Tar bort sidans 16 px nedre padding och listans 10 px extra bottenpadding, så den befintliga flex-/gridlistan kan sträcka sig ända ner. Även det låga liggande lägets nedre 6 px marginal tas bort. Listan behåller safe-area-inset-bottom för enheter med systemfält. Mobilens stående staplade layout bevaras.
- Endast layoutändring; inga tester, TypeScript-körningar eller byggen enligt användarens testpaus.

## Gemensam bildbakgrund på kontrollpanelens högersida, 1 november

- Användarens bifogade bild kopieras oförändrad till public/assets/control-gradient.png. Lokal public-resurs följer Vites produktionspaket. Ingen extern bildkälla eller bildgenerering.
- Ny control-background.css är strikt begränsad till body[data-app-route="/control"] och control-right. En opak gemensam panel med fallbackfärg, cover/center/no-repeat, 22 px hörn, tunn kontur och svag skugga fyller högersidan. Ett 16-procentigt mörkt lager ligger över bilden, utan extra blur eller transparens mot 3D-scenen.
- Enhetskontroll och kompakt Spotify har diskret mörkgrå bakgrund med 55 procents opacitet, tunna konturer och ingen extra backdrop-blur. Förinställningarnas gradients, reglage, layoutordning och funktioner behålls. Vänsterlista, dess scroll/bredd och alla andra sidors bakgrunder är orörda. Popupens befintliga top-layer ligger utanför klippningen.
- Inga tester, TypeScript-körningar, byggen eller automatiserade webbläsarprov enligt användarens uttryckliga instruktion. Endast statisk granskning; visuell granskning återstår.

## Starkare abstrakt bakgrund på funktionsflikar, 1 november

- Ny feature-background.css återanvänder befintliga #garden och kamerans aktuella rendering. Selektorer kräver app-feature och undantar uttryckligen data-app-route=/control; hemskärmens skarpa huvudscen och kontrollpanelens nyss införda bakgrund är oförändrade.
- Canvasens blur ökar från 3 till 60 px (20 gånger), saturation från normal till 2,2 och contrast till 1,4. Synlighet ökar från 0,22 till 0,82, och ett 1,24 gånger förstorat bakgrundslager ger överhäng vid kanterna. Funktionsytans tidigare 36-procentiga grå överdrag sänks till 18 procent.
- Statiska breda orange/blå/magenta/violetta/turkosa färgfält på ett separat fast pseudolager förstärker färgskillnader i neutrala delar av modellen. Lagret har 160 px överhäng, 60 px blur och klipps utanför visningsytan; inga egna scrollområden, interaktionshinder eller animationsloopar. Den dynamiska kamerabilden finns kvar under färgfälten.
- Enbart CSS/import och dokumentation ändrade. Paneler, text, knappar, navigation, HA/Spotify, TV-logik, modeller och sparad konfiguration är orörda. Inga tester, TypeScript-körningar, byggen eller automatiska webbläsarprov enligt användaren; visuell verifiering kvarstår.

## Fullständig kvalitetssäkring slutförd, 1 november

- Användarens senaste uttryckliga uppdrag återupptog alla tester efter tidigare paus. All automatisk styrning kördes mot isolerad simulator med egna qa-*-kataloger; Spotify mockades. Nio kodfel rättades: typning och fokus i Connect-väljaren, dolt popup-lager, SVG-synk, kort liggande Spotify-layout, surfplattans temperaturreglage, långa KNX-rubriker, analyscache före worker-exit och dammsugarens procentformat. Äldre testförväntningar för borttagen toolbar samt ett hårdkodat bil-ID och testregistreringens isolering korrigerades utan att ta bort testfall.
- Slutlig HEL körning efter rättningar: npm test 175/175 (71 backend + 104 frontend), Playwright 67/67 (0 misslyckade, 0 överhoppade, 0 flaky), typecheck, build:web och backendbuild godkända. Modellverifiering av alla tre GLB-varianter och versionskontroll godkända. 50 layoutbilder över tio sidor och fem upplösningar; kompletterande låg liggande kontrollpanel, popup och dammsugare granskade. Full rapport: docs/SYSTEM_TEST_REPORT.md.
- Vanlig npm run dev återställd med oförändrad .env och verklig data/scene.json (SHA-256 jämförda). Riktig brygga och läsande WebSocket autentiserade, 752 entiteter; användarens styrbehörighet bevarad. Inga verkliga service-/Spotify-kommandon skickades. Hem, /control och /dev/screens HTTP 200 på localhost:5173. Process-ID lokalt i .build-tools/qa-normal-dev-pid.txt.
- Fysisk utrustning, verkligt Spotify-konto och native-byggen är inte verifierade. Native-toolchains saknas; ingen långvarig minnesprofilering. Modelloriginal och privata kontofiler är orörda. Egna QA-rättningar publiceras på codex/design-shell.

## Inbyggd Halloween-effekt och separat testserver, 1 november

- Användaren vill ha cirka en minuts gemensam/blandad blinkning och dammsugarens lokaliseringssignal. Bekräftade uttryckligen att bara belysning ska ingå, inte motorvärmare, laddning, vinkyl eller köksuttag. Gamla knappen pekade på simulatorns script.halloween som saknas i verklig HA.
- Befintlig Preset/SceneConfig har valfria effect=halloween, effectTargets och effectVacuum. Serverns HalloweenEffect håller en effekt åt gången, växlar mönster, avslutar efter 60 s och återställer tidigare på/av samt ljusstyrka för ursprungligen tända lampor. Manuell stoppknapp och tydligt återställningsfel finns. Ingen HA-entitet/automation skapas, inga färger ändras. Dammsugaren får bara locate, en gång och endast vid annonserat stöd. Belysningsfilter, tillgänglighet, dolda/spärrade poster och befintliga behörigheter gäller.
- Ordinarie lokala Halloween-preset är migrerat till inbyggd effekt med 40 identifierade belysningsposter och den redan registrerade dammsugaren. Endast presets ändrades; övrig lokal konfiguration och .env bevarades. Ingen verklig effekt aktiverades under arbetet.
- Tester: 184/184 enhets-/integrationstester, 68/68 i hela Playwright, typecheck och båda byggen godkända. Slutlig UI-omkörning 2/2 efter en mindre CSS-rättning av klippt preset-feedback och tre pixlar på låg skärm. Se docs/HALLOWEEN_EFFECT.md för detaljer och begränsning vid abrupt processavbrott.
- Viktigt: lämna alltid servern igång och kontrollera faktiska svar. Vanlig real-drift fortsätter på localhost:5173/8123, autentiserad med 752 entiteter. Separat simulator/testserver lämnas nu också igång på localhost:15173/18123, med en egen Halloween-knapp och utan kopierade Spotify-kontotokens. Båda /control HTTP 200 och båda /health ok. QA-processer/datamapp sparas lokalt i .build-tools/halloween-qa-processes.json; separat Vite-konfiguration i .build-tools/halloween-vite.config.mjs.
- Playwrights tidigare hårdkodade URL:er använder nu HEM_E2E_BASE_URL och HEM_E2E_BACKEND_URL med oförändrade standarder. För isolerade tester: http://localhost:15173 respektive http://localhost:18123. Fullsviten verifierades där medan vanlig server körde vidare. QA-konfiguration/loggar/data är Git-ignorerade.

## KNX-lampornas korta namn och kategorier, 1 november

- PUSH ÄR PAUSAD på användarens uttryckliga begäran. Committa lokalt vid behov men pusha inte förrän användaren uttryckligen återupptar publicering.
- Identifierade KNX-lampor har korta visningsnamn utan Aktor/bank/port-prefix, till exempel Köksbord och Sovrum 1 Fönster. De ligger bland Lampor med samma färgglada lampkort och stora lampdetalj som övrig belysning. Motorvärmare sorteras i egen grupp längre ner; resterande KNX-funktioner ligger under Övrigt. Fordon/robotar och varmvatten behåller Enheter-gruppen. Ändringen gäller kontrollpanelen och belysningssidan.
- Endast presentationen ändras: entity_id, sparad objekttyp, 3D-placering och befintliga switch-kommandovägar/behörigheter bevaras. KNX-brytare får inga påhittade dimmer- eller färgreglage. Sökning på entity_id fungerar även efter namnförkortning. Ingen HA-konfiguration eller verklig enhet ändrades.
- Gemensam isLightingEntity i shared/ha-contract återanvänder exakt Halloween-identifieringen, även för presentationsgrupperingen. Halloween-funktionen återanvänder samma kriterier; inga nya effektmål eller styrbehörigheter. Läsande kontroll av riktiga katalogen gav 22 identifierade KNX-lampor.
- Verifiering av denna begränsade presentationsändring: hela enhets-/integrationssviten 187/187 (80 backend + 107 frontend), fyra riktade Playwright-prov för namn/grupper, katalogfullständighet, lampregistrering och skrivskydd, TypeScript samt webb- och backendbygge godkända. Första nya browserprovet behövde vänta på färdig SPA-navigation; omkörning 4/4 godkänd. Desktop/mobilbilder granskade. Hela tidigare Playwright-sviten kördes inte om för denna ändring.
- Normal localhost:5173/8123 och separat simulator/testserver localhost:15173/18123 lämnas igång, kontrollpaneler/health verifierade HTTP 200. Ingen push gjord för denna uppgift.

## På/av väljer också detaljrutan, 1 november

- Tryck på en aktiverad på/av-brytare i kontrollpanelens vänsterlista väljer nu samma enhet i den stora detaljrutan innan det befintliga styrkommandot skickas. Gäller både vanliga lampor, KNX-lampor och övriga enhetsbrytare med samma komponent. Textval finns kvar och skickar inget på/av-kommando. Ingen extra kamerafokus eller extra styrning läggs till. Spärrade kontroller och alla befintliga behörigheter bevaras.
- Simulatorprovet täcker båda kommandovägarna och verifierar exakt ett kommando per brytartryck samt noll extra kommandon vid textval. Hela enhetssviten 187/187, riktat Playwright-prov 1/1, typecheck och webbbygge godkända. Hela Playwright-sviten kördes inte om för denna lilla ändring. Ingen verklig enhet styrdes. Push är fortsatt pausad.

## Spotify livefelsökning, 1 november

- Användarens riktade uppdrag återupptar publicering för Spotify. Tidigare lokala KNX-/brytarcommittar 2e9aada och 3f5ba99 förblir opublicerade. Spotify publiceras isolerat på codex/spotify-connect-fix från senaste publicerade bas.
- Playwright med installerad Chrome verifierade riktig localhost:5173, befintlig Premium-inloggning, verkliga Connect-webbläsarenheter och SDK-ready med giltigt device_id. Normal separat beständig Chrome-profil med sandbox fungerade; första automatiserade sessionen saknade stödd DRM-keysystem. Ingen användarprofil eller konto ändrades.
- Exakt 404: lokalt POST /spotify-api/command, play utan enhet, blev Spotify PUT /v1/me/player/play; provider svarade NO_ACTIVE_DEVICE, Player command failed: No active device found. Säkra feldetaljer bevaras nu och UI vägleder till enhet/låt. Ingen token loggas.
- Aktuell SDK-enhet kombineras med riktiga API-enheter; valt mål skiljs från bekräftat aktiv enhet. Tom överföring undviks efter verklig Spotify 500 Server error vid tom playback. Första innehåll riktas direkt till valt ID; riktig transfer med laddad låt gav 200. Ljudaktivering sker från användargest. Ingen design-, HA- eller 3D-ändring.
- Get Lucky spelades och pausades faktiskt två gånger i egen Chrome. Slutläget är pausat. Separat slutkontroll såg låt/omslag/enhet, aktiva knappar, popup utan scroll/navigation och noll JS-fel. Fysiska externa Connect-enheter saknades; Jam med andra deltagare inte praktiskt testat.
- Endast riktade tester: 12/12 enhetstester, 7/7 Playwright mot isolerad simulator, typecheck och webb-/backendbygge godkända. Ingen stor systemsvit, inga verkliga HA-kommandon. Rapport docs/SPOTIFY_LIVE_DIAGNOSIS.md; skärmbilder/evidens i ignorerade .build-tools. Normal dev och separat simulator bevaras.

## Spotify-fliken ombyggd efter kontrollpanelen, 1 november

- Användaren rapporterar att fulla Spotify-vyn fortfarande känns trasig och vill ha kontrollpanelens designspråk. TESTER OCH PUSH ÄR ÅTER PAUSADE enligt senaste instruktionen. Ingen ny uppspelning eller kontoförändring genomfördes under denna ändring.
- Spotify-sidan har en gemensam mörk glasyta, stort omslag, orange rund spelknapp, sökbar musik/spellistor och enhetsmeny direkt vid spelaren. Den använder samma MusicPanel-session, transportkommandon och SpotifyDevicePicker som kontrollpanelen. Ny spotify-page.css avgränsas till Spotify-spelaren; kontrollpanelens kompakta layout är oförändrad.
- Sök/spellistor, kö, enheter och Jam är verkliga separata flikar på alla skärmstorlekar. Kön läses när dess flik öppnas. Sökning har laddnings-, fel- och tomt läge samt skydd mot gamla söksvar. Kö-/spellistefel visas i respektive sektion. Söktext bevaras medan användaren skriver. Låttidsreglaget kan söka och följer uppspelning utan att skriva om hela sidan varje sekund.
- Full musikvy utgår från faktisk Spotify-inloggning även när playback saknas. Spela utan låt vägleder till sökningen. Tillåt ljud aktiverar SDK-ljud utan att försöka spela tom playback. Enheter kan uppdateras och en misslyckad lokal SDK-anslutning kan återanslutas manuellt. Inga tokens, scopes, Spotify-kontoinställningar eller HA-funktioner ändras.
- Onödiga lyssnare som ritade om hela musikvyn vid varje HA-state togs bort. Dubbla Spotify-rubriker/feedbackytor ersattes av en sidrubrik och fel nära spelaren. Gemensam knapp-CSS vann tidigare över den tänkta musikdesignen; Spotify-specifika selektorer håller nu rund orange transport och små omslag stabila.
- Endast läsande Spotify-status (ansluten/styrbehörighet godkänd), manuell visuell granskning av körande desktop-vy och statisk diff/hemlighetskontroll. Inga automatiska tester, TypeScript-kontroller, byggen eller spela/pausa-prov kördes för denna ändring. Funktionell verifiering och mobil/surfplatteprov återstår tills användaren återupptar testerna. Skärmbild lokalt i .build-tools/spotify-page-redesign.png.
- Föregående push publicerade innehållet samlat som d746c84 på origin/codex/design-shell via GitHub-integrationen eftersom git push väntade på lokal credential manager. Lokal historik har samma träd men andra commit-ID:n (1214cf0 m.fl.). Vid nästa publicering måste historiken hanteras utan force-push eller förlust av lokala ändringar.

## Praktisk klickgranskning av KNX-lampor, 1 november

- Användaren återupptog uttryckligen praktisk localhost-klickgranskning av lampor. Övriga tester och push är fortsatt pausade. Ingen verklig lampa tändes/släcktes och inga HA-servicekommandon skickades.
- I faktisk /control gick det att välja Sovrum 1 Fönster, men dess brytare var disabled med meddelandet Spara lampans koppling innan styrning. Samma orsak hittades för 17 andra tillgängliga KNX-belysningsaktorer. Detta är separat från de sex Hue-enheter som HA faktiskt rapporterar unavailable.
- Befintliga UI-funktionen Spara lampans koppling användes för alla 18 verifierade belysningsposter, utan ändrade entity_id eller HA-konfiguration. Objekt registrerades av appens normala lokala sparflöde med placering obekräftad. Motorvärmare och övriga uttag fick inga nya kopplingar eller aktiverade kontroller.
- Slutlig DOM i körande app: 40 lampkort, 34 aktiva brytare, endast 6 spärrade, samtliga med unavailable-status från HA. Detaljval för Sovrum 1 Fönster öppnades igen utan sparspärr. Kopplingarna finns i ignorerade data/scene.json och fungerar oberoende av källkodspush. Skärmbild .build-tools/knx-links-enabled.png. Inga källkodsändringar behövdes, ingen full testsvit kördes och fysisk av/på-funktion provades inte.

## Lampnamn och dold otillgänglig belysning, 1 november

- Användaren bad att ta bort de nu otillgängliga lamporna ur Hemstyrning och förtydligade att Sovrum 1 Fönster respektive Sovrum 1 Tak ska heta Viljars hyllor och Viljars tak. Det gäller inte WLED eller Sovrum 2 Fönster.
- Sparade lokala objektnamn uppdaterades. De två light-entiteter som fortfarande hade Aktor-prefix heter nu Ledljus Hönshus och Takljus utanför hönshus. De parallella KNX/light-entiteterna behålls eftersom identitet/samma fysisk last inte verifierats.
- Sex Hue-enheter som fortfarande rapporterar unavailable har hidden=true i befintliga entityPreferences. Inga HA-entiteter raderades. Lokal säkerhetskopia före ändringen i ignorerade .build-tools/lights-before-renaming.json. Alla övriga inställningar bevarades.
- Användarverifierade switch.aktorb1_b3_port9_sovrum1_tak registrerades med befintlig device-objektmodell som Viljars tak och läggs uttryckligen till i gemensam belysningsidentifiering, så den hamnar bland lamporna. Ingen generell regel om alla tak eller uttag infördes; inga Halloween-mål lades till.
- Sparad konfiguration och faktisk kontrollpanel visar båda Viljars-namnen och inga otillgängliga lampkort eller Aktor-namn i lampgruppen. Läsande visuell granskning, ingen verklig styrning. Automatiska tester, typkontroll, byggen och push fortsatt pausade. Skärmbild .build-tools/renamed-viljar-lights.png.

## Flytande sökning i kontrollpanelen, 1 november

- Fasta sökfältet, KNX-statustexten och första Lampor-rubriken tar inte längre höjd i /control. Listan fyller kolumnen från överkant till nederkant.
- Liten absolut placerad förstoringsglasknapp uppe till vänster, transparent mörkt glas och mjuk skugga. Öppnar ett lika transparent sökfält ovanpå listan, utan att ändra scrollområdets storlek. Namn/entity_id-sökningen återanvänds. /lights behåller sitt fasta fält och status.
- Knappen annonserar öppet läge, fältet får fokus och krysset/Escape stänger och rensar med återställt fokus. Klick utanför stänger utan att rensa filtret eller rita om listan under pågående pekarklick; aktivt filter markeras på sökknappen. Dokumentlyssnaren tas bort när sidan lämnas.
- Endast statisk diff och hemlighetskontroll. Automatiska tester, typkontroll, byggen och push är fortsatt pausade enligt användaren. Ingen verklig enhet styrdes.

## Kontrollpanelen visar bara på/av-enheter och dammsugare, 1 november

- Användaren vill ta bort alla poster som saknar på/av-funktion från kontrollpanelen, med uttryckligt undantag för dammsugaren. /control filtrerar därför bort sensorvärden, binary_sensor-status, KNX-diagnostik, temperaturer, energimätare, varmvattenkort utan stödd brytare och andra rena informationsposter.
- Befintliga light-lampor, switch-aktorer och dammsugare finns kvar. Bilkort får bara visas med verkligt annonserat klimat-on/off-stöd. Tillfällig otillgänglighet/skrivskydd för lampor och brytare gör inte att listan ändras; befintliga säkerhetsspärrar gäller. Ingen ny styrbehörighet aktiveras.
- Enbart kontrollpanelens presentationsfilter ändras. Entiteter, lokal konfiguration, fullständig katalog i inställningar och andra sidor bevaras. Tester, typkontroll, byggen och push är fortsatt pausade. Ingen verklig utrustning styrdes.

## Dammsugarens riktiga rum och tömningsplats, 1 november

- Användaren vill ha samtliga befintliga rum/extrafunktioner från Home Assistant i en utfällbar meny under Punktstäda. Läste faktisk HA Lovelace-konfiguration via autentiserad läsande WebSocket. Registret verifierade att knappens device-target hör till vacuum.xiaomi_vacuum_cleaner, samma entitet som Hemstyrning använder. Inga servicekommandon kördes. REST-läsning av skriptkonfiguration nekades; Lovelace-knapparna innehöll redan verifierade service/data och användes som källa.
- Lokal vacuumTargets på det befintliga dammsugarobjektet lagrar tio verifierade mål: Töm behållare, Kök, Hall, Kontorsentré, Salongen, TV Rummet, Gästrummet, Städa öppna spisen, Städa kakelugnen och Kontoret. Inga påhittade rum eller segment. Originalets Hall/Kontorsentré delar segment och dess två eldstadsknappar delar zon; dessa befintliga definitioner bevaras. Säkerhetskopia av scenen före ändring i ignorerade .build-tools/scene-before-vacuum-menu.json.
- Punktstäda öppnar/stänger ett rutnät med rum och extrafunktioner, utan att starta något. Vanlig punktstädning finns som Runt dammsugaren i menyn. Var är jag heter nu Var är Max?. Töm behållare är faktisk app_goto_target till tömningsplatsen, inte automatisk behållartömning, och det står på knappen. Menyn behåller öppet läge över statusuppdateringar och detaljkortets innehåll kan skrollas från toppen.
- Schema och frontendtyp stödjer begränsade segment-, zon- och gå-till-mål i befintliga scene-objekt. Ny backend /vacuum-target tar bara object_id/target_id, hämtar sparad definition, verifierar roll/skrivskydd, entitetens tillgänglighet och annonserad HA-tjänst. Godtyckliga tjänster eller koordinater accepteras inte från klientanropet. Simulatorgrenen ändrar endast lokal state och märker data simulerad.
- Kommandots mottagande skiljs från bekräftad robotstatus. Tillgängliga sugkraftsreglage samt start/paus/stopp/docka bevaras. Övriga sidor och HA-konfiguration ändrades inte.
- Lokal konfigurering och läsande källverifiering genomförda. Automatiska tester, typkontroll, byggen och push fortsatt pausade. Verklig rumskörning och tömningsförflyttning har inte testats eller aktiverats under arbetet.

## Hus 2 och lugnare uppdateringar med senaste mätvärden, 1 november

- Användaren vill ha Hus 2 i stället för Jannes hus och föredrar äldre riktiga mätningar framför tomma kort. Synliga rubriker och sensorväljarens etikett är uppdaterade på hem-/energisidorna.
- Gemensam measurement behåller numeriska värden även efter den tidigare 15-minutersgränsen. Vid unknown/unavailable/frånkoppling används senast verifierat numeriskt visningsvärde om ett sådant har observerats i samma anslutnings state-map. Ursprunglig rapporttid, faktisk anslutningsstatus och enhet bevaras; korten visar en diskret Senast uppmätt-markering. Styrning använder fortfarande riktiga aktuella states och säkerhetsspärrarna ändras inte.
- Cachen är begränsad och finns i minnet under appsessionen, inte i Git eller ett nytt konfigurationssystem. Vid källbyte mellan simulator/HA får Connection en ny state-map så visningsvärden inte blandas. Dagens kostnad/snitt får inte återanvända gårdagens prov. Fel enhet ger fortsatt inget värde. Gamla effektvärden används inte för aktuella flödespilar eller påstådd solproduktion just nu.
- Energisidan sparar historik per källa, verklig sensor, tidsperiod och datum för idag. Diagrammet töms inte vid uppdatering och cache används direkt när man återvänder till fliken. Nya data hämtas bakom befintligt diagram; fel eller svar utan numeriska punkter behåller tidigare diagram med diskret förklaring. Första historikhämtningen startar även när den delade anslutningen redan är igång, vilket tidigare kunde dröja till nästa minut.
- För Hus 2:s två otillgängliga mätare görs läsande sökning efter sista numeriska HA-historikprov under senaste sju dygnen. Ingen annan elmätare ersätter den valda och inget värde uppfinns om historiken saknas. Bakgrundsförsök begränsas till en gång per fem minuter och källbyte kontrolleras före användning.
- Configuration delar senaste lyckade scenläsning och samtidiga anrop. Funktionssidor, kontrollpanel och musik kan montera från den redan lästa scenen och uppdatera i bakgrunden. Pågående lokala ändringar skrivs inte över av bakgrundsläsningen; sparad cache använder exakt skickad snapshot och skyddas mot äldre svar. Redigerare/explicita konfigurationsläsningar väntar fortfarande på färsk läsning.
- Tre riktade regressionsfall tillagda för gammalt nollvärde, unavailable med senast giltiga värde utan ändrad riktig state, källisolering samt offline/enhetskontroll. TESTERNA HAR INTE KÖRTS. Typecheck, byggen och push är fortfarande pausade enligt användaren. Endast statisk diff/hemlighetskontroll och serverstatus; inga verkliga styrkommandon.
- Dagens kostnad/snitt har ännu ingen verifierad datakoppling. Cache kan inte skapa det underlaget och dessa kort får fortsatt visa saknad data tills korrekt dagsberäkning/databindning finns.

## Fler lampor, tydliga uttag och korta namn, 1 november

- Användaren vill sortera kvarvarande lampor från Övrigt, ha en separat Uttag-grupp och ta bort alla Aktor/bank/port-prefix. Läsande HA-registergranskning av KNX-switcharnas aktuella namn och områden användes som grund. Inga verkliga enheter styrdes.
- Kontrollpanelens presentationsklassning känner nu även igen tydligt namngivna tak- och fönsterlampor, exempelvis Kök Fönster, Sovrum 2 Fönster, Vardagsrum Tak Öppenspis och Bastu Tak. Uttag, matningar, konstant matning, kyl, mikro, vattenkokare, motorvärmare och laddning undantas från denna extra lampklassning. Aktuell friendly_name används så att Vinkyl inte klassas som fönsterlampa utifrån gammalt entity_id.
- Detta är enbart presentationsklassning; gemensam Halloween-identifiering och dess mål ändras inte. Ingen ny styrbehörighet eller objektsregistrering görs automatiskt. De nya lampkorten använder samma säkra befintliga kommandovägar och sparkrav som tidigare.
- Explicita uttag och namngivna köks-/TV-uttag sorteras under Uttag. Återstående allmänna/okända switchar ligger under Brytare i stället för att felaktigt kallas uttag. Motorvärmare behåller egen grupp. All KNX-presentation får korta namn, inte bara tidigare identifierade lampor; redan anpassade namn som Viljars hyllor/tak bevaras. Namnlösa E1-kanaler heter Kanal E1 A osv; NIL-portar heter Ej namngiven port 2/4 utan gissad funktion.
- Uppdaterade regressionsförväntningen för Vinkyl till Uttag och lade till fall för fönsterlampa kontra fönsteruttag samt namnlösa kanaler. Inga tester, typkontroller eller byggen kördes; push är fortsatt pausad. Endast statisk diff, hemlighetskontroll och serverstatus.

## Egna färgfamiljer för motorvärmare och uttag, 1 november

- Användaren vill behålla lampor och dammsugare exakt som de är men ge Motorvärmare och Uttag egna liknande färgteman med små variationer. Endast kontrollpanelens kortpresentation ändras.
- deviceCard annonserar befintlig presentationsgrupp via data-device-group. CSS begränsad till /control ger motorvärmare en varm koppar/orange färgfamilj med dämpat rosenfärgat avslut och uttag en petrol/turkos/blå familj. Befintlig stabil palette-klass ger små skillnader mellan kort utan slumpmässiga färgbyten vid omritning.
- Lampkort, dammsugare, övriga brytare, reglage, detaljpaneler och styrlogik ändras inte. Inga tester, typkontroller, byggen eller push kördes enligt pausen. Endast statisk diff, hemlighetskontroll och kontroll av localhost.

## Kontrollerad rensning av tomma funktionsposter, 1 november

- Användaren vill ta bort poster utan HA-data efter kontroll att data inte kan hämtas. Bilar, gräsklippare och allt på hemskärmen är uttryckligen undantagna. Tester och push fortfarande pausade.
- Läste riktiga states/register och kontrollerade upp till 30 dygns recorder-historik för aktuella kandidater. Audit med status, giltiga sampel och sista värde lokalt i ignorerade .build-tools/page-data-audit.json. Historikläsningar misslyckade skulle inte kvalificera för döljning. Ingen HA-konfiguration ändrades och inga servicekommandon skickades.
- 12 sensorposter saknade både aktuellt användbart värde och historik: Hus 2 effekt/energi, nio Vexve/temperaturdifferensposter och en otillgänglig SSO-PCB-temperatur. Dessa får hiddenOnDetails i befintliga entityPreferences, inte global hidden. Detaljkort och pins döljer dem bara när inget numeriskt värde finns; ny riktig data kan visa dem igen. Full katalog finns kvar i inställningar. Hemskärmens renderer och globala synlighet ändrades inte.
- Obundna tomma mätkort för dagens kostnad/snittens pris döljs på funktionssidor, men bil- och robotsidor undantas. Ingen aktuell/månadskostnad omtolkas som dagsunderlag. Tom kamerasektion visas inte när kamerabindningar saknas.
- VVB:s tre gamla ESPHome-temperatursensorer saknas nu i både HA:s states och register, men har tusentals riktiga historikprov från 31 oktober. De behålls. Klimatsidan hämtar senaste numeriska historikprov i bakgrunden med rätt enhet och visar ursprunglig mättid. Den verkligt tillgängliga climate.vvb_lower_threshold visas med sitt faktiska namn och stödda värden/funktioner; den ersätter inte tankens tre fysiska givare eller hemskärmens bindningar. Ej tillgängliga styrfält visas inte. Ingen klimatstyrning utfördes.
- Dammsugarens sensor.xiaomi_vacuum_cleaner_battery finns med riktig procentdata; sparad battery_level-bindning och visning i kontrollpanelen/robotsidan använder sensorn när vacuum-attribut saknas. Ingen påhittad batteriprocent. Lokalt scenbackup före rensning i .build-tools/scene-before-empty-page-cleanup.json.
- Alla bil-/gräsklipparobjekt behålls. home-overview.ts och hemskärmens layout är orörda i denna ändring. Befintlig global hidden och övrig konfiguration bevarade. Döljningen gäller endast funktionsvisning, ingen HA-entitet raderades.
- Ingen automatisk testsvit, TypeScript-kontroll eller build kördes. Statisk diff, hemlighetskontroll, sparad konfiguration och localhost-svar kontrolleras. Riktig drift och separat simulator lämnas igång.

## Kodskyddad skrivskyddad wifi-visning, 1 november

- Användaren vill kunna öppna Hemstyrning på sin telefon på samma wifi. Datorns aktiva Wi-Fi är 192.168.0.68/24. Ordinarie utveckling och backend är fortsatt loopback-only på 5173/8123; separat simulator 15173/18123 ändrades inte.
- Första försök att starta en oautentiserad LAN-proxy och öppna brandvägg nekades av automatisk säkerhetsgranskning eftersom hela wifi-subnätet skulle få hus-/Spotify-status utan inloggning. Kommandot kördes inte. Säkrare alternativ implementerades: .build-tools/lan-preview.mjs kräver en tillfällig sexsiffrig kod, begränsar nät/Host/Origin, har tidsbegränsad IP-bunden HttpOnly-session och begränsar försök. Inga HA-/Spotify-token exponeras. Proxy och kod finns endast lokalt och i minnet; inga kontouppgifter ändrades.
- Servern kör på http://192.168.0.68:5174. Åtkomstkoden visas endast på http://127.0.0.1:5175 på datorn; aldrig loggad. Koden byts när processen startas om. Processmetadata i ignorerade .build-tools/lan-preview-process.json. Processen är dold. Wifi-vyn är ett tillfälligt läsläge, inte full autentiserad produktionsinstallation/native HTTPS. Den tillåter inga styranrop, OAuth- eller SDK-tokenanrop, administrativ API-åtkomst eller godtyckliga filer. Kommandostatus och roll annonseras som skrivskyddad/viewer. WebSocket tillåter endast autentisering, get_states, state_changed-prenumeration och ping. HMR är envägs. Känsliga filvägar spärras.
- Läsande serververifiering: kodinloggning fungerar, /control och /energy samt frontendmodul HTTP 200 efter inloggning, anonym åtkomst HTTP 401, commandsEnabled/canControl/canConfigure false, WebSocket läste 752 riktiga entiteter. Koden/sessionstoken loggades inte. Ingen systemtestsvit, build eller verklig styrning kördes.
- Vanlig process saknar Windows administratörsrättigheter för brandväggen. Försök att skapa regel gav Åtkomst nekad. En Windows UAC-ruta har öppnats för användarens godkännande av just TCP 5174, lokal adress 192.168.0.68, fjärrnät 192.168.0.0/24 och Wi-Fi-interface. Regelns namn Hemstyrning-Wifi-Viewer-5174. Kontrollera .build-tools/lan-firewall-result.json för faktiskt resultat; hävda inte att mobilen kommer igenom brandväggen förrän godkännande/regeln är verifierad. Regel kan vid avslutad wifi-visning tas bort med Remove-NetFirewallRule -Name Hemstyrning-Wifi-Viewer-5174 från förhöjd PowerShell. Ingen routerport eller internetexponering konfigurerades.
- Användaren har fått en fråga om att godkänna Windows-rutan. Avvakta detta vid behov. Push och stora tester fortfarande pausade.
- Slutligt resultat av UAC-försöket: Start-Process rapporterade Åtgärden avbröts av användaren. Ingen brandväggsregel skapades av försöket, och inget resultat-JSON finns. Begär inte ny UAC utan nytt uttryckligt besked. Ny fråga ställd om användaren vill öppna Windows-rutan igen. Den kodskyddade servern kör fortfarande; fjärråtkomst från telefon är inte verifierad.

## Wifi-vyn får ordinarie styrning, 1 november

- Användaren bad uttryckligen att wifi-servern inte ska vara skrivskyddad. Kodinloggning, IP-bundna sessioner, nät/Host/Origin-kontroller och blockerade administrativa vägar behålls.
- Första ändringsförsöket nekades av automatisk säkerhetsgranskning eftersom det också skulle tillåta Spotify SDK-tokenvägen. Försöket kördes inte. Säkrare utförande tillåter bara befintliga HA-reglage/kommandovägar och Spotify /command. SDK-token, OAuth, kontoanslutning och administrativa skrivvägar är fortsatt blockerade. Inga token eller hemligheter exponeras.
- Wifi-serverns extra commandsEnabled/canControl=false-överskrivning togs bort. Serverns verkliga behörighet gäller, approllen annonseras som controller och låsens vanliga bekräftelse bevaras. Begärandekroppar vidarebefordras korrekt för tillåtna kontrollanrop. Inga nya generella HA-tjänster öppnas och HA_ALLOW_CONTROL ändrades inte.
- Endast egen lan-preview-process startades om (ny åtkomstkod finns på localhost:5175). Läsande verifiering gav kontrollpanel/energi HTTP 200, commandsEnabled=true, Spotify canControl=true/canConfigure=false och live-WebSocket med 752 entiteter. Ingen fysisk enhet styrdes, inga systemtester/build/push kördes. Ordinarie servrar är kvar.
- Brandväggsgodkännande är fortfarande inte klart efter det tidigare avbrutna UAC-försöket. Inget nytt UAC-försök görs utan uttryckligt besked. Adress http://192.168.0.68:5174; mobilens åtkomst genom Windows-brandväggen är ännu inte verifierad.

## Telefonen fastnar vid wifi-adressen, 1 november

- Användaren rapporterar att adressen bara laddar. Lokal läsande kontroll visar att 5174 lyssnar, kodinloggning och appstatus fungerar samt 752 entiteter nås via WebSocket. Windows-regeln Hemstyrning-Wifi-Viewer-5174 saknas fortfarande och ingen telefonanslutning observerades i TCP-listan (enbart datorns egen verifiering). Detta pekar på nät/brandvägg före sidladdning, men telefonens exakta skärm är ännu inte bekräftad.
- Läsande granskning av importer hittade en blockerad /app/icon-192.png. /app/-resurser tillåts nu i den befintligt kodskyddade proxyn; egen server omstartad. Ny kontroll: 107 sidresurser, noll fel. Ingen verklig utrustning styrdes och ingen stor testsvit kördes.
- Användaren svarade uttryckligen Ja, öppna rutan – jag godkänner den på begäran om nytt Windows UAC-försök. Rutan öppnades för samma begränsade wifi-regel; godkännande på själva Windows-rutan inväntas. Kontrollera .build-tools/lan-firewall-result.json och faktisk Get-NetFirewallRule innan åtkomst genom brandväggen påstås fungera. Tillåten port 5174, lokal Wi-Fi-IP 192.168.0.68 och fjärrnät 192.168.0.0/24. Inga andra portar eller nätprofiler ändras.
- Åtkomstkod kan ha bytts vid omstarten; aktuell kod finns endast på datorns http://127.0.0.1:5175. Telefonadress http://192.168.0.68:5174. Påminn om samma wifi och uttrycklig http-adress vid behov. Ordinarie localhost och simulator kvar, push fortsatt pausad.
- Uppdaterat slutresultat: även andra UAC-försöket avslutades med Åtgärden avbröts av användaren, utan brandväggsregel/resultatfil. Användaren har fått fråga om Windows-rutan visades eller krävde administratörslösenord. Gör inget nytt UAC-försök utan nytt besked efter detta avbrott. Sidresurser och kodskyddad wifi-server fungerar lokalt; fysisk telefonåtkomst är fortfarande inte verifierad.

## Egna kombinationer från kontrollpanelen, 1 november

- En liten ljus glasknapp med plus uppe till höger öppnar PresetComposer. Samma mörka glas och varma accenter som kontrollpanelen; responsiv dialog med namn, färg, sökbar enhetslista, åtgärdsval och utfällbara Spotify-val. Den tidigare tunna frostade överkanten bevaras.
- Befintliga scene.presets används. Configuration.addPreset läser senaste konfigurationen, slår ihop den nya posten och publicerar lokalt först efter lyckad disksparning. Ingen separat localStorage-konfiguration. Befintliga administratörskrav för konfigurering bevaras.
- Nya combination-poster kan kombinera registrerade light/switch-enheter med på/av och dammsugarens stödda locate-funktion. Backend läser sparade mål, kontrollerar samtliga innan första kommandot, respekterar skrivskydd/roll/koppling och kör små batcher med spärr mot samtidig körning av samma kombination. Delvisa fel redovisas; mottaget kommando presenteras inte som bekräftad fysisk status.
- Valfritt spöklikt blink återanvänder serverns befintliga HalloweenEffect med 60-sekundersgräns och återställning. Endast verifierad belysning, inte generella uttag, kan blinka. Dammsugaren kan endast lokalisera sig. Gruppbelysning väljs inte som blinkmål för att undvika motstridiga grupp-/medlemskommandon.
- Spotify kan spela/pausa samt välja verklig Connect-enhet och valfri låt-/spellistelänk. Befintlig Spotify-API/autentisering återanvänds. Enheterna läses på nytt vid aktivering; saknad/utgången enhet ger begripligt fel och ingen fabricerad ID-reserv. En inaktiv vald enhet överförs före play. Spotify-kommandot utförs av den aktiverande klienten efter accepterade HA-kommandon, inte som en ny schemalagd backendautomation.
- Öppna, välja och spara utför ingen styrning. Visuell granskning av körande dialog och läsande localhost-kontroller genomförda. Automatiska tester, typkontroll, produktionsbygge och push fortsatt pausade enligt användaren. Ingen verklig enhet eller Spotify-uppspelning aktiverades; körning och sparflöde är inte sluttestade.

## Dammsugarens platsval som överliggande rullgardin, 1 november

- Punktstäda öppnar nu ett native popover i webbläsarens översta lager i stället för att expandera kortets innehåll. Därmed klipps menyn inte av detaljkortets skrollyta och flyttar inte undan andra reglage.
- Samma verkliga rum, tömningsplats och punktstädningsåtgärder bevaras. Responsivt kompakt rutnät, rundade hörn, mörkt glas, mjuk skugga och 230 ms nedfällningsanimation. Minskad rörelse respekteras. Ingen egen skrollning; hjul/touchpan inne i popupen skrollar inte sidan under den.
- Placeringen följer knappen och hålls inom skärmen vid ändrad fönsterstorlek/skrollning. Klick utanför, Escape, samma knapp eller val stänger menyn. Pilar/Home/End kan flytta fokus utan att starta något. Befintliga styranrop och behörigheter oförändrade.
- Endast källgranskning och diffkontroll. Inga tester, byggen, typkontroller eller push kördes, enligt användarens senaste instruktion. Ingen verklig utrustning styrdes. Den nya rullgardinen är ännu inte granskad i webbläsaren.

## Fästa funktioner överst i kontrollistan, 1 november

- Långtryck i 550 ms på ett kort visar en animerad glasnål med mjuk ljusskugga. Separat tryck på nålen fäster raden överst; tryck på en redan fäst nål lossar den. Högerklick/kontextmeny ger också åtkomst. Escape/klick utanför döljer det tillfälliga nålvalet.
- Rörelse över 10 px, avbruten pekare, släpp före tidsgränsen eller fönsterbyte avbryter långtrycket. Reglage för dimmer/färg ignoreras. Klicket efter ett registrerat långtryck stoppas i capture-fasen så att ingen fysisk funktion aktiveras av samma gest. Nästa nya tryck återställer spärren.
- Fästningen lagras som controlPins i befintliga scene.json, i senast-fäst-först-ordning, via konfigurationens normala behörighetsskyddade sparväg. Ingen ändring av entityPreferences eller styrbehörigheter. Ingen separat lokal lagring. Misslyckad sparning flyttar inte raden och ger ett synligt fel.
- Fästa entiteter visas en gång före övriga grupper, och återgår till sin vanliga kategori när de lossas. Sökning och dolda/filtrerade enheter respekteras. Nålvalet och ordningen bevaras över sensoruppdateringar; minskad rörelse respekteras.
- Endast källgranskning och diffkontroll. Tester, typkontroll, bygge och push fortsatt pausade; inget HA-kommando utfört. Funktionen är ännu inte verifierad i webbläsaren.

## Wifi-brandväggen godkänd och öppnad, 1 november

- Användaren svarade uttryckligen Ja, öppna rutan nu och godkände denna gång Windows UAC. Den lokala hjälpen .build-tools/enable-phone-wifi.ps1 skapade den befintligt planerade regeln Hemstyrning-Wifi-Viewer-5174. Resultatfilens success är true.
- Faktisk Windows-regel verifierad: Enabled=True, Inbound Allow, TCP local port 5174, local address 192.168.0.68, remote 192.168.0.0/24, Wi-Fi-interface. Ingen annan port, routerinställning eller autentisering ändrades. Wifi-profilen är fortfarande Public; regeln gäller enbart de angivna adresserna/interfacet.
- Kodskyddad wifi-kontroll finns på http://192.168.0.68:5174/control. Aktuell tillfällig kod visas enbart på datorns http://127.0.0.1:5175. Den redan körande processen och koden behölls. Vanlig localhost:5173/control ger HTTP 200; anonym wifi-begäran ger avsiktligt inloggningssidan med HTTP 401.
- Användaren har fått telefonlänken, kodsidans datorlänk och frågan vad telefonen visar. Fysisk telefoninloggning är ännu inte bekräftad. Ingen riktig enhet styrdes, inga tester eller byggen kördes och inget pushades. Båda servrarna lämnas igång.

## Konflikt med Windows Node-blockering åtgärdad, 1 november

- Telefonen rapporterade att webbplatsen inte gick att nå trots den smala tillåtelseregeln. Läsande felsökning hittade en uttrycklig Public/TCP-blockeringsregel för exakt den Node-binär som kör wifi-servern. Block hade företräde framför Allow. Den andra blockeringsregeln codex_sandbox_offline_block_inbound ändrades inte.
- Användaren godkände uttryckligen ett nytt UAC-försök och ett undantag endast för TCP 5174. Två försök avvisades av Windows adressvalidering innan den ursprungliga blockeringen ändrades. Efter rättade IPv4-intervall och giltiga IPv6-unicastprefix lyckades hjälpen; .build-tools/lan-node-firewall-result.json visar success=true.
- Den befintliga Node TCP/Public-blockeringen är kvar och täcker nu 1–5173 samt 5175–65535. Två tillagda Node/Public-blockregler skyddar 5174 utanför det godkända IPv4-subnätet respektive övriga lokala adresser, med giltiga IPv6-unicastprefix i skyddsreglerna. Den separata tillåtelseregeln är fortfarande begränsad till Wi-Fi, lokal 192.168.0.68 och fjärrnät 192.168.0.0/24. Inga UDP-regler, sandboxregler eller routerinställningar ändrades.
- Körande wifi-server och kod behölls. Läsande kontroll ger localhost /control HTTP 200 och anonym wifi /control HTTP 401 (kodinloggning). Användaren har fått länken igen och fråga om telefonens faktiska resultat. Fysisk telefoninloggning fortfarande inte bekräftad vid dokumentationstillfället. Inga tester, byggen, HA-kommandon eller push genomfördes.
- Den lokala hjälpen och säkerhetskopian finns endast under ignorerade .build-tools. Återställning av undantaget kan ske genom att återställa originalregelns TCP LocalPort till Any från en förhöjd process, innan de två kompletterande reglerna eventuellt tas bort.
