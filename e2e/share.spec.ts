import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";

test("the summary saves a PNG card with minutes, Knowledge and the place, and none of the player's own words", async ({ page }) => {
  // Record every string drawn on any canvas, so the test sees what the card actually says.
  await page.addInitScript(() => {
    const drawn: string[] = [];
    (window as unknown as { __drawn: string[] }).__drawn = drawn;
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text: string, ...rest: [number, number]) { drawn.push(text); return original.call(this, text, ...rest); };
  });
  await page.clock.install();
  await page.goto("/");
  await page.clock.resume();
  await page.getByRole("button", { name: "Press to enter" }).click();
  await page.getByLabel("Today's mission").fill("SECRET-MISSION-TEXT");
  await page.getByRole("button", { name: "Set" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("25:05");
  await page.getByRole("button", { name: "Call it" }).click();
  await expect(page.getByRole("dialog", { name: "Session complete" })).toContainText("SECRET-MISSION-TEXT"); // the screen shows it; the card must not

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save a card" }).click()]);
  expect(download.suggestedFilename()).toBe("phantom-corner-session.png");
  const bytes = readFileSync(await download.path());
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]); // PNG signature
  expect(bytes.readUInt32BE(16)).toBe(1200); // IHDR width
  expect(bytes.readUInt32BE(20)).toBe(630); // IHDR height

  const drawn = await page.evaluate(() => (window as unknown as { __drawn: string[] }).__drawn);
  expect(drawn).toEqual(expect.arrayContaining(["PHANTOM CORNER", "25", "minutes focused", "Café Leblanc"]));
  expect(drawn.some((t) => /^\+\d+ Knowledge$/.test(t))).toBe(true);
  expect(drawn.join("|")).not.toContain("SECRET");
});

test("Copy the card puts the same PNG on the clipboard, again without the player's words", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    const drawn: string[] = [];
    (window as unknown as { __drawn: string[] }).__drawn = drawn;
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text: string, ...rest: [number, number]) { drawn.push(text); return original.call(this, text, ...rest); };
  });
  await page.clock.install();
  await page.goto("/");
  await page.clock.resume();
  await page.getByRole("button", { name: "Press to enter" }).click();
  await page.getByLabel("Today's mission").fill("SECRET-MISSION-TEXT");
  await page.getByRole("button", { name: "Set" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.fastForward("25:05");
  await page.getByRole("button", { name: "Call it" }).click();
  await page.getByRole("button", { name: "Copy the card" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
  const clip = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const blob = await item!.getType("image/png");
    return { type: blob.type, head: [...new Uint8Array(await blob.slice(0, 8).arrayBuffer())], size: blob.size };
  });
  expect(clip.type).toBe("image/png");
  expect(clip.head).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(clip.size).toBeGreaterThan(1000);
  const drawn = await page.evaluate(() => (window as unknown as { __drawn: string[] }).__drawn);
  expect(drawn).toEqual(expect.arrayContaining(["PHANTOM CORNER", "25"]));
  expect(drawn.join("|")).not.toContain("SECRET");
});
