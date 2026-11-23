import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// The journeys of spec §3.1, walked as a real user in one browser, start to finish. They always assert; with JOURNEYS=1 they also
// save a screenshot of each step into docs/build/screens/M13 for the final review.
const SHOTS = !!process.env.JOURNEYS;
const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  await page.waitForTimeout(700); // let entrances settle
  await page.screenshot({ path: `docs/build/screens/M13/${name}.jpg`, type: "jpeg", quality: 70 });
};
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();

test.describe("journeys (spec §3.1)", () => {
  test("first visit, return visit, a session, an unlock and a trip", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.clock.install({ time: new Date(2026, 10, 23, 12) });
    await page.goto("/");
    await page.clock.resume();

    // First visit: a black splash with one call to action and the fan-project line.
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeFocused();
    await expect(page.getByText(/fan-made, non-commercial/)).toBeVisible();
    await shot(page, "1-first-visit-splash");
    await enter(page);
    // Morgana speaks in the phone; the player gives a name, then the mission.
    const phone = page.getByRole("region", { name: "Phone" });
    await expect(phone.getByRole("log")).toContainText("Door's open");
    await shot(page, "2-first-visit-onboarding");
    await phone.getByLabel("Your name").fill("Ren");
    await phone.getByRole("button", { name: "Send" }).click();
    await expect(page.getByLabel("Today's mission")).toBeFocused(); // Morgana asks for the mission: the cursor is already in the box
    await page.getByLabel("Today's mission").fill("Finish chapter 3");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible();
    await shot(page, "3-first-visit-mission-set");

    // The session loop: start, the room stays calm, time is up, the choice, the summary.
    await page.getByRole("button", { name: "Start" }).click();
    await shot(page, "4-session-running");
    await page.clock.fastForward("25:05");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
    await shot(page, "5-session-time-up");
    await page.getByRole("button", { name: "Call it" }).click();
    await expect(page.getByRole("dialog", { name: "Session complete" })).toContainText("Mission: Finish chapter 3");
    await shot(page, "6-session-summary");
    await page.getByRole("button", { name: "Done for today" }).click();

    // Unlock and travel: Ryuji's message, the map, the trip, the arrival.
    await page.getByRole("button", { name: "Map (N)" }).click();
    await shot(page, "7-map-ryuji-open");
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.runFor(700);
    await shot(page, "8-travel-title-card");
    await page.clock.runFor(1000);
    await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
    await shot(page, "9-arrived-at-the-rooftop");

    // Return visit: reload; the splash again; Sojiro says the player is back; the place and the mission are where they were.
    await page.reload();
    await enter(page);
    await expect(page.getByRole("status").filter({ hasText: "Ah, you're back." })).toBeVisible();
    await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
    await expect(page.getByText("Finish chapter 3")).toBeVisible();
    await shot(page, "10-return-visit");
  });

  test("the demo visitor sees a living room within ten seconds, with the demo tag and the fan line", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const start = Date.now();
    await page.goto("/?demo=true");
    await expect(page.getByRole("timer").first()).toContainText(/1[67]:\d\d/);
    await expect(page.getByText("Finish chapter 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Phone, 1 unread" })).toBeVisible();
    await expect(page.getByRole("link", { name: "How this was built" })).toBeVisible();
    expect(Date.now() - start).toBeLessThan(10_000);
    await shot(page, "11-demo-first-look");
  });

  test("a long-term user: every place open, the phone full, the profile and the map", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?dev=true");
    await enter(page);
    await page.getByRole("button", { name: "+50 Knowledge" }).click();
    await page.getByRole("button", { name: "Unlock all" }).click();
    await page.getByLabel("Jump to screen").selectOption("map");
    await expect(page.getByRole("dialog", { name: "Map" }).locator('[data-state="locked"]')).toHaveCount(0);
    await shot(page, "12-long-term-map-all-open");
    await page.getByLabel("Jump to screen").selectOption("profile");
    await expect(page.getByRole("dialog", { name: "Profile" }).getByRole("listitem").first()).toBeVisible();
    await shot(page, "13-long-term-profile");
  });
});
