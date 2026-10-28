export type HassStateValue = string;

export interface HassState {
  entity_id: string;
  state: HassStateValue;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_reported: string;
  last_updated: string;
  context: HassContext;
}

export interface HassContext {
  id: string;
  parent_id: string | null;
  user_id: string | null;
}

export interface StateChangedEvent {
  event_type: "state_changed";
  data: {
    entity_id: string;
    old_state: HassState | null;
    new_state: HassState | null;
  };
  origin: "LOCAL";
  time_fired: string;
  context: HassContext;
}

export interface ServiceCall {
  domain: string;
  service: string;
  serviceData: Record<string, unknown>;
  target?: { entity_id?: string | string[] };
}
