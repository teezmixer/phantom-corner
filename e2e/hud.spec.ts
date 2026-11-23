import type { Page } from "@playwright/test";
import { expect, stubExternal, test } from "./fixtures";

const KEY = "pc:v1";
const stored = (page: Page) => page.evaluate((k) => window.localStorage.getItem(k), KEY);
const waitForSaved = (page: Page, check: (raw: string) => boolean) =>
  expect.poll(async () => { const raw = await stored(page); return raw !== null && check(raw); }, { timeout: 5000 }).toBe(true);
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();
const openSettings = async (page: Page) => {
  await page.keyboard.press("m");
  await page.getByRole("button", { name: /SETTINGS/ }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
};
const settingsDialog = (page: Page) => page.getByRole("dialog", { name: "Settings" });
const corner = (page: Page, name: string) => page.getByRole("region", { name });

test.describe("widget toggles", () => {
  test("a widget can be hidden and shown again in Settings, and the choice is saved", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await expect(page.getByRole("group", { name: "Timer" })).toBeVisible();
    await openSettings(page);
    await settingsDialog(page).getByRole("checkbox", { name: "Timer" }).uncheck();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Timer" })).toHaveCount(0);
    await waitForSaved(page, (raw) => raw.includes('"hidden":["timer"]'));
    await page.reload();
    await enter(page);
    await expect(page.getByRole("group", { name: "Timer" })).toHaveCount(0); // still hidden after a reload
    await expect(page.getByRole("group", { name: "Mission" })).toBeVisible(); // the others are untouched
    await openSettings(page);
    await settingsDialog(page).getByRole("checkbox", { name: "Timer" }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Timer" })).toBeVisible();
  });

  test("the TV and the button bar cannot be hidden", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await openSettings(page);
    const boxes = settingsDialog(page).getByRole("checkbox");
    const names = await boxes.evaluateAll((els) => els.map((e) => (e.closest("label")?.textContent ?? "").trim()));
    expect(names).toEqual(expect.arrayContaining(["Date and time", "Timer", "Phone", "Mission", "Todo list", "Level and Knowledge", "Location sign"]));
    expect(names.join("|")).not.toMatch(/TV|button bar|Menu/i);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: "TV" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main controls" })).toBeVisible();
  });

  test("Hide UI hides every widget, keeps the TV, and Show UI brings them back", async ({ page }) => {
    await page.goto("/?demo=true");
    await page.keyboard.press("h");
    for (const name of ["Top left widgets", "Top right widgets", "Bottom left widgets", "Bottom right widgets"]) await expect(corner(page, name)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "TV" })).toBeVisible();
    await page.getByRole("button", { name: "Show UI" }).click();
    await expect(corner(page, "Top left widgets")).toBeAttached();
  });
});

test.describe("HUD size", () => {
  const scale = (page: Page) => corner(page, "Top left widgets").evaluate((el) => Number(/scale\(([\d.]+)\)/.exec((el as HTMLElement).style.transform)![1]));

  test("a bigger HUD scales every corner group on top of the window scaling, and is saved", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    const normal = await scale(page);
    await openSettings(page);
    await settingsDialog(page).getByRole("radio", { name: "Largest" }).check();
    await page.keyboard.press("Escape");
    expect(await scale(page)).toBeCloseTo(normal * 1.3, 3);
    await waitForSaved(page, (raw) => raw.includes('"hudSize":1.3'));
    await page.reload();
    await enter(page);
    expect(await scale(page)).toBeCloseTo(normal * 1.3, 3);
    await openSettings(page);
    await settingsDialog(page).getByRole("radio", { name: "Small" }).check();
    await page.keyboard.press("Escape");
    expect(await scale(page)).toBeCloseTo(normal * 0.85, 3);
  });

  test("the TV keeps its 200×200 player at every HUD size", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    for (const size of ["Small", "Normal", "Large", "Largest"]) {
      await openSettings(page);
      await settingsDialog(page).getByRole("radio", { name: size, exact: true }).check();
      await page.keyboard.press("Escape");
      const inner = await page.getByTestId("tv-player").evaluate((b) => ({ w: b.clientWidth, h: b.clientHeight }));
      expect(inner.w, size).toBeGreaterThanOrEqual(200);
      expect(inner.h, size).toBeGreaterThanOrEqual(200);
    }
  });
});

