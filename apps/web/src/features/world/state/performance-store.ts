import { create } from "zustand";

import {
  DEFAULT_RUNTIME_METRICS,
  type GraphicsQualityTier,
  type WorldRuntimeMetrics
} from "../engine/performance-manager";

interface WorldPerformanceState {
  effectiveTier: GraphicsQualityTier;
  metrics: WorldRuntimeMetrics;
  setEffectiveTier: (tier: GraphicsQualityTier) => void;
  setMetrics: (metrics: WorldRuntimeMetrics) => void;
}

export const useWorldPerformanceStore = create<WorldPerformanceState>((set) => ({
  effectiveTier: "balanced",
  metrics: DEFAULT_RUNTIME_METRICS,
  setEffectiveTier: (effectiveTier) => set({ effectiveTier }),
  setMetrics: (metrics) => set({ metrics })
}));
