import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import type { Page, Response } from "@playwright/test";
import { expect, test } from "./fixtures";

// Spec §4.15. The numbers live in scripts/budgets.json, which scripts/check-budgets.mjs also reads.
const budgets = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../scripts/budgets.json"), "utf8")) as { initialJsGzipKB: number; firstLoadKB: number; imageKB: number; mediaKB: number; };
const kb = (bytes: number) => bytes / 1000;

/** What a response costs on the wire: text is measured gzipped (as a CDN serves it), binary files as they are. */
async function cost(r: Response): Promise<{ url: string; type: string; bytes: number }> {
  const body = await r.body();
  const type = r.headers()["content-type"] ?? "";
  const text = /javascript|css|html|json|svg|xml/.test(type);
  return { url: new URL(r.url()).pathname, type, bytes: text ? gzipSync(body, { level: 9 }).length : body.length };
}

function record(page: Page) {
  const pending: Promise<{ url: string; type: string; bytes: number }>[] = [];
  page.on("response", (r) => { if (r.url().startsWith("http://localhost")) pending.push(cost(r).catch(() => ({ url: r.url(), type: "", bytes: 0 }))); });
  return async () => (await Promise.all(pending)).splice(0);
}

test.describe("performance budgets", () => {
  test("the first load of the splash stays within the first-load budget, and its scripts within the initial-JS budget", async ({ page }) => {
    const collect = record(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const all = await collect();
    // Screens are fetched when the page is idle, after the first screen is up: they are not part of the first load.
    const html = readFileSync(path.resolve(import.meta.dirname, "../dist/index.html"), "utf8");
    const staticScripts = new Set([...html.matchAll(/(?:<script[^>]*src|<link[^>]*rel="modulepreload"[^>]*href)="([^"]+\.js)"/g)].map((m) => m[1]));
    const firstLoad = all.filter((r) => !r.url.endsWith(".js") || staticScripts.has(r.url));
    const js = firstLoad.filter((r) => r.url.endsWith(".js")).reduce((n, r) => n + r.bytes, 0);
    const total = firstLoad.reduce((n, r) => n + r.bytes, 0);
    console.log(`first load: ${kb(total).toFixed(1)} kB in ${firstLoad.length} requests; scripts ${kb(js).toFixed(1)} kB gzipped`);
    expect(kb(js)).toBeLessThanOrEqual(budgets.initialJsGzipKB);
    expect(kb(total)).toBeLessThanOrEqual(budgets.firstLoadKB);
  });

  test("the splash does not pull in the room: no screenshot, no widgets, until the player enters", async ({ page }) => {
    const collect = record(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Press to enter" })).toBeVisible();
    expect((await collect()).filter((r) => r.type.startsWith("image/png"))).toEqual([]);
  });

  test("every image the room loads is within the image budget, and the background loop within the media budget", async ({ page }) => {
    const collect = record(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Press to enter" }).click();
    await expect(page.getByRole("timer").first()).toBeVisible();
    await expect(page.getByLabel("Background scene")).toBeVisible();
    const images = (await collect()).filter((r) => r.type.startsWith("image/"));
    const over = images.filter((r) => kb(r.bytes) > budgets.imageKB);
    expect(over).toEqual([]);
    const loops = (await collect()).filter((r) => r.url.endsWith(".mp4"));
    expect(loops.length).toBeGreaterThan(0); // the background loop really is fetched
    for (const l of loops) expect(kb(l.bytes), l.url).toBeLessThanOrEqual(budgets.mediaKB);
  });

  test("the room and the rarely opened screens are their own chunks, fetched on idle, so nothing waits when first opened", async ({ page }) => {
    const chunks = new Set<string>();
    page.on("response", (r) => { const m = /\/assets\/(MainScreen|SummaryScreen|SettingsScreen|ProfileScreen|Pages)-.*\.js$/.exec(r.url()); if (m) chunks.add(m[1]!); });
    await page.goto("/");
    await expect.poll(() => chunks.size, { timeout: 8000 }).toBeGreaterThanOrEqual(5); // prefetched while the splash is up
    await page.getByRole("button", { name: "Press to enter" }).click();
    await page.getByRole("button", { name: /Menu/ }).first().click();
    await expect(page.getByRole("dialog", { name: "Hideout" })).toBeVisible();
  });
});
