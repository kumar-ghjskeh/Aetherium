import { describe, expect, it } from "vitest";

import {
  advanceAutomaticPerformance,
  createAutomaticPerformanceState,
  resolveGraphicsPresetSettings,
  resolvePerformanceWarning,
  resolveTargetPixelRatio,
  type AutomaticPerformanceState
} from "./performance-manager";

describe("world performance manager", () => {
  it("resolves explicit and automatic preset budgets", () => {
    expect(resolveGraphicsPresetSettings("low")).toMatchObject({
      maxPixelRatio: 1,
      shadows: false,
      tier: "low",
      viewDistance: 520
    });
    expect(resolveGraphicsPresetSettings("automatic", "high").tier).toBe("high");
    expect(resolveTargetPixelRatio(2, resolveGraphicsPresetSettings("balanced"))).toBe(1.25);
    expect(resolveTargetPixelRatio(0.5, resolveGraphicsPresetSettings("low"))).toBe(0.75);
  });

  it("steps down only after repeated slow samples", () => {
    let state = createAutomaticPerformanceState(2);
    for (let index = 0; index < 3; index += 1) {
      state = advanceAutomaticPerformance(state, {
        fps: 40,
        frameTimeMs: 25,
        memoryWarning: false
      });
    }
    expect(state.pixelRatio).toBe(1.25);

    state = advanceAutomaticPerformance(state, {
      fps: 40,
      frameTimeMs: 25,
      memoryWarning: false
    });
    expect(state.pixelRatio).toBe(1.125);
    expect(state.effectiveTier).toBe("balanced");
  });

  it("recovers quality only after sustained fast samples", () => {
    let state: AutomaticPerformanceState = {
      ...createAutomaticPerformanceState(1),
      effectiveTier: "low",
      pixelRatio: 1
    };
    for (let index = 0; index < 12; index += 1) {
      state = advanceAutomaticPerformance(state, {
        fps: 60,
        frameTimeMs: 16,
        memoryWarning: false
      });
    }
    expect(state.effectiveTier).toBe("balanced");
    expect(state.pixelRatio).toBe(1);
  });

  it("reports the first exceeded runtime budget", () => {
    const balanced = resolveGraphicsPresetSettings("balanced");
    expect(
      resolvePerformanceWarning(
        {
          drawCalls: 351,
          jsHeapUsedMb: null,
          textureMemoryEstimateMb: 0,
          triangles: 1
        },
        balanced
      )
    ).toBe("Draw-call budget exceeded");
    expect(
      resolvePerformanceWarning(
        {
          drawCalls: 10,
          jsHeapUsedMb: 100,
          textureMemoryEstimateMb: 10,
          triangles: 10
        },
        balanced
      )
    ).toBeNull();
  });
});
