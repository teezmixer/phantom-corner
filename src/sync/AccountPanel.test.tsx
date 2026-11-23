import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settings } from "@/content/copy";
import { initialTimer } from "@/domain/timer";
import type { StorageAdapter } from "@/state/persistence/adapter";
import { freshPersisted } from "@/state/persistence/schema";
import { initialState, type Action, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { AccountPanel } from "./AccountPanel";
import { AccountProvider } from "./AccountProvider";
import { SyncDot } from "./SyncDot";
import { FAKE_CODE, FakeBackend, FakeServer } from "./fake";

const t = settings.accountPanel;
const base = freshPersisted("c1", "2026-11-20T10:00:00.000Z", { timer: initialTimer, locationId: "leblanc", visited: ["leblanc"] });
const adapter: StorageAdapter = { read: () => null, write: () => true, backup: () => true, blocked: false };

/** One "device": a store with some local progress, the account provider over a shared fake server, and the panel. */
function device(server: FakeServer, patch: Partial<AppState> = {}, backendFor: (s: FakeServer) => FakeBackend = (s) => new FakeBackend(s)) {
  let send!: (a: Action) => void;
  let latest!: AppState;
  function Grab() { const s = useStore(); useEffect(() => { send = s.dispatch; latest = s.state; }); return null; }
  const api = backendFor(server);
  const view = render(
    <StoreProvider initial={{ ...initialState, layer: "settings", entered: true, clientId: "c1", accountsEnabled: true, ...patch }}>
      <AccountProvider backend={{ api, fake: true }} adapter={adapter} base={base}><AccountPanel /><SyncDot /><Grab /></AccountProvider>
    </StoreProvider>,
  );
  return { api, view, state: () => latest, send: (a: Action) => act(() => send(a)) };
}
const signIn = async (email = "ren@example.com", code = FAKE_CODE) => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  await user.type(screen.getByLabelText(t.email), email);
  await user.click(screen.getByRole("button", { name: t.sendCode }));
  await user.type(await screen.findByLabelText(t.code), code);
  await user.click(screen.getByRole("button", { name: t.signIn }));
  return user;
};

