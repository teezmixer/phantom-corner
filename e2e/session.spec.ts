import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const KEY = "pc:v1";
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();
const waitForSaved = (page: Page, check: (raw: string) => boolean) =>
  expect.poll(async () => { const raw = await page.evaluate((k) => localStorage.getItem(k), KEY); return raw !== null && check(raw); }, { timeout: 5000 }).toBe(true);

test("the session length can be 10, 25 or 30 minutes", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  const timer = page.getByRole("timer").first();
  await expect(timer).toContainText("25:00");
  for (const [value, shown] of [["10", "10:00"], ["30", "30:00"], ["25", "25:00"]] as const) {
    await page.getByLabel("Session length").selectOption(value);
    await expect(timer).toContainText(shown);
  }
});

test("the countdown stays within a second of real time after the clock jumps, as in a throttled background tab", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.clock.resume();
  await enter(page);
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("05:00"); // five minutes pass in one jump, like a hidden tab waking up
  const text = await page.getByRole("timer").first().innerText();
  const [m, s] = text.split(":").map(Number);
  const left = m! * 60 + s!;
  expect(Math.abs(left - 20 * 60)).toBeLessThanOrEqual(1);
});

test("the mission has empty, set, editing and done states", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await expect(page.getByPlaceholder("What's today's mission?")).toBeVisible(); // empty
  await page.getByLabel("Today's mission").fill("Write essay");
  await page.getByRole("button", { name: "Set" }).click();
  await expect(page.getByText("Write essay")).toBeVisible(); // set
  await page.getByRole("button", { name: "Edit mission" }).click(); // editing
  const input = page.getByLabel("Today's mission");
  await expect(input).toHaveValue("Write essay");
  await input.fill("Write the intro");
  await page.getByRole("button", { name: "Set" }).click();
  await expect(page.getByText("Write the intro")).toBeVisible();
  await page.getByRole("checkbox", { name: "Mission done" }).click(); // done
  await expect(page.getByRole("checkbox", { name: "Mission done" })).toBeChecked();
});

test("a return visit shows the open mission and one click starts a session", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await page.getByLabel("Today's mission").fill("Finish chapter 3");
  await page.getByRole("button", { name: "Set" }).click();
  await waitForSaved(page, (raw) => raw.includes("Finish chapter 3"));
  await page.reload();
  await enter(page);
  await expect(page.getByText("Finish chapter 3")).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click(); // one click
  await expect(page.getByRole("timer").first()).toContainText(/2[45]:\d\d/);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test("a return visit can also start with Space", async ({ page }) => {
  await page.goto("/");
  await enter(page);
  await page.getByLabel("Today's mission").fill("Read");
  await page.getByRole("button", { name: "Set" }).click();
  await waitForSaved(page, (raw) => raw.includes('"Read"'));
  await page.reload();
  await enter(page);
  await page.keyboard.press(" ");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test.describe("end of a session", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.goto("/?demo=true");
    await page.clock.resume();
    await page.clock.fastForward("17:30");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
  });

  test("Go on starts the next session straight away", async ({ page }) => {
    await page.getByRole("button", { name: "Go on" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("timer").first()).toContainText(/2[45]:\d\d/);
  });

  test("the summary offers one more, with the focused minutes and one character line", async ({ page }) => {
    await page.getByRole("button", { name: "Call it" }).click();
    const summary = page.getByRole("dialog", { name: "Session complete" });
    await expect(summary).toContainText("25"); // minutes focused
    await expect(summary).toContainText(/Not bad\. Coffee's on me\. Once\.|Hm\. Acceptable work\.|Don't let it go to your head\./); // one of Sojiro's completion lines for LeBlanc
    await summary.getByRole("button", { name: "One more" }).click();
    await expect(page.getByRole("timer").first()).toContainText(/2[45]:\d\d/);
  });

  test("the Knowledge gained shows its final value at once under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Call it" }).click();
    // 25 focused minutes + 5 completion bonus = +30, with no counting animation to wait for
    await expect(page.getByRole("dialog", { name: "Session complete" })).toContainText("+30");
  });
});
