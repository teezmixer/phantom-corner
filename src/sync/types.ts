import type { ProgressEvent } from "@/domain/progress";
import { settings as copy } from "@/content/copy";
import type { Persisted } from "@/state/persistence/schema";

/** One synced slice and when it last changed (an ISO time). The newer side wins (spec §4.9). */
export interface Doc<T> { data: T; updatedAt: string }

/** The synced settings: everything but the analytics choice, which stays on the device. */
export type SettingsDoc = Omit<Persisted["settings"], "analytics">;
export type MissionDoc = Persisted["mission"];
export interface TodosDoc { todos: Persisted["todos"]; nextTodoId: number }

export interface Docs {
  settings?: Doc<SettingsDoc>;
  mission?: Doc<MissionDoc>;
  todos?: Doc<TodosDoc>;
}

/** The part of a save that is synced: the event log (append-only, merged by id) and three documents (newest stamp wins). */
export interface Snapshot {
  events: ProgressEvent[];
  docs: Required<Docs>;
}

export interface Who { userId: string; email: string }

/**
 * The only thing the app knows about "the server" (spec §4.9). The live implementation is Supabase (blocked until
 * credentials exist, B-10); `FakeBackend` is the same contract in memory. Every method may reject when offline.
 */
export interface SyncBackend {
  /** Sends a six-digit code to the address. */
  requestCode(email: string): Promise<void>;
  /** Checks the code and signs in. Rejects with `BadCode` for a wrong one. */
  verifyCode(email: string, code: string): Promise<Who>;
  /** Who is signed in now, if anyone (a session restored after a reload). */
  current(): Who | null;
  /** Signs out of the server. Local progress is never touched here. */
  signOut(): Promise<void>;
  /** Inserts events; an id the server already has is ignored. */
  pushEvents(events: ProgressEvent[]): Promise<void>;
  pullEvents(): Promise<ProgressEvent[]>;
  pullDocs(): Promise<Docs>;
  /** Writes a document only if it is newer than the server's copy. */
  pushDocs(docs: Docs): Promise<void>;
  /** Everything the server holds for the signed-in user (the export, spec §4.9). */
  exportAll(): Promise<unknown>;
  /** Deletes the signed-in user and everything of theirs on the server. */
  deleteAccount(): Promise<void>;
}

export class BadCode extends Error {
  constructor() { super(copy.accountPanel.badCode); this.name = "BadCode"; }
}
/** The server will not take this one event (it fails a check). Pushing the others still works. */
export class Refused extends Error {
  constructor() { super("The server refused an event."); this.name = "Refused"; }
}
export class NotSignedIn extends Error {
  constructor() { super("Not signed in."); this.name = "NotSignedIn"; }
}