describe("the account panel", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("says it is practice mode, and asks for an email first", () => {
    device(new FakeServer());
    expect(screen.getByText(t.fakeNote)).toBeInTheDocument();
    expect(screen.getByLabelText(t.email)).toBeInTheDocument();
    expect(screen.queryByLabelText(t.code)).not.toBeInTheDocument();
  });

  it("a bad address and a wrong code each say so in words, and nothing is signed in", async () => {
    device(new FakeServer());
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByLabelText(t.email), "nope");
    await user.click(screen.getByRole("button", { name: t.sendCode }));
    expect(await screen.findByRole("alert")).toHaveTextContent("doesn't look like an email");
    await user.clear(screen.getByLabelText(t.email));
    await user.type(screen.getByLabelText(t.email), "ren@example.com");
    await user.click(screen.getByRole("button", { name: t.sendCode }));
    await user.type(await screen.findByLabelText(t.code), "000000");
    await user.click(screen.getByRole("button", { name: t.signIn }));
    expect(await screen.findByRole("alert")).toHaveTextContent("isn't right");
    expect(screen.queryByText(new RegExp(t.signedInAs))).not.toBeInTheDocument();
  });

  it("signing in uploads the guest's history, marks the state signed in, and says everything is saved", async () => {
    const server = new FakeServer();
    const d = device(server, { events: [{ kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed", id: "c1:1" }] });
    await signIn();
    expect(await screen.findByText(`${t.signedInAs} ren@example.com`)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.syncedPractice));
    expect(d.state().signedIn).toBe(true);
    expect([...server.userFor("ren@example.com").events.keys()]).toEqual(["c1:1"]);
  });

  it("on a second device the same account brings the first device's progress in", async () => {
    const server = new FakeServer();
    device(server, { events: [{ kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed", id: "c1:1" }], mission: "From device one" });
    await signIn();
    await waitFor(() => expect(server.userFor("ren@example.com").events.size).toBe(1));
    cleanup(); // the first device is closed; this is another one
    const two = device(server, { clientId: "c2" });
    await signIn();
    await waitFor(() => expect(two.state().events.map((e) => e.id)).toEqual(["c1:1"]));
    expect(two.state().mission).toBe("From device one");
  });

  it("sign out keeps local progress and leaves the server's copy", async () => {
    const server = new FakeServer();
    const d = device(server, { mission: "Keep me", events: [{ kind: "mission_first_set", id: "c1:1" }] });
    const user = await signIn();
    await screen.findByText(new RegExp(t.signedInAs));
    await user.click(screen.getByRole("button", { name: t.signOut }));
    expect(await screen.findByLabelText(t.email)).toBeInTheDocument();
    expect(d.state().signedIn).toBe(false);
    expect(d.state().mission).toBe("Keep me");
    expect(d.state().events).toHaveLength(1);
    expect(server.userFor("ren@example.com").events.size).toBe(1);
  });

  it("export gives the account's data as a file", async () => {
    const server = new FakeServer();
    device(server, { events: [{ kind: "mission_first_set", id: "c1:1" }] });
    const user = await signIn();
    await screen.findByText(new RegExp(t.signedInAs));
    await waitFor(() => expect(server.userFor("ren@example.com").events.size).toBe(1));
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => { created.push(b as Blob); return "blob:x"; });
    URL.revokeObjectURL = vi.fn();
    await user.click(screen.getByRole("button", { name: t.export }));
    await waitFor(() => expect(created).toHaveLength(1));
    const body = JSON.parse(await created[0]!.text()) as { email: string; events: { id: string }[] };
    expect(body.email).toBe("ren@example.com");
    expect(body.events.map((e) => e.id)).toEqual(["c1:1"]);
  });

  it("delete takes two presses, removes the account online, and leaves progress on this device", async () => {
    const server = new FakeServer();
    const d = device(server, { mission: "Still here", events: [{ kind: "mission_first_set", id: "c1:1" }] });
    const user = await signIn();
    await screen.findByText(new RegExp(t.signedInAs));
    await user.click(screen.getByRole("button", { name: t.delete }));
    expect(server.users.size).toBe(1); // armed, not done
    await user.click(screen.getByRole("button", { name: t.deleteConfirm }));
    await waitFor(() => expect(server.users.size).toBe(0));
    expect(await screen.findByText(t.deleted)).toBeInTheDocument();
    expect(d.state().mission).toBe("Still here");
  });

  it("a change made while a sync is still on its way, when the pause before syncing is over, is synced as soon as that one ends", async () => {
    const server = new FakeServer();
    let release!: () => void;
    let gate: Promise<void> = Promise.resolve();
    class Slow extends FakeBackend { override async pullEvents() { await gate; return super.pullEvents(); } }
    const d = device(server, { events: [{ kind: "mission_first_set", id: "c1:1" }] }, (s) => new Slow(s));
    const user = await signIn();
    await screen.findByText(new RegExp(t.signedInAs));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.syncedPractice));
    gate = new Promise<void>((resolve) => { release = resolve; });
    await user.click(screen.getByRole("button", { name: t.syncNow })); // a sync begins and waits on the network
    d.send({ type: "SET_MISSION", text: "Written during the sync" });
    await act(async () => { vi.advanceTimersByTime(2500); }); // the pause is over while the first sync is still waiting: that request is queued, not dropped
    expect(server.userFor("ren@example.com").docs.mission?.data).toBeNull(); // nothing of the new mission is on the server yet
    release();
    await waitFor(() => expect(server.userFor("ren@example.com").docs.mission?.data?.text).toBe("Written during the sync"), { timeout: 1200 });
  });

  it("when the server is down it says progress is safe, and tries again when asked", async () => {
    const server = new FakeServer();
    const d = device(server, { events: [{ kind: "mission_first_set", id: "c1:1" }] });
    const user = await signIn();
    await screen.findByText(new RegExp(t.signedInAs));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(t.syncedPractice));
    server.down = true;
    d.send({ type: "SET_MISSION", text: "Changed offline" });
    await user.click(screen.getByRole("button", { name: t.syncNow }));
    await waitFor(() => expect(screen.getAllByRole("status").some((s) => s.textContent === t.syncDown)).toBe(true));
    expect(screen.getByLabelText(t.syncDown)).toBeInTheDocument(); // the corner dot
    expect(d.state().mission).toBe("Changed offline");
    server.down = false;
    await user.click(screen.getByRole("button", { name: t.syncNow }));
    await waitFor(() => expect(screen.queryByLabelText(t.syncDown)).not.toBeInTheDocument()); // the dot goes
    expect(server.userFor("ren@example.com").docs.mission?.data?.text).toBe("Changed offline");
  });
});
