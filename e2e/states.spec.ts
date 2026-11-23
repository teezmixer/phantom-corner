import { expect, test as raw } from "@playwright/test";
import { stubExternal } from "./fixtures";

// Spec §3.11, one test per state we can force. These provoke failures on purpose (React reports the error it caught; the
// browser logs a failed network load), so they use Playwright's own `test`, not the project's, which fails on any console error.
// Uncaught exceptions still fail the offline test.

raw.describe("app error", () => {
  raw.beforeEach(async ({ page }) => { await stubExternal(page); });

  raw("a broken screen shows Sojiro's line and one Reload button, and the rest of the app stays", async ({ page }) => {
    await page.goto("/?dev=true");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.getByRole("button", { name: "Crash a screen" }).click();
    const card = page.getByTestId("app-error");
    await expect(card).toContainText("Something broke. Don't look at me. Reload, I'll keep your seat.");
    await expect(card.getByRole("button")).toHaveCount(1);
    await expect(page.getByRole("complementary", { name: "Developer tools" })).toBeVisible(); // outside the screen's boundary
  });

  raw("a broken app shows the same card, and Reload reloads the page", async ({ page }) => {
    await page.goto("/?dev=true");
    await page.evaluate(() => { (window as unknown as { __marker: boolean }).__marker = true; });
    await page.getByRole("button", { name: "Crash the app" }).click();
    await expect(page.getByTestId("app-error")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reload" })).toBeFocused();
    await Promise.all([page.waitForNavigation(), page.getByRole("button", { name: "Reload" }).click()]);
    await expect(page.getByTestId("app-error")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBeUndefined(); // a fresh page
  });
});

raw.describe("offline (YouTube unreachable)", () => {
  raw("the timer, mission and todos keep working; only the TV says it cannot play", async ({ page, context }) => {
    await stubExternal(page);
    const uncaught: string[] = [];
    page.on("pageerror", (e) => uncaught.push(e.message));
    await page.route("https://www.youtube.com/iframe_api", (route) => route.abort("internetdisconnected")); // later routes win over the stub
    await page.goto("/");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await context.setOffline(true);

    await page.getByLabel("Today's mission").fill("Read offline");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByText("Read offline")).toBeVisible();

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("timer").first()).toContainText(/2[45]:\d\d/);

    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("region", { name: "TV" }).getByRole("status")).toHaveText("That tape's gone. Skipping it.");
    await expect(page.getByRole("timer").first()).toContainText(/2[45]:\d\d/); // the session carries on
    expect(uncaught).toEqual([]);
  });
});
