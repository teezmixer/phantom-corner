import { describe, expect, it } from "vitest";
import { morgana, ui } from "@/content/copy";
import { initialState, reducer, settle, type AppState } from "./store";

const base: AppState = { ...initialState, layer: "main", entered: true, firstVisit: false, accountsEnabled: true };
const atRyuji = (patch: Partial<AppState> = {}): AppState => settle({ ...base, visited: ["leblanc", "ryuji"], events: [{ kind: "dev_grant", knowledge: 500 }], ...patch });
const save = (s: AppState) => s.story["save"];

describe("Morgana's save prompt (spec §3.1)", () => {
  it("appears on arrival at Ryuji's place, in her words, and waits for an answer", () => {
    const s = atRyuji();
    expect(save(s)?.messages.map((m) => m.text)).toEqual([morgana.savePrompt]);
    expect(save(s)?.done).toBe(false);
  });

  it("does not appear before arriving, when accounts are off, or to someone already signed in", () => {
    expect(save(settle({ ...base, visited: ["leblanc"], events: [{ kind: "dev_grant", knowledge: 500 }] }))).toBeUndefined();
    expect(save(atRyuji({ accountsEnabled: false }))).toBeUndefined();
    expect(save(atRyuji({ signedIn: true }))).toBeUndefined();
  });

  it("'Yes' opens Settings and closes the phone; Morgana's last line follows", () => {
    const s = reducer(atRyuji({ phoneOpen: true }), { type: "ANSWER_THREAD", id: "save", text: ui.thread.saveYes });
    expect(s.layer).toBe("settings");
    expect(s.phoneOpen).toBe(false);
    expect(save(s)?.messages.map((m) => m.text)).toEqual([morgana.savePrompt, ui.thread.saveYes, morgana.saveAfter]);
    expect(save(s)?.done).toBe(true);
  });

  it("'Not now' keeps the player in the room and does not ask again", () => {
    const s = reducer(atRyuji(), { type: "ANSWER_THREAD", id: "save", text: ui.thread.saveNo });
    expect(s.layer).toBe("main");
    expect(save(s)?.done).toBe(true);
    expect(settle(s).story["save"]).toEqual(s.story["save"]);
  });

  it("never asks in the demo or dev mode (accounts are off there)", () => {
    expect(save(atRyuji({ accountsEnabled: false, demo: true }))).toBeUndefined();
  });
});
