import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const stored = (page: Page) => page.evaluate(() => window.localStorage.getItem("pc:v1"));
const savedDays = async (page: Page): Promise<{ day: string; style: number }[]> => JSON.parse((await stored(page)) ?? "{}").studiedDays ?? [];
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();
const DAY1 = new Date(2026, 10, 23, 12); // Monday 23 November 2026, local noon

async function start(page: Page, time: Date = DAY1) {
  await page.clock.install({ time });
  await page.goto("/");
  await page.clock.resume();
  await enter(page);
}

/** Run one full session and land on its summary. */
async function finishSession(page: Page) {
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("25:05");
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
  await page.getByRole("button", { name: "Call it" }).click();
  await expect(page.getByRole("dialog", { name: "Session complete" })).toBeVisible();
}

test.describe("calendar of studied days", () => {
  test("a finished session stamps today in the summary, and the day is saved", async ({ page }) => {
    await start(page);
    await finishSession(page);
    const summary = page.getByRole("dialog", { name: "Session complete" });
    await expect(summary.getByText("Today is stamped.")).toBeVisible();
    await expect(summary.getByRole("heading", { name: "November 2026" })).toBeVisible();
    await expect(summary.locator('[data-day="2026-11-23"]')).toHaveAttribute("data-stamp", "stamp");
    await expect(summary.locator('[data-day="2026-11-23"]')).toHaveAttribute("aria-current", "date");
    await expect(summary.locator("[data-stamp]")).toHaveCount(1);
    await expect.poll(() => savedDays(page)).toEqual([{ day: "2026-11-23", style: 0 }]);
  });

  test("a second day adds a second stamp; the calendar has no counter and no streak", async ({ page }) => {
    await start(page);
    await finishSession(page);
    await page.getByRole("button", { name: "Done for today" }).click();
    await page.clock.fastForward("24:00:00"); // the next day
    await finishSession(page);
    const summary = page.getByRole("dialog", { name: "Session complete" });
    await expect(summary.locator("[data-stamp]")).toHaveCount(2);
    await expect(summary.locator('[data-day="2026-11-23"]')).toHaveAttribute("data-stamp", "stamp");
    await expect(summary.locator('[data-day="2026-11-24"]')).toHaveAttribute("data-stamp", "stamp");
    const text = (await summary.textContent()) ?? "";
    expect(text).not.toMatch(/streak|in a row|consecutive|broken|\d+\s*days/i);
    await expect.poll(async () => (await savedDays(page)).map((d) => d.day)).toEqual(["2026-11-23", "2026-11-24"]);
  });

  test("two sessions on the same day stamp it once", async ({ page }) => {
    await start(page);
    await finishSession(page);
    await page.getByRole("button", { name: "One more" }).click();
    await page.clock.fastForward("25:05");
    await page.getByRole("button", { name: "Call it" }).click();
    await expect(page.getByRole("dialog", { name: "Session complete" }).locator("[data-stamp]")).toHaveCount(1);
    await expect.poll(async () => (await savedDays(page)).length).toBe(1);
  });

  test("a session stopped under five minutes does not stamp the day, and the summary does not say it did", async ({ page }) => {
    await start(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.clock.fastForward("03:00");
    await page.getByRole("button", { name: "Stop" }).click();
    const summary = page.getByRole("dialog", { name: "Session complete" });
    await expect(summary).toBeVisible();
    await expect(summary.getByText("Today is stamped.")).toHaveCount(0);
    await expect(summary.locator("[data-stamp]")).toHaveCount(0);
  });

  test("a stamp survives a reload and is drawn again afterwards, next to a new one", async ({ page }) => {
    await start(page);
    await finishSession(page);
    await expect.poll(() => savedDays(page)).toEqual([{ day: "2026-11-23", style: 0 }]); // the save has happened before we reload
    await page.getByRole("button", { name: "Done for today" }).click();
    await page.clock.fastForward("24:00:00"); // the next day
    await page.reload();
    await enter(page);
    await finishSession(page); // a session on the second day, in a page that has loaded yesterday's stamp from storage
    const summary = page.getByRole("dialog", { name: "Session complete" });
    await expect(summary.locator("[data-stamp]")).toHaveCount(2);
    await expect(summary.locator('[data-day="2026-11-23"]')).toHaveAttribute("data-stamp", "stamp"); // drawn from what was stored
    await expect(summary.locator('[data-day="2026-11-24"]')).toHaveAttribute("data-stamp", "stamp");
  });
});

test.describe("level gifts", () => {
  test("the first level-up gives the map, announced after the level, one banner at a time", async ({ page }) => {
    await start(page);
    await page.getByLabel("Today's mission").fill("Read");
    await page.getByRole("button", { name: "Set" }).click();
    const banner = page.locator("div[role=status] p");
    await expect(banner).toHaveText("+10 Knowledge");
    await page.clock.fastForward(3600);
    await expect(banner).toHaveText("Level 2");
    await page.clock.fastForward(3600);
    await expect(banner).toHaveText("Morgana: There's a map now. Don't wander off.");
    await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible();
  });

  test("a session that finished while the tab was closed brings its Knowledge, level and gift when the player comes back", async ({ page }) => {
    await start(page);
    await page.getByRole("button", { name: "Start" }).click();
    await expect.poll(async () => JSON.parse((await stored(page)) ?? "{}").timer?.status).toBe("running");
    // Make the saved session end a minute ago, as if the tab had been closed for the rest of it. A script that runs when the NEXT page loads
    // makes the edit: the old page is gone by then (its unload save has happened), so nothing can write over it.
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("expired")) return;
      const raw = window.localStorage.getItem("pc:v1");
      if (!raw) return;
      const saved = JSON.parse(raw);
      saved.timer.endsAt = Date.now() - 60_000;
      window.localStorage.setItem("pc:v1", JSON.stringify(saved));
      window.sessionStorage.setItem("expired", "1");
    });
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible(); // the finished session waits for its choice
    const banner = page.locator("div[role=status] p");
    await expect(banner).toHaveText("+30 Knowledge");
    await page.clock.fastForward(3600);
    await expect(banner).toHaveText("Level 2");
    await page.clock.fastForward(3600);
    await expect(banner).toHaveText("Morgana: There's a map now. Don't wander off.");
  });
});
