import { describe, expect, it } from "vitest";
import { callService } from "./services.js";
import { StateStore } from "./store.js";
import type { HassState } from "./types.js";

function storeWith(state: string): StateStore {
  const timestamp = new Date(0).toISOString();
  const item: HassState = {
    entity_id: "light.test",
    state,
    attributes: { brightness: state === "on" ? 200 : 0 },
    last_changed: timestamp,
    last_reported: timestamp,
    last_updated: timestamp,
    context: { id: "initial", parent_id: null, user_id: null },
  };
  return new StateStore([item]);
}

describe("light services", () => {
  it.each([
    ["off", "turn_on", "on"],
    ["on", "turn_off", "off"],
    ["off", "toggle", "on"],
    ["on", "toggle", "off"],
  ])("changes %s with %s to %s", async (initial, service, expected) => {
    const store = storeWith(initial);
    await callService(store, {
      domain: "light",
      service,
      serviceData: {},
      target: { entity_id: "light.test" },
    }, 0);
    expect(store.get("light.test")?.state).toBe(expected);
  });

  it("rejects commands for unavailable entities without changing state", async () => {
    const store = storeWith("unavailable");
    await expect(callService(store, {
      domain: "light",
      service: "turn_on",
      serviceData: {},
      target: { entity_id: "light.test" },
    }, 0)).rejects.toMatchObject({ status: 503 });
    expect(store.get("light.test")?.state).toBe("unavailable");
  });

  it("rejects unsupported services", async () => {
    await expect(callService(storeWith("off"), {
      domain: "light",
      service: "delete_everything",
      serviceData: {},
      target: { entity_id: "light.test" },
    }, 0)).rejects.toThrow("Unsupported service");
  });
});
