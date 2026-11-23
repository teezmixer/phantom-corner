import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

interface Entry { kind: "phase" | "sign"; value: string; at: number; animations: { name: string; duration: number; props: string[] }[] }

/**
 * Record every change of the travel phase and of the location sign's state from inside the page, with the (fake) time and
 * the animations running at that moment. Looking at the screen afterwards would miss anything that came and went.
 */
async function record(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __log: Entry[] };
    w.__log = [];
    const last: Record<string, string> = {};
    const note = (kind: "phase" | "sign", value: string | null) => {
      if (value === null || last[kind] === value) return;
      last[kind] = value;
      const animations = document.getAnimations().flatMap((a) => {
        const name = (a as CSSAnimation).animationName;
        // Only what the travel card itself animates: the room behind it has animations of its own.
        const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
        if (!name || !target?.closest?.("[data-phase]")) return [];
        const frames = (a.effect as KeyframeEffect).getKeyframes();
        const props = [...new Set(frames.flatMap((f) => Object.keys(f)).filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)))].sort();
        return [{ name, duration: a.effect!.getComputedTiming().duration as number, props }];
      });
      w.__log.push({ kind, value, at: Date.now(), animations });
    };
    const scan = () => {
      note("phase", document.querySelector("[data-phase]")?.getAttribute("data-phase") ?? null);
      note("sign", document.querySelector("[data-sign]")?.getAttribute("data-sign") ?? null);
    };
    new MutationObserver(scan).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-phase", "data-sign"] });
  });
}
const log = (page: Page) => page.evaluate(() => (window as unknown as { __log: Entry[] }).__log);
const values = async (page: Page, kind: "phase" | "sign") => (await log(page)).filter((e) => e.kind === kind).map((e) => e.value);

const T0 = new Date(2026, 10, 23, 12);
async function toTheMap(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto("/?demo=true&dev=true");
  await page.clock.resume();
  await page.getByRole("button", { name: "Unlock all" }).click();
  await page.keyboard.press("n");
  await expect(page.getByRole("dialog", { name: "Map" })).toBeVisible();
}

test.describe("travel", () => {
  test("covering, then the title card, then revealing, then arrival, at the spec's times", async ({ page }) => {
    await record(page);
    await toTheMap(page);
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(1600);
    expect(await values(page, "phase")).toEqual(["covering", "title", "revealing", "done"]); // done is the instant before the card unmounts
    const phases = (await log(page)).filter((e) => e.kind === "phase");
    const start = phases[0]!.at;
    expect(phases[1]!.at - start).toBeGreaterThanOrEqual(280); // the cover takes its 300 ms (20 ms of timer jitter allowed)
    expect(phases[1]!.at - start).toBeLessThan(450);
    expect(phases[2]!.at - phases[1]!.at).toBeGreaterThanOrEqual(780); // the card is held at least 800 ms
    expect(phases[2]!.at - phases[1]!.at).toBeLessThan(950);
    expect(phases[3]!.at - phases[2]!.at).toBeGreaterThanOrEqual(280); // the reveal takes its 300 ms
    expect(phases[3]!.at - phases[2]!.at).toBeLessThan(450);
    await expect(page.getByLabel("Current location: School rooftop")).toBeVisible(); // arrived
    await expect(page.locator("[data-phase]")).toHaveCount(0); // and the card is gone
  });

  test("the cover and the reveal are the only things that animate on the card, and both are clip-path wipes", async ({ page }) => {
    await record(page);
    await toTheMap(page);
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(1600);
    const phases = (await log(page)).filter((e) => e.kind === "phase");
    const during = (phase: string) => phases.find((e) => e.value === phase)!.animations;
    expect(during("covering")).toEqual([{ name: "menu-wipe", duration: 300, props: ["clipPath"] }]); // exactly this: no fade, no second animation
    expect(during("title")).toEqual([]); // the card is held still
    expect(during("revealing")).toEqual([{ name: "travel-reveal", duration: 300, props: ["clipPath"] }]);
  });

  test("the destination is the current place by the time the wipe uncovers the room", async ({ page }) => {
    await record(page);
    await toTheMap(page);
    await expect(page.getByLabel("Current location: Café Leblanc")).toBeVisible();
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(300 + 800 + 50); // just into the reveal
    expect((await values(page, "phase")).slice(0, 3)).toEqual(["covering", "title", "revealing"]);
    await expect(page.getByLabel("Current location: School rooftop")).toBeVisible(); // already the rooftop behind the wipe
  });

  test("with reduced motion the wipes are 100 ms cuts: shorter, and no wipe is drawn", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await record(page);
    await toTheMap(page);
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(1600);
    const phases = (await log(page)).filter((e) => e.kind === "phase");
    expect(phases.map((e) => e.value)).toEqual(["covering", "title", "revealing", "done"]);
    expect(phases[1]!.at - phases[0]!.at).toBeLessThan(200); // a cut, not a 300 ms wipe
    expect(phases[1]!.at - phases[0]!.at).toBeGreaterThanOrEqual(80);
    expect(phases[2]!.at - phases[1]!.at).toBeGreaterThanOrEqual(780); // the card still holds
    for (const p of phases) expect(p.animations.filter((a) => a.name === "menu-wipe" || a.name === "travel-reveal")).toEqual([]);
  });

  test("the in-app Reduce motion setting does the same as the system's", async ({ page }) => {
    await record(page);
    await page.clock.install({ time: T0 });
    await page.goto("/?demo=true&dev=true");
    await page.clock.resume();
    await page.keyboard.press("m");
    await page.getByRole("button", { name: /SETTINGS/ }).click();
    await page.getByRole("radio", { name: /Reduce motion/ }).check();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Unlock all" }).click();
    await page.keyboard.press("n");
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(1600);
    const phases = (await log(page)).filter((e) => e.kind === "phase");
    expect(phases[1]!.at - phases[0]!.at).toBeLessThan(200);
    for (const p of phases) expect(p.animations).toEqual([]); // and no wipe is drawn at all
  });

  test("when the trip ends, focus is back on the map button, not lost on the page", async ({ page }) => {
    await record(page);
    await toTheMap(page);
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(1600);
    await expect(page.locator("[data-phase]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Map (N)" })).toBeFocused();
  });
});

