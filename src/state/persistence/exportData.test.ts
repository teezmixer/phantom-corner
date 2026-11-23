import { describe, expect, it, vi } from "vitest";
import { initialState } from "../store";
import { buildExport, eraseStoredData } from "./exportData";
import { isPersisted } from "./guard";
import { freshPersisted } from "./schema";
import { MINUTE, initialTimer } from "@/domain/timer";

const NOW = "2026-11-22T12:00:00.000Z";

describe("buildExport", () => {
  const state = { ...initialState, name: "Ren", mission: "Finish chapter 3", todos: [{ id: 1, text: "read", done: false }], nextTodoId: 2, events: [{ kind: "mission_first_set" }, { kind: "session", plannedMs: 25 * MINUTE, focusedMs: 25 * MINUTE, outcome: "completed" }] } as typeof initialState;

  it("is valid JSON in the current schema, built from the live state, and passes the same guard as a save", () => {
    const { json, filename } = buildExport(state, null, NOW);
    const data: unknown = JSON.parse(json);
    expect(isPersisted(data)).toBe(true);
    expect(data).toMatchObject({ schema: 5, name: "Ren", mission: { text: "Finish chapter 3" } });
    expect(filename).toBe("phantom-corner-2026-11-22.json");
  });

  it("keeps the stored identity when there is a stored save, and falls back safely when it is unreadable", () => {
    const stored = JSON.stringify({ ...freshPersisted("my-client", NOW, { timer: initialTimer, locationId: "leblanc", visited: ["leblanc"] }) });
    expect(JSON.parse(buildExport(state, stored, NOW).json).clientId).toBe("my-client");
    expect(() => buildExport(state, "{broken", NOW)).not.toThrow();
    expect(JSON.parse(buildExport(state, "{broken", NOW).json).clientId).toBe("export");
  });

  it("never includes UI-only state", () => {
    const text = buildExport({ ...state, banners: [{ id: "x", text: "Level 2" }], phoneOpen: true }, null, NOW).json;
    expect(text).not.toMatch(/banners|phoneOpen|layer/);
  });
});

describe("eraseStoredData", () => {
  it("removes every pc: key, backups included, and nothing else", () => {
    const store = new Map<string, string>([["pc:v1", "a"], ["pc:v1:backup:2026", "b"], ["pc:other", "c"], ["unrelated", "d"]]);
    const storage = { get length() { return store.size; }, key: (i: number) => [...store.keys()][i] ?? null, removeItem: vi.fn((k: string) => { store.delete(k); }) };
    expect(eraseStoredData(storage)).toBe(3);
    expect([...store.keys()]).toEqual(["unrelated"]);
  });
});
