import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const stored = (page: Page) => page.evaluate(() => window.localStorage.getItem("pc:v1"));
const savedStory = async (page: Page) => JSON.parse((await stored(page)) ?? "{}").story ?? {};
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();
const phone = (page: Page) => page.getByRole("region", { name: "Phone" });
/** Show the phone's list of threads: open the phone if it is shut, and step back out of a thread if one is showing. */
async function phoneList(page: Page) {
  const toggle = page.getByRole("button", { name: /^Phone/ });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  const open = phone(page).getByRole("log");
  if (await open.count()) await phone(page).getByRole("button", { name: (await open.getAttribute("aria-label"))!, exact: true }).click();
}
const log = (page: Page, title: string) => phone(page).getByRole("log", { name: title });

async function firstVisit(page: Page, clock = true) {
  if (clock) await page.clock.install({ time: new Date(2026, 10, 23, 12) });
  await page.goto("/");
  if (clock) await page.clock.resume();
  await enter(page);
}

test.describe("onboarding", () => {
  test("a first visit opens the phone on Morgana, who greets, asks for a name and takes it", async ({ page }) => {
    await firstVisit(page);
    await expect(page.getByRole("button", { name: /^Phone/ })).toHaveAttribute("aria-expanded", "true");
    await expect(log(page, "Morgana")).toContainText("Door's open. Sit wherever.");
    await expect(log(page, "Morgana")).toContainText("I'm Morgana");
    await expect(log(page, "Morgana")).toContainText("What do I call you?");
    await phone(page).getByRole("textbox", { name: "Your name" }).fill("Ren");
    await phone(page).getByRole("button", { name: "Send" }).click();
    await expect(log(page, "Morgana")).toContainText("Ren. Fine. It suits you.");
    await expect(log(page, "Morgana")).toContainText("What's today's mission?"); // Ares's line, word for word
    await expect(phone(page).getByRole("textbox", { name: "Your name" })).toHaveCount(0);
    // The name is the player's name from here on: it shows in the profile.
    await page.keyboard.press("Escape"); // close the phone
    await page.keyboard.press("m");
    await page.getByRole("button", { name: /PROFILE/ }).click();
    await expect(page.getByRole("dialog", { name: "Profile" })).toContainText("Ren");
  });

  test("the whole conversation: name, mission, first Knowledge and the map, a session, then Ryuji's message and arrival", async ({ page }) => {
    await firstVisit(page);
    await expect(page.getByRole("button", { name: "Map (N)" })).toHaveCount(0); // not earned yet
    await phone(page).getByRole("textbox", { name: "Your name" }).fill("Ren");
    await phone(page).getByRole("button", { name: "Send" }).click();

    await page.getByLabel("Today's mission").fill("Read chapter 3");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByRole("group", { name: "Mission" }).getByText("Read chapter 3")).toBeVisible(); // the mission widget shows what was written
    await expect(log(page, "Morgana")).toContainText("That's already worth something");
    await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible(); // level 2
    await expect(log(page, "Morgana")).toContainText("start the timer");

    await page.getByRole("button", { name: "Start" }).click();
    await page.clock.fastForward("25:05");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
    await expect(log(page, "Morgana")).toContainText("Someone's been waiting to hear from you");
    await page.getByRole("button", { name: "Call it" }).click();
    await page.getByRole("button", { name: "Done for today" }).click();

    // Ryuji's message arrived, unread, because the session reached his level.
    await expect(page.getByRole("button", { name: /^Phone, \d+ unread/ })).toBeVisible();
    await phoneList(page);
    await phone(page).getByRole("button", { name: /Ryuji/ }).click();
    await expect(log(page, "Ryuji")).toContainText("Found a spot");
    await expect(log(page, "Ryuji")).not.toContainText("Took you long enough"); // not until you get there

    // Travel to the roof: the arrival exchange plays, once.
    await page.getByRole("button", { name: "Map (N)" }).click();
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.fastForward(2000);
    await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
    await phoneList(page);
    await phone(page).getByRole("button", { name: /Ryuji/ }).click();
    await expect(log(page, "Ryuji")).toContainText("Took you long enough");
    const lines = await log(page, "Ryuji").locator("p").count();
    await page.getByRole("button", { name: "Map (N)" }).click();
    await page.getByRole("button", { name: /Café Leblanc|LeBlanc/i }).first().click();
    await page.clock.fastForward(2000);
    await page.getByRole("button", { name: "Map (N)" }).click();
    await page.getByRole("button", { name: /School rooftop/ }).click();
    await page.clock.fastForward(2000);
    expect(await log(page, "Ryuji").locator("p").count()).toBe(lines); // arriving again says nothing new
  });

  test("S skips it at any point: the thread ends, the map is there, and what was said stays readable", async ({ page }) => {
    await firstVisit(page, false);
    await expect(page.getByRole("button", { name: "Map (N)" })).toHaveCount(0);
    await page.keyboard.press("s");
    await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible(); // level 2 from the skipped first Knowledge
    await expect(phone(page).getByRole("button", { name: "Skip (S)" })).toHaveCount(0);
    await expect(log(page, "Morgana")).toContainText("What do I call you?"); // still readable
    await expect(phone(page).getByRole("textbox", { name: "Your name" })).toHaveCount(0); // and nothing more is asked
  });

  test("the skip button does the same", async ({ page }) => {
    await firstVisit(page, false);
    await phone(page).getByRole("button", { name: "Skip (S)" }).click();
    await expect(page.getByRole("button", { name: "Map (N)" })).toBeVisible();
  });

  test("typing an S in the name does not skip it", async ({ page }) => {
    await firstVisit(page, false);
    await phone(page).getByRole("textbox", { name: "Your name" }).pressSequentially("Sam");
    await expect(phone(page).getByRole("textbox", { name: "Your name" })).toHaveValue("Sam");
    await expect(phone(page).getByRole("button", { name: "Skip (S)" })).toBeVisible(); // still running
  });

  test("it runs once: after a reload there is no onboarding, the phone stays shut, and the thread can be read again", async ({ page }) => {
    await firstVisit(page, false);
    await phone(page).getByRole("textbox", { name: "Your name" }).fill("Ren");
    await phone(page).getByRole("button", { name: "Send" }).click();
    await expect.poll(async () => (await savedStory(page)).morgana?.messages?.length).toBeGreaterThan(3);
    const before = (await savedStory(page)).morgana.messages.length;
    await page.reload();
    await enter(page);
    await expect(page.getByRole("button", { name: /^Phone/ })).toHaveAttribute("aria-expanded", "false"); // no pop-up on a return
    await expect(page.getByText("Ah, you're back.")).toBeVisible(); // Sojiro's greeting, for a returning player
    await page.getByRole("button", { name: /^Phone/ }).click();
    await phone(page).getByRole("button", { name: /Morgana/ }).click();
    await expect(log(page, "Morgana")).toContainText("Ren. Fine. It suits you."); // the conversation is still there
    expect(await log(page, "Morgana").locator("p").count()).toBe(before);
  });
});

