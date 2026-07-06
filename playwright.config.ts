import { defineConfig, devices } from "@playwright/test";

/**
 * Requires Postgres + Redis running (docker compose up -d) - same
 * requirement as the backend integration tests, since this drives the real
 * dev servers against a real database rather than mocking anything.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:backend",
      url: "http://localhost:4000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // Otherwise the production auth rate limiter (20 req/15min) throttles
      // this suite almost immediately - every spec registers at least one
      // user, and re-running the suite a few times exhausts it fast.
      env: { NODE_ENV: "test" },
    },
    {
      command: "npm run dev:frontend",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
