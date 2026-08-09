import type { PerformancePreset } from "@aetherium/shared-types";
import { create } from "zustand";

import type { WorldTimeMode } from "../engine/time-manager";
import type { WorldWeatherMode } from "../engine/weather-manager";

export type WorldTextScale = "default" | "large" | "largest";

interface WorldSettingsState {
  accessibilityPanelOpen: boolean;
  diagnosticsVisible: boolean;
  graphicsPreset: PerformancePreset;
  highContrastEnabled: boolean;
  particlesEnabled: boolean;
  reducedMotionEnabled: boolean;
  setAccessibilityPanelOpen: (open: boolean) => void;
  setTimeMode: (mode: WorldTimeMode) => void;
  setWeatherEnabled: (enabled: boolean) => void;
  setWeatherMode: (mode: WorldWeatherMode) => void;
  setDiagnosticsVisible: (visible: boolean) => void;
  setGraphicsPreset: (preset: PerformancePreset) => void;
  setHighContrastEnabled: (enabled: boolean) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setReducedMotionEnabled: (enabled: boolean) => void;
  setTextScale: (scale: WorldTextScale) => void;
  textScale: WorldTextScale;
  timeMode: WorldTimeMode;
  weatherEnabled: boolean;
  weatherMode: WorldWeatherMode;
}

export const useWorldSettingsStore = create<WorldSettingsState>((set) => ({
  accessibilityPanelOpen: false,
  diagnosticsVisible: false,
  graphicsPreset: "balanced",
  highContrastEnabled: false,
  particlesEnabled: true,
  reducedMotionEnabled: false,
  setAccessibilityPanelOpen: (accessibilityPanelOpen) => set({ accessibilityPanelOpen }),
  setDiagnosticsVisible: (visible) => set({ diagnosticsVisible: visible }),
  setGraphicsPreset: (preset) => set({ graphicsPreset: preset }),
  setHighContrastEnabled: (highContrastEnabled) => set({ highContrastEnabled }),
  setParticlesEnabled: (particlesEnabled) => set({ particlesEnabled }),
  setReducedMotionEnabled: (reducedMotionEnabled) => set({ reducedMotionEnabled }),
  setTextScale: (textScale) => set({ textScale }),
  setTimeMode: (mode) => set({ timeMode: mode }),
  setWeatherEnabled: (enabled) => set({ weatherEnabled: enabled }),
  setWeatherMode: (mode) => set({ weatherMode: mode }),
  textScale: "default",
  timeMode: "cycle",
  weatherEnabled: true,
  weatherMode: "automatic"
}));