test.describe("motion setting", () => {
  test("'Reduce motion' overrides the system: the page switches to the reduced mode and it is saved", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe("system");
    await openSettings(page);
    await settingsDialog(page).getByRole("radio", { name: "Reduce motion" }).check();
    expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe("reduced");
    await waitForSaved(page, (raw) => raw.includes('"motion":"reduced"'));
    await page.reload();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe("reduced");
  });

  test("with 'Reduce motion' on, CSS animations and transitions collapse to nothing even though the system allows motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await enter(page);
    await openSettings(page);
    await settingsDialog(page).getByRole("radio", { name: "Reduce motion" }).check();
    const duration = await page.getByRole("button", { name: "Close" }).evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });
});

test.describe("analytics switch", () => {
  const analyticsRequests = (page: Page) => {
    const urls: string[] = [];
    page.on("request", (r) => { if (r.url().includes("/_vercel/")) urls.push(r.url()); });
    return urls;
  };

  test("by default (provisional, D-14) the visit statistics scripts load", async ({ page }) => {
    const urls = analyticsRequests(page);
    await page.goto("/");
    await enter(page);
    await expect.poll(() => urls.length).toBeGreaterThan(0);
  });

  test("switched off, the scripts do not load on the next visit — and the choice is saved", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await openSettings(page);
    await settingsDialog(page).getByRole("checkbox", { name: "Anonymous visit statistics" }).uncheck();
    await waitForSaved(page, (raw) => raw.includes('"analytics":false'));
    const urls = analyticsRequests(page);
    await page.reload();
    await enter(page);
    await page.waitForTimeout(800);
    expect(urls).toEqual([]);
    expect(await page.evaluate(() => document.querySelector('script[src*="_vercel"]'))).toBeNull(); // the scripts are not even in the page
  });

  test("switching analytics on inside a demo never changes the real visitor's remembered opt-out", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("pc-optout", "1"));
    await page.goto("/?demo=true");
    await page.keyboard.press("m");
    await page.getByRole("button", { name: /SETTINGS/ }).click();
    const box = settingsDialog(page).getByRole("checkbox", { name: "Anonymous visit statistics" });
    await expect(box).not.toBeChecked(); // the remembered opt-out is honoured in the demo too
    await box.check();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.localStorage.getItem("pc-optout"))).toBe("1");
  });

  test("the opt-out holds from the very first load and survives Delete my data", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await openSettings(page);
    await settingsDialog(page).getByRole("checkbox", { name: "Anonymous visit statistics" }).uncheck();
    await waitForSaved(page, (raw) => raw.includes('"analytics":false'));
    await settingsDialog(page).getByRole("button", { name: "Delete my data" }).click();
    await settingsDialog(page).getByRole("button", { name: "Press again to delete everything" }).click();
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible(); // reloaded to a first visit
    expect(await page.evaluate(() => window.localStorage.getItem("pc:v1"))).toBeNull(); // everything is gone…
    expect(await page.evaluate(() => window.localStorage.getItem("pc-optout"))).toBe("1"); // …except the one choice that must outlive it
    expect(await page.evaluate(() => document.querySelector('script[src*="_vercel"]'))).toBeNull(); // no analytics, even right after a delete
    await enter(page);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.querySelector('script[src*="_vercel"]'))).toBeNull();
  });
});

