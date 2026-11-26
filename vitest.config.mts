try { process.loadEnvFile(".env.local"); } catch {}
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: process.env.SQL_CAPTURE ? ["tests/capture-setup.ts"] : [],
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
    env: { PBKDF2_ITERS: "1000" },
  },
});
