import { defineConfig, devices } from "@playwright/test";

const webBaseUrl = "http://localhost:3000";
const apiBaseUrl = "http://localhost:8000";
const headedVisualRun = process.env.AETHERIUM_VISUAL_HEADED === "true";

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.012,
      threshold: 0.18
    }
  },
  fullyParallel: false,
  globalSetup: "./apps/web/e2e/world/global-setup.ts",
  outputDir: "artifacts/playwright/results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "artifacts/playwright/report" }]],
  retries: process.env.CI ? 1 : 0,
  snapshotPathTemplate: headedVisualRun
    ? "{testDir}/__screenshots__/{arg}{ext}"
    : "{testDir}/__screenshots__/headless/{arg}{ext}",
  testDir: "./apps/web/e2e/world",
  timeout: 180_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: webBaseUrl,
    colorScheme: "dark",
    headless: !headedVisualRun,
    launchOptions: {
      args: headedVisualRun ? [] : ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"]
    },
    locale: "en-US",
    reducedMotion: "no-preference",
    screenshot: "only-on-failure",
    storageState: "artifacts/playwright/auth/visual-user.json",
    timezoneId: "UTC",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    viewport: { height: 900, width: 1440 }
  },
  webServer: [
    {
      command:
        "node scripts/python-task.mjs uvicorn visual_test_server:app --app-dir apps/api --host 127.0.0.1 --port 8000",
      env: {
        AETHERIUM_APP_ENV: "test",
        AETHERIUM_CORS_ORIGINS: webBaseUrl,
        AETHERIUM_SESSION_COOKIE_SECURE: "false",
        AETHERIUM_SESSION_SIGNING_SECRET: "aetherium-visual-session-secret",
        AETHERIUM_VISUAL_SEED_TOKEN: "aetherium-visual-seed"
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${apiBaseUrl}/api/v1/health/live`
    },
    {
      command: "pnpm --filter @aetherium/web dev --hostname 127.0.0.1",
      env: {
        NEXT_PUBLIC_AETHERIUM_API_BASE_URL: apiBaseUrl,
        NEXT_PUBLIC_AETHERIUM_WORLD_DEBUG: "true",
        NEXT_PUBLIC_AETHERIUM_WORLD_VISUAL_TEST: "true"
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: webBaseUrl
    }
  ],
  workers: 1
});
