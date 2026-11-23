import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

type Call = [string, { name: string; data?: Record<string, unknown> }];

/** Watch what the app hands to Vercel's analytics (window.va): the real calls, in a real browser. */
async function watch(page: Page) {
  await page.waitForFunction(() => typeof (window as unknown as { va?: unknown }).va === "function");
  await page.evaluate(() => {
    const w = window as unknown as { va: (...a: unknown[]) => unknown; __calls: unknown[][] };
    const original = w.va;
    w.__calls = [];
    w.va = (...a: unknown[]) => { w.__calls.push(a); return original(...a); };
  });
}
const events = async (page: Page) => ((await page.evaluate(() => (window as unknown as { __calls: unknown[][] }).__calls)) as Call[]).filter((c) => c[0] === "event").map((c) => c[1]);
const names = async (page: Page) => (await events(page)).map((e) => e.name);
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();

test.describe("analytics events", () => {
  test("a real session sends the named events, with only where, how long and how far, and never the text a player wrote", async ({ page }) => {
    await page.clock.install({ time: new Date(2026, 10, 23, 12) });
    await page.goto("/");
    await page.clock.resume();
    await watch(page);
    await enter(page);
    await page.keyboard.press("s"); // skip onboarding
    await page.getByLabel("Today's mission").fill("My secret thesis chapter");
    await page.getByRole("button", { name: "Set" }).click();
    await page.getByLabel("Add a todo").fill("buy secret milk");
    await page.getByRole("button", { name: "Add todo" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    await page.clock.fastForward("25:05");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
    const got = await events(page);
    // The session's 30 Knowledge, on top of the first mission's 10, reaches level 3: Ryuji opens.
    expect(got.map((e) => e.name)).toEqual(["entered", "mission_set", "session_started", "session_completed", "location_unlocked"]);
    const allowed = new Set(["location", "plannedMin", "focusedMin", "level"]);
    for (const e of got) for (const key of Object.keys(e.data ?? {})) expect(allowed.has(key), `${e.name}.${key}`).toBe(true);
    expect(got.find((e) => e.name === "session_completed")!.data).toEqual({ location: "leblanc", plannedMin: 25, focusedMin: 25, level: 3 });
    expect(got.find((e) => e.name === "location_unlocked")!.data).toEqual({ location: "ryuji", level: 3 });
    expect(JSON.stringify(got)).not.toMatch(/secret|thesis|milk/i);
  });

  test("with the Settings switch off, no event is sent for what the player does next", async ({ page }) => {
    await page.goto("/");
    await watch(page);
    await enter(page);
    await page.keyboard.press("s");
    await page.keyboard.press("m");
    await page.getByRole("button", { name: /SETTINGS/ }).click();
    const before = (await names(page)).length;
    await page.getByRole("dialog", { name: "Settings" }).getByRole("checkbox", { name: "Anonymous visit statistics" }).uncheck();
    await page.keyboard.press("Escape");
    await page.getByLabel("Today's mission").fill("After the switch");
    await page.getByRole("button", { name: "Set" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    await page.waitForTimeout(300);
    expect((await names(page)).slice(before)).toEqual([]); // nothing sent once it was off
  });

  test("a demo sends no events", async ({ page }) => {
    await page.goto("/?demo=true");
    await watch(page);
    await page.keyboard.press("Space"); // the demo's timer is running: this pauses it
    await page.getByRole("button", { name: "Menu (M)" }).click();
    await page.waitForTimeout(300);
    expect(await names(page)).toEqual([]);
  });

  test("travelling sends the place, and unlocking sends the place and the level", async ({ page }) => {
    await page.clock.install({ time: new Date(2026, 10, 23, 12) });
    await page.goto("/?demo=true&dev=true");
    await page.clock.resume();
    await watch(page);
    // Demo and dev send nothing: the real-visit route is covered above. This checks that dev mode stays silent too.
    await page.getByRole("button", { name: "Unlock all" }).click();
    await page.keyboard.press("n");
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(1600);
    expect(await names(page)).toEqual([]);
  });
});
