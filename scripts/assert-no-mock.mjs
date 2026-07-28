/**
 * Build gate: the mock fixture must never reach a production bundle.
 * Greps dist/ for a string that exists only in src/api/mock.ts.
 * Structural, not discipline — `npm run build` cannot pass with the mock in it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NEEDLE = "Findings are the atomic unit of delapan knowledge";
const DIR = "dist/assets";

let offenders = [];
try {
  offenders = readdirSync(DIR)
    .filter((f) => f.endsWith(".js"))
    .filter((f) => readFileSync(join(DIR, f), "utf8").includes(NEEDLE));
} catch (err) {
  console.error(`assert-no-mock: cannot read ${DIR} — did vite build run?`, err.message);
  process.exit(1);
}

if (offenders.length) {
  console.error(
    `assert-no-mock: FAIL — the mock fixture is in the production bundle: ${offenders.join(", ")}\n` +
      "The dynamic import in src/api/client.ts is not being tree-shaken.",
  );
  process.exit(1);
}
console.log("assert-no-mock: ok — no fixture in dist/");