test.describe("export and delete", () => {
  test("Export downloads the saved data as a JSON file in the current schema", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByLabel("Today's mission").fill("Export me");
    await page.getByRole("button", { name: "Set" }).click();
    await openSettings(page);
    const [download] = await Promise.all([page.waitForEvent("download"), settingsDialog(page).getByRole("button", { name: "Export my data" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^phantom-corner-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    const data = JSON.parse((await import("node:fs")).readFileSync(path, "utf8"));
    expect(data).toMatchObject({ schema: 5, mission: { text: "Export me" } });
    expect(data).not.toHaveProperty("banners");
    await expect(settingsDialog(page).getByText("Saved as a file.")).toBeVisible();
  });

  test("Delete needs a second press, then removes everything including backups and returns to the splash", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByLabel("Today's mission").fill("Forget me");
    await page.getByRole("button", { name: "Set" }).click();
    await waitForSaved(page, (raw) => raw.includes("Forget me"));
    await page.evaluate(() => window.localStorage.setItem("pc:v1:backup:2026-01-01T00:00:00.000Z", "{old}"));
    await openSettings(page);
    await settingsDialog(page).getByRole("button", { name: "Delete my data" }).click();
    await expect(settingsDialog(page).getByRole("button", { name: "Press again to delete everything" })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem("pc:v1:backup:2026-01-01T00:00:00.000Z"))).toBe("{old}"); // one press changes nothing
    await settingsDialog(page).getByRole("button", { name: "Press again to delete everything" }).click();
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
    await page.waitForTimeout(800); // longer than the save debounce: nothing may write the old save back
    expect(await page.evaluate(() => window.localStorage.getItem("pc:v1:backup:2026-01-01T00:00:00.000Z"))).toBeNull();
    expect(await page.evaluate(() => window.localStorage.getItem("pc:v1"))).toBeNull(); // really gone, not rewritten
    await page.reload();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.localStorage.getItem("pc:v1"))).toBeNull(); // looking at the splash saves nothing
    await enter(page);
    await expect(page.getByText("Forget me")).toHaveCount(0); // a clean start
    await page.waitForTimeout(400);
    await expect(page.getByText("Ah, you're back.")).toHaveCount(0); // it is a first visit again, not a return
  });

  test("Delete in demo mode never touches the real saved progress", async ({ page, context }) => {
    await page.goto("/");
    await enter(page);
    await page.getByLabel("Today's mission").fill("Real progress");
    await page.getByRole("button", { name: "Set" }).click();
    await waitForSaved(page, (raw) => raw.includes("Real progress"));
    const before = await stored(page);
    const demo = await context.newPage();
    await stubExternal(demo);
    await demo.goto("/?demo=true");
    await demo.keyboard.press("m");
    await demo.getByRole("button", { name: /SETTINGS/ }).click();
    await demo.getByRole("button", { name: "Delete my data" }).click();
    await demo.getByRole("button", { name: "Press again to delete everything" }).click();
    await expect(demo.getByRole("button", { name: "Press to enter" })).toBeVisible(); // the demo reset itself
    await demo.waitForTimeout(600);
    expect(await stored(page)).toBe(before); // the real save is exactly as it was
    await demo.close();
  });

  test("a visit that only looks at the splash saves nothing", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(700);
    expect(await stored(page)).toBeNull();
  });
});

test.describe("a session still ends when the timer cannot be seen", () => {
  test("hiding the timer widget in Settings (or the whole HUD) does not stop a running session from completing", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await openSettings(page);
    await settingsDialog(page).getByRole("checkbox", { name: "Timer" }).uncheck();
    await page.keyboard.press("Escape");
    await page.keyboard.press("h"); // hide the whole HUD too
    await page.keyboard.press(" "); // Space starts a session nobody can see
    await page.clock.fastForward("25:05");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
  });
});

