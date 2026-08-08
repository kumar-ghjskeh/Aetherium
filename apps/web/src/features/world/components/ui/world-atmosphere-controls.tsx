import React from "react";

import type { WorldTimeMode } from "../../engine/time-manager";
import type { WorldWeatherMode } from "../../engine/weather-manager";
import { useWorldSettingsStore } from "../../state/settings-store";

const TIME_OPTIONS: readonly { label: string; value: WorldTimeMode }[] = [
  { label: "Cycle", value: "cycle" },
  { label: "Day", value: "day" },
  { label: "Sunset", value: "sunset" },
  { label: "Night", value: "night" }
];

export function WorldAtmosphereControls(): React.ReactElement {
  const timeMode = useWorldSettingsStore((state) => state.timeMode);
  const weatherEnabled = useWorldSettingsStore((state) => state.weatherEnabled);
  const weatherMode = useWorldSettingsStore((state) => state.weatherMode);
  const setTimeMode = useWorldSettingsStore((state) => state.setTimeMode);
  const setWeatherEnabled = useWorldSettingsStore((state) => state.setWeatherEnabled);
  const setWeatherMode = useWorldSettingsStore((state) => state.setWeatherMode);

  return (
    <details className="world-atmosphere-controls">
      <summary>
        <span>Atmosphere</span>
        <strong>{timeMode === "cycle" ? "Living cycle" : timeMode}</strong>
      </summary>
      <div>
        <span id="world-time-label">Time of day</span>
        <div aria-labelledby="world-time-label" className="world-time-segments" role="group">
          {TIME_OPTIONS.map((option) => (
            <button
              aria-pressed={timeMode === option.value}
              key={option.value}
              onClick={() => setTimeMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <label className="world-atmosphere-toggle">
        <input
          checked={weatherEnabled}
          onChange={(event) => setWeatherEnabled(event.target.checked)}
          type="checkbox"
        />
        Dynamic weather
      </label>
      <label>
        Weather pattern
        <select
          aria-label="Weather pattern"
          disabled={!weatherEnabled}
          onChange={(event) => setWeatherMode(event.target.value as WorldWeatherMode)}
          value={weatherMode}
        >
          <option value="automatic">Automatic</option>
          <option value="clear">Clear</option>
          <option value="mist">Mist</option>
          <option value="rain">Light rain</option>
        </select>
      </label>
      <small>
        World-only controls for this visit. Reduced motion removes moving precipitation.
      </small>
    </details>
  );
}
