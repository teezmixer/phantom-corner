import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** The headers production serves (vercel.json), checked as data: what is allowed, and, as important, what is not (spec §4.17). */
const vercel = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../vercel.json"), "utf8")) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
const headers = Object.fromEntries(vercel.headers.filter((h) => h.source === "/(.*)").flatMap((h) => h.headers.map((x) => [x.key, x.value])));
const csp = Object.fromEntries((headers["Content-Security-Policy"] ?? "").split(";").map((d) => d.trim()).filter(Boolean).map((d) => { const [name, ...values] = d.split(/\s+/); return [name!, values]; })) as Record<string, string[]>;

describe("security headers in vercel.json", () => {
  it("every page gets all four headers", () => {
    for (const key of ["Content-Security-Policy", "Referrer-Policy", "X-Content-Type-Options", "Permissions-Policy"]) expect(headers[key], key).toBeTruthy();
  });

  it("the small headers are the strict ones", () => {
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("the permissions policy grants nothing the app does not use (no camera, microphone, location, payment)", () => {
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) expect(headers["Permissions-Policy"]).toContain(`${feature}=()`);
  });

  describe("content security policy", () => {
    it("allows the app's own scripts and the YouTube API, and nothing else", () => {
      expect(csp["script-src"]).toEqual(["'self'", "https://www.youtube.com", "https://s.ytimg.com"]);
    });

    it("never allows inline script or eval, and has no wildcard source anywhere", () => {
      for (const [name, values] of Object.entries(csp)) {
        expect(values, name).not.toContain("'unsafe-eval'");
        expect(values, name).not.toContain("*");
        if (name === "script-src") expect(values).not.toContain("'unsafe-inline'");
      }
    });

    it("the player may be framed from YouTube's privacy-enhanced host, and the page may be framed by no one", () => {
      expect(csp["frame-src"]).toContain("https://www.youtube-nocookie.com");
      expect(csp["frame-ancestors"]).toEqual(["'none'"]);
    });

    it("blocks plugins, restricts the base URL and form targets, and defaults everything else to the page's own origin", () => {
      expect(csp["object-src"]).toEqual(["'none'"]);
      expect(csp["base-uri"]).toEqual(["'self'"]);
      expect(csp["form-action"]).toEqual(["'self'"]);
      expect(csp["default-src"]).toEqual(["'self'"]);
    });

    it("lets the app talk only to itself (analytics goes through the same origin, and there is no backend yet)", () => {
      expect(csp["connect-src"]).toEqual(["'self'"]);
    });

    it("fonts and images are the app's own (plus data and blob URLs for images)", () => {
      expect(csp["font-src"]).toEqual(["'self'"]);
      expect(csp["img-src"]).toEqual(["'self'", "data:", "blob:"]);
    });
  });
});
