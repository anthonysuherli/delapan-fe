// @types/node isn't installed in this project (it's only an unresolved
// optional peer dep of vite/vitest), so tsc otherwise can't type "node:fs".
// Minimal ambient shim for the one export encoding.test.ts needs — no new
// dependency added. (Ambient module declarations must live in a global
// script / .d.ts file; they can't be embedded in encoding.test.ts itself,
// which is already a module.)
declare module "node:fs" {
  export function readFileSync(path: URL, encoding: string): string;
}
