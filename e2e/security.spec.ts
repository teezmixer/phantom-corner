import { expect, test as raw } from "@playwright/test";

// These tests provoke violations on purpose, so they use Playwright's own `test`, not the project's, which fails on any console error.

raw.describe("the page is served with its security headers, and the policy is enforced", () => {
  raw("every header is on the page itself", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  raw("an inline script is refused, and the browser reports the violation", async ({ page }) => {
    await page.goto("/");
    const outcome = await page.evaluate(() => new Promise<{ ran: boolean; violated: string }>((resolve) => {
      (window as unknown as { __ran: boolean }).__ran = false;
      document.addEventListener("securitypolicyviolation", (e) => resolve({ ran: (window as unknown as { __ran: boolean }).__ran, violated: e.violatedDirective }), { once: true });
      const script = document.createElement("script");
      script.textContent = "window.__ran = true";
      document.head.appendChild(script);
      setTimeout(() => resolve({ ran: (window as unknown as { __ran: boolean }).__ran, violated: "none" }), 1000);
    }));
    expect(outcome.violated).toMatch(/^script-src/);
    expect(outcome.ran).toBe(false);
  });

  raw("eval and new Function are refused to the page's own scripts", async ({ page }) => {
    // Not from page.evaluate: Playwright's own evaluation is exempt from the policy. A same-origin script is allowed to load, then tries both.
    await page.route("**/__probe.js", (route) => route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: 'const attempt = (f) => { try { f(); return "ran"; } catch (e) { return e.name; } }; window.__probe = { evalResult: attempt(() => eval("1 + 1")), fnResult: attempt(() => new Function("return 1")()) };',
    }));
    await page.goto("/");
    await page.evaluate(() => new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = "/__probe.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    }));
    expect(await page.evaluate(() => (window as unknown as { __probe: unknown }).__probe)).toEqual({ evalResult: "EvalError", fnResult: "EvalError" });
  });

  raw("a script from a host that is not on the list is refused", async ({ page }) => {
    await page.route("https://evil.example/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "window.__evil = true" }));
    await page.goto("/");
    const outcome = await page.evaluate(() => new Promise<{ ran: boolean; violated: string }>((resolve) => {
      document.addEventListener("securitypolicyviolation", (e) => resolve({ ran: !!(window as unknown as { __evil?: boolean }).__evil, violated: e.violatedDirective }), { once: true });
      const script = document.createElement("script");
      script.src = "https://evil.example/x.js";
      document.head.appendChild(script);
      setTimeout(() => resolve({ ran: !!(window as unknown as { __evil?: boolean }).__evil, violated: "none" }), 1500);
    }));
    expect(outcome.violated).toMatch(/^script-src/);
    expect(outcome.ran).toBe(false);
  });

  raw("the page cannot be framed by another site", async ({ page }) => {
    const response = await page.goto("/");
    expect(response!.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
