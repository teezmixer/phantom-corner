import { expect, test as base } from "@playwright/test";

/**
 * Every e2e test fails on an uncaught exception or a console error. Vercel's analytics scripts do not exist on a
 * local preview server, so those requests are answered with an empty script instead of a 404.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") problems.push(`console.error: ${m.text()}`); });
    await page.route("**/_vercel/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
    await provide(page);
    expect(problems).toEqual([]);
  },
});

export { expect };
