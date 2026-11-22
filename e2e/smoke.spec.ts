import { devices } from "@playwright/test";
import { expect, test } from "./fixtures";

test("desktop opens on the splash, and entering shows the room with all four HUD corners", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Phantom Corner");
  await expect(page.getByText(/fan-made, non-commercial/)).toBeVisible();
  await page.getByRole("button", { name: "Press to enter" }).click();
  for (const label of ["Top left widgets", "Top right widgets", "Bottom left widgets", "Bottom right widgets"]) {
    await expect(page.getByRole("region", { name: label })).toBeAttached();
  }
  await expect(page.getByLabel("Current location: Café Leblanc")).toBeVisible();
});

test.describe("phone browsers", () => {
  const { userAgent, viewport, isMobile, hasTouch } = devices["iPhone 15"];
  test.use({ userAgent, viewport, isMobile, hasTouch });
  test("see the mobile gate instead of the app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /doesn't fit in your pocket/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Press to enter" })).toHaveCount(0);
  });
});
