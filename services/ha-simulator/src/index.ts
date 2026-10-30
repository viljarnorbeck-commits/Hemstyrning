import { createSimulator } from "./server.js";

const host = process.env.HA_SIM_HOST ?? "127.0.0.1";
const port = Number(process.env.HA_SIM_PORT ?? 8123);
const token = process.env.HA_SIM_TOKEN ?? "hemkontroll-local-dev";
const commandDelayMs = Number(process.env.HA_SIM_COMMAND_DELAY_MS ?? 250);

const mode = process.env.HA_MODE ?? (process.env.HA_REAL_URL ? 'real' : 'simulator');
if (!['real', 'simulator'].includes(mode)) throw new Error('HA_MODE måste vara real eller simulator');
const realUrl = process.env.HA_URL ?? process.env.HA_REAL_URL;
const realToken = process.env.HA_TOKEN ?? process.env.HA_REAL_TOKEN;
if (mode === 'real' && (!realUrl || !realToken)) throw new Error('Ange HA_URL och HA_TOKEN lokalt i .env för real-läge');
if (host !== '127.0.0.1') throw new Error('Backend kräver 127.0.0.1; använd autentiserad HTTPS-proxy för LAN');
const live = mode === 'real' ? {
  url: new URL(realUrl!).href.replace(/\/$/, ''), token: realToken!,
  commandsEnabled: process.env.HA_ALLOW_CONTROL === 'true',
} : undefined;
const { server, webSockets, simulation, stopScreens } = createSimulator({ token, commandDelayMs, ...(live ? { live } : {}) });
server.listen(port, host, () => {
  console.log(`Home Assistant simulator: http://${host}:${port}`);
  console.log(`WebSocket API: ws://${host}:${port}/api/websocket`);
  console.log(live ? 'Dashboard bridge configured for Home Assistant; simulator endpoints remain local.' : 'Simulation mode only — no real devices are connected.');
});

// tsx watch sends SIGTERM before restarting. Release WebSockets and the port first.
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  simulation.stop();stopScreens();
  for (const client of webSockets.clients) client.terminate();
  server.close(() => process.exit(0));
  server.closeAllConnections();
  setTimeout(() => process.exit(1), 3000).unref();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
