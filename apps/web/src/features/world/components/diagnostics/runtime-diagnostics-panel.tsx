import type { PerformancePreset, WorldLocationPage, WorldProfile } from "@aetherium/shared-types";
import React from "react";

import { useWorldPerformanceStore } from "../../state/performance-store";
import { useWorldCameraStore } from "../../state/camera-store";
import { usePlayerStore } from "../../state/player-store";
import { useWorldSettingsStore } from "../../state/settings-store";

const PRESET_OPTIONS: PerformancePreset[] = ["automatic", "low", "balanced", "high"];

export function RuntimeDiagnosticsPanel({
  locationPage,
  pageVisible,
  profile
}: Readonly<{
  locationPage: WorldLocationPage;
  pageVisible: boolean;
  profile: WorldProfile;
}>): React.ReactElement {
  const diagnosticsVisible = useWorldSettingsStore((state) => state.diagnosticsVisible);
  const graphicsPreset = useWorldSettingsStore((state) => state.graphicsPreset);
  const setDiagnosticsVisible = useWorldSettingsStore((state) => state.setDiagnosticsVisible);
  const setGraphicsPreset = useWorldSettingsStore((state) => state.setGraphicsPreset);
  const effectiveTier = useWorldPerformanceStore((state) => state.effectiveTier);
  const metrics = useWorldPerformanceStore((state) => state.metrics);
  const movementState = usePlayerStore((state) => state.movementState);
  const completedTeleportSequence = usePlayerStore((state) => state.completedTeleportSequence);
  const pendingTeleport = usePlayerStore((state) => state.pendingTeleport);
  const planarSpeed = usePlayerStore((state) => state.planarSpeed);
  const playerPosition = usePlayerStore((state) => state.position);
  const playerPaused = usePlayerStore((state) => state.paused);
  const inputMode = usePlayerStore((state) => state.inputMode);
  const cameraMode = useWorldCameraStore((state) => state.mode);
  const cameraFov = useWorldCameraStore((state) => state.fov);
  const cameraCollisionShortened = useWorldCameraStore((state) => state.collisionShortened);
  const cameraSettings = useWorldCameraStore((state) => state.settings);
  const setBaseFov = useWorldCameraStore((state) => state.setBaseFov);
  const setCameraShakeEnabled = useWorldCameraStore((state) => state.setCameraShakeEnabled);
  const setCinematicTravelEnabled = useWorldCameraStore((state) => state.setCinematicTravelEnabled);
  const setDistance = useWorldCameraStore((state) => state.setDistance);
  const setInvertY = useWorldCameraStore((state) => state.setInvertY);
  const setMotionSmoothing = useWorldCameraStore((state) => state.setMotionSmoothing);
  const setSensitivity = useWorldCameraStore((state) => state.setSensitivity);
  const teleportSequence = usePlayerStore((state) => state.teleportSequence);
  const diagnosticsAllowed =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_AETHERIUM_WORLD_DEBUG === "true";

  return (
    <aside
      aria-label="World runtime controls"
      className="world-runtime-hud"
      data-completed-teleport-sequence={completedTeleportSequence}
      data-pending-teleport={pendingTeleport === null ? "false" : "true"}
      data-player-position={playerPosition.map((value) => value.toFixed(3)).join(",")}
      data-teleport-sequence={teleportSequence}
    >
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
        <strong>
          {graphicsPreset === "automatic" ? `Auto / ${effectiveTier}` : effectiveTier}
        </strong>
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
        <span>Camera</span>
        <strong>
          {cameraMode} / {cameraFov.toFixed(0)} deg
        </strong>
      </div>
      <div>
        <span>Collision</span>
        <strong>{cameraCollisionShortened ? "Adjusted" : "Clear"}</strong>
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
            <>
              <dl className="world-runtime-metrics" aria-label="World runtime diagnostics">
                <dt>FPS</dt>
                <dd>{metrics.fps.toFixed(0)}</dd>
                <dt>Frame time</dt>
                <dd>{metrics.frameTimeMs.toFixed(1)} ms</dd>
                <dt>Draw calls</dt>
                <dd>{metrics.drawCalls}</dd>
                <dt>Triangles</dt>
                <dd>{metrics.triangles}</dd>
                <dt>Active meshes</dt>
                <dd>{metrics.activeMeshes}</dd>
                <dt>Pixel ratio</dt>
                <dd>{metrics.pixelRatio.toFixed(2)}</dd>
                <dt>Loaded assets</dt>
                <dd>{metrics.loadedAssets}</dd>
                <dt>Texture estimate</dt>
                <dd>{metrics.textureMemoryEstimateMb.toFixed(0)} MB</dd>
                <dt>Physics bodies</dt>
                <dd>{metrics.physicsBodies}</dd>
                <dt>JS heap</dt>
                <dd>
                  {metrics.jsHeapUsedMb === null
                    ? "Unavailable"
                    : `${metrics.jsHeapUsedMb.toFixed(0)} MB`}
                </dd>
              </dl>
              {metrics.memoryWarning ? (
                <p className="world-runtime-warning" role="status">
                  {metrics.memoryWarning}
                </p>
              ) : null}
              <form
                className="world-runtime-camera-controls"
                aria-label="Camera settings"
                onSubmit={(event) => event.preventDefault()}
              >
                <label>
                  <span>Sensitivity</span>
                  <input
                    max="1.8"
                    min="0.2"
                    onChange={(event) => setSensitivity(Number(event.target.value))}
                    step="0.05"
                    type="range"
                    value={cameraSettings.sensitivity}
                  />
                </label>
                <label>
                  <span>Distance</span>
                  <input
                    max={cameraSettings.maxDistance}
                    min={cameraSettings.minDistance}
                    onChange={(event) => setDistance(Number(event.target.value))}
                    step="0.1"
                    type="range"
                    value={cameraSettings.distance}
                  />
                </label>
                <label>
                  <span>FOV</span>
                  <input
                    max="72"
                    min="45"
                    onChange={(event) => setBaseFov(Number(event.target.value))}
                    step="1"
                    type="range"
                    value={cameraSettings.baseFov}
                  />
                </label>
                <label>
                  <span>Smoothing</span>
                  <input
                    max="24"
                    min="0"
                    onChange={(event) => setMotionSmoothing(Number(event.target.value))}
                    step="1"
                    type="range"
                    value={cameraSettings.motionSmoothing}
                  />
                </label>
                <label className="world-runtime-camera-checkbox">
                  <input
                    checked={cameraSettings.invertY}
                    onChange={(event) => setInvertY(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Invert Y</span>
                </label>
                <label className="world-runtime-camera-checkbox">
                  <input
                    checked={cameraSettings.cameraShakeEnabled}
                    onChange={(event) => setCameraShakeEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Camera shake</span>
                </label>
                <label className="world-runtime-camera-checkbox">
                  <input
                    checked={cameraSettings.cinematicTravelEnabled}
                    onChange={(event) => setCinematicTravelEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Cinematic travel</span>
                </label>
              </form>
            </>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
