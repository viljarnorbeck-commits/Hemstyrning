import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createSimulator } from "./server.js";

const token = "test-token";
let baseUrl = "";
let wsUrl = "";
let closeServer: (() => Promise<void>) | undefined;

beforeEach(async () => {
  const simulator = createSimulator({ token, commandDelayMs: 1 });
  await new Promise<void>((resolve) => simulator.server.listen(0, "127.0.0.1", resolve));
  const address = simulator.server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  wsUrl = `ws://127.0.0.1:${address.port}/api/websocket`;
  closeServer = async () => {
    simulator.webSockets.close();
    await new Promise<void>((resolve, reject) => simulator.server.close((error) => error ? reject(error) : resolve()));
  };
});

afterEach(async () => closeServer?.());

const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };

describe("Home Assistant REST simulation", () => {
  it("rejects invalid tokens", async () => {
    const response = await fetch(`${baseUrl}/api/states`);
    expect(response.status).toBe(401);
  });

  it("toggles a light and returns confirmed state", async () => {
    const response = await fetch(`${baseUrl}/api/services/light/turn_on`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ entity_id: "light.garage", brightness: 120 }),
    });
    expect(response.status).toBe(200);
    const stateResponse = await fetch(`${baseUrl}/api/states/light.garage`, { headers: auth });
    const body = await stateResponse.json() as { state: string; attributes: { brightness: number } };
    expect(body).toMatchObject({ state: "on", attributes: { brightness: 120 } });
  });
});

describe("Home Assistant WebSocket simulation", () => {
  it("authenticates, subscribes and emits external state changes", async () => {
    const socket = new WebSocket(wsUrl);
    const messages: Array<Record<string, unknown>> = [];
    socket.on("message", (raw) => messages.push(JSON.parse(raw.toString()) as Record<string, unknown>));
    await new Promise<void>((resolve) => socket.once("open", resolve));
    await waitFor(() => messages.some((message) => message.type === "auth_required"));
    socket.send(JSON.stringify({ type: "auth", access_token: token }));
    await waitFor(() => messages.some((message) => message.type === "auth_ok"));
    socket.send(JSON.stringify({ id: 1, type: "subscribe_events", event_type: "state_changed" }));
    await waitFor(() => messages.some((message) => message.id === 1 && message.type === "result"));

    await fetch(`${baseUrl}/simulator/entities/light.altan`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ state: "on", attributes: { brightness: 200 } }),
    });
    await waitFor(() => messages.some((message) => message.id === 1 && message.type === "event"));
    const eventMessage = messages.find((message) => message.id === 1 && message.type === "event") as { event: { data: { entity_id: string; new_state: { state: string } } } };
    expect(eventMessage.event.data).toMatchObject({ entity_id: "light.altan", new_state: { state: "on" } });
    socket.close();
  });
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const timeoutAt = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() > timeoutAt) throw new Error("Timed out waiting for WebSocket message");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
