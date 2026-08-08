import { beforeEach, describe, expect, it } from "vitest";

import { useWorldSettingsStore } from "./settings-store";

describe("world settings store", () => {
  beforeEach(() => {
    useWorldSettingsStore.setState({
      diagnosticsVisible: false,
      graphicsPreset: "balanced",
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
});
