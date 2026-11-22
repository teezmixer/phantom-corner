import { devices, expect, test } from "@playwright/test";

test("desktop shows the main screen with all four HUD corners", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Phantom Corner");
  for (const label of ["Top left widgets", "Top right widgets", "Bottom left widgets", "Bottom right widgets"]) {
    await expect(page.getByRole("region", { name: label })).toBeAttached();
  }
  await expect(page.getByLabel("Current location: Café Leblanc")).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("phone browsers", () => {
  const { userAgent, viewport, isMobile, hasTouch } = devices["iPhone 15"];
  test.use({ userAgent, viewport, isMobile, hasTouch });
  test("see the mobile gate instead of the app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("needs a bigger screen")).toBeVisible();
    await expect(page.getByRole("region", { name: "Top left widgets" })).toHaveCount(0);
  });
});
