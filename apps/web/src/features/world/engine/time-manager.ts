export type WorldTimeMode = "cycle" | "day" | "sunset" | "night";

export type WorldDayPhase = "day" | "sunset" | "night";

export interface WorldTimeSnapshot {
  ambientColor: string;
  ambientIntensity: number;
  backgroundColor: string;
  fogColor: string;
  hemisphereIntensity: number;
  phase: WorldDayPhase;
  skyColor: string;
  sunColor: string;
  sunIntensity: number;
  sunPosition: readonly [number, number, number];
}

const FIXED_TIME_FRACTIONS: Record<Exclude<WorldTimeMode, "cycle">, number> = {
  day: 0.5,
  night: 0.9,
  sunset: 0.74
};

interface TimeKeyframe {
  ambientColor: string;
  ambientIntensity: number;
  backgroundColor: string;
  fogColor: string;
  fraction: number;
  hemisphereIntensity: number;
  skyColor: string;
  sunColor: string;
  sunIntensity: number;
}

const TIME_KEYFRAMES: readonly TimeKeyframe[] = [
  {
    ambientColor: "#46587a",
    ambientIntensity: 0.28,
    backgroundColor: "#020713",
    fogColor: "#081321",
    fraction: 0,
    hemisphereIntensity: 0.42,
    skyColor: "#0b1830",
    sunColor: "#8aa5ff",
    sunIntensity: 0.12
  },
  {
    ambientColor: "#765a72",
    ambientIntensity: 0.34,
    backgroundColor: "#181426",
    fogColor: "#382c45",
    fraction: 0.22,
    hemisphereIntensity: 0.72,
    skyColor: "#8a5268",
    sunColor: "#ffad72",
    sunIntensity: 1.4
  },
  {
    ambientColor: "#637d91",
    ambientIntensity: 0.36,
    backgroundColor: "#12364c",
    fogColor: "#355d68",
    fraction: 0.34,
    hemisphereIntensity: 0.98,
    skyColor: "#5897b5",
    sunColor: "#fff2cf",
    sunIntensity: 2.6
  },
  {
    ambientColor: "#6f8998",
    ambientIntensity: 0.38,
    backgroundColor: "#17445b",
    fogColor: "#426b74",
    fraction: 0.58,
    hemisphereIntensity: 1.02,
    skyColor: "#69a8c2",
    sunColor: "#fff6dd",
    sunIntensity: 2.8
  },
  {
    ambientColor: "#795364",
    ambientIntensity: 0.32,
    backgroundColor: "#251a32",
    fogColor: "#4a3444",
    fraction: 0.76,
    hemisphereIntensity: 0.68,
    skyColor: "#b05a52",
    sunColor: "#ff8e4f",
    sunIntensity: 1.8
  },
  {
    ambientColor: "#46587a",
    ambientIntensity: 0.28,
    backgroundColor: "#020713",
    fogColor: "#081321",
    fraction: 0.86,
    hemisphereIntensity: 0.42,
    skyColor: "#0b1830",
    sunColor: "#8aa5ff",
    sunIntensity: 0.12
  },
  {
    ambientColor: "#46587a",
    ambientIntensity: 0.28,
    backgroundColor: "#020713",
    fogColor: "#081321",
    fraction: 1,
    hemisphereIntensity: 0.42,
    skyColor: "#0b1830",
    sunColor: "#8aa5ff",
    sunIntensity: 0.12
  }
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColor(from: string, to: string, progress: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  return rgbToHex(
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
    start[2] + (end[2] - start[2]) * progress
  );
}

function mixNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function resolveWorldTimeFraction({
  cycleDurationSeconds = 480,
  elapsedSeconds,
  mode
}: {
  cycleDurationSeconds?: number;
  elapsedSeconds: number;
  mode: WorldTimeMode;
}): number {
  if (mode !== "cycle") {
    return FIXED_TIME_FRACTIONS[mode];
  }
  const safeDuration = Math.max(1, cycleDurationSeconds);
  return (((elapsedSeconds % safeDuration) + safeDuration) % safeDuration) / safeDuration;
}

export function resolveWorldTimeSnapshot(fraction: number): WorldTimeSnapshot {
  const normalized = clamp01(fraction);
  const upperIndex = TIME_KEYFRAMES.findIndex((keyframe) => keyframe.fraction >= normalized);
  const resolvedUpperIndex = Math.max(1, upperIndex);
  const to = TIME_KEYFRAMES[resolvedUpperIndex]!;
  const from = TIME_KEYFRAMES[resolvedUpperIndex - 1]!;
  const range = Math.max(0.0001, to.fraction - from.fraction);
  const progress = clamp01((normalized - from.fraction) / range);
  const solarAngle = (normalized - 0.25) * Math.PI * 2;
  const phase: WorldDayPhase =
    normalized >= 0.68 && normalized < 0.84
      ? "sunset"
      : normalized >= 0.31 && normalized < 0.68
        ? "day"
        : "night";

  return {
    ambientColor: mixColor(from.ambientColor, to.ambientColor, progress),
    ambientIntensity: mixNumber(from.ambientIntensity, to.ambientIntensity, progress),
    backgroundColor: mixColor(from.backgroundColor, to.backgroundColor, progress),
    fogColor: mixColor(from.fogColor, to.fogColor, progress),
    hemisphereIntensity: mixNumber(from.hemisphereIntensity, to.hemisphereIntensity, progress),
    phase,
    skyColor: mixColor(from.skyColor, to.skyColor, progress),
    sunColor: mixColor(from.sunColor, to.sunColor, progress),
    sunIntensity: mixNumber(from.sunIntensity, to.sunIntensity, progress),
    sunPosition: [
      Math.cos(solarAngle) * 230,
      Math.sin(solarAngle) * 230,
      Math.sin(solarAngle * 0.38) * 120
    ]
  };
}
