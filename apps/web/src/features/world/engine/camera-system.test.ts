import { describe, expect, it } from "vitest";

import {
  DEFAULT_CAMERA_SETTINGS,
  calculateThirdPersonCameraPose,
  clampCameraOrbit,
  dampValue,
  resolveCameraCollision,
  resolveCameraFov,
  resolveCameraMode
} from "./camera-system";

describe("world camera system", () => {
  it("clamps orbit pitch and distance while normalizing yaw", () => {
    const orbit = clampCameraOrbit(
      { distance: 40, pitch: 2, yaw: Math.PI * 3 },
      DEFAULT_CAMERA_SETTINGS
    );

    expect(orbit.distance).toBe(DEFAULT_CAMERA_SETTINGS.maxDistance);
    expect(orbit.pitch).toBe(DEFAULT_CAMERA_SETTINGS.maxPitch);
    expect(orbit.yaw).toBeCloseTo(Math.PI);
  });

  it("uses reduced-motion follow instead of cinematic travel", () => {
    expect(
      resolveCameraMode({
        cinematicTravelRequested: true,
        interactionActive: false,
        panelOpen: false,
        reducedMotion: true,
        settings: DEFAULT_CAMERA_SETTINGS
      })
    ).toBe("follow");
  });

  it("prioritizes panel and interaction camera modes", () => {
    expect(
      resolveCameraMode({
        cinematicTravelRequested: true,
        interactionActive: true,
        panelOpen: true,
        reducedMotion: false,
        settings: DEFAULT_CAMERA_SETTINGS
      })
    ).toBe("panel");

    expect(
      resolveCameraMode({
        cinematicTravelRequested: true,
        interactionActive: true,
        panelOpen: false,
        reducedMotion: false,
        settings: DEFAULT_CAMERA_SETTINGS
      })
    ).toBe("interaction");
  });

  it("adds sprint FOV only when reduced motion is disabled", () => {
    expect(
      resolveCameraFov({
        movementState: "sprint",
        reducedMotion: false,
        settings: DEFAULT_CAMERA_SETTINGS
      })
    ).toBe(DEFAULT_CAMERA_SETTINGS.baseFov + DEFAULT_CAMERA_SETTINGS.sprintFovBoost);

    expect(
      resolveCameraFov({
        movementState: "sprint",
        reducedMotion: true,
        settings: DEFAULT_CAMERA_SETTINGS
      })
    ).toBe(DEFAULT_CAMERA_SETTINGS.baseFov);
  });

  it("shortens the camera segment before a blocking sphere", () => {
    const resolved = resolveCameraCollision({
      collision: {
        blockers: [{ center: [0, 1, 4], radius: 1.5 }]
      },
      desiredPosition: [0, 1, 8],
      target: [0, 1, 0]
    });

    expect(resolved.collisionShortened).toBe(true);
    expect(resolved.position[2]).toBeLessThan(4);
  });

  it("calculates a stable third-person pose behind the player", () => {
    const pose = calculateThirdPersonCameraPose({
      movementState: "jog",
      orbit: { distance: DEFAULT_CAMERA_SETTINGS.distance, pitch: 0.22, yaw: 0 },
      playerPosition: [0, 1.1, 0],
      reducedMotion: false,
      settings: DEFAULT_CAMERA_SETTINGS
    });

    expect(pose.position[2]).toBeGreaterThan(pose.target[2]);
    expect(pose.position[1]).toBeGreaterThan(pose.target[1]);
    expect(pose.fov).toBe(DEFAULT_CAMERA_SETTINGS.baseFov);
  });

  it("damps values toward the target without snapping", () => {
    const next = dampValue(0, 10, 8, 0.016);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });
});
