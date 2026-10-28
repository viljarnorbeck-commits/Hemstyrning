import { describe, expect, it, vi } from "vitest";
import { HomeAssistantClient } from "./ha-client.js";

describe("HomeAssistantClient", () => {
  it("sends the opposite service but waits for confirmed state", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const client = new HomeAssistantClient({ fetchImpl });
    await client.toggle("light.altan", "off");
    expect(fetchImpl).toHaveBeenCalledWith("/ha-api/services/light/turn_on", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ entity_id: "light.altan" }),
    }));
  });

  it.each(["unknown", "unavailable"])("blocks commands while state is %s", async (state) => {
    const fetchImpl = vi.fn();
    const client = new HomeAssistantClient({ fetchImpl });
    await expect(client.toggle("light.altan", state)).rejects.toThrow("kan inte styras");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces backend service failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: "light.altan is unavailable" }),
    });
    const client = new HomeAssistantClient({ fetchImpl });
    await expect(client.toggle("light.altan", "off")).rejects.toThrow("unavailable");
  });
});
