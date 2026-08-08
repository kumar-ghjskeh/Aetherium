import { describe, expect, it } from "vitest";

import {
  formatWorldAudioCaption,
  resolveFootstepInterval,
  resolveWorldAudioMix,
  resolveWorldAudioProfile,
  resolveWorldAudioZone,
  WORLD_AUDIO_ZONES
} from "./audio-system";

describe("world audio system", () => {
  it("maps all ten locations to distinct audio zones", () => {
    expect(WORLD_AUDIO_ZONES).toHaveLength(10);
    expect(new Set(WORLD_AUDIO_ZONES.map((zone) => zone.id)).size).toBe(10);
    expect(resolveWorldAudioZone([0, 0, 0])?.id).toBe("audio-central-plaza");
    expect(resolveWorldAudioZone([900, 0, 900])).toBeNull();
  });

  it("respects persisted enablement, mute, sensory, and preset controls", () => {
    const active = resolveWorldAudioMix({
      ambientEnabled: true,
      ambientVolume: 0.8,
      effectsVolume: 0.9,
      masterVolume: 0.7,
      musicEnabled: true,
      musicVolume: 0.6,
      muted: false,
      performancePreset: "low",
      reducedSensory: true
    });
    const muted = resolveWorldAudioMix({
      ambientEnabled: true,
      ambientVolume: 1,
      effectsVolume: 1,
      masterVolume: 1,
      musicEnabled: true,
      musicVolume: 1,
      muted: true,
      performancePreset: "balanced",
      reducedSensory: false
    });

    expect(active.ambientGain).toBeCloseTo(0.33);
    expect(active.musicGain).toBeCloseTo(0.33);
    expect(muted.masterGain).toBe(0);
  });

  it("provides movement cadence and readable non-color captions", () => {
    expect(resolveFootstepInterval("walk")).toBe(500);
    expect(resolveFootstepInterval("sprint")).toBe(260);
    expect(resolveFootstepInterval("idle")).toBeNull();
    expect(formatWorldAudioCaption(WORLD_AUDIO_ZONES[0] ?? null)).toContain("Central Plaza");
    expect(resolveWorldAudioProfile("audio-observatory").musicFrequencyHz).not.toBe(
      resolveWorldAudioProfile("audio-garden").musicFrequencyHz
    );
  });
});
