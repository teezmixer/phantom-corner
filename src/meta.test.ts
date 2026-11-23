import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** The page's title, description and share tags, read from the HTML the build starts from (spec §4.18). */
const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const meta = (attr: "name" | "property", key: string) => new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`).exec(html)?.[1];
const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];

describe("index.html", () => {
  it("declares its language, charset and viewport", () => {
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toMatch(/<meta charset="utf-8"/i);
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1"');
  });

  it("has a title that names the app and fits in a browser tab and a search result (under 60 characters)", () => {
    expect(title).toBeTruthy();
    expect(title!.length).toBeLessThanOrEqual(60);
    expect(title).toMatch(/Phantom Corner/);
    expect(title).not.toMatch(/React App/i);
  });

  it("has a description of a sensible length that says what it is, and that it is a fan project", () => {
    const description = meta("name", "description")!;
    expect(description.length).toBeGreaterThanOrEqual(70);
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).toMatch(/fan project/i);
    expect(description).toMatch(/not affiliated with Atlus or SEGA/i);
  });

  it("has Open Graph and Twitter tags that agree with the title and description", () => {
    expect(meta("property", "og:title")).toBe(title);
    expect(meta("property", "og:description")).toBe(meta("name", "description"));
    expect(meta("property", "og:type")).toBe("website");
    expect(meta("property", "og:site_name")).toBe("Phantom Corner");
    expect(meta("name", "twitter:card")).toBe("summary");
    expect(meta("name", "twitter:title")).toBe(title);
    expect(meta("name", "twitter:description")).toBe(meta("name", "description"));
  });

  it("does not point at an image or a URL that does not exist yet (no broken share preview)", () => {
    expect(html).not.toMatch(/og:image|twitter:image|rel="canonical"|og:url/);
  });

  it("is dark: the theme colour is black (the token) and the colour scheme is dark", () => {
    expect(meta("name", "theme-color")).toBe("#000000");
    expect(meta("name", "color-scheme")).toBe("dark");
  });

  it("links a manifest and icon that exist", () => {
    expect(html).toContain('rel="manifest" href="/manifest.json"');
    expect(existsSync(resolve(root, "public/manifest.json"))).toBe(true);
    expect(html).toContain('rel="icon" href="/favicon.ico"');
    expect(existsSync(resolve(root, "public/favicon.ico"))).toBe(true);
  });

  it("loads only its own script (a module from /src), with no inline script (the content security policy forbids it)", () => {
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    expect(scripts[0]![1]).toContain('src="/src/index.tsx"');
    expect((scripts[0]![2] ?? "").trim()).toBe("");
  });
});

describe("manifest.json", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8")) as Record<string, unknown>;
  it("names the app, starts at its own address, and is dark", () => {
    expect(manifest.name).toBe("Phantom Corner");
    expect(manifest.short_name).toBe("Phantom Corner");
    expect(manifest.start_url).toBe(".");
    expect(manifest.theme_color).toBe("#000000");
    expect(manifest.background_color).toBe("#000000");
    expect(manifest.lang).toBe("en");
  });
  it("lists only icons that exist", () => {
    for (const icon of manifest.icons as { src: string }[]) expect(existsSync(resolve(root, "public", icon.src)), icon.src).toBe(true);
  });
});
