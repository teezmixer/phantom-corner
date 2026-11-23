import { expect, test } from "./fixtures";

test("ticking the mission done shows its banner", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Press to enter" }).click();
  await page.keyboard.press("s");
  await page.getByLabel("Today's mission").fill("Finish chapter 3");
  await page.getByRole("button", { name: "Set" }).click();
  await page.getByRole("checkbox", { name: "Mission done" }).click();
  // Banners queue (the Knowledge notice first), each for a few seconds; this one comes after them.
  await expect(page.getByRole("status").filter({ hasText: "Mission complete." })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("checkbox", { name: "Mission done" })).toBeChecked();
});

test("the break: pick a length, skip the rest, and a break that runs out says so", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 23, 12) });
  await page.goto("/?demo=true");
  await page.clock.resume();
  await page.clock.fastForward("17:30");
  await page.getByRole("button", { name: "Take five" }).click();
  const brk = page.getByRole("dialog", { name: "Breathe." });
  await expect(brk.getByRole("timer")).toContainText("05:00");
  await brk.getByRole("button", { name: "10 min", exact: true }).click();
  await expect(brk.getByRole("timer")).toContainText("10:00");
  await expect(brk.getByRole("button", { name: "10 min", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(brk.getByRole("button", { name: "5 min", exact: true })).toHaveAttribute("aria-pressed", "false");
  await brk.getByRole("button", { name: "Skip the rest" }).click();
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible(); // back to the choice
  await expect(page.getByText("Break's over.")).toHaveCount(0); // skipping says nothing

  await page.getByRole("button", { name: "Take five" }).click();
  await page.clock.fastForward("05:05");
  // The banners of the finished session are still queued ahead of this one.
  await expect(page.getByRole("status").filter({ hasText: "Break's over." })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
});
