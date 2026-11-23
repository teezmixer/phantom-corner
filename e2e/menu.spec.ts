import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Record the pitch of every oscillator the app schedules, so a test can tell which interface sound played. */
async function probeFrequencies(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __freqs: number[]; AudioContext: typeof AudioContext };
    w.__freqs = [];
    const Original = w.AudioContext;
    w.AudioContext = class extends Original {
      createOscillator() {
        const osc = super.createOscillator();
        const set = osc.frequency.setValueAtTime.bind(osc.frequency);
        osc.frequency.setValueAtTime = (v: number, t: number) => { w.__freqs.push(Math.round(v * 100) / 100); return set(v, t); };
        return osc;
      }
    } as unknown as typeof AudioContext;
  });
}
const freqs = (page: Page) => page.evaluate(() => (window as unknown as { __freqs: number[] }).__freqs);

/** Every running CSS animation on the menu, with what it animates (read from the browser, not from the stylesheet). */
const animations = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().flatMap((a) => {
      const anim = a as CSSAnimation;
      const timing = a.effect!.getComputedTiming();
      const frames = (a.effect as KeyframeEffect).getKeyframes();
      const props = [...new Set(frames.flatMap((f) => Object.keys(f)).filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)))].sort();
      return anim.animationName.startsWith("menu-") ? [{ name: anim.animationName, duration: timing.duration as number, delay: timing.delay as number, props }] : [];
    }),
  );

test.describe("hideout menu", () => {
  test("opens with a 200 ms diagonal wipe that animates only clip-path, and the labels fly in one after another", async ({ page }) => {
    await page.goto("/?demo=true&at=menu");
    await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
    const all = await animations(page);
    const wipe = all.filter((a) => a.name === "menu-wipe");
    expect(wipe).toHaveLength(1);
    expect(wipe[0]).toMatchObject({ duration: 200, props: ["clipPath"] });
    const labels = all.filter((a) => a.name === "menu-label");
    expect(labels).toHaveLength(6);
    expect(labels.map((l) => l.duration)).toEqual(Array(6).fill(420));
    expect(labels.map((l) => l.delay)).toEqual([0, 60, 120, 180, 240, 300]); // staggered, in list order
    for (const l of labels) expect(l.props).toEqual(["opacity", "transform"]); // never anything that triggers layout
  });

  test("with the system asking for reduced motion, the wipe and the flying labels become one 100 ms cut", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?demo=true&at=menu");
    await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
    const all = await animations(page);
    expect(all.some((a) => a.name === "menu-wipe" || a.name === "menu-label")).toBe(false);
    expect(all.length).toBeGreaterThan(0);
    for (const a of all) expect(a).toMatchObject({ name: "menu-cut", duration: 100, delay: 0, props: ["opacity"] });
  });

  test("arrow keys move the highlight (wrapping) with a sound, Enter selects, Esc closes and focus goes back", async ({ page }) => {
    await probeFrequencies(page);
    await page.goto("/?demo=true");
    const menuButton = page.getByRole("button", { name: "Menu (M)" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Hideout" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "STUDY" })).toBeFocused();
    await page.waitForTimeout(300);
    const before = (await freqs(page)).filter((f) => f === 880).length;
    await page.keyboard.press("ArrowUp"); // wraps from the first label to the last
    await expect(dialog.getByRole("button", { name: "CLOSE" })).toBeFocused();
    await expect.poll(async () => (await freqs(page)).filter((f) => f === 880).length).toBe(before + 1); // the select tick
    await page.keyboard.press("ArrowUp");
    await expect(dialog.getByRole("button", { name: "SETTINGS" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Esc closes the menu and returns focus to the button that opened it", async ({ page }) => {
    await page.goto("/?demo=true");
    const menuButton = page.getByRole("button", { name: "Menu (M)" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(menuButton).toBeFocused();
  });

  test("a label that is not built yet can be focused, says so, and does nothing when pressed", async ({ page }) => {
    await page.goto("/"); // a real visit: the map is locked
    await page.getByRole("button", { name: "Press to enter" }).click();
    await expect(page.getByRole("group", { name: "Timer" })).toBeVisible();
    await page.getByRole("button", { name: "Menu (M)" }).click();
    const dialog = page.getByRole("dialog", { name: "Hideout" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const map = dialog.getByRole("button", { name: /MAP/ });
    await expect(map).toBeFocused();
    await expect(map).toHaveAttribute("aria-disabled", "true");
    await expect(map).toContainText("Not yet.");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible(); // still the menu
    await expect(page.getByRole("dialog", { name: "Map" })).toHaveCount(0);
  });
});
