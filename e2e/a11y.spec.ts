import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Serious and critical axe findings fail the build (spec §4.17). The dev panel is not part of the product, so it is left out. */
async function seriousViolations(page: Page) {
  // A screen fades in; contrast measured mid-fade is not the screen's real contrast, so let every animation finish first.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  const results = await new AxeBuilder({ page }).exclude('[aria-label="Developer tools"]').analyze();
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

const SCREENS = ["menu", "map", "settings", "profile", "summary", "choice", "break", "about", "credits", "privacy"] as const;

test.describe("axe", () => {
  test("the splash has no serious or critical violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  test("the room, with the HUD and the TV, has none", async ({ page }) => {
    await page.goto("/?dev=true");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await expect(page.getByRole("timer").first()).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  test("control: the scan really does catch a serious violation (an image with no alternative text)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => { const img = document.createElement("img"); img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw="; document.body.appendChild(img); });
    expect((await seriousViolations(page)).join()).toContain("image-alt");
  });

  test("the phone and the TV's mixer, opened, have none", async ({ page }) => {
    await page.goto("/?dev=true");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.getByRole("button", { name: /^Phone/ }).click();
    await page.getByRole("button", { name: "Mixer" }).click();
    await expect(page.getByRole("region", { name: "TV" }).getByRole("slider").first()).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  test("the map with the community vote and presence line showing has none", async ({ page }) => {
    await page.goto("/?community=true");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.keyboard.press("s");
    await page.getByLabel("Today's mission").fill("x");
    await page.getByRole("button", { name: "Set" }).click();
    await page.getByRole("button", { name: "Map (N)" }).click();
    await expect(page.getByRole("region", { name: "Which place should open next?" })).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  for (const screen of SCREENS) {
    test(`the ${screen} screen has none`, async ({ page }) => {
      await page.goto("/?dev=true");
      await page.getByRole("button", { name: "Press to enter" }).click();
      await page.getByLabel("Jump to screen").selectOption(screen);
      await expect(page.getByRole("dialog").first()).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
});

/** Press Tab until `matches` says the focused element is the one wanted (at most 40 presses, so a missing target fails instead of hanging). */
async function tabTo(page: Page, matches: (label: string) => boolean): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => { const e = document.activeElement; return e ? (e.getAttribute("aria-label") ?? e.textContent ?? "").trim() : ""; });
    if (matches(label)) return;
  }
  throw new Error("Tab never reached the element");
}

test.describe("keyboard, announcements, targets and landmarks", () => {
  test("a whole session can be run with the keyboard alone, and the timer is announced politely", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeFocused();
    await page.keyboard.press("Enter");
    await tabTo(page, (l) => l === "Today's mission");
    await page.keyboard.type("Read chapter 3");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Read chapter 3")).toBeVisible();
    await tabTo(page, (l) => l === "Start");
    // The focus ring is drawn for keyboard focus.
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement as Element); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
    expect(ring.style).not.toBe("none");
    expect(ring.width).toBeGreaterThan(0);
    await page.keyboard.press("Enter");
    const timer = page.getByRole("timer").first();
    await expect(timer).toContainText(/2[45]:\d\d/);
    // role=timer is not read each second; the polite region says the time left in steps.
    await expect(page.getByRole("status").filter({ hasText: "minutes left" })).toHaveText("25 minutes left");
    await expect(page.getByRole("status").filter({ hasText: "minutes left" })).toHaveAttribute("aria-live", "polite");
  });

  for (const size of [{ width: 1280, height: 720 }, { width: 1024, height: 640 }]) {
    test(`every control in the room is at least 24 by 24 pixels at ${size.width}x${size.height} (WCAG 2.2 target size)`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/");
      await page.getByRole("button", { name: "Press to enter" }).click();
      await page.getByLabel("Today's mission").fill("x");
      await page.getByRole("button", { name: "Set" }).click(); // opens the map button and the rest of the HUD
      await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible();
      await page.getByLabel("Add a todo").fill("one");
      await page.keyboard.press("Enter");
      await page.getByRole("button", { name: /^Phone/ }).click(); // the phone's open thread, with its back and skip buttons
      const small = await page.evaluate(() => {
        const found: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('button, a[href], input:not([type="hidden"]), select, textarea, [role="slider"]')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue; // not displayed
          if (r.width < 23.9 || r.height < 23.9) found.push(`${el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`);
        }
        return found;
      });
      expect(small).toEqual([]);
    });
  }

  test("the room has its landmarks: main, the four widget corners, the main controls and the TV", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Main controls" })).toBeVisible();
    await expect(page.getByRole("region", { name: "TV" })).toBeVisible();
    for (const corner of ["Top left widgets", "Top right widgets", "Bottom left widgets", "Bottom right widgets"]) {
      await expect(page.getByRole("region", { name: corner })).toBeAttached();
    }
  });
});
