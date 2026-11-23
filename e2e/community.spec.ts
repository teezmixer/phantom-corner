import { expect, test } from "./fixtures";
import { FakeCommunity } from "../src/community/fake";

// The numbers are made up (B-11): the line and the vote say "practice" wherever they show them.
const NOON = new Date(2026, 10, 23, 12);

test.describe("community (behind ?community=true, on made-up numbers)", () => {
  test("the room says how many are studying here, and that the number is practice", async ({ page }) => {
    const expected = await new FakeCommunity([]).presence("leblanc", NOON.getTime());
    test.skip(expected === 0, "a count of nothing shows no line; pick an hour that gives someone");
    await page.clock.install({ time: NOON });
    await page.goto("/?community=true");
    await page.clock.resume();
    await page.getByRole("button", { name: "Press to enter" }).click();
    const line = page.getByRole("status").filter({ hasText: "studying here" });
    await expect(line).toContainText(expected === 1 ? "1 Phantom Thief is studying here" : `${expected} Phantom Thieves are studying here`);
    await expect(line).toContainText("practice numbers");
  });

  test("the map takes one vote for a bonus place, and a second vote moves it", async ({ page }) => {
    await page.goto("/?community=true");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.keyboard.press("s");
    await page.getByLabel("Today's mission").fill("x");
    await page.getByRole("button", { name: "Set" }).click();
    await page.getByRole("button", { name: "Map (N)" }).click();
    const panel = page.getByRole("region", { name: "Which place should open next?" });
    const options = panel.getByRole("button");
    await expect(options).toHaveCount(4);
    await options.nth(0).click();
    await expect(options.nth(0)).toHaveAttribute("aria-pressed", "true");
    await options.nth(2).click();
    await expect(options.nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(options.nth(0)).toHaveAttribute("aria-pressed", "false");
    await expect(panel).toContainText("A practice vote");
  });

  test("without the switch there is no presence line and no vote", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.keyboard.press("s");
    await page.getByLabel("Today's mission").fill("x");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByText("studying here")).toHaveCount(0);
    await page.getByRole("button", { name: "Map (N)" }).click();
    await expect(page.getByRole("region", { name: "Which place should open next?" })).toHaveCount(0);
  });
});
