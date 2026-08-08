import type { PerformancePreset } from "@aetherium/shared-types";

import { WORLD_AUDIO_MANIFEST } from "../manifests/audio.manifest";
import { WORLD_LOCATIONS_MANIFEST } from "../manifests/locations.manifest";
import type { PlayerMovementState } from "./player-controller";

export type WorldAudioCue =
  "achievement" | "footstep" | "interface" | "interaction" | "mentor" | "travel";

export interface WorldAudioZone {
  ambientLayer: string;
  center: readonly [number, number, number];
  id: string;
  musicLayer: string;
  name: string;
  radius: number;
}

export interface WorldAudioMix {
  ambientGain: number;
  effectsGain: number;
  masterGain: number;
  musicGain: number;
}

export interface WorldAudioProfile {
  ambientFilterHz: number;
  musicFrequencyHz: number;
}

const AUDIO_PROFILES: Record<string, WorldAudioProfile> = {
  "audio-academy": { ambientFilterHz: 980, musicFrequencyHz: 164.81 },
  "audio-achievements": { ambientFilterHz: 720, musicFrequencyHz: 196 },
  "audio-arena": { ambientFilterHz: 1320, musicFrequencyHz: 110 },
  "audio-central-plaza": { ambientFilterHz: 840, musicFrequencyHz: 130.81 },
  "audio-dock": { ambientFilterHz: 620, musicFrequencyHz: 146.83 },
  "audio-garden": { ambientFilterHz: 540, musicFrequencyHz: 174.61 },
  "audio-library": { ambientFilterHz: 760, musicFrequencyHz: 155.56 },
  "audio-observatory": { ambientFilterHz: 1080, musicFrequencyHz: 220 },
  "audio-progress": { ambientFilterHz: 1160, musicFrequencyHz: 185 },
  "audio-sanctuary": { ambientFilterHz: 460, musicFrequencyHz: 123.47 }
};

export const WORLD_AUDIO_ZONES: readonly WorldAudioZone[] = WORLD_LOCATIONS_MANIFEST.map(
  (location) => {
    const audio = WORLD_AUDIO_MANIFEST.find((entry) => entry.id === location.audioZone);
    if (!audio) {
      throw new Error(`World audio zone ${location.audioZone} is not registered.`);
    }
    return {
      ambientLayer: audio.ambientLayer,
      center: location.position,
      id: audio.id,
      musicLayer: audio.musicLayer,
      name: audio.name,
      radius: audio.radius
    };
  }
);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function resolveWorldAudioZone(
  position: readonly [number, number, number],
  zones: readonly WorldAudioZone[] = WORLD_AUDIO_ZONES
): WorldAudioZone | null {
  return (
    zones
      .map((zone) => ({
        normalizedDistance:
          Math.hypot(position[0] - zone.center[0], position[2] - zone.center[2]) / zone.radius,
        zone
      }))
      .filter((candidate) => candidate.normalizedDistance <= 1)
      .sort((left, right) => left.normalizedDistance - right.normalizedDistance)[0]?.zone ?? null
  );
}

export function resolveWorldAudioProfile(zoneId: string | null): WorldAudioProfile {
  return zoneId && AUDIO_PROFILES[zoneId]
    ? AUDIO_PROFILES[zoneId]
    : { ambientFilterHz: 680, musicFrequencyHz: 116.54 };
}

export function resolveWorldAudioMix({
  ambientEnabled,
  ambientVolume,
  effectsVolume,
  masterVolume,
  musicEnabled,
  musicVolume,
  muted,
  performancePreset,
  reducedSensory
}: {
  ambientEnabled: boolean;
  ambientVolume: number;
  effectsVolume: number;
  masterVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  muted: boolean;
  performancePreset: PerformancePreset;
  reducedSensory: boolean;
}): WorldAudioMix {
  const presetScale = performancePreset === "low" ? 0.75 : 1;
  const sensoryScale = reducedSensory ? 0.55 : 1;
  return {
    ambientGain: ambientEnabled ? clamp01(ambientVolume) * sensoryScale * presetScale : 0,
    effectsGain: clamp01(effectsVolume) * sensoryScale,
    masterGain: muted ? 0 : clamp01(masterVolume),
    musicGain: musicEnabled ? clamp01(musicVolume) * sensoryScale : 0
  };
}

export function resolveFootstepInterval(movementState: PlayerMovementState): number | null {
  if (movementState === "sprint") {
    return 260;
  }
  if (movementState === "jog") {
    return 360;
  }
  if (movementState === "walk") {
    return 500;
  }
  return null;
}

export function formatWorldAudioCaption(zone: WorldAudioZone | null): string {
  if (!zone) {
    return "Open-world ambience: distant wind and water.";
  }
  return `${zone.name}: ${zone.ambientLayer.replaceAll("-", " ")} ambience with ${zone.musicLayer.replaceAll("-", " ")} music.`;
}