test.describe("banner", () => {
  test("banners are visible above an open screen, not hidden behind it", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?demo=true");
    await page.clock.resume();
    await page.clock.fastForward("17:30"); // the demo session ends: Knowledge banners queue and the choice screen opens
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
    const banner = page.locator("div[role=status] p", { hasText: /Knowledge/ });
    await expect(banner).toBeVisible();
    const onTop = await banner.evaluate((el) => {
      // The banner ignores the pointer on purpose, which also hides it from elementFromPoint: make it hit-testable for this check only.
      for (let n: HTMLElement | null = el as HTMLElement; n && n !== document.body; n = n.parentElement) n.style.pointerEvents = "auto";
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && el.contains(hit);
    });
    expect(onTop).toBe(true); // nothing (the dialog's scrim) covers it
  });

  test("a visit whose saved data was lost gets the notice, not a 'you're back' greeting", async ({ page }) => {
    await page.addInitScript(([k]) => { if (!window.sessionStorage.getItem("seeded")) { window.localStorage.setItem(k as string, "{nope"); window.sessionStorage.setItem("seeded", "1"); } }, [KEY]);
    await page.goto("/");
    await expect(page.getByRole("status").filter({ hasText: "scrambled" })).toBeVisible();
    await enter(page);
    await page.waitForTimeout(500);
    await expect(page.getByText("Ah, you're back.")).toHaveCount(0);
  });

  test("a returning user is greeted in Sojiro's words, a first-time user is not", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.waitForTimeout(400);
    await expect(page.getByText("Ah, you're back.")).toHaveCount(0); // first visit: the door bell is that moment
    await page.getByLabel("Today's mission").fill("Come back");
    await page.getByRole("button", { name: "Set" }).click();
    await waitForSaved(page, (raw) => raw.includes("Come back"));
    await page.reload();
    await enter(page);
    await expect(page.getByText("Ah, you're back.")).toBeVisible();
  });

  test("Knowledge and a level-up are announced one after another, then the banner clears", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByLabel("Today's mission").fill("Study");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByText("+10 Knowledge")).toBeVisible();
    await page.clock.fastForward(3600);
    await expect(page.getByText("Level 2")).toBeVisible();
    await page.clock.fastForward(3600);
    await expect(page.getByText("Level 2")).toHaveCount(0);
  });

  test("the banner is a polite live region", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    const live = page.locator('div[role="status"][aria-live="polite"].fixed.left-1\\/2.top-3');
    await expect(live).toHaveCount(1);
  });

  test("an unlock is announced with Ares's line, but the dev panel's unlock-all is silent", async ({ page }) => {
    await page.goto("/?dev=true");
    await enter(page);
    await page.getByRole("button", { name: "Unlock all" }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText("You unlocked a new location. Someone's waiting for you.")).toHaveCount(0);
    await page.getByRole("button", { name: "+50 Knowledge" }).click(); // genuinely earns levels
    await expect(page.locator("div[role=status] p", { hasText: "+50 Knowledge" })).toBeVisible();
  });
});

