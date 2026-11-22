import { expect, test } from "./fixtures";

/** The walking skeleton, end to end: enter → mission → short timer → summary → map → travel. */
test("a user can run the whole loop and travel to a newly unlocked location", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.clock.resume(); // time flows normally; we jump it with fastForward below

  await page.getByRole("button", { name: "Press to enter" }).click();
  await expect(page.getByRole("button", { name: "Map (N)" })).toHaveCount(0); // not earned yet

  // Mission → first Knowledge → level 2 → the map button appears
  await page.getByLabel("Today's mission").fill("Finish chapter 3");
  await page.getByRole("button", { name: "Set" }).click();
  await expect(page.getByRole("group", { name: "Level and Knowledge" })).toContainText("Knowledge");
  await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible();

  // Run a full 25-minute session
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("timer").first()).toContainText("25:00");
  await page.clock.fastForward("25:05");
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();

  // Finish → summary shows the focused minutes and mission
  await page.getByRole("button", { name: "Call it" }).click();
  const summary = page.getByRole("dialog", { name: "Session complete" });
  await expect(summary).toContainText("25");
  await expect(summary).toContainText("Mission: Finish chapter 3");
  await page.getByRole("button", { name: "Done for today" }).click();

  // The session unlocked Ryuji; travel there from the map
  await page.getByRole("button", { name: "Map (N)" }).click();
  const ryuji = page.getByRole("button", { name: /School rooftop/ });
  await expect(ryuji).toBeEnabled();
  await ryuji.click();
  await expect(page.getByRole("status")).toContainText("School rooftop"); // travel title card
  await page.clock.fastForward(2000);
  await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
});

test("take five opens a break that returns to the choice", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?demo=true");
  await page.clock.resume();
  await page.clock.fastForward("17:30"); // the demo timer runs out
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
  await page.getByRole("button", { name: "Take five" }).click();
  await expect(page.getByRole("dialog", { name: "Breathe." })).toBeVisible();
  await page.clock.fastForward("05:05");
  await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
});
