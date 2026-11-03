# Väder och regressionstester, 3 november 2026

Tester åter tillåtna av användaren; push fortsatt pausad. Automatiska webbläsartester kördes mot isolerade simulatorer utan verkliga HA-styranrop.

| Kontroll | Resultat |
| --- | --- |
| Backend enhets-/integrationstester | 126 godkända |
| Frontend enhetstester | 146 godkända |
| Isolerad modellutbytesvalidering | 4 godkända |
| TypeScript | Godkänd |
| Produktionsbygge | Godkänt; befintlig varning om stora JavaScript-filer |
| Riktade Chromium-vädertester | 3 godkända |
| Alla unika webbläsarscenarier, sammanställda körningar | 63 godkända, 22 misslyckade av 85 |

## Väderkontroll
Sol, halvklart, mulet, regn, kraftigt regn, snö, snöblandat regn och dimma växlades i simulatorn. Okänd/otillgänglig data ger neutralt utseende. Fasta datum verifierar dag/natt och att solvärmen försvinner nattetid. Veckoprognos, cache, utanförklick och frånvaro av horisontell överrinning kontrollerades på dator, surfplatta och mobil. Enhetstester täcker SMHI-symboler, datumgruppering i Stockholm och datans ålder.

Rättat under körningen: blandad regn-/snöeffekt, korrekt simulator-källmärkning, uppdatering vid ändrat simulatorväder, typfel i mätvärdeskontroll/testfixture och entydig klass för historikdialogen. Övriga dialoger delar stil utan att ha samma identitetsklass. Namntest uppdaterat till användarens Viljars rum.

## Kvarstående fel
Hela sviten är inte grön. Fel per fil: app-flow (2), atmosphere (1), audit-system (1), control-workspace (1), editor-sky (1), function-pages (1), garden (1), hero (1), home-music (1), light-location (1), mobile-navigation (4), overview (1), premium (3), shared-view (1), v2-apps (2).

Flera tester förväntar äldre gränssnitt: 3D-vädertestet fastnar på den borttagna Visa himmel-knappen och når inte väderkontrollen. Andra förväntar tidigare färger, navigering och ständig 3D-rendering på fotostartsidan. Övriga fel behöver undersökas separat; de räknas inte som godkända eller automatiskt som enbart testfel. De nya testerna verifierar fotografiets väder och veckoprognos, inte hela den äldre 3D-atmosfärens flöde.

Fullkörningen nådde tiominutersgränsen; återstående scenarier kördes separat. För kort tidsgräns i första väderkörningen rättades, varefter alla tre riktade vädertesterna kördes tillsammans och passerade. Sammanställningen räknar varje scenario en gång med senaste resultat.

Loggar/bilder: .build-tools/qa-weather-*.log, qa-weather-summary.json, weather-*.png och forecast-*.png (lokala, Git-ignorerade).

Tillfälliga testservrar på 15173/18123 och 15174/18124 stängdes efter verifiering av process-ID och port. Ordinarie localhost:5173 lämnades igång: HTTP 200, backend health=ok, riktig HA autentiserad med 752 entiteter vid avslutande läskontroll. Ingen push utförd.

## Omkörning inför användarens begärda push
Alla tester kördes igen. Enhets-/integrationstester: 276 godkända. TypeScript och produktionsbygge godkända. De 85 unika webbläsarscenarierna gav åter 63 godkända och 22 misslyckade; alla tre riktade vädertesterna passerade. Första testprocessen och den isolerade simulatorbackenden avslutades under detaljtexturtestet utan slutrapport. Simulatorn startades om och återstående scenarier kördes separat. Detaljtexturtestet kördes därefter enskilt och passerade på 28,8 sekunder. Ingen underliggande orsak till processavbrottet fastställdes. Senaste loggar: .build-tools/push-unit.log, push-type.log, push-build.log, push-e2e.log, push-e2e-rest.log och push-e2e-detail.log. Inga produktkodändringar gjordes under omkörningen. Användaren har nu uttryckligen tillåtit commit/push trots att hela sviten inte är grön; resultaten redovisas öppet.
