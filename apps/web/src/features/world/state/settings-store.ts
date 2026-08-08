import type { PerformancePreset } from "@aetherium/shared-types";
import { create } from "zustand";

import type { WorldTimeMode } from "../engine/time-manager";
import type { WorldWeatherMode } from "../engine/weather-manager";

interface WorldSettingsState {
  diagnosticsVisible: boolean;
  graphicsPreset: PerformancePreset;
  setTimeMode: (mode: WorldTimeMode) => void;
  setWeatherEnabled: (enabled: boolean) => void;
  setWeatherMode: (mode: WorldWeatherMode) => void;
  setDiagnosticsVisible: (visible: boolean) => void;
  setGraphicsPreset: (preset: PerformancePreset) => void;
  timeMode: WorldTimeMode;
  weatherEnabled: boolean;
  weatherMode: WorldWeatherMode;
}

export const useWorldSettingsStore = create<WorldSettingsState>((set) => ({
  diagnosticsVisible: false,
  graphicsPreset: "balanced",
  setDiagnosticsVisible: (visible) => set({ diagnosticsVisible: visible }),
  setGraphicsPreset: (preset) => set({ graphicsPreset: preset }),
  setTimeMode: (mode) => set({ timeMode: mode }),
  setWeatherEnabled: (enabled) => set({ weatherEnabled: enabled }),
  setWeatherMode: (mode) => set({ weatherMode: mode }),
  timeMode: "cycle",
  weatherEnabled: true,
  weatherMode: "automatic"
}));
