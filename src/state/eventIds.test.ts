import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./store";

const room = { ...initialState, layer: "main" as const, entered: true };

describe("event ids (D-24)", () => {
  it("every event the reducer appends gets '<clientId>:<n>', counting on from this device's highest", () => {
    let s = reducer({ ...room, clientId: "c1" }, { type: "SET_MISSION", text: "Read" });
    s = reducer(s, { type: "DEV_GRANT", knowledge: 5 });
    s = reducer(s, { type: "DEV_GRANT", knowledge: 5 });
    expect(s.events.map((e) => e.id)).toEqual(["c1:1", "c1:2", "c1:3"]);
  });

  it("never renumbers an event that has an id, including another device's", () => {
    const s0 = { ...room, clientId: "c1", events: [{ kind: "dev_grant" as const, knowledge: 1, id: "other:9" }] };
    const s = reducer(s0, { type: "DEV_GRANT", knowledge: 1 });
    expect(s.events.map((e) => e.id)).toEqual(["other:9", "c1:1"]);
  });

  it("stamps nothing without a client id (the demo and dev mode never sync)", () => {
    const s = reducer(room, { type: "DEV_GRANT", knowledge: 5 });
    expect(s.events[0]).toEqual({ kind: "dev_grant", knowledge: 5 });
  });

  it("keeps the client id through a reset, so a later sync still knows this device", () => {
    expect(reducer({ ...room, clientId: "c1" }, { type: "RESET" }).clientId).toBe("c1");
  });
});
