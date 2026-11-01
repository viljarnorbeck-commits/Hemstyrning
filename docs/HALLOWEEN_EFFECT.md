# Halloween-effekt

Den gamla lokala knappen pekade på script.halloween, som bara fanns i simulatorn. Förinställningar kan nu uttryckligen välja effect=halloween i samma befintliga scenkonfiguration. Ingen HA-entitet eller HA-automation skapas.

## Beteende

- Kör i cirka 60 sekunder på servern och fortsätter vid flikbyte/omladdning.
- Växlar mellan gemensamma och blandade blinkmönster, med varierade intervall på 0,9–2 sekunder. Inga färgändringar eller snabb strobning.
- Explicit lista av light-/switch-entiteter. Bara lampor och identifierade belysningsaktorer accepteras. Motorvärmare, laddning, köksuttag, matningar, lås, klimat och robotdrift ingår inte. Dolda eller uttryckligen spärrade poster utesluts.
- Endast tillgängliga on/off-tillstånd används. Lampgrupper utesluts från blinkkommandona för att undvika konflikter med deras individuella medlemmar.
- En uttryckligen vald dammsugare kan få vacuum.locate en gång, om den rapporterar stöd. Inga andra dammsugarkommandon skickas.
- Samma brytare stoppar effekten i förtid. Pågående kommandon avslutas före återställningen, så att ett sent blinkkommando inte skriver över den. På/av återställs och ursprunglig ljusstyrka återställs för tända lampor. Färger ändras inte.
- En effekt åt gången. Styrfel avbryter blinkningen och utlöser återställning. Misslyckad återställning visas uttryckligen. Normalt serverstopp begär återställning; ett abrupt process-/strömavbrott kan inte garantera att fysiska lampor återställs.

## Konfiguration och behörighet

Preset-fälten effect, effectTargets och effectVacuum sparas i befintlig SceneConfig. Inställningar har ett val för den inbyggda effekten, en lista med belysnings-ID:n samt val av dammsugare. Ingen ny parallell konfigurationsfil. script.halloween i det äldre entityId-fältet används inte för inbyggda effekter och låtsas inte finnas i Home Assistant.

POST /connection-api/presets/:id använder samma roll-, origin- och HA_ALLOW_CONTROL-skydd som annan styrning. GET /connection-api/presets/:id/status visar lokal effektstatus; detta är inte en bekräftelse på att varje fysisk lampa faktiskt lyser. Lampornas verkliga tillstånd hämtas fortsatt från HA.

## Verifiering

Nya enhetstester omfattar tidsgräns, synk/blandning, lokalisering, återställning, samtidighet, fel och filtrering. API-proven omfattar simulator, tittarroll och skrivskydd. Webbläsarprovet kör start/stopp, flikbyte och kontroll av återställda tillstånd utan någon HA-script-entitet.

Resultat: npm test 184/184 (80 backend + 104 frontend), hela Playwright 68/68, 0 misslyckade/överhoppade/flaky. TypeScript, frontend- och backendbyggen godkända. Fullsviten tog 11,1 minuter. En efterföljande UI-kontroll hittade tre pixlars klippning vid 844 × 390; padding rättades. Den slutliga riktade omkörningen gav 2/2 godkända: Halloween vid 1440 × 960, 1024 × 768 och 844 × 390 samt kontrollpanelens sex befintliga storlekar. Frontendbygget kördes också om efter den sista CSS-rättningen. Inga testfall har tagits bort eller hoppats över. Testservrar använder localhost:15173 och localhost:18123 med separata simulatorfiler. Ordinarie localhost:5173 och localhost:8123 fortsätter vara igång. Testernas hårdkodade adresser ersätts med HEM_E2E_BASE_URL/HEM_E2E_BACKEND_URL, med samma standardadresser som tidigare. Inga verkliga enhetskommandon utförs automatiskt.

Ordinarie och separata testservrar lämnas igång med Halloween förberett men avstängt. Båda kontrollpanelerna och båda health-endpointsen svarar HTTP 200/ok. Riktig HA är autentiserad med 752 entiteter. .env är oförändrad. Endast den befintliga lokala Halloween-förinställningen ändrades, med 40 valda belysningsposter och registrerad dammsugare; övriga lokala inställningar bevarades. Inga verkliga effekter eller andra fysiska kommandon aktiverades av testerna.
