# Home Assistant-simulator

En lokal backend som efterliknar de delar av Home Assistants REST- och WebSocket-API som Hemkontroll behöver. All data är uttryckligen simulerad och inga verkliga enheter ansluts.

## Starta

Från repots rot:

```bash
npm install
npm run dev:simulator
```

Standardadress är `http://127.0.0.1:8123` och lokal utvecklingstoken är `hemkontroll-local-dev`. Ändra värden med variablerna i `.env.example`. Simulatorn lyssnar endast på loopback som standard.

## API

- `GET /health` – publik hälsokontroll.
- `GET /api/config` – simulerad HA-konfiguration.
- `GET /api/states` och `GET /api/states/:entity_id` – aktuella tillstånd.
- `POST /api/services/light/turn_on|turn_off|toggle` – tjänsteanrop med fördröjd, bekräftad stateändring.
- `WS /api/websocket` – HA-lik autentisering, `get_states`, `subscribe_events`, `unsubscribe_events`, `call_service` och `ping`.
- `POST /simulator/entities/:entity_id` – simulera extern/fysisk stateändring.
- `POST /simulator/disconnect-clients` – testa klientens reconnect-flöde.

Alla `/api`- och `/simulator`-anrop kräver `Authorization: Bearer <token>`.

Exempel på en fysisk knapp som tänder altanlampan:

```bash
curl -X POST http://127.0.0.1:8123/simulator/entities/light.altan \
  -H 'Authorization: Bearer hemkontroll-local-dev' \
  -H 'Content-Type: application/json' \
  -d '{"state":"on","attributes":{"brightness":180}}'
```

Simulatorn innehåller sex lampor samt representativa energi-, väder-, bil- och robotentiteter. Endast lampornas styrtjänster implementeras nu, i linje med projektets MVP-avgränsning.
