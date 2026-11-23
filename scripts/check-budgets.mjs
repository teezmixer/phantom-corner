// Fails the build when a performance budget in scripts/budgets.json is broken. Run after `npm run build`.
// Initial JS = the entry script plus every chunk the page preloads (what the first screen needs). Chunks loaded later
// (screens, the room) are not initial. The real first-load total and the room's images are checked in the browser
// by e2e/budgets.spec.ts; this script checks what can be known from dist/ alone.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const budgets = JSON.parse(readFileSync(path.join(root, "scripts/budgets.json"), "utf8"));
const kb = (bytes) => bytes / 1000;
const gz = (file) => gzipSync(readFileSync(path.join(dist, file)), { level: 9 }).length;

const html = readFileSync(path.join(dist, "index.html"), "utf8");
const initial = [...html.matchAll(/(?:<script[^>]*src|<link[^>]*rel="modulepreload"[^>]*href)="\/([^"]+\.js)"/g)].map((m) => m[1]);
const initialGz = initial.reduce((sum, f) => sum + gz(f), 0);

const failures = [];
console.log(`Initial JS: ${initial.length} files, ${kb(initialGz).toFixed(1)} kB gzipped (budget ${budgets.initialJsGzipKB} kB)`);
for (const f of initial) console.log(`  ${f}  ${kb(gz(f)).toFixed(1)} kB`);
if (kb(initialGz) > budgets.initialJsGzipKB) failures.push(`initial JS ${kb(initialGz).toFixed(1)} kB gzipped is over ${budgets.initialJsGzipKB} kB`);

const assets = readdirSync(path.join(dist, "assets"));
for (const f of assets.filter((a) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(a))) {
  const size = statSync(path.join(dist, "assets", f)).size;
  const exempt = budgets.exemptImagePrefixes.some((p) => f.startsWith(p));
  console.log(`Image ${f}  ${kb(size).toFixed(1)} kB${exempt ? "  (exempt by name: B-05)" : ""}`);
  if (!exempt && kb(size) > budgets.imageKB) failures.push(`image ${f} is ${kb(size).toFixed(1)} kB, over ${budgets.imageKB} kB`);
}

if (failures.length) {
  console.error(`\nBudget broken:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nAll static budgets hold.");
