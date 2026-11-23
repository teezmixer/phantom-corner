import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const KNOWN_CODE = "123456"; // the practice backend's code, shown on the panel

/** A first visit, skipped onboarding, one 25-minute session (Ryuji opens at level 3), and a trip to his rooftop. */
async function reachRyuji(page: Page, query: string) {
  await page.clock.install({ time: new Date(2026, 10, 23, 12) });
  await page.goto(`/${query}`);
  await page.clock.resume();
  await page.getByRole("button", { name: "Press to enter" }).click();
  await page.keyboard.press("s");
  await page.getByLabel("Today's mission").fill("Read chapter 3");
  await page.getByRole("button", { name: "Set" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("25:05");
  await page.getByRole("button", { name: "Call it" }).click();
  await page.getByRole("button", { name: "Done for today" }).click();
  await page.getByRole("button", { name: "Map (N)" }).click();
  await page.getByRole("button", { name: /School rooftop/ }).click();
  await page.clock.runFor(1600);
  await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
}

test.describe("accounts (behind ?accounts=true, against the practice backend)", () => {
  test("on arrival at Ryuji's place Morgana asks to save; Yes opens Settings, where an emailed code signs in; sign out keeps progress", async ({ page }) => {
    await reachRyuji(page, "?accounts=true");
    const phone = page.getByRole("button", { name: /^Phone/ });
    if ((await phone.getAttribute("aria-expanded")) !== "true") await phone.click(); // an arrival may already have opened it
    await expect(phone).toHaveAttribute("aria-expanded", "true");
    const backToList = page.getByRole("log").first(); // the phone may be showing a thread (the first one opens by itself)
    if (await backToList.count()) await page.getByRole("region", { name: "Phone" }).getByRole("button", { name: "Morgana" }).first().click();
    await page.getByRole("button", { name: /Save progress/ }).click();
    await expect(page.getByRole("log", { name: "Save progress" })).toContainText("Hold up — want to save your progress?");
    await page.getByRole("button", { name: "Yes, save it" }).click();

    const settings = page.getByRole("dialog", { name: "Settings" });
    await expect(settings).toBeVisible();
    await expect(settings.getByText(/Practice mode/)).toBeVisible();
    await settings.getByLabel("Email").fill("ren@example.com");
    await settings.getByRole("button", { name: "Send code" }).click();
    await settings.getByLabel("Six-digit code").fill(KNOWN_CODE);
    await settings.getByRole("button", { name: "Sign in" }).click();
    await expect(settings.getByText("Signed in as ren@example.com")).toBeVisible();
    await expect(settings.getByRole("status").first()).toContainText("Saved to the practice account");

    await settings.getByRole("button", { name: "Sign out" }).click();
    await expect(settings.getByLabel("Email")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Read chapter 3")).toBeVisible(); // the mission, and the rest of the progress, stayed
    await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
  });

  test("without the switch the same trip brings no save prompt, and Settings shows no account panel", async ({ page }) => {
    await reachRyuji(page, ""); // a normal visit: Ryuji's place is reached, and nothing of accounts shows
    const phone = page.getByRole("button", { name: /^Phone/ });
    if ((await phone.getAttribute("aria-expanded")) !== "true") await phone.click();
    const backToList = page.getByRole("log").first();
    if (await backToList.count()) await page.getByRole("region", { name: "Phone" }).getByRole("button", { name: "Morgana" }).first().click();
    await expect(page.getByRole("button", { name: /Ryuji/ })).toBeVisible(); // the list is showing, and Ryuji is in it…
    await expect(page.getByRole("button", { name: /Save progress/ })).toHaveCount(0); // …but not the save thread
    await page.keyboard.press("m");
    await page.getByRole("button", { name: /SETTINGS/ }).click();
    const settings = page.getByRole("dialog", { name: "Settings" });
    await expect(settings.getByText("Accounts: not yet.")).toBeVisible();
    await expect(settings.getByLabel("Email")).toHaveCount(0);
  });
});
