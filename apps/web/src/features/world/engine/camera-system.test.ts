import { describe, expect, it } from "vitest";

import {
  DEFAULT_CAMERA_SETTINGS,
  calculateThirdPersonCameraPose,
  clampCameraOrbit,
  dampValue,
  resolveCameraCollision,
  resolveCameraFov,
  resolveCameraMode,
  resolveArrivalCameraTarget,
  resolveCameraYawToward,
  shouldSnapArrivalCamera
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

  it("orients the arrival camera from a travel point toward its district", () => {
    const yaw = resolveCameraYawToward([10, 1, 20], [30, 1, 20]);
    const pose = calculateThirdPersonCameraPose({
      movementState: "idle",
      orbit: { distance: DEFAULT_CAMERA_SETTINGS.distance, pitch: 0.22, yaw },
      playerPosition: [10, 1, 20],
      reducedMotion: false,
      settings: DEFAULT_CAMERA_SETTINGS
    });

    expect(pose.position[0]).toBeLessThan(pose.target[0]);
  });

  it("snaps once for each active arrival sequence", () => {
    expect(
      shouldSnapArrivalCamera({
        arrivalSequence: 1_000,
        frameArrival: true,
        previousArrivalSequence: 0
      })
    ).toBe(true);
    expect(
      shouldSnapArrivalCamera({
        arrivalSequence: 1_000,
        frameArrival: true,
        previousArrivalSequence: 1_000
      })
    ).toBe(false);
    expect(
      shouldSnapArrivalCamera({
        arrivalSequence: 2_000,
        frameArrival: false,
        previousArrivalSequence: 1_000
      })
    ).toBe(false);
  });

  it("frames a nearby district during arrival and returns to the player afterward", () => {
    const playerTarget: [number, number, number] = [10, 2.4, 20];
    const arrivalTarget = resolveArrivalCameraTarget({
      destinationPosition: [30, 4, -10],
      destinationRadius: 60,
      frameArrival: true,
      playerPosition: [10, 1, 20],
      playerTarget
    });
    expect(arrivalTarget[0]).toBeCloseTo(30);
    expect(arrivalTarget[1]).toBeCloseTo(11.8);
    expect(arrivalTarget[2]).toBeCloseTo(-10);
    expect(
      resolveArrivalCameraTarget({
        destinationPosition: [30, 4, -10],
        destinationRadius: 60,
        frameArrival: false,
        playerPosition: [10, 1, 20],
        playerTarget
      })
    ).toBe(playerTarget);
  });

  it("damps values toward the target without snapping", () => {
    const next = dampValue(0, 10, 8, 0.016);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });
});
