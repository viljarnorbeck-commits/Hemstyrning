import { EventEmitter } from "node:events";
import type { HassContext, HassState, StateChangedEvent } from "./types.js";

export class StateStore extends EventEmitter {
  readonly #states = new Map<string, HassState>();
  readonly #history = new Map<string, HassState[]>();

  constructor(initialStates: HassState[]) {
    super();
    for (const item of initialStates) this.#states.set(item.entity_id, structuredClone(item));
  }

  all(): HassState[] {
    return [...this.#states.values()].map((item) => structuredClone(item));
  }

  get(entityId: string): HassState | undefined {
    const item = this.#states.get(entityId);
    return item ? structuredClone(item) : undefined;
  }

  history(ids: string[], since = 0) { return ids.map(id => (this.#history.get(id) ?? []).filter(s => Date.parse(s.last_updated) >= since).map(s => structuredClone(s))); }

  set(
    entityId: string,
    value: string,
    attributes: Record<string, unknown> = {},
    userId: string | null = null,
  ): HassState {
    const oldState = this.#states.get(entityId) ?? null;
    const timestamp = new Date().toISOString();
    const context: HassContext = {
      id: crypto.randomUUID().replaceAll("-", ""),
      parent_id: null,
      user_id: userId,
    };
    const next: HassState = {
      entity_id: entityId,
      state: value,
      attributes: { ...(oldState?.attributes ?? {}), ...attributes },
      last_changed: oldState?.state === value ? (oldState?.last_changed ?? timestamp) : timestamp,
      last_reported: timestamp,
      last_updated: timestamp,
      context,
    };
    this.#states.set(entityId, next);
    const history = this.#history.get(entityId) ?? [];
    // Bound memory and sample history rather than retaining large forecast/panel attribute arrays.
    if (!history.length || timestamp > new Date(Date.parse(history.at(-1)!.last_updated) + 5000).toISOString() || oldState?.state !== value) {
      history.push({ ...next, attributes: { unit_of_measurement: next.attributes.unit_of_measurement } });
      if (history.length > 720) history.shift();
      this.#history.set(entityId, history);
    }
    const event: StateChangedEvent = {
      event_type: "state_changed",
      data: {
        entity_id: entityId,
        old_state: oldState ? structuredClone(oldState) : null,
        new_state: structuredClone(next),
      },
      origin: "LOCAL",
      time_fired: timestamp,
      context,
    };
    this.emit("state_changed", event);
    return structuredClone(next);
  }
}
