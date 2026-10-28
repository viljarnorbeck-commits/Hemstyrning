import { describe, expect, it, vi } from "vitest";
import { StateStore } from "./store.js";
import type { HassState, StateChangedEvent } from "./types.js";

function fixture(value = "off"): HassState {
  return {
    entity_id: "light.test",
    state: value,
    attributes: { friendly_name: "Testlampa", brightness: 0 },
    last_changed: "2026-01-01T00:00:00.000Z",
    last_reported: "2026-01-01T00:00:00.000Z",
    last_updated: "2026-01-01T00:00:00.000Z",
    context: { id: "initial", parent_id: null, user_id: null },
  };
}

describe("StateStore", () => {
  it("returns defensive copies", () => {
    const store = new StateStore([fixture()]);
    const state = store.get("light.test")!;
    state.state = "on";
    expect(store.get("light.test")?.state).toBe("off");
  });

  it("preserves last_changed when only attributes change", () => {
    const store = new StateStore([fixture("on")]);
    const next = store.set("light.test", "on", { brightness: 100 });
    expect(next.last_changed).toBe("2026-01-01T00:00:00.000Z");
    expect(next.attributes).toMatchObject({ friendly_name: "Testlampa", brightness: 100 });
  });

  it("emits old and new states for an external update", () => {
    const store = new StateStore([fixture()]);
    const listener = vi.fn<(event: StateChangedEvent) => void>();
    store.on("state_changed", listener);
    store.set("light.test", "unavailable");
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0].data).toMatchObject({
      entity_id: "light.test",
      old_state: { state: "off" },
      new_state: { state: "unavailable" },
    });
  });
});
