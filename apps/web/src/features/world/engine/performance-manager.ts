import type { PerformancePreset } from "@aetherium/shared-types";
import type * as THREE from "three";

export type GraphicsQualityTier = Exclude<PerformancePreset, "automatic">;

export interface GraphicsPresetSettings {
  antialias: boolean;
  maxDrawCalls: number;
  maxPixelRatio: number;
  maxTextureMemoryMb: number;
  maxTriangles: number;
  minPixelRatio: number;
  particleDensity: number;
  shadowMapSize: 0 | 1024 | 2048;
  shadows: boolean;
  targetPixelRatio: number;
  tier: GraphicsQualityTier;
  vegetationDensity: number;
  viewDistance: number;
  waterQuality: "simple" | "standard" | "enhanced";
}

export interface WorldRuntimeMetrics {
  activeMeshes: number;
  drawCalls: number;
  fps: number;
  frameTimeMs: number;
  jsHeapUsedMb: number | null;
  loadedAssets: number;
  memoryWarning: string | null;
  physicsBodies: number;
  pixelRatio: number;
  textureMemoryEstimateMb: number;
  triangles: number;
}

export const DEFAULT_RUNTIME_METRICS: WorldRuntimeMetrics = {
  activeMeshes: 0,
  drawCalls: 0,
  fps: 0,
  frameTimeMs: 0,
  jsHeapUsedMb: null,
  loadedAssets: 0,
  memoryWarning: null,
  physicsBodies: 0,
  pixelRatio: 1,
  textureMemoryEstimateMb: 0,
  triangles: 0
};

const TIER_SETTINGS: Record<GraphicsQualityTier, GraphicsPresetSettings> = {
  balanced: {
    antialias: true,
    maxDrawCalls: 350,
    maxPixelRatio: 1.25,
    maxTextureMemoryMb: 512,
    maxTriangles: 800_000,
    minPixelRatio: 1,
    particleDensity: 1,
    shadowMapSize: 1024,
    shadows: true,
    targetPixelRatio: 1.25,
    tier: "balanced",
    vegetationDensity: 0.6,
    viewDistance: 780,
    waterQuality: "standard"
  },
  high: {
    antialias: true,
    maxDrawCalls: 450,
    maxPixelRatio: 1.5,
    maxTextureMemoryMb: 768,
    maxTriangles: 1_100_000,
    minPixelRatio: 1.25,
    particleDensity: 1.5,
    shadowMapSize: 2048,
    shadows: true,
    targetPixelRatio: 1.5,
    tier: "high",
    vegetationDensity: 1,
    viewDistance: 1100,
    waterQuality: "enhanced"
  },
  low: {
    antialias: false,
    maxDrawCalls: 260,
    maxPixelRatio: 1,
    maxTextureMemoryMb: 256,
    maxTriangles: 550_000,
    minPixelRatio: 0.75,
    particleDensity: 0.35,
    shadowMapSize: 0,
    shadows: false,
    targetPixelRatio: 1,
    tier: "low",
    vegetationDensity: 0.3,
    viewDistance: 520,
    waterQuality: "simple"
  }
};

const SLOW_SAMPLE_LIMIT = 4;
const FAST_SAMPLE_LIMIT = 12;
const PIXEL_RATIO_STEP = 0.125;

export interface AutomaticPerformanceState {
  effectiveTier: GraphicsQualityTier;
  fastSamples: number;
  pixelRatio: number;
  samples: number;
  slowSamples: number;
}

