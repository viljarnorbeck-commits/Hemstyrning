# Full testkörning – 2026-10-31

Testad kod: 138b50f. Windows, PowerShell, Node.js och projektets ordinarie npm-skript. Start: 2026-10-31 14:05:52, svensk tid.

| Kontroll | Resultat |
|---|---|
| npm run typecheck | Godkänd |
| npm test | 142 godkända: 58 backend + 84 frontend |
| npm run build:web | Godkänd; befintlig varning om stora grafikbundles |
| npm run test:e2e | 38 godkända, 11 misslyckade, 0 överhoppade; cirka 9 min 50 s |

## Misslyckade webbläsartester

| Fil | Test | Första felmeddelande |
|---|---|
| atmosphere.spec.ts | local photographic skies, moon map and weather shaders work through day, night and storm | Test timeout of 120000ms exceeded. |
| hero.spec.ts | hero keeps a live stage, honest telemetry and camera-only object selection | Error: expect(locator).toBeVisible() failed · Locator: locator('.hero-experience') · Expected: visible |
| home-music.spec.ts | mobile portrait and landscape provide bottom navigation and scrollable dashboard without overflow | Test timeout of 120000ms exceeded. |
| mobile-navigation.spec.ts | iPhone compact music, status, camera tools and direct calendar stay within the viewport | Error: .mobile-home-nav · expect(received).not.toBeNull() · Received: null |
| mobile-navigation.spec.ts | Android compact music, status, camera tools and direct calendar stay within the viewport | Error: .mobile-home-nav · expect(received).not.toBeNull() · Received: null |
| mobile-navigation.spec.ts | Tablet compact music, status, camera tools and direct calendar stay within the viewport | Error: .mobile-home-nav · expect(received).not.toBeNull() · Received: null |
| mobile-navigation.spec.ts | Landscape compact music, status, camera tools and direct calendar stay within the viewport | Error: .mobile-home-nav · expect(received).not.toBeNull() · Received: null |
| mobile-navigation.spec.ts | manual touch navigation exits LUBA follow mode and camera clearance survives close zoom | Error: expect(received).toBeLessThan(expected) · Expected: < 33.49268576868686 · Received:   83.73171442171832 |
| model-texture.spec.ts | original UV/PNG samples render identically to the unsimplified reference without color multiplication | Error: page.evaluate: TypeError: Failed to fetch dynamically imported module: http://localhost:5173/@fsC:/Users/vilja/OneDrive/Dokument/ChatGPT/Home%20assistant/Hemstyrning/node_modules/three/build/three.module.js ·   26 /  await page.route('**/models/daniels-reference. |
| premium.spec.ts | editor generates a real high-resolution photo, saves routes, supports undo and enters live energy view | Error: expect(locator).toHaveClass(expected) failed · Locator: locator('body') · Expected pattern: /photo-start/ |
| premium.spec.ts | configured building and car volumes project keyboard-accessible frames without device commands | Error: expect(locator).toContainText(expected) failed · Locator: locator('[data-hero-status]') · Expected substring: "SIMULERAD" |

## Bedömning

Flera tester förväntar sig uttryckligen borttagna hero-element eller den tidigare mobila bottennavigationen. Premium-startbildstestet förväntar sig foto-start trots etapp 2:s krav på levande 3D. Texturjämförelsen har en Windows/Vite-sökväg med /@fsC:/... som inte kan laddas. LUBA-zoomtestet missar sitt avståndsvillkor och atmosfärtestet får timeout; de orsakerna är inte fastställda. Detta är en fullständig inventering av körningens resultat, inte ett påstående att alla fel är produktbuggar eller att sviten är grön. Inga tester togs bort, hoppades över eller ändrades för att dölja felen.

Webbläsarnas globala startkontroll bekräftade simulatorläge. Inga verkliga Home Assistant-kommandon skickades. Scenkonfigurationen återställdes från säkerhetskopian efter körningen.

Fullständiga lokala råloggar: .build-tools/full-typecheck.log, full-unit.log, full-build.log, full-playwright.log och full-playwright.json. Råloggar och skärmbilder är inte committade.
