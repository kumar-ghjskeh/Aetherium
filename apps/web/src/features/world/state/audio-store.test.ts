import type { UserPreferences } from "@aetherium/shared-types";
import { beforeEach, describe, expect, it } from "vitest";

import { useWorldAudioStore } from "./audio-store";

const preferences: UserPreferences = {
  aiMemoryEnabled: false,
  ambientAudioEnabled: false,
  backgroundMusicEnabled: true,
  cameraEffectsEnabled: false,
  createdAt: "2026-01-01T00:00:00Z",
  defaultInterfaceMode: "command",
  id: "preferences-1",
  locale: "en-US",
  performancePreset: "low",
  productAnalyticsEnabled: false,
  reducedMotion: false,
  theme: "dark",
  timeZone: "UTC",
  updatedAt: "2026-01-01T00:00:00Z"
};

describe("world audio store", () => {
  beforeEach(() => {
    useWorldAudioStore.setState({
      ambientEnabled: true,
      ambientVolume: 0.62,
      captionsEnabled: true,
      effectsVolume: 0.72,
      masterVolume: 0.78,
      musicEnabled: true,
      musicVolume: 0.48,
      muted: false,
      performancePreset: "balanced",
      reducedSensory: false
    });
  });

  it("hydrates persisted booleans and clamps transient visit volumes", () => {
    const store = useWorldAudioStore.getState();
    store.hydratePreferences(preferences);
    store.setMasterVolume(4);
    store.setMusicVolume(-2);

    expect(useWorldAudioStore.getState()).toMatchObject({
      ambientEnabled: false,
      masterVolume: 1,
      musicEnabled: true,
      musicVolume: 0,
      performancePreset: "low"
    });
  });
});
