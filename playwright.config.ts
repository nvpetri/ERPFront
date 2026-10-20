import { defineConfig } from "@playwright/test";
const apiDir = process.env.API_DIR || "../ERPBack";
export default defineConfig({
  testDir: "test",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: [
    {
      command: "npm start",
      cwd: apiDir,
      url: "http://127.0.0.1:3001/v1/health",
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
      env: { ...process.env, NODE_ENV: "test", PORT: "3001" },
    },
    {
      command: "npm start",
      url: "http://localhost:3000",
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        NODE_ENV: "test",
        API_URL: "http://127.0.0.1:3001",
        APP_ORIGIN: "http://localhost:3000",
        COMPANY_SLUG: "erp-demo",
        SESSION_SECRET: "ci-only-frontend-secret-never-use-in-production",
      },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
