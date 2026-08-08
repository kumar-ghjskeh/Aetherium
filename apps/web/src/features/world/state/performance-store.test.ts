import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_RUNTIME_METRICS } from "../engine/performance-manager";
import { useWorldPerformanceStore } from "./performance-store";

describe("world performance store", () => {
  beforeEach(() => {
    useWorldPerformanceStore.setState({
      effectiveTier: "balanced",
      metrics: DEFAULT_RUNTIME_METRICS
    });
  });

  it("publishes infrequent diagnostics outside the scene component tree", () => {
    useWorldPerformanceStore.getState().setEffectiveTier("low");
    useWorldPerformanceStore.getState().setMetrics({
      ...DEFAULT_RUNTIME_METRICS,
      fps: 42,
      frameTimeMs: 23.8
    });

    expect(useWorldPerformanceStore.getState()).toMatchObject({
      effectiveTier: "low",
      metrics: { fps: 42, frameTimeMs: 23.8 }
    });
  });
});
