import { expect, stubExternal, test } from "./fixtures";

/**
 * Review-loop screenshots (BUILD-PROMPT feedback loops). Skipped in normal runs.
 * Run: MILESTONE=M1 npm run screens  → docs/build/screens/<MILESTONE>/<screen>-<w>x<h>[-reduced].jpg
 * Add each new screen to SCREENS as milestones add them.
 */
const MILESTONE = process.env.MILESTONE ?? "";
const SIZES = [
  [1024, 600],
  [1440, 900],
  [2560, 1440],
] as const;

type Page = import("@playwright/test").Page;
type Context = import("@playwright/test").BrowserContext;
/** `before` runs before navigation (init scripts); `ready` may return another page to photograph instead. */
type Screen = { name: string; path: string; clock?: boolean; since?: string; before?: (page: Page) => Promise<void>; ready?: (page: Page, context: Context, opts: { reduced: boolean }) => Promise<Page | void> };
const fromMenu = (item: RegExp) => async (page: Page) => {
  await page.getByRole("button", { name: item }).click();
};
const enterRoom = async (p: Page) => { await p.getByRole("button", { name: "Press to enter" }).click(); };
const SCREENS: Screen[] = [
  { name: "splash", path: "/" },
  { name: "main", path: "/?demo=true" },
  { name: "main-phone-open", path: "/?demo=true", ready: async (p) => { await p.getByRole("button", { name: /^Phone/ }).click(); } },
  { name: "menu", path: "/?demo=true&at=menu" },
  { name: "map", path: "/?demo=true&at=menu", ready: fromMenu(/MAP/) },
  { name: "settings", path: "/?demo=true&at=menu", ready: fromMenu(/SETTINGS/) },
  { name: "profile", path: "/?demo=true&at=menu", ready: fromMenu(/PROFILE/) },
  { name: "summary", path: "/?demo=true&at=summary" },
  { name: "session-end", path: "/?demo=true", clock: true, ready: async (p) => { await p.clock.fastForward("17:30"); } },
  { name: "break", path: "/?demo=true", clock: true, ready: async (p) => { await p.clock.fastForward("17:30"); await p.getByRole("button", { name: "Take five" }).click(); } },
  { name: "travel", path: "/?demo=true&dev=true", ready: async (p) => { await p.getByRole("button", { name: "Unlock all" }).click(); await p.getByLabel("Jump to screen").selectOption("map"); await p.getByRole("button", { name: /School rooftop/ }).click(); } },
  { name: "main-fresh", path: "/", since: "M3", ready: enterRoom },
  { name: "tv-playing", path: "/", since: "M4", ready: async (p) => { await enterRoom(p); await p.getByRole("button", { name: "Play" }).click(); await p.getByRole("region", { name: "TV" }).getByRole("status").filter({ hasText: "Beneath the Mask" }).waitFor(); } },
  { name: "tv-unavailable", path: "/", since: "M4", ready: async (p) => { await enterRoom(p); await p.getByRole("button", { name: "Play" }).click(); for (const code of [150, 101, 100]) await p.evaluate((c) => (window as unknown as { __yt: { instances: { _error(c: number): void }[] } }).__yt.instances.at(-1)!._error(c), code); await p.getByText("That tape's gone.").waitFor(); } },
  { name: "mixer-open", path: "/", since: "M4", ready: async (p) => { await enterRoom(p); await p.getByRole("button", { name: "Mixer" }).click(); } },
  { name: "settings-top", path: "/", since: "M5", ready: async (p) => { await enterRoom(p); await p.keyboard.press("m"); await p.getByRole("button", { name: /SETTINGS/ }).click(); } },
  { name: "settings-bottom", path: "/", since: "M5", ready: async (p) => { await enterRoom(p); await p.keyboard.press("m"); await p.getByRole("button", { name: /SETTINGS/ }).click(); await p.getByRole("button", { name: "Delete my data" }).scrollIntoViewIfNeeded(); } },
  { name: "banner", path: "/", since: "M5", ready: async (p) => { await enterRoom(p); await p.getByLabel("Today's mission").fill("Study"); await p.getByRole("button", { name: "Set" }).click(); await p.locator("div[role=status] p", { hasText: "+10 Knowledge" }).waitFor(); } },
  { name: "mission-deadline-overdue", path: "/", since: "M5", clock: true, ready: async (p) => { await enterRoom(p); await p.getByLabel("Today's mission").fill("Hand it in"); const past = await p.evaluate(() => { const d = new Date(Date.now() - 3 * 3600_000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }); await p.getByLabel("Mission deadline").fill(past); await p.getByRole("button", { name: "Set" }).click(); await p.getByTestId("mission-countdown").waitFor(); } },
  { name: "hud-largest", path: "/?demo=true", since: "M5", ready: async (p) => { await p.keyboard.press("m"); await p.getByRole("button", { name: /SETTINGS/ }).click(); await p.getByRole("radio", { name: "Largest" }).check(); await p.keyboard.press("Escape"); } },
  { name: "hud-small-widgets-hidden", path: "/?demo=true", since: "M5", ready: async (p) => { await p.keyboard.press("m"); await p.getByRole("button", { name: /SETTINGS/ }).click(); await p.getByRole("radio", { name: "Small" }).check(); await p.getByRole("checkbox", { name: "Timer" }).uncheck(); await p.getByRole("checkbox", { name: "Todo list" }).uncheck(); await p.keyboard.press("Escape"); } },
  { name: "menu-wipe-mid", path: "/?demo=true", since: "M6", ready: async (p) => { await p.keyboard.press("m"); await p.getByRole("dialog", { name: "Hideout" }).waitFor(); await p.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 110; })); } },
  { name: "menu-highlight", path: "/?demo=true&at=menu", since: "M6", ready: async (p) => { await p.getByRole("dialog", { name: "Hideout" }).waitFor(); await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); } },
  { name: "menu-not-yet", path: "/", since: "M6", ready: async (p) => { await enterRoom(p); await p.keyboard.press("m"); await p.getByRole("dialog", { name: "Hideout" }).waitFor(); await p.keyboard.press("ArrowDown"); } },
  { name: "level-gift-banner", path: "/", since: "M7", clock: true, ready: async (p) => { await enterRoom(p); await p.getByLabel("Today's mission").fill("Study"); await p.getByRole("button", { name: "Set" }).click(); await p.clock.fastForward(7200); await p.locator("div[role=status] p", { hasText: "There's a map now" }).waitFor(); } },
  { name: "onboarding-first-visit", path: "/", since: "M8", ready: async (p) => { await enterRoom(p); await p.getByRole("log", { name: "Morgana" }).waitFor(); await p.waitForTimeout(900); /* the panel's open spring settles */ } },
  { name: "onboarding-mission-asked", path: "/", since: "M8", ready: async (p) => { await enterRoom(p); await p.getByRole("textbox", { name: "Your name" }).fill("Ren"); await p.getByRole("button", { name: "Send" }).click(); await p.getByText("What's today's mission?").waitFor(); await p.waitForTimeout(900); } },
  { name: "phone-threads-unlocked", path: "/?demo=true&dev=true", since: "M8", ready: async (p) => { await p.getByRole("button", { name: "Unlock all" }).click(); await p.keyboard.press("s"); await p.getByRole("button", { name: /^Phone/ }).click(); await p.getByRole("button", { name: /Akechi/ }).waitFor(); await p.waitForTimeout(900); } },
  { name: "phone-character-thread", path: "/?demo=true&dev=true", since: "M8", ready: async (p) => { await p.getByRole("button", { name: "Unlock all" }).click(); await p.keyboard.press("s"); await p.getByRole("button", { name: /^Phone/ }).click(); await p.getByRole("button", { name: /Ryuji/ }).click(); await p.getByRole("log", { name: "Ryuji" }).waitFor(); await p.waitForTimeout(900); } },
  // Travel and the arriving sign are time-based: the fake clock is frozen part-way through a phase and the running animations pinned to match.
  { name: "travel-covering", path: "/?demo=true&dev=true", since: "M9", clock: true, ready: async (p) => { await travelTo(p, 120, 120); } },
  { name: "travel-title-card", path: "/?demo=true&dev=true", since: "M9", clock: true, ready: async (p) => { await travelTo(p, 600, 0); } },
  { name: "travel-revealing", path: "/?demo=true&dev=true", since: "M9", clock: true, ready: async (p) => { await travelTo(p, 1250, 150); } },
  { name: "sign-arriving", path: "/", since: "M9", clock: true, ready: async (p) => { await freezeClock(p); await enterRoom(p); await p.clock.runFor(250); } },
  { name: "map-locked-and-open", path: "/?demo=true&dev=true", since: "M9", ready: async (p) => { await p.getByRole("button", { name: "+50 Knowledge" }).click(); await p.getByLabel("Jump to screen").selectOption("map"); } },
  { name: "timer-custom", path: "/", since: "M3", ready: async (p) => { await enterRoom(p); await p.getByLabel("Session length").selectOption("custom"); } },
  { name: "splash-recovered", path: "/", since: "M3", before: async (p) => { await p.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("pc:v1", "{nope"); sessionStorage.setItem("seeded", "1"); } }); } },
  { name: "splash-storage-blocked", path: "/", since: "M3", before: async (p) => { await p.addInitScript(() => { const boom = () => { throw new DOMException("blocked", "SecurityError"); }; Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; }); } },
  { name: "tab-lock", path: "/", since: "M3", ready: async (p, context, { reduced }) => { const second = await context.newPage(); await stubExternal(second); await second.setViewportSize(p.viewportSize()!); await second.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" }); await second.goto("/"); await second.getByRole("alertdialog").waitFor(); return second; } },
  { name: "scene-ryuji", path: "/?demo=true&dev=true", ready: async (p) => { await p.getByLabel("Jump to location").selectOption("ryuji"); } },
];

/** Freeze the fake clock where it is, so what happens next is stepped by hand (`runFor`) and nothing runs on real time. */
async function freezeClock(p: Page) {
  await p.clock.pauseAt(new Date((await p.evaluate(() => Date.now())) + 1000));
}

/** Start travel to the rooftop, step the frozen clock `ms` into it, and pin any running animation to `animationMs` into itself. */
async function travelTo(p: Page, ms: number, animationMs: number) {
  await p.getByRole("button", { name: "Unlock all" }).click();
  await p.getByLabel("Jump to screen").selectOption("map");
  await freezeClock(p);
  await p.getByRole("button", { name: /School rooftop/ }).click();
  await p.clock.runFor(ms); // runs the phases' timers in turn (a single jump would fire only the first)
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), animationMs);
}

test.describe("review screenshots", () => {
  test.skip(!MILESTONE, "set MILESTONE to capture review screenshots");

  for (const screen of SCREENS) {
    for (const [width, height] of SIZES) {
      for (const reduced of [false, true]) {
        const suffix = `${width}x${height}${reduced ? "-reduced" : ""}`;
        test(`${screen.name} ${suffix}`, async ({ page }) => {
          if (screen.clock) { await page.clock.install(); }
          await screen.before?.(page);
          await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
          await page.setViewportSize({ width, height });
          await page.goto(screen.path);
          if (screen.clock) await page.clock.resume();
          const target = (await screen.ready?.(page, page.context(), { reduced })) ?? page;
          await page.waitForTimeout(600); // let entrance animations settle
          await expect(page.locator("body")).toBeVisible();
          await target.screenshot({ path: `docs/build/screens/${MILESTONE}/${screen.name}-${suffix}.jpg`, type: "jpeg", quality: 70 });
        });
      }
    }
  }
});
