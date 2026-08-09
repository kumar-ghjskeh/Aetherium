import { expect, test } from "@playwright/test";

import {
  expectWorldSnapshot,
  guardWorldRuntime,
  openRenderedWorld,
  travelToDistrict
} from "./world-test-helpers";

const DISTRICTS = [
  { backendId: "central_plaza", name: "Central Plaza", snapshot: "central-plaza" },
  { backendId: "library", name: "Knowledge Library", snapshot: "knowledge-library" },
  { backendId: "ai_hall", name: "AI Observatory", snapshot: "ai-observatory" },
  { backendId: "habit_garden", name: "Habit Garden", snapshot: "habit-garden" },
  {
    backendId: "research_laboratory",
    name: "Learning Academy",
    snapshot: "learning-academy"
  },
  { backendId: "programming_tower", name: "Coding Arena", snapshot: "coding-arena" },
  { backendId: "project_workshop", name: "Project Dock", snapshot: "project-dock" },
  { backendId: "command_center", name: "Progress Tower", snapshot: "progress-tower" },
  {
    backendId: "achievement_hall",
    name: "Achievement Hall",
    snapshot: "achievement-hall"
  },
  { backendId: "personal_home", name: "Personal Sanctuary", snapshot: "personal-sanctuary" }
] as const;

for (const district of DISTRICTS) {
  test(`renders real World Mode district: ${district.name}`, async ({ page }) => {
    test.setTimeout(120_000);
    const guard = guardWorldRuntime(page);
    await page.setViewportSize({ height: 900, width: 1440 });
    await openRenderedWorld(page);
    await page.getByLabel("Graphics preset").selectOption("low");
    await page.locator(".world-atmosphere-controls summary").click();
    await page.getByRole("button", { name: "Day", exact: true }).click();
    await page.waitForTimeout(1_000);

    await travelToDistrict(page, district);
    await expectWorldSnapshot(page, `${district.snapshot}.png`);

    guard.assertClean();
  });
}

for (const timeMode of ["Day", "Sunset", "Night"] as const) {
  test(`renders deterministic atmosphere: ${timeMode}`, async ({ page }) => {
    test.setTimeout(120_000);
    const guard = guardWorldRuntime(page);
    await page.setViewportSize({ height: 900, width: 1440 });
    await openRenderedWorld(page);
    await page.getByLabel("Graphics preset").selectOption("low");
    await page.locator(".world-atmosphere-controls summary").click();
    await page.getByRole("combobox", { name: "Weather pattern" }).selectOption("clear");
    await page.getByRole("button", { name: timeMode, exact: true }).click();
    await travelToDistrict(page, DISTRICTS[0]);
    await expectWorldSnapshot(page, `central-plaza-${timeMode.toLowerCase()}.png`);
    guard.assertClean();
  });
}

for (const preset of ["low", "balanced"] as const) {
  test(`renders deterministic graphics preset: ${preset}`, async ({ page }) => {
    test.setTimeout(120_000);
    const guard = guardWorldRuntime(page);
    await page.setViewportSize({ height: 900, width: 1440 });
    await openRenderedWorld(page);
    await page.locator(".world-atmosphere-controls summary").click();
    await page.getByRole("combobox", { name: "Weather pattern" }).selectOption("clear");
    await page.getByRole("button", { name: "Day", exact: true }).click();
    await page.getByLabel("Graphics preset").selectOption(preset);
    await travelToDistrict(page, DISTRICTS[0]);
    await expectWorldSnapshot(page, `central-plaza-${preset}.png`);
    guard.assertClean();
  });
}

test("falls back cleanly when reduced motion is requested", async ({ page }) => {
  const guard = guardWorldRuntime(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/app/world");
  const fallback = page.locator(".world-runtime-fallback");
  await expect(fallback).toContainText("Command Mode fallback");
  await expect(fallback).toContainText("Reduced motion is enabled");
  await expect(fallback).toHaveScreenshot("reduced-motion-fallback.png");
  guard.assertClean();
});

test("falls back cleanly when WebGL2 is unsupported", async ({ page }) => {
  const guard = guardWorldRuntime(page);
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patchedGetContext(
      contextId: string,
      ...args: unknown[]
    ): RenderingContext | null {
      if (contextId === "webgl2") {
        return null;
      }
      return Reflect.apply(getContext, this, [contextId, ...args]) as RenderingContext | null;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/app/world");
  const fallback = page.locator(".world-runtime-fallback");
  await expect(fallback).toContainText("did not provide a stable WebGL2 context");
  await expect(fallback).toHaveScreenshot("unsupported-webgl2-fallback.png");
  guard.assertClean();
});

test("shows a real error state when world data loading fails", async ({ page }) => {
  const guard = guardWorldRuntime(page, ["/api/v1/world/profile", "ERR_FAILED", "Failed to fetch"]);
  await page.route("**/api/v1/world/profile", (route) => route.abort("failed"));
  await page.goto("/app/world");
  const alert = page.getByRole("main").locator(".inline-alert[role='alert']");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("fetch");
  await expect(alert).toHaveScreenshot("world-loading-failure.png");
  guard.assertClean();
});
