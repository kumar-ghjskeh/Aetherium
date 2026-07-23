import type { PerformancePreset } from "@aetherium/shared-types";

export interface GraphicsPresetSettings {
  antialias: boolean;
  maxPixelRatio: number;
  name: PerformancePreset;
  shadows: boolean;
}

const PRESET_SETTINGS: Record<PerformancePreset, GraphicsPresetSettings> = {
  automatic: {
    antialias: true,
    maxPixelRatio: 1.5,
    name: "automatic",
    shadows: false
  },
  balanced: {
    antialias: true,
    maxPixelRatio: 1.5,
    name: "balanced",
    shadows: false
  },
  high: {
    antialias: true,
    maxPixelRatio: 2,
    name: "high",
    shadows: true
  },
  low: {
    antialias: false,
    maxPixelRatio: 1,
    name: "low",
    shadows: false
  }
};

export function resolveGraphicsPresetSettings(preset: PerformancePreset): GraphicsPresetSettings {
  return PRESET_SETTINGS[preset];
}