test.describe("what's new and feedback", () => {
  test("a returning player has the release note and a feedback thread; feedback is kept on this device", async ({ page }) => {
    await firstVisit(page, false);
    await page.keyboard.press("s");
    await phoneList(page);
    await expect(phone(page).getByRole("button", { name: /What's new/ })).toBeVisible();
    await phone(page).getByRole("button", { name: /What's new/ }).click();
    await expect(log(page, "What's new")).toContainText("Everyone who asked for this: thank you");
    await phone(page).getByRole("button", { name: "What's new" }).click(); // back
    await phone(page).getByRole("button", { name: /Feedback/ }).click();
    await phone(page).getByRole("textbox", { name: "Write feedback" }).fill("More rain, please");
    await phone(page).getByRole("button", { name: "Send" }).click();
    await expect(log(page, "Feedback")).toContainText("More rain, please");
    await expect.poll(async () => JSON.stringify((await savedStory(page)).feedback ?? {})).toContain("More rain, please");
    await page.reload();
    await enter(page);
    await phoneList(page);
    await phone(page).getByRole("button", { name: /Feedback/ }).click();
    await expect(log(page, "Feedback")).toContainText("More rain, please"); // still there
  });
});

test.describe("dev tools", () => {
  test("the dev panel replays onboarding from the start", async ({ page }) => {
    await page.goto("/?demo=true&dev=true");
    await page.getByRole("button", { name: "Replay onboarding" }).click();
    await expect(page.getByRole("button", { name: /^Phone/ })).toHaveAttribute("aria-expanded", "true");
    await expect(log(page, "Morgana")).toContainText("I'm Morgana");
    await expect(phone(page).getByRole("textbox", { name: "Your name" })).toBeVisible();
  });

  test("unlocking everything brings an unread message from each character", async ({ page }) => {
    await page.goto("/?demo=true&dev=true");
    await page.getByRole("button", { name: "Unlock all" }).click();
    await expect(page.getByRole("button", { name: /^Phone, \d+ unread/ })).toBeVisible();
    await page.getByRole("button", { name: /^Phone/ }).click();
    for (const title of ["Ryuji", "Ann", "Yusuke", "Makoto", "Futaba", "Haru", "Akechi"]) await expect(phone(page).getByRole("button", { name: new RegExp(title) }).getByRole("img", { name: "unread" })).toBeVisible();
  });
});