test.describe("the location sign", () => {
  test("on a first visit it comes in big, holds about 900 ms, and settles", async ({ page }) => {
    await record(page);
    await page.clock.install({ time: T0 });
    await page.goto("/");
    await page.clock.resume();
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.clock.runFor(2000);
    const signs = (await log(page)).filter((e) => e.kind === "sign");
    expect(signs.map((e) => e.value)).toEqual(["arriving", "settled"]);
    const held = signs[1]!.at - signs[0]!.at;
    expect(held).toBeGreaterThanOrEqual(850); // about 900 ms, allowing for timer jitter
    expect(held).toBeLessThan(1100);
  });

  test("with reduced motion it is never drawn big", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await record(page);
    await page.clock.install({ time: T0 });
    await page.goto("/");
    await page.clock.resume();
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.clock.runFor(2000);
    expect(await values(page, "sign")).not.toContain("arriving");
    expect((await values(page, "sign")).at(-1)).toBe("settled");
  });

  test("it arrives big at a new place after travel, once the room is in view, and not on a return to a place already seen", async ({ page }) => {
    await record(page);
    await toTheMap(page);
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(3000);
    expect(await values(page, "sign")).toEqual(["settled", "arriving", "settled"]); // settled at first, big on arriving, back in its corner
    // Back to LeBlanc, which the player has already seen: the sign just changes, it does not arrive big again.
    await page.keyboard.press("n");
    await page.getByRole("button", { name: /Café Leblanc/ }).click();
    await page.clock.runFor(3000);
    expect(await values(page, "sign")).toEqual(["settled", "arriving", "settled"]);
  });
});

test.describe("the map", () => {
  test("shows all twelve places; at the start one is current and eleven are locked, with no unlock level shown", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.keyboard.press("s"); // skip onboarding: level 2, the map
    await page.keyboard.press("Escape");
    await page.keyboard.press("n");
    const map = page.getByRole("dialog", { name: "Map" });
    await expect(map.locator("[data-state]")).toHaveCount(12);
    await expect(map.locator('[data-state="current"]')).toHaveCount(1);
    await expect(map.locator('[data-state="locked"]')).toHaveCount(11);
    await expect(map.locator('[data-state="unlocked"]')).toHaveCount(0);
    expect(await map.innerText()).not.toMatch(/level|reach/i);
  });

  test("the states follow progress, and everything open once everything is unlocked", async ({ page }) => {
    await page.goto("/?demo=true&dev=true");
    await page.getByRole("button", { name: "+50 Knowledge" }).click(); // level 3 from the demo's 10: Ryuji
    await page.keyboard.press("n");
    const map = page.getByRole("dialog", { name: "Map" });
    await expect(map.locator('[data-state="unlocked"]')).toHaveCount(1);
    await expect(map.locator('[data-state="locked"]')).toHaveCount(10);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Unlock all" }).click();
    await page.keyboard.press("n");
    await expect(map.locator('[data-state="unlocked"]')).toHaveCount(11);
    await expect(map.locator('[data-state="locked"]')).toHaveCount(0);
  });

  test("after travel to the place with the longest name, the big sign is still clear of the TV and inside the window (1024×600)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await record(page);
    await toTheMap(page);
    await page.getByRole("button", { name: /Atelier by the park/ }).click();
    await page.clock.runFor(2000); // the trip, then into the sign's hold, with its move finished
    await expect(page.locator('[data-sign="arriving"]')).toBeVisible();
    const tv = (await page.getByRole("region", { name: "TV" }).boundingBox())!;
    for (const part of [page.locator('[data-sign="arriving"] span'), page.locator('[data-sign="arriving"] svg')]) {
      const box = (await part.boundingBox())!;
      expect(box.x < tv.x + tv.width && box.x + box.width > tv.x && box.y < tv.y + tv.height && box.y + box.height > tv.y, "clear of the TV").toBe(false);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1024);
      expect(box.y + box.height).toBeLessThanOrEqual(600);
    }
  });

  for (const [width, height] of [[1024, 600], [1440, 900], [2560, 1440]] as const) {
    test(`${width}×${height}: the big arriving sign never reaches the TV (the player is never covered or crowded)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await record(page);
      await page.clock.install({ time: T0 });
      await page.goto("/");
      await page.clock.resume();
      await page.getByRole("button", { name: "Press to enter" }).click();
      await expect(page.locator('[data-sign="arriving"]')).toBeVisible();
      const tv = (await page.getByRole("region", { name: "TV" }).boundingBox())!;
      // What can be seen of the sign: the name box and the pin (the element around them is bigger than either).
      for (const part of [page.locator('[data-sign="arriving"] span'), page.locator('[data-sign="arriving"] svg')]) {
        const box = (await part.boundingBox())!;
        const overlaps = box.x < tv.x + tv.width && box.x + box.width > tv.x && box.y < tv.y + tv.height && box.y + box.height > tv.y;
        expect(overlaps, "the big sign does not overlap the TV").toBe(false);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
    });
  }
});
