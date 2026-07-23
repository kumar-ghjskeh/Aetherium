import type { PerformancePreset } from "@aetherium/shared-types";
import { create } from "zustand";

interface WorldSettingsState {
  diagnosticsVisible: boolean;
  graphicsPreset: PerformancePreset;
  setDiagnosticsVisible: (visible: boolean) => void;
  setGraphicsPreset: (preset: PerformancePreset) => void;
}

export const useWorldSettingsStore = create<WorldSettingsState>((set) => ({
  diagnosticsVisible: false,
  graphicsPreset: "balanced",
  setDiagnosticsVisible: (visible) => set({ diagnosticsVisible: visible }),
  setGraphicsPreset: (preset) => set({ graphicsPreset: preset })
}));
