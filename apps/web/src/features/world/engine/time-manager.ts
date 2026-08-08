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
    ambientColor: "#6171a1",
    ambientIntensity: 0.34,
    backgroundColor: "#030713",
    fogColor: "#07101f",
    fraction: 0,
    hemisphereIntensity: 0.48,
    skyColor: "#081126",
    sunColor: "#869be4",
    sunIntensity: 0.18
  },
  {
    ambientColor: "#8a728a",
    ambientIntensity: 0.48,
    backgroundColor: "#1a1729",
    fogColor: "#342538",
    fraction: 0.22,
    hemisphereIntensity: 0.82,
    skyColor: "#6d4153",
    sunColor: "#ffb477",
    sunIntensity: 1.2
  },
  {
    ambientColor: "#8fa6bd",
    ambientIntensity: 0.58,
    backgroundColor: "#23445d",
    fogColor: "#52788b",
    fraction: 0.34,
    hemisphereIntensity: 1.28,
    skyColor: "#7eb5cf",
    sunColor: "#fff5d7",
    sunIntensity: 2.3
  },
  {
    ambientColor: "#91a8bd",
    ambientIntensity: 0.62,
    backgroundColor: "#315d76",
    fogColor: "#648a97",
    fraction: 0.58,
    hemisphereIntensity: 1.4,
    skyColor: "#8bc5dc",
    sunColor: "#fff8e7",
    sunIntensity: 2.55
  },
  {
    ambientColor: "#906f79",
    ambientIntensity: 0.48,
    backgroundColor: "#32233d",
    fogColor: "#5b3b4a",
    fraction: 0.76,
    hemisphereIntensity: 0.88,
    skyColor: "#ad655d",
    sunColor: "#ff9b5c",
    sunIntensity: 1.42
  },
  {
    ambientColor: "#6171a1",
    ambientIntensity: 0.34,
    backgroundColor: "#030713",
    fogColor: "#07101f",
    fraction: 0.86,
    hemisphereIntensity: 0.48,
    skyColor: "#081126",
    sunColor: "#869be4",
    sunIntensity: 0.18
  },
  {
    ambientColor: "#6171a1",
    ambientIntensity: 0.34,
    backgroundColor: "#030713",
    fogColor: "#07101f",
    fraction: 1,
    hemisphereIntensity: 0.48,
    skyColor: "#081126",
    sunColor: "#869be4",
    sunIntensity: 0.18
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
