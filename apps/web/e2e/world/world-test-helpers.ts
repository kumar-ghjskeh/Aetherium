import { expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";

export interface RuntimeMetrics {
  activeMeshes: number;
  drawCalls: number;
  fps: number;
  frameTimeMs: number;
  loadedAssets: number;
  physicsBodies: number;
  pixelRatio: number;
  textureEstimateMb: number;
  triangles: number;
}

export interface RuntimeGuard {
  assertClean: () => void;
}

interface OverlayRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

const APP_ORIGINS = ["http://localhost:3000", "http://localhost:8000"];

export function guardWorldRuntime(
  page: Page,
  expectedFailureFragments: string[] = []
): RuntimeGuard {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  const serverErrors: string[] = [];
  const isExpected = (value: string) =>
    expectedFailureFragments.some((fragment) => value.includes(fragment));

  page.on("console", (message) => {
    if (message.type() === "error" && !isExpected(message.text())) {
      const location = message.location();
      consoleErrors.push(
        `${message.text()} (${location.url || "unknown source"}:${location.lineNumber})`
      );
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (APP_ORIGINS.some((origin) => url.startsWith(origin)) && !isExpected(url)) {
      requestFailures.push(
        `${request.method()} ${url}: ${request.failure()?.errorText ?? "failed"}`
      );
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (
      response.status() >= 400 &&
      APP_ORIGINS.some((origin) => url.startsWith(origin)) &&
      !isExpected(url)
    ) {
      serverErrors.push(`${response.status()} ${url}`);
    }
  });

  return {
    assertClean: () => {
      expect(consoleErrors, "critical browser console errors").toEqual([]);
      expect(pageErrors, "uncaught browser runtime errors").toEqual([]);
      expect(requestFailures, "failed Aetherium network requests").toEqual([]);
      expect(serverErrors, "Aetherium server errors").toEqual([]);
    }
  };
}

export async function openRenderedWorld(page: Page, destination = "central_plaza"): Promise<void> {
  await page.goto(`/app/world?destination=${destination}&mode=instant`, {
    waitUntil: "domcontentloaded"
  });
  const frame = page.locator(".world-runtime-frame");
  await expect(frame).toBeVisible({ timeout: 60_000 });
  await expect(frame.locator("canvas")).toBeVisible({ timeout: 60_000 });
  const locationValue = page.locator(".world-runtime-hud > div").first().locator("strong");
  await expect(locationValue).toHaveText(destination, { timeout: 30_000 });
  const runtimeHud = page.locator(".world-runtime-hud");
  await expect
    .poll(
      async () =>
        Number.parseInt(
          (await runtimeHud.getAttribute("data-completed-teleport-sequence")) ?? "0",
          10
        ),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(0);
  await expect(runtimeHud).toHaveAttribute("data-pending-teleport", "false");
  await page.waitForTimeout(500);
}

export async function travelToDistrict(
  page: Page,
  destination: { backendId: string; id: string; name: string }
): Promise<void> {
  const runtimeHud = page.locator(".world-runtime-hud");
  const completedBeforeTravel = Number.parseInt(
    (await runtimeHud.getAttribute("data-completed-teleport-sequence")) ?? "0",
    10
  );
  await page.getByRole("button", { name: "Map", exact: true }).click();
  const worldMap = page.getByRole("dialog", { name: "Aetherium world map" });
  await expect(worldMap).toBeVisible();
  await worldMap.getByRole("button", { name: "Instant", exact: true }).click();
  const marker = worldMap.locator(`.world-map-marker[aria-label="${destination.name}"]`);
  await expect(marker).toBeVisible();
  await expect(marker).toBeEnabled();
  await marker.click({ timeout: 15_000 });
  await worldMap.getByRole("button", { name: "Travel instant" }).click();
  const locationValue = page.locator(".world-runtime-hud > div").first().locator("strong");
  await expect(locationValue).toHaveText(destination.backendId, { timeout: 30_000 });
  await expect
    .poll(
      async () =>
        Number.parseInt(
          (await runtimeHud.getAttribute("data-completed-teleport-sequence")) ?? "0",
          10
        ),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(completedBeforeTravel);
  await expect(runtimeHud).toHaveAttribute("data-pending-teleport", "false");
  await expect(runtimeHud).toHaveAttribute("data-navigation-destination", destination.id);
  await expect
    .poll(
      async () =>
        Number.parseInt((await runtimeHud.getAttribute("data-arrival-framing-until")) ?? "0", 10) -
        Date.now(),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(2_000);
  await expect
    .poll(
      async () => {
        const before = parsePosition(await runtimeHud.getAttribute("data-camera-position"));
        await page.waitForTimeout(250);
        const after = parsePosition(await runtimeHud.getAttribute("data-camera-position"));
        return Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2]);
      },
      { timeout: 30_000 }
    )
    .toBeLessThan(0.08);
}

function parsePosition(value: string | null): [number, number, number] {
  const parts = (value ?? "0,0,0").split(",").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

export async function expectWorldSnapshot(page: Page, name: string): Promise<void> {
  const screenshot = await assertCanvasIsNonblank(page);
  expect(screenshot).toMatchSnapshot(name, {
    maxDiffPixelRatio: 0.03,
    threshold: 0.2
  });
}

export async function expectWorldOverlaysNotToOverlap(page: Page): Promise<void> {
  const selectors = {
    atmosphere: ".world-atmosphere-controls",
    audio: ".world-audio-controls",
    district:
      ".world-plaza-panel:visible, .world-library-panel:visible, .world-ai-panel:visible, .world-habit-panel:visible, .world-learning-panel:visible, .world-coding-panel:visible, .world-project-dock-panel:visible, .world-progress-tower-panel:visible, .world-achievement-hall-panel:visible, .world-sanctuary-panel:visible",
    label: ".world-runtime-label"
  } as const;
  const rectangles = Object.fromEntries(
    await Promise.all(
      Object.entries(selectors).map(async ([name, selector]) => {
        const box = await page.locator(selector).first().boundingBox();
        expect(box, `${name} world overlay`).not.toBeNull();
        return [
          name,
          {
            bottom: (box?.y ?? 0) + (box?.height ?? 0),
            left: box?.x ?? 0,
            right: (box?.x ?? 0) + (box?.width ?? 0),
            top: box?.y ?? 0
          } satisfies OverlayRect
        ];
      })
    )
  ) as Record<keyof typeof selectors, OverlayRect>;

  for (const [first, second] of [
    ["label", "atmosphere"],
    ["atmosphere", "audio"],
    ["atmosphere", "district"],
    ["audio", "district"]
  ] as const) {
    expect(
      rectangles[first].right <= rectangles[second].left ||
        rectangles[second].right <= rectangles[first].left ||
        rectangles[first].bottom <= rectangles[second].top ||
        rectangles[second].bottom <= rectangles[first].top,
      `${first} and ${second} overlays must not overlap`
    ).toBe(true);
  }
}

export async function assertCanvasIsNonblank(page: Page): Promise<Buffer> {
  const canvas = page.locator(".world-runtime-frame canvas");
  const runtimeTelemetry = await page.locator(".world-runtime-hud").evaluate((element) => ({
    arrivalFramingUntil: element.getAttribute("data-arrival-framing-until"),
    cameraPosition: element.getAttribute("data-camera-position"),
    cameraTarget: element.getAttribute("data-camera-target"),
    destination: element.getAttribute("data-navigation-destination"),
    playerPosition: element.getAttribute("data-player-position")
  }));
  const capture = await canvas.evaluate((canvasElement) => {
    const renderCanvas = canvasElement as HTMLCanvasElement;
    const context = renderCanvas.getContext("webgl2") ?? renderCanvas.getContext("webgl");
    const centerPixel = new Uint8Array(4);
    if (context) {
      context.readPixels(
        Math.floor(context.drawingBufferWidth / 2),
        Math.floor(context.drawingBufferHeight / 2),
        1,
        1,
        context.RGBA,
        context.UNSIGNED_BYTE,
        centerPixel
      );
    }
    return {
      centerPixel: [...centerPixel],
      clientHeight: renderCanvas.clientHeight,
      clientWidth: renderCanvas.clientWidth,
      contextAttributes: context?.getContextAttributes(),
      contextLost: context?.isContextLost() ?? true,
      drawingBufferHeight: context?.drawingBufferHeight ?? 0,
      drawingBufferWidth: context?.drawingBufferWidth ?? 0,
      height: renderCanvas.height,
      width: renderCanvas.width
    };
  });
  expect(capture.contextLost, "world WebGL context").toBe(false);
  const screenshot = await canvas.screenshot({
    animations: "disabled",
    style: `
      body * { visibility: hidden !important; }
      .world-runtime-frame,
      .world-runtime-frame > div:first-child,
      .world-runtime-frame canvas { visibility: visible !important; }
    `,
    type: "png"
  });
  const captureDiagnostics = {
    ...capture,
    runtimeTelemetry,
    screenshotBytes: screenshot.byteLength
  };
  const png = PNG.sync.read(screenshot);
  let luminanceTotal = 0;
  let luminanceSquaredTotal = 0;
  let opaquePixels = 0;
  const pixelCount = png.width * png.height;

  for (let index = 0; index < png.data.length; index += 4) {
    const alpha = png.data[index + 3] ?? 0;
    if (alpha < 220) {
      continue;
    }
    opaquePixels += 1;
    const red = png.data[index] ?? 0;
    const green = png.data[index + 1] ?? 0;
    const blue = png.data[index + 2] ?? 0;
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    luminanceTotal += luminance;
    luminanceSquaredTotal += luminance * luminance;
  }

  const mean = luminanceTotal / Math.max(opaquePixels, 1);
  const variance = luminanceSquaredTotal / Math.max(opaquePixels, 1) - mean * mean;
  expect(
    opaquePixels / pixelCount,
    `canvas opaque pixel coverage (${JSON.stringify(captureDiagnostics)})`
  ).toBeGreaterThan(0.95);
  expect(mean, `canvas average luminance (${JSON.stringify(captureDiagnostics)})`).toBeGreaterThan(
    8
  );
  expect(mean, `canvas average luminance (${JSON.stringify(captureDiagnostics)})`).toBeLessThan(
    245
  );
  expect(
    Math.sqrt(Math.max(variance, 0)),
    `canvas luminance variation (${JSON.stringify(captureDiagnostics)})`
  ).toBeGreaterThan(10);
  return screenshot;
}

export async function showDiagnostics(page: Page): Promise<void> {
  const showButton = page.getByRole("button", { name: "Show diagnostics" });
  if (await showButton.isVisible()) {
    await showButton.click();
  }
  await expect(page.locator(".world-runtime-metrics")).toBeVisible();
}

export async function readRuntimeMetrics(page: Page): Promise<RuntimeMetrics> {
  const metrics = page.locator(".world-runtime-metrics");
  if (!(await metrics.isVisible())) {
    await showDiagnostics(page);
  }
  const values = new Map<string, string>();
  const labels = await metrics.locator("dt").allTextContents();
  const readings = await metrics.locator("dd").allTextContents();
  labels.forEach((label, index) => values.set(label, readings[index] ?? "0"));
  const number = (label: string) =>
    Number.parseFloat(values.get(label)?.replace(/[^0-9.]/g, "") ?? "0");

  return {
    activeMeshes: number("Active meshes"),
    drawCalls: number("Draw calls"),
    fps: number("FPS"),
    frameTimeMs: number("Frame time"),
    loadedAssets: number("Loaded assets"),
    physicsBodies: number("Physics bodies"),
    pixelRatio: number("Pixel ratio"),
    textureEstimateMb: number("Texture estimate"),
    triangles: number("Triangles")
  };
}
