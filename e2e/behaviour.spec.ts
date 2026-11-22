import { expect, test } from "./fixtures";

test("a finished session can lead to the map, travel, and a fresh session without getting stuck", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?demo=true");
  await page.clock.resume();
  await page.clock.fastForward("17:30");
  await page.getByRole("dialog", { name: "Time." }).getByRole("button", { name: "Go somewhere else" }).click();
  await page.keyboard.press("Escape"); // close the map without travelling
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible(); // a finished timer still offers Start
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("timer").first()).toContainText("25:00");
});

test("travelling mid-session keeps the timer running", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?demo=true&dev=true");
  await page.clock.resume();
  await page.getByRole("button", { name: "Unlock all" }).click();
  await page.getByLabel("Jump to screen").selectOption("map");
  await page.getByRole("button", { name: /School rooftop/ }).click();
  await page.clock.fastForward(2000);
  await expect(page.getByLabel("Current location: School rooftop")).toBeVisible();
  await expect(page.getByRole("timer").first()).toContainText(/1[56]:\d\d/);
});

test("keyboard shortcuts: M menu, N map, H hide UI, Space start/pause, Esc closes", async ({ page }) => {
  await page.goto("/?demo=true");
  await page.keyboard.press("m");
  await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("n");
  await expect(page.getByRole("dialog", { name: "Map" })).toBeVisible();
  await page.keyboard.press("n");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("h");
  await expect(page.getByRole("region", { name: "Top left widgets" })).toHaveCount(0);
  await page.keyboard.press("h");
  await expect(page.getByRole("region", { name: "Top left widgets" })).toBeAttached();
  // demo timer is running: Space pauses, Space resumes
  await page.keyboard.press(" ");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.keyboard.press(" ");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
});

test("shortcuts stay off while typing in a field", async ({ page }) => {
  await page.goto("/?demo=true");
  const todo = page.getByLabel("Add a todo");
  await todo.click();
  await page.keyboard.type("mhn ");
  await expect(todo).toHaveValue("mhn ");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Escape closes the phone panel", async ({ page }) => {
  await page.goto("/?demo=true");
  await page.getByRole("button", { name: /^Phone/ }).click();
  await expect(page.getByRole("button", { name: "Morgana" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Morgana" })).toHaveCount(0);
});

test("focus stays inside an open dialog and returns to the button that opened it", async ({ page }) => {
  await page.goto("/?demo=true");
  const menuButton = page.getByRole("button", { name: "Menu (M)" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Hideout" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
});

test("the room behind a dialog is inert", async ({ page }) => {
  await page.goto("/?demo=true&at=menu");
  const inert = (widget: string) => page.evaluate((w) => document.querySelector(`[data-widget="${w}"]`)?.closest("[inert]") !== null, widget);
  expect(await inert("timer")).toBe(true);
  // …but the TV is deliberately not inert
  expect(await page.evaluate(() => document.querySelector('[aria-label="TV"]')?.closest("[inert]") !== null)).toBe(false);
  await page.keyboard.press("Escape");
  expect(await inert("timer")).toBe(false);
});

test("the TV is visible, at least 200x200 and never covered, under every screen", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?demo=true&dev=true");
  await page.clock.resume();
  await page.getByRole("button", { name: "Unlock all" }).click();
  const check = async (label: string) => {
    const tv = page.getByRole("region", { name: "TV" });
    await expect(tv, label).toBeVisible();
    const box = (await tv.boundingBox())!;
    expect(box.width, label).toBeGreaterThanOrEqual(200);
    expect(box.height, label).toBeGreaterThanOrEqual(200);
    const topmostIsTv = await tv.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && el.contains(hit);
    });
    expect(topmostIsTv, `${label}: something covers the TV`).toBe(true);
  };
  await check("main");
  for (const screen of ["menu", "map", "settings", "profile", "summary", "choice", "break", "about", "credits", "privacy"]) {
    await page.getByLabel("Jump to screen").selectOption(screen);
    await check(screen);
  }
  // travel title card
  await page.getByLabel("Jump to screen").selectOption("map");
  await page.getByRole("button", { name: /School rooftop/ }).click();
  await check("travel");
});

test("Delete my data needs a second press and keeps demo mode", async ({ page }) => {
  await page.goto("/?demo=true&at=menu");
  await page.getByRole("button", { name: /SETTINGS/ }).click();
  await page.getByRole("button", { name: "Delete my data" }).click();
  await expect(page.getByRole("button", { name: "Press again to delete everything" })).toBeVisible();
  await page.getByRole("button", { name: "Press again to delete everything" }).click();
  await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
});

test("Credits, About and Privacy close back to Settings", async ({ page }) => {
  await page.goto("/?demo=true&at=menu");
  await page.getByRole("button", { name: /SETTINGS/ }).click();
  await page.getByRole("button", { name: "Credits", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
});
