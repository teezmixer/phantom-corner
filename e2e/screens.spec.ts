import { expect, test } from "@playwright/test";

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
type Screen = { name: string; path: string; clock?: boolean; ready?: (page: Page) => Promise<void> };
const fromMenu = (item: RegExp) => async (page: Page) => {
  await page.getByRole("button", { name: item }).click();
};
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
  { name: "scene-ryuji", path: "/?demo=true&dev=true", ready: async (p) => { await p.getByLabel("Jump to location").selectOption("ryuji"); } },
];

test.describe("review screenshots", () => {
  test.skip(!MILESTONE, "set MILESTONE to capture review screenshots");

  for (const screen of SCREENS) {
    for (const [width, height] of SIZES) {
      for (const reduced of [false, true]) {
        const suffix = `${width}x${height}${reduced ? "-reduced" : ""}`;
        test(`${screen.name} ${suffix}`, async ({ page }) => {
          if (screen.clock) { await page.clock.install(); }
          await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
          await page.setViewportSize({ width, height });
          await page.goto(screen.path);
          if (screen.clock) await page.clock.resume();
          await screen.ready?.(page);
          await page.waitForTimeout(600); // let entrance animations settle
          await expect(page.locator("body")).toBeVisible();
          await page.screenshot({ path: `docs/build/screens/${MILESTONE}/${screen.name}-${suffix}.jpg`, type: "jpeg", quality: 70 });
        });
      }
    }
  }
});
