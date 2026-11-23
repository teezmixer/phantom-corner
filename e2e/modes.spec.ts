import { expect, test } from "./fixtures";

test.describe("demo mode", () => {
  test("lands mid-session with a mission, two todos and one unread message", async ({ page }) => {
    await page.goto("/?demo=true");
    await expect(page.getByRole("button", { name: "Press to enter" })).toHaveCount(0);
    await expect(page.getByLabel("Today's mission")).toHaveCount(0);
    await expect(page.getByText("Finish chapter 3")).toBeVisible();
    await expect(page.getByText("Summarise the reading")).toBeVisible();
    await expect(page.getByText("Do practice problems")).toBeVisible();
    await expect(page.getByRole("timer").first()).toContainText(/1[67]:\d\d/);
    await expect(page.getByRole("button", { name: "Phone, 1 unread" })).toBeVisible();
  });

  test("shows a Demo tag with the fan-project line and a link to how it was built", async ({ page }) => {
    await page.goto("/?demo=true");
    const link = page.getByRole("link", { name: "How this was built" });
    await expect(link).toHaveAttribute("href", "https://github.com/teezmixer/phantom-corner#how-this-was-built");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(page.getByText("Demo · Fan project ·")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("link", { name: "How this was built" })).toHaveCount(0); // only in the demo
  });

  test("&at=summary and &at=menu open those screens", async ({ page }) => {
    await page.goto("/?demo=true&at=summary");
    await expect(page.getByRole("dialog", { name: "Session complete" })).toBeVisible();
    await page.goto("/?demo=true&at=menu");
    await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
  });

  test("never touches real saved progress", async ({ page }) => {
    await page.goto("/?demo=true");
    await page.getByRole("button", { name: "Hide UI (H)" }).click();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("pc:")))).toEqual([]);
  });
});

test.describe("dev panel", () => {
  test("is absent by default and present with ?dev=true", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("complementary", { name: "Developer tools" })).toHaveCount(0);
    await page.goto("/?dev=true");
    await expect(page.getByRole("complementary", { name: "Developer tools" })).toBeVisible();
  });

  test("grants Knowledge, unlocks all, jumps to any location and screen, and resets", async ({ page }) => {
    await page.goto("/?dev=true");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.getByRole("button", { name: "+50 Knowledge" }).click();
    await expect(page.getByRole("group", { name: "Level and Knowledge" })).toContainText("Knowledge");
    await page.getByRole("button", { name: "Unlock all" }).click();

    await page.getByLabel("Jump to screen").selectOption("map");
    const map = page.getByRole("dialog", { name: "Map" });
    await expect(map.getByRole("button")).toHaveCount(13); // 12 locations + Close
    await expect(map.locator('[data-state="locked"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByLabel("Jump to location").selectOption("mementos");
    await expect(page.getByLabel("Current location: Mementos")).toBeVisible();

    await page.getByRole("button", { name: "Reset all data" }).click();
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
  });
});

test("the map shows locked, unlocked and current states for all twelve locations", async ({ page }) => {
  await page.goto("/?demo=true&at=menu"); // demo is level 2: map open, only LeBlanc unlocked
  await page.getByRole("button", { name: /MAP/ }).click();
  const map = page.getByRole("dialog", { name: "Map" });
  await expect(map.locator("[data-state]")).toHaveCount(12);
  await expect(map.locator('[data-state="current"]')).toHaveCount(1);
  await expect(map.locator('[data-state="locked"]')).toHaveCount(11);
});

test("every screen is reachable from the menu or settings and closes with Escape", async ({ page }) => {
  await page.goto("/?demo=true&at=menu");
  for (const [item, title] of [["PROFILE", "Profile"], ["SETTINGS", "Settings"]] as const) {
    await page.getByRole("button", { name: new RegExp(item) }).click();
    await expect(page.getByRole("dialog", { name: title })).toBeVisible();
    if (item === "SETTINGS") {
      for (const page_ of ["About", "Credits", "Privacy"]) {
        await page.getByRole("button", { name: page_, exact: true }).click();
        await expect(page.getByRole("dialog", { name: page_ })).toBeVisible();
        await page.keyboard.press("Escape"); // info pages close back to Settings
        await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
      }
    }
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Menu (M)" }).click();
  }
});

test("the phone lists the threads that have started, reveals a character's only when they unlock, adds the release note when onboarding ends, and clears the unread badge when one is read", async ({ page }) => {
  await page.goto("/?demo=true&dev=true");
  await page.getByRole("button", { name: "Phone, 1 unread" }).click();
  const phone = page.getByRole("region", { name: "Phone" });
  await expect(phone.getByRole("button", { name: "Morgana" })).toBeVisible();
  for (const title of ["Ryuji", "Ann", "Yusuke", "Makoto", "Futaba", "Haru", "Akechi", "What's new", "Feedback"]) await expect(phone.getByRole("button", { name: title })).toHaveCount(0); // nothing telegraphs what unlocks; the note and feedback wait for onboarding
  await page.getByRole("button", { name: "Unlock all" }).click();
  for (const title of ["Ryuji", "Ann", "Yusuke", "Makoto", "Futaba", "Haru", "Akechi"]) await expect(phone.getByRole("button", { name: title })).toBeVisible();
  await expect(phone.getByRole("button", { name: "What's new" })).toHaveCount(0);
  await page.keyboard.press("s"); // skip onboarding (the one key)
  for (const title of ["Morgana", "Ryuji", "Ann", "Yusuke", "Makoto", "Futaba", "Haru", "Akechi", "What's new", "Feedback"]) {
    await expect(phone.getByRole("button", { name: title })).toBeVisible();
  }
  await phone.getByRole("button", { name: /Morgana/ }).click();
  await expect(phone.getByText(/doing the talking/)).toBeVisible();
  await expect(phone.getByRole("log", { name: "Morgana" })).toBeVisible();
});

test("Hide UI hides the widgets but never the TV, and Show UI brings them back", async ({ page }) => {
  await page.goto("/?demo=true");
  await page.getByRole("button", { name: "Hide UI (H)" }).click();
  await expect(page.getByRole("region", { name: "Top left widgets" })).toHaveCount(0);
  const tv = page.getByRole("region", { name: "TV" });
  await expect(tv).toBeVisible();
  const box = await tv.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(200);
  expect(box!.height).toBeGreaterThanOrEqual(200);
  await page.getByRole("button", { name: "Show UI" }).click();
  await expect(page.getByRole("region", { name: "Top left widgets" })).toBeAttached();
});

test("todos can be added, ticked, deleted and the list collapsed", async ({ page }) => {
  await page.goto("/?demo=true");
  const todo = page.getByRole("group", { name: "Todo list" });
  await todo.getByLabel("Add a todo").fill("Review notes");
  await todo.getByRole("button", { name: "Add todo" }).click();
  await expect(todo.getByText("Review notes")).toBeVisible();
  await todo.getByLabel("Done: Review notes").check();
  await expect(todo.getByLabel("Done: Review notes")).toBeChecked();
  await todo.getByRole("button", { name: "Delete: Review notes" }).click();
  await expect(todo.getByText("Review notes")).toHaveCount(0);
  await todo.getByRole("button", { name: "Collapse todo list" }).click();
  await expect(todo.getByLabel("Add a todo")).toHaveCount(0);
});
