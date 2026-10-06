import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  outputDir: ".playwright-results",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3100",
    channel: "chrome",
    headless: true,
    actionTimeout: 15_000,
    viewport: { width: 1440, height: 1000 },
  },
});
