import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  testIgnore: "**/integration/**",
  use: { baseURL: "http://127.0.0.1:4300", headless: true },
  webServer: {
    command: "npm run serve:demo",
    url: "http://127.0.0.1:4300",
    reuseExistingServer: !process.env["CI"],
    timeout: 120000,
  },
});
