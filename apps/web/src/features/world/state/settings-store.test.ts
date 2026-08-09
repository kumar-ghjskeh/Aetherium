import { beforeEach, describe, expect, it } from "vitest";

import { useWorldSettingsStore } from "./settings-store";

describe("world settings store", () => {
  beforeEach(() => {
    useWorldSettingsStore.setState({
      accessibilityPanelOpen: false,
      diagnosticsVisible: false,
      graphicsPreset: "balanced",
      highContrastEnabled: false,
      particlesEnabled: true,
      reducedMotionEnabled: false,
      textScale: "default",
      timeMode: "cycle",
      weatherEnabled: true,
      weatherMode: "automatic"
    });
  });

  it("updates transient atmosphere settings without claiming backend persistence", () => {
    const settings = useWorldSettingsStore.getState();
    settings.setTimeMode("sunset");
    settings.setWeatherMode("mist");
    settings.setWeatherEnabled(false);

    expect(useWorldSettingsStore.getState()).toMatchObject({
      timeMode: "sunset",
      weatherEnabled: false,
      weatherMode: "mist"
    });
  });

  it("updates explicit world accessibility presentation settings", () => {
    const settings = useWorldSettingsStore.getState();
    settings.setAccessibilityPanelOpen(true);
    settings.setHighContrastEnabled(true);
    settings.setParticlesEnabled(false);
    settings.setReducedMotionEnabled(true);
    settings.setTextScale("largest");

    expect(useWorldSettingsStore.getState()).toMatchObject({
      accessibilityPanelOpen: true,
      highContrastEnabled: true,
      particlesEnabled: false,
      reducedMotionEnabled: true,
      textScale: "largest"
    });
  });
});
