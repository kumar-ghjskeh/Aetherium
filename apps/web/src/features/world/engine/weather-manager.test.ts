import { describe, expect, it } from "vitest";

import {
  createDeterministicAtmospherePoints,
  resolveAutomaticWeather,
  resolveWorldWeatherBudget
} from "./weather-manager";

describe("world weather manager", () => {
  it("keeps automatic weather deterministic for a fixed seed and time bucket", () => {
    expect(resolveAutomaticWeather(80421, 12)).toBe(resolveAutomaticWeather(80421, 12));
  });

  it("caps effects by preset and removes rain motion for reduced motion", () => {
    const low = resolveWorldWeatherBudget({
      enabled: true,
      mode: "rain",
      performancePreset: "low",
      reducedMotion: false,
      seed: 1,
      timeBucket: 0
    });
    const high = resolveWorldWeatherBudget({
      enabled: true,
      mode: "rain",
      performancePreset: "high",
      reducedMotion: false,
      seed: 1,
      timeBucket: 0
    });
    const reduced = resolveWorldWeatherBudget({
      enabled: true,
      mode: "rain",
      performancePreset: "high",
      reducedMotion: true,
      seed: 1,
      timeBucket: 0
    });

    expect(low.rainDropCount).toBeLessThan(high.rainDropCount);
    expect(reduced).toMatchObject({ animated: false, rainDropCount: 0, weather: "rain" });
  });

  it("disables weather and generates reproducible point fields", () => {
    const disabled = resolveWorldWeatherBudget({
      enabled: false,
      mode: "rain",
      performancePreset: "balanced",
      reducedMotion: false,
      seed: 2,
      timeBucket: 4
    });
    const points = createDeterministicAtmospherePoints({
      count: 4,
      height: [10, 20],
      radius: 30,
      seed: 9
    });
    expect(disabled.weather).toBe("clear");
    expect(disabled.rainDropCount).toBe(0);
    expect(Array.from(points)).toEqual(
      Array.from(
        createDeterministicAtmospherePoints({ count: 4, height: [10, 20], radius: 30, seed: 9 })
      )
    );
  });
});
