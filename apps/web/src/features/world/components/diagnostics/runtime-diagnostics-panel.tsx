import type { PerformancePreset, WorldLocationPage, WorldProfile } from "@aetherium/shared-types";
import React from "react";

import { usePlayerStore } from "../../state/player-store";
import { useWorldSettingsStore } from "../../state/settings-store";

export interface WorldRuntimeMetrics {
  activeObjects: number;
  drawCalls: number;
  fps: number;
  frameTimeMs: number;
  pixelRatio: number;
  triangles: number;
}

export const DEFAULT_RUNTIME_METRICS: WorldRuntimeMetrics = {
  activeObjects: 0,
  drawCalls: 0,
  fps: 0,
  frameTimeMs: 0,
  pixelRatio: 1,
  triangles: 0
};

const PRESET_OPTIONS: PerformancePreset[] = ["automatic", "low", "balanced", "high"];

export function RuntimeDiagnosticsPanel({
  locationPage,
  metrics,
  pageVisible,
  profile
}: Readonly<{
  locationPage: WorldLocationPage;
  metrics: WorldRuntimeMetrics;
  pageVisible: boolean;
  profile: WorldProfile;
}>): React.ReactElement {
  const diagnosticsVisible = useWorldSettingsStore((state) => state.diagnosticsVisible);
  const graphicsPreset = useWorldSettingsStore((state) => state.graphicsPreset);
  const setDiagnosticsVisible = useWorldSettingsStore((state) => state.setDiagnosticsVisible);
  const setGraphicsPreset = useWorldSettingsStore((state) => state.setGraphicsPreset);
  const movementState = usePlayerStore((state) => state.movementState);
  const planarSpeed = usePlayerStore((state) => state.planarSpeed);
  const playerPaused = usePlayerStore((state) => state.paused);
  const inputMode = usePlayerStore((state) => state.inputMode);
  const diagnosticsAllowed =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_AETHERIUM_WORLD_DEBUG === "true";

  return (
    <aside className="world-runtime-hud" aria-label="World runtime controls">
      <div>
        <span>Location</span>
        <strong>{profile.currentLocationId}</strong>
      </div>
      <div>
        <span>Preset</span>
        <label className="sr-only" htmlFor="world-graphics-preset">
          Graphics preset
        </label>
        <select
          id="world-graphics-preset"
          onChange={(event) => setGraphicsPreset(event.target.value as PerformancePreset)}
          value={graphicsPreset}
        >
          {PRESET_OPTIONS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span>Runtime</span>
        <strong>{playerPaused || !pageVisible ? "Paused" : "Active"}</strong>
      </div>
      <div>
        <span>Movement</span>
        <strong>{movementState}</strong>
      </div>
      <div>
        <span>Input</span>
        <strong>{inputMode}</strong>
      </div>
      <div>
        <span>Speed</span>
        <strong>{planarSpeed.toFixed(1)} m/s</strong>
      </div>
      <div>
        <span>Locations</span>
        <strong>{locationPage.unlockedCount} unlocked</strong>
      </div>

      {diagnosticsAllowed ? (
        <>
          <button
            className="world-runtime-button"
            onClick={() => setDiagnosticsVisible(!diagnosticsVisible)}
            type="button"
          >
            {diagnosticsVisible ? "Hide diagnostics" : "Show diagnostics"}
          </button>
          {diagnosticsVisible ? (
            <dl className="world-runtime-metrics" aria-label="World runtime diagnostics">
              <dt>FPS</dt>
              <dd>{metrics.fps.toFixed(0)}</dd>
              <dt>Frame time</dt>
              <dd>{metrics.frameTimeMs.toFixed(1)} ms</dd>
              <dt>Draw calls</dt>
              <dd>{metrics.drawCalls}</dd>
              <dt>Triangles</dt>
              <dd>{metrics.triangles}</dd>
              <dt>Active objects</dt>
              <dd>{metrics.activeObjects}</dd>
              <dt>Pixel ratio</dt>
              <dd>{metrics.pixelRatio.toFixed(2)}</dd>
            </dl>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
