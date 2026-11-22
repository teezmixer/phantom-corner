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

type Screen = { name: string; path: string; ready?: (page: import("@playwright/test").Page) => Promise<void> };
const SCREENS: Screen[] = [{ name: "main", path: "/" }];

test.describe("review screenshots", () => {
  test.skip(!MILESTONE, "set MILESTONE to capture review screenshots");

  for (const screen of SCREENS) {
    for (const [width, height] of SIZES) {
      for (const reduced of [false, true]) {
        const suffix = `${width}x${height}${reduced ? "-reduced" : ""}`;
        test(`${screen.name} ${suffix}`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
          await page.setViewportSize({ width, height });
          await page.goto(screen.path);
          await screen.ready?.(page);
          await page.waitForTimeout(600); // let entrance animations settle
          await expect(page.locator("body")).toBeVisible();
          await page.screenshot({ path: `docs/build/screens/${MILESTONE}/${screen.name}-${suffix}.jpg`, type: "jpeg", quality: 70 });
        });
      }
    }
  }
});
