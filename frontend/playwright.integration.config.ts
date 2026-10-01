import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "viticontrol-integration-"));

export default defineConfig({
  testDir: "./tests/integration",
  use: { baseURL: "http://127.0.0.1:8001", headless: true },
  webServer: {
    command: "python -m uvicorn main:app --host 127.0.0.1 --port 8001",
    cwd: "../backend",
    url: "http://127.0.0.1:8001/api/health",
    env: {
      DATABASE_URL: "sqlite:///" + join(directory, "notebook.db"),
      UPLOAD_DIR: join(directory, "uploads"),
      STATIC_DIR: resolve(__dirname, "../dist"),
      ADMIN_USER: "admin",
      ADMIN_PASSWORD: "integration-test-password",
      COOKIE_SECURE: "false",
      SEED_DEMO: "false",
    },
  },
});
