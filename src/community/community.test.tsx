import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { community as copy } from "@/content/copy";
import type { CommunityBackend } from "./types";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import CommunityProvider from "./CommunityProvider";
import { FakeCommunity } from "./fake";
import { VotePanel } from "./VotePanel";

const at = (h: number) => new Date(2026, 10, 23, h).getTime();

describe("FakeCommunity", () => {
  it("gives a count that depends on the place and the hour, between 0 and 8", async () => {
    const c = new FakeCommunity(["a"]);
    const counts = await Promise.all([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => c.presence("leblanc", at(h))));
    expect(counts.every((n) => n >= 0 && n <= 8)).toBe(true);
    expect(new Set(counts).size).toBeGreaterThan(1);
    const places = await Promise.all(["leblanc", "ryuji", "ann", "yusuke", "makoto"].map((p) => c.presence(p, at(12))));
    expect(new Set(places).size).toBeGreaterThan(1); // other places have other counts
  });
  it("one vote each: a second moves it, and an unknown option is refused", async () => {
    const c = new FakeCommunity(["a", "b"]);
    const before = await c.tally();
    await c.vote("a");
    expect((await c.tally()).a).toBe((before.a ?? 0) + 1);
    await c.vote("b");
    const after = await c.tally();
    expect(after.a).toBe(before.a);
    expect(after.b).toBe((before.b ?? 0) + 1);
    expect(c.myVote()).toBe("b");
    await expect(c.vote("zzz")).rejects.toThrow();
  });
  it("rejects while 'down', so nothing is shown rather than a stale number", async () => {
    const c = new FakeCommunity(["a"]);
    c.down = true;
    await expect(c.presence("leblanc", at(12))).rejects.toThrow("offline");
  });
});

const show = (patch: Partial<AppState>, ui: React.ReactNode) =>
  render(<StoreProvider initial={{ ...initialState, entered: true, layer: "main", communityEnabled: true, ...patch }}><CommunityProvider>{ui}</CommunityProvider></StoreProvider>);

const stub = (n: number | "down"): CommunityBackend => ({
  presence: async () => { if (n === "down") throw new Error("offline"); return n; },
  tally: async () => ({}),
  vote: async () => {},
  myVote: () => null,
});
const showWith = (backend: CommunityBackend, patch: Partial<AppState> = {}) =>
  render(<StoreProvider initial={{ ...initialState, entered: true, layer: "main", communityEnabled: true, ...patch }}><CommunityProvider backend={backend}>{null}</CommunityProvider></StoreProvider>);

describe("the presence line", () => {
  it("says how many are here, in the singular for one, and says the number is practice", async () => {
    const { unmount } = showWith(stub(3));
    expect(await screen.findByText(copy.presence(3))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(copy.practice))).toBeInTheDocument();
    unmount();
    showWith(stub(1));
    expect(await screen.findByText("1 Phantom Thief is studying here")).toBeInTheDocument();
  });
  it("shows nothing at zero, when the server is down, over a screen, or before the player has entered", async () => {
    for (const [backend, patch] of [[stub(0), {}], [stub("down"), {}], [stub(4), { layer: "menu" as const }], [stub(4), { entered: false }]] as const) {
      const { container, unmount } = showWith(backend, patch);
      await new Promise((r) => setTimeout(r, 20));
      expect(container.textContent).toBe("");
      expect(screen.queryByText(/studying here/)).not.toBeInTheDocument();
      unmount();
    }
  });
});

describe("the presence line and the vote panel", () => {
  it("the vote panel lists the four bonus places, takes one vote, and moves it", async () => {
    const user = userEvent.setup();
    show({}, <VotePanel />);
    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(4);
    await user.click(buttons[0]!);
    await waitFor(() => expect(screen.getByRole("button", { pressed: true })).toBe(buttons[0]));
    await user.click(buttons[1]!);
    await waitFor(() => expect(screen.getByRole("button", { pressed: true })).toBe(buttons[1]));
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    expect(screen.getByText(new RegExp(copy.voteNote))).toBeInTheDocument();
  });
  it("lists only bonus places that are still closed", async () => {
    show({ devUnlockAll: true }, <VotePanel />);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole("region", { name: copy.voteTitle })).not.toBeInTheDocument();
  });
  it("without community, the vote panel renders nothing", () => {
    const { container } = render(<StoreProvider initial={initialState}><VotePanel /></StoreProvider>);
    expect(container).toBeEmptyDOMElement();
  });
});
