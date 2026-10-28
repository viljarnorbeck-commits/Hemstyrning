# Codex-arbetsinstruktioner för Hemkontroll

Läs `PLAN_HOME_ASSISTANT_3D.md` före alla större beslut. Projektet använder Home Assistant som sanningskälla för verkliga enheter.

## Grundregler

- Börja med en fungerande enkel MVP för **en lampas tvåvägssynkronisering** innan andra integrationer.
- TypeScript strict, React/Vite och React Three Fiber. Separera adapter för demodata respektive Home Assistant.
- Identifiera enheter via konfigurerade `entityId` – anta aldrig att ett entity-id finns.
- Visa **bekräftat state**, inte enbart beställda actions. Hantera unknown/unavailable, timeout och reconnect.
- Lägg aldrig lösenord, API-nycklar eller långlivade access tokens i HTML, JavaScript-bundle, konfigfiler som committas, loggar eller felmeddelanden.
- Inga direkta kommandon från godtyckligt internet till HA. Använd autentiserad lokal access/proxy med tydlig behörighet.
- Använd WebSocket för status, inte aggressiv polling. Respektera API-rate limits, särskilt för bilar.
- Dela scene rendering, entity mapping och business logic i olika moduler.
- Utveckla med demo utan att kräva verkliga enheter. Alla simuleringar märks tydligt.
- Håll automatiseringar i Home Assistant, inte i klienten.
- Testa enhetstoggle åt båda håll, externa statusändringar och avbrott före godkännande.

## Första prioritet

1. Skapa struktur från planfilen.
2. Vite/React/TypeScript/R3F med navigerbar testgård och 6 lampor.
3. DemoAdapter med realistisk eventström.
4. Säker HA-adapter (skiss/prototyp med testmiljö; inga hemligheter i klient).
5. E2E-/enhetstester för UI, lampstyrning och statusåterkoppling.
6. Därefter utbyte mot GLB från DJI/WebODM, sedan bilar/robotar/energi.


## Beslut v0.2 – 3D som primärt användargränssnitt

- Alltid helskärms-3D först. **Lista** öppnar samma enhetslista som tidigare i utfällbar sidopanel; ingen fast sidokolumn. Vid val öppnas inspektör ovanpå 3D, inte en ny dashboard-sida.
- Objekt som ska gå att klicka på både i 3D och i listan: 6 lampor, 24 solpaneler (som takgrupp med separat modullista när data finns), två parkerade bilar, Mammotion LUBA 3 AWD. Dammsugaren nås tills vidare från listan.
- Skilj på renderad status, verklig mätning, ålder, uppskattning, okänd status, och simulerad data. Ljusförändring ska utgå från bekräftad Home Assistant-state och få visuella ljuseffekter.
- Bygg en `MowerTrackingService`: positionshistorik med tidsstämplar (högst 3 min), coordinate transform till scenen, filtrering, mätuppdateringar, hastighets-/riktningsestimat, extrapolering med hårda tids- och längdgränser och interpolering för mjuk rendering. Den ska sluta extrapolera vid stale/offline/paused/docked och visa mätålder. Separata enhetstester med telemetrijitter, tappade sampel, orimliga hopp och riktningsbyten.
- Verifiera att Mammotion-HA faktiskt levererar rätt `device_tracker`-position för **LUBA 3 och aktuellt firmware**; anta inte att det offentliga Mammotion Open API innehåller livekoordinater. Implementera avgränsad telemetriadapter.
- Lägg drönarfotogrammetrin som statisk texturerad mesh med LOD, men håll lampor, solpaneler, bilar och klippare separata och klickbara, inte fast inbakade i mesh.
- Använd utomhus-luxgivare + solhöjd + väder + årstid för automatisk bildljusnivå. AI-väder-/säsongsbilder får inte ersätta bekräftade statusvärden.
- Bevara det fristående HTML-exemplet som **prototyp**, inte som produktionsimplementering eller som bevis på anslutna enheter.
