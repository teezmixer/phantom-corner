import { isEvent } from "@/state/persistence/guard";
import type { ProgressEvent } from "@/domain/progress";
import { settings } from "@/content/copy";
import { isLater } from "./merge";
import { BadCode, NotSignedIn, Refused, type Docs, type SyncBackend, type Who } from "./types";

/** The six-digit code the fake accepts. A real backend sends a random one by email. */
export const FAKE_CODE = "123456";

interface UserRow { id: string; email: string; events: Map<string, ProgressEvent>; docs: Docs }

/**
 * The server, in memory: shared by every `FakeBackend` made from it, so two "devices" can sync through it. It enforces what
 * the SQL does (supabase/migrations): events are append-only, a bad event is refused, one user cannot see another's rows.
 */
export class FakeServer {
  users = new Map<string, UserRow>();
  /** Set to make every call reject, as when the network is down. */
  down = false;
  private next = 1;

  userFor(email: string): UserRow {
    const key = email.trim().toLowerCase();
    let row = this.users.get(key);
    if (!row) { row = { id: `user-${this.next++}`, email: key, events: new Map(), docs: {} }; this.users.set(key, row); }
    return row;
  }
}

/** One device's connection to a `FakeServer`. */
export class FakeBackend implements SyncBackend {
  private who: Who | null = null;
  constructor(private server: FakeServer) {}

  private guard(): UserRow {
    if (this.server.down) throw new Error("offline");
    if (!this.who) throw new NotSignedIn();
    const row = [...this.server.users.values()].find((u) => u.id === this.who!.userId);
    if (!row) throw new NotSignedIn(); // the account was deleted elsewhere
    return row;
  }

  async requestCode(email: string): Promise<void> {
    if (this.server.down) throw new Error("offline");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) throw new Error(settings.accountPanel.badAddress);
  }
  async verifyCode(email: string, code: string): Promise<Who> {
    if (this.server.down) throw new Error("offline");
    if (code.trim() !== FAKE_CODE) throw new BadCode();
    const row = this.server.userFor(email);
    this.who = { userId: row.id, email: row.email };
    return this.who;
  }
  current(): Who | null { return this.who; }
  async signOut(): Promise<void> { this.who = null; }

  async pushEvents(events: ProgressEvent[]): Promise<void> {
    const row = this.guard();
    // All or nothing, like one insert statement: a single bad event refuses the whole batch (the engine then sends them one by one).
    if (events.some((e) => !e.id || e.kind === "dev_grant" || !isEvent(e))) throw new Refused(); // like the check constraints
    for (const e of events) if (!row.events.has(e.id!)) row.events.set(e.id!, e); // an id already there is ignored: append-only
  }
  async pullEvents(): Promise<ProgressEvent[]> { return [...this.guard().events.values()]; }
  async pullDocs(): Promise<Docs> { return { ...this.guard().docs }; }
  async pushDocs(docs: Docs): Promise<void> {
    const row = this.guard();
    for (const key of ["settings", "mission", "todos"] as const) {
      const incoming = docs[key];
      const have = row.docs[key];
      if (incoming && (!have || isLater(incoming.updatedAt, have.updatedAt))) (row.docs as Record<string, unknown>)[key] = incoming;
    }
  }
  async exportAll(): Promise<unknown> {
    const row = this.guard();
    return { email: row.email, events: [...row.events.values()], docs: row.docs };
  }
  async deleteAccount(): Promise<void> {
    const row = this.guard();
    this.server.users.delete(row.email);
    this.who = null;
  }
}