export interface PerformanceSample {
  fps: number;
  frameTimeMs: number;
  memoryWarning: boolean;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function lowerTier(tier: GraphicsQualityTier): GraphicsQualityTier {
  if (tier === "high") {
    return "balanced";
  }
  return "low";
}

function higherTier(tier: GraphicsQualityTier): GraphicsQualityTier {
  if (tier === "low") {
    return "balanced";
  }
  return "high";
}

export function resolveGraphicsPresetSettings(
  preset: PerformancePreset,
  automaticTier: GraphicsQualityTier = "balanced"
): GraphicsPresetSettings {
  return TIER_SETTINGS[preset === "automatic" ? automaticTier : preset];
}

export function resolveTargetPixelRatio(
  devicePixelRatio: number,
  settings: GraphicsPresetSettings
): number {
  const safeDeviceRatio = Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1;
  return clamp(safeDeviceRatio, settings.minPixelRatio, settings.targetPixelRatio);
}

export function createAutomaticPerformanceState(
  devicePixelRatio: number
): AutomaticPerformanceState {
  const settings = TIER_SETTINGS.balanced;
  return {
    effectiveTier: "balanced",
    fastSamples: 0,
    pixelRatio: resolveTargetPixelRatio(devicePixelRatio, settings),
    samples: 0,
    slowSamples: 0
  };
}

export function advanceAutomaticPerformance(
  state: AutomaticPerformanceState,
  sample: PerformanceSample
): AutomaticPerformanceState {
  if (sample.fps <= 0 || sample.frameTimeMs <= 0) {
    return { ...state, samples: state.samples + 1 };
  }

  const slowFrame = sample.memoryWarning || sample.fps < 48 || sample.frameTimeMs > 22;
  const fastFrame = !sample.memoryWarning && sample.fps >= 58 && sample.frameTimeMs <= 18;
  let next: AutomaticPerformanceState = {
    ...state,
    fastSamples: fastFrame ? state.fastSamples + 1 : 0,
    samples: state.samples + 1,
    slowSamples: slowFrame ? state.slowSamples + 1 : 0
  };

  if (next.slowSamples >= SLOW_SAMPLE_LIMIT) {
    const settings = TIER_SETTINGS[next.effectiveTier];
    if (next.pixelRatio > settings.minPixelRatio) {
      next = {
        ...next,
        pixelRatio: Math.max(settings.minPixelRatio, next.pixelRatio - PIXEL_RATIO_STEP)
      };
    } else if (next.effectiveTier !== "low") {
      const effectiveTier = lowerTier(next.effectiveTier);
      next = {
        ...next,
        effectiveTier,
        pixelRatio: clamp(
          next.pixelRatio,
          TIER_SETTINGS[effectiveTier].minPixelRatio,
          TIER_SETTINGS[effectiveTier].maxPixelRatio
        )
      };
    }
    return { ...next, fastSamples: 0, slowSamples: 0 };
  }

  if (next.fastSamples >= FAST_SAMPLE_LIMIT) {
    const settings = TIER_SETTINGS[next.effectiveTier];
    if (next.pixelRatio < settings.maxPixelRatio) {
      next = {
        ...next,
        pixelRatio: Math.min(settings.maxPixelRatio, next.pixelRatio + PIXEL_RATIO_STEP)
      };
    } else if (next.effectiveTier !== "high") {
      const effectiveTier = higherTier(next.effectiveTier);
      next = {
        ...next,
        effectiveTier,
        pixelRatio: clamp(
          next.pixelRatio,
          TIER_SETTINGS[effectiveTier].minPixelRatio,
          TIER_SETTINGS[effectiveTier].maxPixelRatio
        )
      };
    }
    return { ...next, fastSamples: 0, slowSamples: 0 };
  }

  return next;
}

export function resolvePerformanceWarning(
  metrics: Pick<
    WorldRuntimeMetrics,
    "drawCalls" | "jsHeapUsedMb" | "textureMemoryEstimateMb" | "triangles"
  >,
  settings: GraphicsPresetSettings
): string | null {
  if (metrics.drawCalls > settings.maxDrawCalls) {
    return "Draw-call budget exceeded";
  }
  if (metrics.triangles > settings.maxTriangles) {
    return "Triangle budget exceeded";
  }
  if (metrics.textureMemoryEstimateMb > settings.maxTextureMemoryMb) {
    return "Texture-memory estimate exceeded";
  }
  if (metrics.jsHeapUsedMb !== null && metrics.jsHeapUsedMb > 768) {
    return "JavaScript heap use is high";
  }
  return null;
}

export function estimateSceneTriangles(scene: THREE.Object3D): number {
  let triangles = 0;
  scene.traverse((object) => {
    const renderable = object as THREE.Object3D & {
      count?: number;
      geometry?: THREE.BufferGeometry;
      isInstancedMesh?: boolean;
      isMesh?: boolean;
    };
    if (!renderable.visible || !renderable.isMesh || !renderable.geometry) {
      return;
    }

    const geometry = renderable.geometry;
    const primitiveCount = geometry.index?.count ?? geometry.getAttribute("position")?.count ?? 0;
    let instanceCount = 1;
    if (renderable.isInstancedMesh) {
      instanceCount = Number.isFinite(renderable.count) ? Math.max(renderable.count ?? 0, 0) : 0;
    } else if ((geometry as THREE.InstancedBufferGeometry).isInstancedBufferGeometry) {
      const authoredCount = (geometry as THREE.InstancedBufferGeometry).instanceCount;
      const boundedAttributeCount =
        geometry.getAttribute("instanceStart")?.count ??
        geometry.getAttribute("instanceDistanceStart")?.count ??
        1;
      instanceCount = Number.isFinite(authoredCount)
        ? Math.max(authoredCount, 0)
        : boundedAttributeCount;
    }
    triangles += Math.floor(primitiveCount / 3) * instanceCount;
  });
  return Math.round(triangles);
}
