# Hemstyrning

Hemstyrning är en interaktiv 3D-klient som drivs av en lokal [Home Assistant-simulator](services/ha-simulator/README.md). Dashboarden och simulatorn utvecklas och testas tillsammans utan riktiga enheter.

## Hemstyrning 2.0 och installerbara appar

Hem är nu en levande 3D-startvy med energikort och sparad kamera. **Öppna 3D**
ger fri navigering. **Lista** behåller hela hemöversikten och pausar GPU-rendering.
`/control` är en separat modellfri kontrollpanel med parkoppling till en vald skärm.
`/settings` kopplar energimätare och färgkodade HA-scener/skript. `/install` visar
PWA-installation och bara verkligt byggda paket.

- [2.0: Hem, kontrollpanel, förinställningar och simulator](docs/HEMSTYRNING_2.md)
- [Appar: faktiska APK-filer, Windows/iOS-projekt, HTTPS och byggning](docs/INSTALLABLE_APPS.md)
- Android/Google TV: byggda debug-APK:er finns lokalt under `artifacts/` och via `/install`.
- Windows Tauri och iOS Xcode-projekt finns; inga EXE/MSI/IPA har byggts här.
- Nativeappar använder en central **betrodd HTTPS-server**, inte utvecklingsservern
  öppet på LAN. Se guiden för viewer/controller/admin och privat CA.

## Gränssnitt och musik

3D-vyn har direkta kontroller och Spotify. **Lista** öppnar en komplett dashboard
och stoppar 3D-renderingen; fullskärmsknappen ger ren 3D. Mobilen har egen nedre
navigering. Välj Spotify-entitet och Jam-inbjudan visuellt i musikinställningarna.
Se [gränssnitt, Spotify och Jam](docs/HOME_INTERFACE_AND_SPOTIFY.md).

## Kom igång

```bash
npm install
npm run dev
```

Det startar:

- 3D-dashboard: `http://localhost:5173`
- Home Assistant-simulator: `http://localhost:8123`

Båda kör watch-läge. Frontend laddas om när appen ändras och simulatorn startas om när dess källkod ändras.

Verifiera med:

```bash
npm test
npm run typecheck
```

Huvudvyn är återställd som en helskärmsvärld med klickbara lampor, bilar, solpaneler,
energi och robotar. Vanliga användare behöver inte välja datakälla.

- [Hemkontroll](http://localhost:5173/)
- [Separat simulator](http://localhost:5173/dev/simulator)
- [Separat 3D-redigerare](http://localhost:5173/editor)

Anslutningen till simulator/riktig HA konfigureras centralt på servern. Utvecklings-
simulatorns ändringar stannar alltid lokalt, även med en riktig HA-brygga konfigurerad.
Scen och modellimporter sparas i `data/` (gitignorerat).

Den tydliga knappen **Redigera gård** öppnar redigeraren. Snabbåtkomst ger belysning,
bilar, robotar, energi och kalender; översikten visar datum/tid, väder och energi.
Månljus, stjärnhimmel, terrängkrage och skymning av markörer kompletterar 3D-vyn.

Se [nytt användarläge, himmel och kalender](docs/UI_SKY_AND_CALENDAR.md),
[funktioner, modellanalys och kvarstående begränsningar](docs/FEATURE_STATUS.md)
och [användning/arkitektur](docs/ENVIRONMENT_AND_EDITOR.md).

```bash
node scripts/audit-model.mjs
npm run prepare:model  # återskapa referens-, detalj- och mobilnivå med original-PNG
npm run build --workspace @hemkontroll/dashboard
npm run test:e2e       # kräver npm run dev och installerad Playwright Chromium
```

Originalfilerna finns i `In/Daniels.glb` och `In/Daniels_u0_v0_diffuse.png` och ändras inte.
Originaltexturen (8192 × 8192 PNG) bäddas in förlustfritt i alla tre GLB-nivåer.
Fotografiska vertexfärger multipliceras inte med texturen. `npm run verify:model`
kontrollerar bildbytes och referensens geometri/UV. Tre årstidsskanningar återstår.
Se [texturåterställningen](docs/TEXTURE_RESTORATION.md) för resultat och minneskrav.

Ny administration för oförenklad modelljämförelse, geografisk kalibrering, egna enhetsmodeller, markytor och himmelspanoraman: [handhavande och begränsningar](docs/REALITYSCAN_GEO_AND_ASSETS.md).
