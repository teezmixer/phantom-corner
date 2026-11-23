/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import path from "node:path";

// The security headers live in vercel.json (what production serves). `vite preview` serves the same ones, so every end-to-end test
// runs under the real content security policy and fails on a violation.
const vercel = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "vercel.json"), "utf8")) as { headers?: { source: string; headers: { key: string; value: string }[] }[] };
const securityHeaders = Object.fromEntries((vercel.headers ?? []).filter((h) => h.source === "/(.*)").flatMap((h) => h.headers.map((x) => [x.key, x.value])));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: { headers: securityHeaders },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
