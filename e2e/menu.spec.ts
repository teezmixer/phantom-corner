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
      return anim.animationName.startsWith("menu-") ? [{ name: anim.animationName, duration: timing.duration as number, delay: timing.delay as number, easing: frames[0]?.easing ?? "", props }] : [];
    }),
  );

/** Rest the mouse over a label of the (closed) menu before it opens: measure where the label will be, then park the pointer there. */
async function restPointerOver(page: Page, label: string) {
  await page.keyboard.press("m");
  const dialog = page.getByRole("dialog", { name: "Hideout" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(700); // the labels have finished flying in
  const box = await dialog.getByRole("button", { name: label }).boundingBox();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

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
    for (const a of all) expect(a.easing).toMatch(/^steps\(1/); // a hard step, not a 100 ms fade (spec: never crossfades)
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
    await expect(menuButton).toBeFocused(); // focus went all the way back to the button that opened the menu
  });

  test("focus returns to the Menu button after menu → Profile → Esc too", async ({ page }) => {
    await page.goto("/?demo=true");
    const menuButton = page.getByRole("button", { name: "Menu (M)" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog", { name: "Hideout" }).getByRole("button", { name: "PROFILE" }).click();
    await expect(page.getByRole("dialog", { name: "Profile" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuButton).toBeFocused();
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

  test("each label does what it says: STUDY returns to the room, MAP, PROFILE and SETTINGS open their screens, MESSAGES opens the phone, CLOSE returns to the room", async ({ page }) => {
    await page.goto("/?demo=true&dev=true");
    const open = async () => { await page.keyboard.press("m"); await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible(); };
    const item = (name: string) => page.getByRole("dialog", { name: "Hideout" }).getByRole("button", { name });
    await page.getByLabel("Jump to location").waitFor(); // dev panel: unlocks the map for this check
    await page.getByRole("button", { name: /unlock all/i }).click();
    await open(); await item("MAP").click();
    await expect(page.getByRole("dialog", { name: "Map" })).toBeVisible();
    await page.keyboard.press("Escape");
    await open(); await item("PROFILE").click();
    await expect(page.getByRole("dialog", { name: "Profile" })).toBeVisible();
    await page.keyboard.press("Escape");
    await open(); await item("SETTINGS").click();
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
    await page.keyboard.press("Escape");
    await open(); await item("MESSAGES").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Phone/ })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await open(); await item("CLOSE").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await open(); await item("STUDY").click();
    await expect(page.getByRole("dialog")).toHaveCount(0); // STUDY closes the menu (that it starts a session is proven by its own test below)
  });

  test("opening the menu does not pause a running timer: the minute spent behind it is counted", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-22T12:00:00") });
    await page.goto("/?demo=true"); // the demo's timer is already running
    await page.clock.resume();
    const seconds = async () => {
      const text = ((await page.getByRole("group", { name: "Timer" }).textContent()) ?? "").replace(/\s+/g, "");
      const m = /(\d{1,2}):(\d{2})/.exec(text);
      if (!m) throw new Error(`no time in "${text}"`);
      return Number(m[1]) * 60 + Number(m[2]);
    };
    const before = await seconds();
    await page.keyboard.press("m");
    await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
    await page.clock.fastForward("01:00"); // a minute passes behind the menu
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect.poll(async () => before - (await seconds())).toBeGreaterThanOrEqual(60); // it kept counting while the menu was open
    expect(before - (await seconds())).toBeLessThan(66);
  });

  test("STUDY on an idle timer starts a session", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-22T12:00:00") });
    await page.goto("/"); // a real visit: the timer starts idle at 25:00
    await page.clock.resume();
    await page.getByRole("button", { name: "Press to enter" }).click();
    const timer = page.getByRole("group", { name: "Timer" });
    await expect(timer).toContainText("25:00");
    await page.getByRole("button", { name: "Menu (M)" }).click();
    await page.getByRole("dialog", { name: "Hideout" }).getByRole("button", { name: "STUDY" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.clock.fastForward("00:10");
    await expect(timer).not.toContainText("25:00"); // it is counting down
    await expect(timer).toContainText(/24:[45]\d/);
  });

  test("the tilted labels never overlap, so a click lands on the label it is on", async ({ page }) => {
    await page.goto("/?demo=true&at=menu");
    const dialog = page.getByRole("dialog", { name: "Hideout" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(800); // the labels have finished flying in
    const boxes = await dialog.getByRole("button").evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return { name: b.textContent, top: r.top, bottom: r.bottom }; }));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.top, `${boxes[i]!.name} overlaps ${boxes[i - 1]!.name}`).toBeGreaterThanOrEqual(boxes[i - 1]!.bottom);
  });

  test("moving the mouse onto a not-yet label highlights it, so the pointer is never left without feedback", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.getByRole("button", { name: "Menu (M)" }).click();
    const dialog = page.getByRole("dialog", { name: "Hideout" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700);
    const map = dialog.getByRole("button", { name: /MAP/ });
    await map.hover();
    await expect(map).toBeFocused();
    const outline = await map.evaluate((b) => { const c = getComputedStyle(b); return { width: c.outlineWidth, style: c.outlineStyle, color: c.outlineColor }; });
    expect(outline).toEqual({ width: "2px", style: "solid", color: "rgb(23, 228, 245)" }); // the teal accent
  });

  test("a mouse resting over the list does not take the highlight from the keyboard, but moving it does", async ({ page }) => {
    await page.goto("/?demo=true");
    const at = await restPointerOver(page, "MESSAGES"); // the pointer rests where that label will be
    await page.keyboard.press("m");
    const dialog = page.getByRole("dialog", { name: "Hideout" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700); // the labels have finished flying in
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.closest("[role=dialog] button")?.textContent, [at.x, at.y])).toContain("MESSAGES"); // the pointer really is over a label
    await expect(dialog.getByRole("button", { name: "STUDY" })).toBeFocused(); // the resting pointer did not move it
    await page.keyboard.press("ArrowDown");
    await expect(dialog.getByRole("button", { name: "MAP" })).toBeFocused();
    await dialog.getByRole("button", { name: "SETTINGS" }).hover(); // an actual move
    await expect(dialog.getByRole("button", { name: "SETTINGS" })).toBeFocused();
  });

  test("only the highlighted label is red: a resting pointer's hover does not paint a second one", async ({ page }) => {
    await page.goto("/?demo=true");
    const at = await restPointerOver(page, "PROFILE"); // rests over a label once the menu has opened
    await page.keyboard.press("m");
    const dialog = page.getByRole("dialog", { name: "Hideout" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700);
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.closest("[role=dialog] button")?.textContent, [at.x, at.y])).toContain("PROFILE"); // the pointer really is over a label
    const red = () => dialog.getByRole("button").evaluateAll((bs) => bs.filter((b) => getComputedStyle(b).backgroundColor === "rgb(221, 5, 7)").map((b) => b.textContent));
    expect(await red()).toEqual(["STUDY"]); // the keyboard highlight, and nothing else
    await page.keyboard.press("ArrowDown");
    expect(await red()).toEqual(["MAP"]); // the red moved with it
  });
});
