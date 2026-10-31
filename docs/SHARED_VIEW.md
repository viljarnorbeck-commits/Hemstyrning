# Gemensam visningshantering

Alla klienter ansluter till samma Hemstyrning-server och samma autentiserade `/screen-ws`. Inga parkopplingskoder, skärmhemligheter eller mål-TV-register används längre. Det tidigare parkopplingsregistret läses inte. Home Assistant-styrning använder fortsatt sin separata backend och påverkas inte av visningskommandon.

## Serverns ansvar

`ViewCoordinator` äger HOME, FOCUS_OBJECT, FOLLOW_OBJECT och FREE_3D i minnet. Varje start får en ny epoch och varje ändring ett stigande versionsnummer. Servern behandlar meddelanden i en gemensam kö, även när objektvalideringen är asynkron. Nyanslutna och återanslutna skärmar får aktuellt giltigt tillstånd. Om servern startas om börjar den på HOME.

Temporära lägen har `expiresAt` 300 sekunder efter senaste visningsaktivitet. En servertimer återställer HOME även när kontrollpanelen stängts. Snapshot kontrollerar också utgångstiden. Klienten begränsar aktivitetsmeddelanden till högst ett per sekund; HA-state, rendering och heartbeat förlänger inte giltigheten. OrbitControls start/change/end skiljer användarrörelse från automatiska kameraanimationer.

Servern tillåter bara kända lägen och registrerade objekt med tillåten placering. Kamera- och enhets-URL:er samt godtyckliga HA-tjänster accepteras inte. Oplacerade enheter kan fortfarande styras via den vanliga enhetskanalen men ger inget kamerafokus. LUBA-fokus kräver dessutom en säker position i den befintliga 3D-trackern.

## Klienterna

`ScreenLink` återansluter med heartbeat, accepterar bara nyare versioner inom aktuell serverepoch och hämtar en ny snapshot efter återanslutning. Kamerafokus använder befintlig GardenScene-animation. Ingen ny modell laddas vid varje visningskommando.

Objektets namn i kontrollpanelen skickar fokus/följning. På/av, dimring och vanliga sensoruppdateringar skickar inga visningskommandon. Alla följande hemskärmar får samma läge. Fri navigation synkroniserar läge och inaktivitet, inte varje kamerapixel eller exakt orbitposition.

Hem på startsidan återställer lokalt direkt, avbryter följning och pågående presentationsövergång samt skickar HOME. Upprepade tryck får nya versioner. Hem från en annan sida begär samma återställning när hemskärmen ansluter. Detta innebär sidnavigation till Hem, men ingen omladdning när användaren redan är där.

## Permanenta kameravyer

VIEW_CAMERA och VIEW_MOWER_CAMERA är lokala tittarlägen. Servern validerar kamerareferensen innan klienten öppnar dem. Under tittarläget behåller klienten den senaste gemensamma snapshoten men tillämpar den inte. Ingen femminuterstimer stänger tittarläget. Lämna kameravisning återansluter till aktuellt gemensamt läge; Hem lämnar även tittarläget. Återanslutning försöker återuppta tittarläget.

Ingen riktig kamera- eller streamingintegration har tillförts. Real-läge accepterar tills vidare inga kamerareferenser. Simulatorns enda tillåtna referens, `simulated-camera`, visar uttryckligen ett simulerat tomt tittarläge, inte en videoström. Framtida integration kopplas via serverns kameravaliderare och säker strömproxy; interna kameradresser ska aldrig skickas till klienten.

## Behörigheter

Befintlig autentisering, origin-kontroll och roller används. Viewer kan prenumerera men inte skicka gemensamma visningskommandon eller aktivitet. Controller/admin kan styra gemensam visning. Behörigheten kontrolleras för varje meddelande. Visningskanalen har ingen referens till Home Assistant-tjänster och ändrar inte HA_ALLOW_CONTROL.

## TV och testmiljö

Android/Google TV återöppnar en sparad betrodd HTTPS-server. TV startar med `profile=tv&native=home`, återställer HOME och prenumererar därefter automatiskt. Vanliga återanslutningar får aktuell snapshot. Fjärrkontroll, helskärm, fokus och grafikprofiler bevaras. Ett nytt nativepaket måste byggas/installeras för ändrat native-startbeteende; webbklienten uppdateras från servern.

`/dev/screens` öppnar TV, hemskärm, kontrollpanel och mobil på samma server utan koder. Automatisk testning använder simulatorn. Endast när `HEM_VIEW_TEST_CLOCK=true` och backend kör utan riktig HA finns adminskyddade `/dev-api/view-clock` och `/dev-api/view-disconnect`. Dessa används för att prova fem minuter och återanslutning utan att vänta eller påverka enheter. Produktionsläge saknar dessa vägar.
