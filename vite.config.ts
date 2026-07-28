/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This project has no @types/node (tsconfig `types` is scoped to `["vite/client"]`
// for the browser build), but vite.config.ts runs on Node, so the real `process`
// global is present. Declare just enough of it for the production guard below.
declare const process: { env: Record<string, string | undefined> };

// Dev proxy note:
// By default the app talks straight to VITE_API_BASE (http://127.0.0.1:8001),
// which requires the backend to allow CORS from the vite origin.
// If you'd rather avoid CORS entirely, set VITE_API_BASE="" (empty string) in
// .env.local — requests then go same-origin to /api/* and the proxy below
// forwards them to the engine.
export default defineConfig(({ mode }) => {
  if (mode === "production") {
    if (!process.env.VITE_API_BASE) {
      throw new Error(
        "VITE_API_BASE must be set for a production build — the localhost default would ship a bundle pointing at the visitor's own machine.",
      );
    }
    if (process.env.VITE_USE_MOCK === "1") {
      throw new Error("VITE_USE_MOCK=1 must never be set for a production build.");
    }
  }
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8001",
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
      // encoding.test.ts imports tokens.css?raw to assert the CSS tokens still
      // mirror the TS palette. Vitest blanks CSS imports by default, which would
      // make that drift test pass vacuously against an empty string.
      css: true,
    },
  };
});
