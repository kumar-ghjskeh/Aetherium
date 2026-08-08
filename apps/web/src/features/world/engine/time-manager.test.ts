import { describe, expect, it } from "vitest";

import { resolveWorldTimeFraction, resolveWorldTimeSnapshot } from "./time-manager";

describe("world time manager", () => {
  it("resolves fixed day, sunset, and night phases", () => {
    expect(
      resolveWorldTimeSnapshot(resolveWorldTimeFraction({ elapsedSeconds: 0, mode: "day" })).phase
    ).toBe("day");
    expect(
      resolveWorldTimeSnapshot(resolveWorldTimeFraction({ elapsedSeconds: 0, mode: "sunset" }))
        .phase
    ).toBe("sunset");
    expect(
      resolveWorldTimeSnapshot(resolveWorldTimeFraction({ elapsedSeconds: 0, mode: "night" })).phase
    ).toBe("night");
  });

  it("loops a deterministic eight-minute day cycle", () => {
    expect(resolveWorldTimeFraction({ elapsedSeconds: 120, mode: "cycle" })).toBeCloseTo(0.25);
    expect(resolveWorldTimeFraction({ elapsedSeconds: 600, mode: "cycle" })).toBeCloseTo(0.25);
  });

  it("returns stable light and color values for screenshot presets", () => {
    const first = resolveWorldTimeSnapshot(0.74);
    const second = resolveWorldTimeSnapshot(0.74);
    expect(second).toEqual(first);
    expect(first.sunPosition).toHaveLength(3);
    expect(first.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
  });
});