test.describe("mission deadline", () => {
  test("counts down from an optional deadline, goes red when overdue, and is saved", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-22T12:00:00") });
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByLabel("Today's mission").fill("Hand it in");
    await page.getByLabel("Mission deadline").fill("2026-11-22T14:15");
    await page.getByRole("button", { name: "Set" }).click();
    const countdown = page.getByTestId("mission-countdown");
    await expect(countdown).toHaveText("due in 2 h 15 min");
    await waitForSaved(page, (raw) => raw.includes('"deadline"'));
    await page.reload();
    await enter(page);
    await expect(page.getByTestId("mission-countdown")).toContainText(/due in 2 h/);
    await page.clock.fastForward("03:00:00");
    await expect(page.getByTestId("mission-countdown")).toHaveText(/overdue by 4[56] min/, { timeout: 40_000 }); // the clock keeps running while the test waits
    await expect(page.getByTestId("mission-countdown")).toHaveClass(/bg-redbright/);
  });

  test("changing only the deadline keeps a finished mission finished", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-22T12:00:00") });
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByLabel("Today's mission").fill("Keep going");
    await page.getByRole("button", { name: "Set" }).click();
    await page.getByRole("checkbox", { name: "Mission done" }).click();
    await expect(page.getByRole("checkbox", { name: "Mission done" })).toBeChecked();
    await page.getByRole("button", { name: "Edit mission" }).click();
    await page.getByLabel(/mission deadline/i).fill("2030-01-01T10:00");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByRole("checkbox", { name: "Mission done" })).toBeChecked(); // adding a deadline does not un-complete it
  });

  test("an absurd deadline is ignored rather than stored", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-22T12:00:00") });
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByLabel("Today's mission").fill("Typo");
    await page.getByLabel(/mission deadline/i).fill("2999-01-01T10:00");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByText("Typo")).toBeVisible();
    await expect(page.getByTestId("mission-countdown")).toHaveCount(0);
  });

  test("a mission without a deadline shows no countdown, and marking it done hides it", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByLabel("Today's mission").fill("No rush");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByTestId("mission-countdown")).toHaveCount(0);
    await page.getByRole("button", { name: "Edit mission" }).click();
    await page.getByLabel("Mission deadline").fill("2030-01-01T10:00");
    await page.getByRole("button", { name: "Set" }).click();
    await expect(page.getByTestId("mission-countdown")).toBeVisible();
    await page.getByRole("checkbox", { name: "Mission done" }).click();
    await expect(page.getByTestId("mission-countdown")).toHaveCount(0);
  });
});

test.describe("other HUD behaviour", () => {
  test("collapsing the todo list is remembered across a reload", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Collapse todo list" }).click();
    await expect(page.getByLabel("Add a todo")).toHaveCount(0);
    await waitForSaved(page, (raw) => raw.includes('"todoCollapsed":true'));
    await page.reload();
    await enter(page);
    await expect(page.getByLabel("Add a todo")).toHaveCount(0);
    await page.getByRole("button", { name: "Expand todo list" }).click();
    await expect(page.getByLabel("Add a todo")).toBeVisible();
  });

  test("todos survive a reload, and an empty list says so in voice", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await expect(page.getByText("Nothing on the list. Suspicious.")).toBeVisible();
    await page.getByLabel("Add a todo").fill("Keep me");
    await page.getByRole("button", { name: "Add todo" }).click();
    await waitForSaved(page, (raw) => raw.includes("Keep me"));
    await page.reload();
    await enter(page);
    await expect(page.getByText("Keep me")).toBeVisible();
    await expect(page.getByText("Nothing on the list. Suspicious.")).toHaveCount(0);
  });

  test("the bottom bar shows its keycap hints, and the phone badge counts then clears", async ({ page }) => {
    await page.goto("/?demo=true");
    const bar = page.getByRole("navigation", { name: "Main controls" });
    await expect(bar.locator("kbd")).toHaveText(["M", "N", "H"]);
    await expect(page.getByRole("button", { name: "Phone, 1 unread" })).toBeVisible();
    await page.getByRole("button", { name: /^Phone/ }).click();
    await page.getByRole("button", { name: "Morgana" }).click();
    await expect(page.getByRole("button", { name: "Phone", exact: true })).toBeVisible(); // no unread count any more
  });

  test("the clock shows the date, weekday, time-of-day label and a live time, with no weather", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-22T20:05:00") });
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    const widget = page.getByRole("group", { name: "Date and time" });
    await expect(widget).toContainText("Sunday");
    await expect(widget).toContainText("Evening");
    await expect(widget.locator("time")).toHaveAttribute("datetime", /^20:0[5-6]$/);
    await expect(widget.getByLabel("11/22")).toBeVisible();
    expect(await widget.innerText()).not.toMatch(/weather|°|sunny|rain/i);
    await page.clock.fastForward("01:05:00");
    await expect(widget.locator("time")).toHaveAttribute("datetime", /^21:/);
    await expect(widget).toContainText("Night");
  });
});
