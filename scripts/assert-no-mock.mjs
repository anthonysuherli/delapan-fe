/**
 * Build gate: the mock fixture must never reach a production bundle.
 * Greps dist/ for a string that exists only in src/api/mock.ts.
 * Structural, not discipline — `npm run build` cannot pass with the mock in it.
 *
 * NEEDLE is fixture content, not fixture-loader code — if src/api/mock.ts is
 * ever edited or regenerated without updating NEEDLE, the string vanishes from
 * both the source and any emitted chunk, and a naive "grep dist/ for NEEDLE"
 * would print "ok" forever while a *different* string ships unnoticed. So this
 * also checks NEEDLE is still present in src/api/mock.ts itself — if it isn't,
 * that's this script going stale, not a passing build, and it fails loudly
 * instead of silently no-opping.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NEEDLE = "Findings are the atomic unit of delapan knowledge";
const DIR = "dist/assets";
const MOCK_SOURCE = "src/api/mock.ts";

let mockSource;
try {
  mockSource = readFileSync(MOCK_SOURCE, "utf8");
} catch (err) {
  console.error(`assert-no-mock: cannot read ${MOCK_SOURCE}`, err.message);
  process.exit(1);
}
if (!mockSource.includes(NEEDLE)) {
  console.error(
    `assert-no-mock: FAIL — NEEDLE is no longer present in ${MOCK_SOURCE}. This script's\n` +
      "check is now vacuous (it would report \"ok\" without checking anything real). Update\n" +
      "NEEDLE to a string that still exists in the current fixture before trusting this gate.",
  );
  process.exit(1);
}

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
