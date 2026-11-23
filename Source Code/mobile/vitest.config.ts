import { defineConfig } from "vitest/config";

// Expo Router owns app/: keep test-only modules outside its runtime route graph.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules*/**", "**/dist/**"],
    setupFiles: ["./src/testSetup.ts"],
  },
});
