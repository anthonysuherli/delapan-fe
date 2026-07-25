// Minimal type declarations for Node.js built-in modules used in tests.
// These are not Ambient module declarations—they're normal .d.ts definitions
// that get included by the TypeScript compiler and don't require @types/node.

declare module "node:fs" {
  export function readFileSync(
    path: string | Buffer | URL,
    encoding: BufferEncoding
  ): string;
  export function readFileSync(
    path: string | Buffer | URL
  ): Buffer;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}

declare module "node:path" {
  export function dirname(p: string): string;
  export function join(...paths: string[]): string;
}
