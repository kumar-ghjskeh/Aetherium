import type { PerformancePreset } from "@aetherium/shared-types";

export type WorldWeatherMode = "automatic" | "clear" | "mist" | "rain";
export type ResolvedWorldWeather = Exclude<WorldWeatherMode, "automatic">;

export interface WorldWeatherBudget {
  animated: boolean;
  cloudCount: number;
  mistCount: number;
  rainDropCount: number;
  weather: ResolvedWorldWeather;
  windStrength: number;
}

const PRESET_BUDGETS: Record<
  PerformancePreset,
  Omit<WorldWeatherBudget, "animated" | "weather">
> = {
  automatic: { cloudCount: 6, mistCount: 12, rainDropCount: 360, windStrength: 0.42 },
  balanced: { cloudCount: 6, mistCount: 12, rainDropCount: 360, windStrength: 0.42 },
  high: { cloudCount: 9, mistCount: 18, rainDropCount: 620, windStrength: 0.58 },
  low: { cloudCount: 3, mistCount: 6, rainDropCount: 140, windStrength: 0.24 }
};

function hashWeather(seed: number, timeBucket: number): number {
  let value = (seed ^ Math.imul(timeBucket + 1, 2654435761)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 2246822519) >>> 0;
  value ^= value >>> 13;
  return value >>> 0;
}

export function resolveAutomaticWeather(seed: number, timeBucket: number): ResolvedWorldWeather {
  const value = hashWeather(seed, timeBucket) % 100;
  if (value < 18) {
    return "rain";
  }
  if (value < 44) {
    return "mist";
  }
  return "clear";
}

export function resolveWorldWeatherBudget({
  enabled,
  mode,
  performancePreset,
  reducedMotion,
  seed,
  timeBucket
}: {
  enabled: boolean;
  mode: WorldWeatherMode;
  performancePreset: PerformancePreset;
  reducedMotion: boolean;
  seed: number;
  timeBucket: number;
}): WorldWeatherBudget {
  const resolvedWeather = !enabled
    ? "clear"
    : mode === "automatic"
      ? resolveAutomaticWeather(seed, timeBucket)
      : mode;
  const preset = PRESET_BUDGETS[performancePreset];

  return {
    animated: !reducedMotion,
    cloudCount:
      resolvedWeather === "clear" ? Math.ceil(preset.cloudCount * 0.6) : preset.cloudCount,
    mistCount: resolvedWeather === "mist" ? preset.mistCount : Math.ceil(preset.mistCount * 0.35),
    rainDropCount: resolvedWeather === "rain" && !reducedMotion ? preset.rainDropCount : 0,
    weather: resolvedWeather,
    windStrength: reducedMotion ? 0 : preset.windStrength
  };
}

export function createDeterministicAtmospherePoints({
  count,
  height,
  radius,
  seed
}: {
  count: number;
  height: readonly [number, number];
  radius: number;
  seed: number;
}): Float32Array {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const points = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * radius;
    points[index * 3] = Math.cos(angle) * distance;
    points[index * 3 + 1] = height[0] + random() * (height[1] - height[0]);
    points[index * 3 + 2] = Math.sin(angle) * distance;
  }
  return points;
}
