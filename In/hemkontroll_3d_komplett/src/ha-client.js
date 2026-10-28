const SIMULATOR_TOKEN = "hemkontroll-local-dev";

export class HomeAssistantClient extends EventTarget {
  constructor({ fetchImpl = fetch, socketFactory = (url) => new WebSocket(url) } = {}) {
    super();
    this.fetchImpl = fetchImpl;
    this.socketFactory = socketFactory;
    this.entities = new Map();
    this.socket = null;
    this.commandId = 10;
    this.reconnectTimer = null;
    this.stopped = false;
  }

  async connect() {
    this.stopped = false;
    this.#setConnection("connecting");
    try {
      const [mappingResponse, statesResponse] = await Promise.all([
        this.fetchImpl("/config/entities.json"),
        this.fetchImpl("/ha-api/states"),
      ]);
      if (!mappingResponse.ok || !statesResponse.ok) throw new Error("Kunde inte läsa simulatorns states");
      const mapping = await mappingResponse.json();
      this.entities = new Map(mapping.lights.map((light) => [light.entityId, light.id]));
      const states = await statesResponse.json();
      for (const state of states) this.#emitState(state);
      this.#openSocket();
    } catch (error) {
      this.#setConnection("disconnected", error instanceof Error ? error.message : String(error));
      this.#scheduleReconnect();
    }
  }

  disconnect() {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }

  async toggle(entityId, currentState) {
    if (currentState === "unknown" || currentState === "unavailable") {
      throw new Error("Enheten kan inte styras i sitt nuvarande läge");
    }
    const service = currentState === "on" ? "turn_off" : "turn_on";
    const response = await this.fetchImpl(`/ha-api/services/light/${service}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_id: entityId }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? `Service call misslyckades (${response.status})`);
    }
  }

  #openSocket() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = this.socketFactory(`${protocol}//${location.host}/ha-ws`);
    this.socket = socket;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "auth_required") {
        socket.send(JSON.stringify({ type: "auth", access_token: SIMULATOR_TOKEN }));
      } else if (message.type === "auth_ok") {
        this.#setConnection("connected");
        socket.send(JSON.stringify({ id: 1, type: "subscribe_events", event_type: "state_changed" }));
      } else if (message.type === "auth_invalid") {
        this.#setConnection("disconnected", "Simulatorautentisering misslyckades");
      } else if (message.type === "event" && message.event?.event_type === "state_changed") {
        this.#emitState(message.event.data.new_state);
      }
    });
    socket.addEventListener("close", () => {
      if (this.socket !== socket || this.stopped) return;
      this.#setConnection("disconnected", "Anslutningen bröts – återansluter");
      this.#scheduleReconnect();
    });
    socket.addEventListener("error", () => socket.close());
  }

  #emitState(state) {
    if (!state || !this.entities.has(state.entity_id)) return;
    this.dispatchEvent(new CustomEvent("state", { detail: state }));
  }

  #setConnection(status, message = "") {
    this.dispatchEvent(new CustomEvent("connection", { detail: { status, message } }));
  }

  #scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 1500);
  }
}

export function connectDashboard(model, ui) {
  const client = new HomeAssistantClient();
  const byEntityId = new Map(model.lights.map((light) => [light.entityId, light]));

  client.addEventListener("state", (event) => {
    const { detail } = /** @type {CustomEvent} */ (event);
    const light = byEntityId.get(detail.entity_id);
    if (!light) return;
    light.haState = detail.state;
    light.on = detail.state === "on";
    light.attributes = detail.attributes;
    light.pending = false;
    light.error = null;
    ui.refresh();
  });
  client.addEventListener("connection", (event) => {
    const { detail } = /** @type {CustomEvent} */ (event);
    ui.connection(detail);
  });

  ui.toggle = async (light) => {
    light.pending = true;
    light.error = null;
    ui.refresh();
    try {
      await client.toggle(light.entityId, light.haState ?? (light.on ? "on" : "off"));
    } catch (error) {
      light.pending = false;
      light.error = error instanceof Error ? error.message : String(error);
      ui.refresh();
    }
  };
  client.connect();
  return client;
}
