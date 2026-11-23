import { describe, expect, it } from "vitest";
import { MINUTE } from "@/domain/timer";
import { memoryAdapter } from "@/state/persistence/adapter";
import { bootstrap } from "./bootstrap";
import { parseMode } from "./initialState";

const NOW = Date.UTC(2026, 10, 22, 12);
const id = () => "client-test";

describe("bootstrap", () => {
  it("demo mode ignores storage completely and persists nothing", () => {
    const adapter = memoryAdapter(JSON.stringify({ schema: 1, garbage: true }));
    const b = bootstrap(parseMode("?demo=true"), NOW, adapter, id);
    expect(b.persistence).toBeNull();
    expect(b.initial.demo).toBe(true);
    expect(adapter.dump().backups).toEqual([]); // the unreadable data was not even looked at
  });

  it("dev mode reads saved progress but never writes it", () => {
    const first = bootstrap(parseMode(""), NOW, memoryAdapter(), id);
    const saved = { ...first.persistence!.base, name: "Ren" };
    const b = bootstrap(parseMode("?dev=true"), NOW, memoryAdapter(JSON.stringify(saved)), id);
    expect(b.initial.name).toBe("Ren");
    expect(b.persistence).toBeNull();
  });

  it("newer-build data is left alone: memory-only visit and a blocked-storage notice", () => {
    const first = bootstrap(parseMode(""), NOW, memoryAdapter(), id);
    const b = bootstrap(parseMode(""), NOW, memoryAdapter(JSON.stringify({ ...first.persistence!.base, schema: 7 })), id);
    expect(b.persistence).toBeNull();
    expect(b.initial).toMatchObject({ recovered: true, storageBlocked: true });
  });

  it("an analytics opt-out holds from the very first load, and in demo mode", () => {
    expect(bootstrap(parseMode(""), NOW, memoryAdapter(), id).initial.analytics).toBe(true); // provisional default (D-14)
    expect(bootstrap(parseMode(""), NOW, memoryAdapter(), id, true).initial.analytics).toBe(false);
    expect(bootstrap(parseMode("?demo=true"), NOW, memoryAdapter(), id, true).initial.analytics).toBe(false);
  });

  it("a genuine first visit rings the doorbell, but blocked storage does not make EVERY visit a first one", () => {
    expect(bootstrap(parseMode(""), NOW, memoryAdapter(), id).initial.firstVisit).toBe(true);
    const blocked = { ...memoryAdapter(), blocked: true } as ReturnType<typeof memoryAdapter>;
    expect(bootstrap(parseMode(""), NOW, blocked, id).initial.firstVisit).toBe(false);
  });

  it("a first visit starts at the splash with nothing marked recovered", () => {
    const b = bootstrap(parseMode(""), NOW, memoryAdapter(), id);
    expect(b.initial).toMatchObject({ layer: "splash", entered: false, recovered: false, storageBlocked: false });
    expect(b.persistence?.base.clientId).toBe("client-test");
  });

  it("unreadable data starts fresh, backs the old data up and says so", () => {
    const adapter = memoryAdapter("{nope");
    const b = bootstrap(parseMode(""), NOW, adapter, id);
    expect(b.initial.recovered).toBe(true);
    expect(adapter.dump().backups).toEqual(["{nope"]);
  });

  it("restores saved progress, including a timer that finished while the tab was closed", () => {
    const first = bootstrap(parseMode(""), NOW, memoryAdapter(), id);
    const saved = {
      ...first.persistence!.base,
      mission: { text: "Read", setAt: new Date(NOW).toISOString(), done: false },
      timer: { status: "running", durationMs: 25 * MINUTE, endsAt: NOW + MINUTE },
    };
    const b = bootstrap(parseMode(""), NOW + 5 * MINUTE, memoryAdapter(JSON.stringify(saved)), id);
    expect(b.initial.mission).toBe("Read");
    expect(b.initial.timer.status).toBe("complete");
    expect(b.initial.events).toHaveLength(1);
  });
});
