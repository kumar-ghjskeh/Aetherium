import type { PerformancePreset, UserPreferences } from "@aetherium/shared-types";
import { create } from "zustand";

interface WorldAudioState {
  ambientEnabled: boolean;
  ambientVolume: number;
  captionsEnabled: boolean;
  effectsVolume: number;
  hydratePreferences: (preferences: UserPreferences) => void;
  masterVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  muted: boolean;
  performancePreset: PerformancePreset;
  reducedSensory: boolean;
  setAmbientVolume: (value: number) => void;
  setCaptionsEnabled: (enabled: boolean) => void;
  setEffectsVolume: (value: number) => void;
  setMasterVolume: (value: number) => void;
  setMusicVolume: (value: number) => void;
  setMuted: (muted: boolean) => void;
  setReducedSensory: (enabled: boolean) => void;
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export const useWorldAudioStore = create<WorldAudioState>((set) => ({
  ambientEnabled: true,
  ambientVolume: 0.62,
  captionsEnabled: true,
  effectsVolume: 0.72,
  hydratePreferences: (preferences) =>
    set({
      ambientEnabled: preferences.ambientAudioEnabled,
      musicEnabled: preferences.backgroundMusicEnabled,
      performancePreset: preferences.performancePreset
    }),
  masterVolume: 0.78,
  musicEnabled: true,
  musicVolume: 0.48,
  muted: false,
  performancePreset: "balanced",
  reducedSensory: false,
  setAmbientVolume: (ambientVolume) => set({ ambientVolume: clampVolume(ambientVolume) }),
  setCaptionsEnabled: (captionsEnabled) => set({ captionsEnabled }),
  setEffectsVolume: (effectsVolume) => set({ effectsVolume: clampVolume(effectsVolume) }),
  setMasterVolume: (masterVolume) => set({ masterVolume: clampVolume(masterVolume) }),
  setMusicVolume: (musicVolume) => set({ musicVolume: clampVolume(musicVolume) }),
  setMuted: (muted) => set({ muted }),
  setReducedSensory: (reducedSensory) => set({ reducedSensory })
}));
