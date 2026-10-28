# Riktig Home Assistant

Ubuntu når `http://192.168.0.130:8123/api/` (401 utan token, verifierat 2026-10-28).
Inga riktiga entiteter har ännu hämtats och inga verkliga kommandon har skickats.

## Lokal konfiguration

Kör från projektroten:

```bash
python3 scripts/configure-ha.py
```

Ange värdet för token **Hemstyrning 3d** vid dold terminalinmatning. Skriptet
sparar `.env` med rättighet 600. Filen ignoreras av Git. Token får aldrig skickas
i chatten, anges som kommandoradsargument eller visas i loggar.
Skriptet väljer `HA_MODE=real`, `HA_URL`, `HA_TOKEN` och
`HA_ALLOW_CONTROL=false`. Starta om den gemensamma `npm run dev` efter ändringen.
`HA_MODE=simulator` återställer simulatorn. Äldre HA_REAL-variabler stöds för migration.

## Verifiering och kopplingar

- `/connection-api/status` via localhost:5173 verifierar REST-autentisering och
  antal entiteter utan att lämna ut token.
- Redigeraren: välj objekt → **Koppla Home Assistant**. Sök bland anslutningens
  befintliga entiteter och visa namn, domän, state och attribut. `unknown` och
  `unavailable` markeras. Lämna kopplingsfältet tomt för huvud-entiteten.
- Separata bilvärden använder befintliga fältnamn, exempelvis `battery_level`,
  `charging_power_kw`, `climate` och `charging`. Kontrollera respektive UI-fälts
  bindningsnamn och integrationens faktiska attribut; inga funktioner antas.
- Status kommer från befintlig WebSocket-prenumeration med återanslutning.
  Ingen ny pollingloop används.
- Kopplingarna sparas med befintlig scenlagring. Direktklick på lampor är kvar.

## Styrning och behörighet

Verkliga POST-kommandon blockeras som standard. Efter verifierad läsanslutning,
WebSocket och val av en specifik lampa kan lokal operatör aktivera
`HA_ALLOW_CONTROL=true` och starta om. Endast konfigurerade objekt/tjänster tillåts.
Real-läge kräver backend bunden till 127.0.0.1. Lokal OS-åtkomst är tills vidare
behörighetsgränsen; fleranvändarinloggning och nätverksexponering är inte implementerade.
Exponera därför inte denna utvecklingsserver genom tunnel eller publik proxy.

Simulatorns `/dev-api`, scenarier och `/simulator/ws` använder alltid lokal store,
även när dashboardens brygga använder riktig HA. WebSocket-bryggan till riktig HA
är läsande; tjänsteanrop går via serverns begränsade REST-rutter.

API-kontrakt: [REST](https://developers.home-assistant.io/docs/api/rest/),
[WebSocket](https://developers.home-assistant.io/docs/api/websocket/).
