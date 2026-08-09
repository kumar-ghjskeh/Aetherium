import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

import {
  guardWorldRuntime,
  openRenderedWorld,
  readRuntimeMetrics,
  showDiagnostics,
  type RuntimeMetrics
} from "./world-test-helpers";

interface PerformanceEvidence {
  metrics: RuntimeMetrics;
  preset: "balanced" | "low";
  renderer: "headed-chromium" | "headless-chromium";
  viewport: { height: number; width: number };
}

const evidence: PerformanceEvidence[] = [];
const headedRun = process.env.AETHERIUM_VISUAL_HEADED === "true";
const renderer = headedRun ? "headed-chromium" : "headless-chromium";
const PROBES = [
  { preset: "low", viewport: { height: 1080, width: 1920 } },
  { preset: "balanced", viewport: { height: 1080, width: 1920 } },
  { preset: "balanced", viewport: { height: 1440, width: 2560 } }
] as const;

test("records runtime evidence across required resolutions and presets", async ({ page }) => {
  const guard = guardWorldRuntime(page);
  await openRenderedWorld(page);
  await page.locator(".world-audio-controls summary").click();
  await page.getByRole("button", { name: "Enable world audio" }).click();
  await expect(page.locator(".world-audio-controls summary")).toContainText("Active");
  await showDiagnostics(page);

  for (const probe of PROBES) {
    await page.setViewportSize(probe.viewport);
    await page.getByLabel("Graphics preset").selectOption(probe.preset);
    await page.waitForTimeout(1_000);

    await expect
      .poll(async () => (await readRuntimeMetrics(page)).fps, {
        message: "headless renderer must continue producing frames",
        timeout: 30_000
      })
      .toBeGreaterThan(0);

    const metrics = await readRuntimeMetrics(page);
    expect(metrics.drawCalls).toBeGreaterThan(0);
    expect(metrics.triangles).toBeGreaterThan(0);
    expect(metrics.activeMeshes).toBeGreaterThan(0);
    expect(Number.isFinite(metrics.physicsBodies)).toBe(true);
    evidence.push({
      metrics,
      preset: probe.preset,
      renderer,
      viewport: probe.viewport
    });
  }

  guard.assertClean();
});

test.afterAll(async () => {
  await mkdir("artifacts/playwright", { recursive: true });
  await writeFile(
    `artifacts/playwright/world-performance-${headedRun ? "headed" : "headless"}.json`,
    `${JSON.stringify({ capturedAt: new Date().toISOString(), evidence }, null, 2)}\n`,
    "utf8"
  );
});
