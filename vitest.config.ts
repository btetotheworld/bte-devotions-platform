import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    pool: "forks", // Use forks pool for better isolation
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.config.*",
        "**/dist/",
        "**/.next/",
      ],
    },
  },
  resolve: {
    alias: {
      "@bte-devotions/lib": path.resolve(__dirname, "./packages/lib"),
      "@bte-devotions/database": path.resolve(__dirname, "./packages/database"),
    },
  },
});


