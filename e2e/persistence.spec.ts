import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const KEY = "pc:v1";
const stored = (page: Page) => page.evaluate((k) => window.localStorage.getItem(k), KEY);
/** Saves are debounced (~250 ms), so wait until the stored copy satisfies a check. */
const waitForSaved = (page: Page, check: (raw: string) => boolean) =>
  expect.poll(async () => { const raw = await stored(page); return raw !== null && check(raw); }, { timeout: 5000 }).toBe(true);

async function enter(page: Page) {
  await page.getByRole("button", { name: "Press to enter" }).click();
}

test("progress survives a reload: mission, todos, location, Knowledge and a running timer", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.clock.resume();
  await enter(page);
  await page.getByLabel("Today's mission").fill("Finish chapter 3");
  await page.getByRole("button", { name: "Set" }).click();
  await page.getByLabel("Add a todo").fill("Read notes");
  await page.getByRole("button", { name: "Add todo" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("10:00");
  await waitForSaved(page, (raw) => raw.includes("Finish chapter 3") && raw.includes("Read notes") && raw.includes('"running"'));

  await page.reload();
  await enter(page);
  await expect(page.getByText("Finish chapter 3")).toBeVisible();
  await expect(page.getByText("Read notes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible(); // level 2 was kept
  // ~15 minutes are left: the timer resumed from its end time, not from zero
  await expect(page.getByRole("timer").first()).toContainText(/1[45]:\d\d/);
});

test("a session that ended while the tab was closed still counts and waits at the choice", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await page.getByRole("button", { name: "Start" }).click();
  await waitForSaved(page, (raw) => raw.includes('"running"'));
  // Pretend the tab was closed and the timer ran out meanwhile
  await page.evaluate((k) => {
    const data = JSON.parse(window.localStorage.getItem(k)!);
    data.timer.endsAt = Date.now() - 1000;
    window.localStorage.setItem(k, JSON.stringify(data));
  }, KEY);
  // Navigating away runs the old page's pagehide flush; give the stored data a beat to settle, then load fresh
  await page.goto("about:blank");
  await page.evaluate(() => undefined).catch(() => undefined);
  await page.goto("/");
  await enter(page);
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
  await page.getByRole("button", { name: "Call it" }).click();
  await expect(page.getByRole("dialog", { name: "Session complete" })).toContainText("25");
});

test("unreadable saved data is backed up and the visit starts fresh, with Morgana saying so", async ({ page }) => {
  await page.addInitScript(([k]) => { if (!window.sessionStorage.getItem("seeded")) { window.localStorage.setItem(k as string, "{nope"); window.sessionStorage.setItem("seeded", "1"); } }, [KEY]);
  await page.goto("/");
  await expect(page.getByRole("status").filter({ hasText: "scrambled" })).toBeVisible();
  const backups = await page.evaluate((k) => Object.keys(window.localStorage).filter((x) => x.startsWith(`${k}:backup:`)), KEY);
  expect(backups).toHaveLength(1);
  expect(await page.evaluate((x) => window.localStorage.getItem(x), backups[0]!)).toBe("{nope");
  await enter(page);
  await expect(page.getByLabel("Today's mission")).toBeVisible(); // a clean start still works
});

test("blocked storage: the app still works for the visit and Morgana says it cannot write things down", async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => { throw new DOMException("blocked", "SecurityError"); };
    Storage.prototype.getItem = boom;
    Storage.prototype.setItem = boom;
    Storage.prototype.removeItem = boom;
  });
  await page.goto("/");
  await expect(page.getByRole("status").filter({ hasText: "can't write anything down" })).toBeVisible();
  await enter(page);
  await page.getByLabel("Today's mission").fill("Still works");
  await page.getByRole("button", { name: "Set" }).click();
  await expect(page.getByText("Still works")).toBeVisible();
});

test("the tab title counts down while a session runs, says Paused, and resets", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Phantom Corner");
  await enter(page);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveTitle(/^(25|24):\d\d · Phantom Corner$/);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page).toHaveTitle(/^Paused (25|24):\d\d · Phantom Corner$/);
  await page.getByRole("button", { name: "Stop" }).click(); // stopping from paused: nothing focused yet, back to idle
  await expect(page).toHaveTitle("Phantom Corner");
});

test("pause keeps the time left and resume continues from it", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.clock.resume();
  await enter(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("05:00");
  await page.getByRole("button", { name: "Pause" }).click();
  const pausedAt = await page.getByRole("timer").first().innerText();
  await page.clock.fastForward("20:00"); // a long while paused
  await expect(page.getByRole("timer").first()).toHaveText(pausedAt);
  await page.getByRole("button", { name: "Resume" }).click();
  await page.clock.fastForward("19:00");
  await expect(page.getByRole("dialog", { name: "Time." })).toHaveCount(0); // ~1 minute still left
  await page.clock.fastForward("01:30");
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
});

test("a custom session length is clamped to 5–120 minutes", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await page.getByLabel("Session length").selectOption("custom");
  const custom = page.getByLabel("Custom session length in minutes");
  await custom.fill("45");
  await custom.blur();
  await expect(page.getByRole("timer").first()).toContainText("45:00");
  await custom.fill("2");
  await custom.blur();
  await expect(page.getByRole("timer").first()).toContainText("05:00");
  await custom.fill("500");
  await custom.blur();
  await expect(page.getByRole("timer").first()).toContainText("120:00");
});

test("the mission can be marked done and that survives a reload", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await page.getByLabel("Today's mission").fill("Write essay");
  await page.getByRole("button", { name: "Set" }).click();
  await page.getByRole("checkbox", { name: "Mission done" }).click();
  await expect(page.getByRole("checkbox", { name: "Mission done" })).toBeChecked();
  await waitForSaved(page, (raw) => raw.includes('"done":true'));
  await page.reload();
  await enter(page);
  await expect(page.getByRole("checkbox", { name: "Mission done" })).toBeChecked();
});

test("a second tab shows the takeover screen and taking over moves the session", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
  const second = await context.newPage();
  await second.route("**/_vercel/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await second.goto("/");
  const message = "LeBlanc's already open in another tab.";
  await expect(second.getByRole("alertdialog", { name: message })).toBeVisible();
  await expect(second.getByRole("button", { name: "Press to enter" })).toHaveCount(0);

  await second.getByRole("button", { name: "Study here instead" }).click();
  await expect(second.getByRole("button", { name: "Press to enter" })).toBeVisible();
  await expect(page.getByRole("alertdialog", { name: message })).toBeVisible(); // the first tab gave way
  await second.close();
});

test("demo mode never takes the session lock or writes saved progress", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
  await waitForSaved(page, () => true);
  const before = await stored(page);
  const demo = await context.newPage();
  await demo.route("**/_vercel/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await demo.goto("/?demo=true");
  await expect(demo.getByText("Finish chapter 3")).toBeVisible();
  await demo.getByLabel("Add a todo").fill("demo only");
  await demo.getByRole("button", { name: "Add todo" }).click();
  await demo.waitForTimeout(600); // longer than the save debounce
  expect(await stored(demo)).toBe(before); // the demo changed nothing the real session saved
  await demo.close();
});
