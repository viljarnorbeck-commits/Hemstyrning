# Hemstyrning

Hemstyrning är en interaktiv 3D-klient som drivs av en lokal [Home Assistant-simulator](services/ha-simulator/README.md). Dashboarden och simulatorn utvecklas och testas tillsammans utan riktiga enheter.

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
npm run prepare:model  # återskapa mobil- och detaljnivå från bevarat original
npm run build --workspace @hemkontroll/dashboard
npm run test:e2e       # kräver npm run dev och installerad Playwright Chromium
```

Originalmodellen finns i `In/Daniels.glb`. Vertexfärger och UV bevaras; extern textur
och tre separata årstidsskanningar saknas fortfarande. Inga detaljer fabriceras för
att dölja brister i fotogrammetrin.

Ny administration för oförenklad modelljämförelse, geografisk kalibrering, egna enhetsmodeller, markytor och himmelspanoraman: [handhavande och begränsningar](docs/REALITYSCAN_GEO_AND_ASSETS.md).
