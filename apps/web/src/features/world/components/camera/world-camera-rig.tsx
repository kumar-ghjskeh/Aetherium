import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  calculateThirdPersonCameraPose,
  dampValue,
  dampVector,
  resolveArrivalCameraAnchor,
  resolveArrivalCameraDistance,
  resolveArrivalCameraTarget,
  resolveCameraMode,
  resolveCameraYawToward,
  shouldSnapArrivalCamera,
  type CameraPose,
  type Vector3Tuple
} from "../../engine/camera-system";
import type { WorldDestination } from "../../engine/navigation-system";
import { useWorldCameraInput } from "../../hooks/use-world-camera-input";
import { useWorldCameraStore } from "../../state/camera-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";

export function WorldCameraRig({
  destinations,
  reducedMotion
}: Readonly<{
  destinations: WorldDestination[];
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const { camera } = useThree();
  const initializedRef = React.useRef(false);
  const arrivalSequenceRef = React.useRef(0);
  const currentTargetRef = React.useRef<Vector3Tuple>([0, 2.35, 0]);
  const lastPublishedRef = React.useRef("");

  useWorldCameraInput();

  useFrame(({ clock }, delta) => {
    if (!("fov" in camera)) {
      return;
    }

    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const playerState = usePlayerStore.getState();
    const cameraState = useWorldCameraStore.getState();
    const navigationState = useWorldNavigationStore.getState();
    const gamepad = playerState.gamepadInput;
    const selectedDestination = destinations.find(
      (destination) => destination.id === navigationState.destinationId
    );

    if (gamepad) {
      const cameraX = Math.abs(gamepad.axes[2] ?? 0) > 0.18 ? (gamepad.axes[2] ?? 0) : 0;
      const cameraY = Math.abs(gamepad.axes[3] ?? 0) > 0.18 ? (gamepad.axes[3] ?? 0) : 0;
      if (cameraX !== 0 || cameraY !== 0) {
        cameraState.setOrbitDelta(cameraX * delta * 540, cameraY * delta * 420);
      }
    }

    const nextCameraState = useWorldCameraStore.getState();
    const distanceToSelectedDistrict = selectedDestination
      ? Math.hypot(
          selectedDestination.worldPosition[0] - playerState.position[0],
          selectedDestination.worldPosition[2] - playerState.position[2]
        )
      : Number.POSITIVE_INFINITY;
    const arrivalFraming =
      playerState.planarSpeed < 0.1 &&
      distanceToSelectedDistrict <= Math.max(90, (selectedDestination?.worldRadius ?? 0) + 28) &&
      Date.now() < navigationState.arrivalSuppressedUntilMilliseconds;
    const snapArrival = shouldSnapArrivalCamera({
      arrivalSequence: navigationState.arrivalSuppressedUntilMilliseconds,
      frameArrival: arrivalFraming,
      previousArrivalSequence: arrivalSequenceRef.current
    });
    const cameraAnchor = resolveArrivalCameraAnchor({
      destinationPosition: selectedDestination?.worldPosition ?? null,
      frameArrival: arrivalFraming,
      playerPosition: playerState.position
    });
    const arrivalDistance = selectedDestination
      ? resolveArrivalCameraDistance({
          authoredBackoff: selectedDestination.arrivalCameraDistance,
          destinationPosition: selectedDestination.worldPosition,
          travelPoint: selectedDestination.point
        })
      : nextCameraState.orbit.distance;
    const arrivalPitch = selectedDestination
      ? Math.min(0.52, 0.2 + selectedDestination.arrivalFocusHeight / 95)
      : 0.2;
    const desiredPose = calculateThirdPersonCameraPose({
      collision: {
        blockers: arrivalFraming
          ? []
          : destinations.map((destination) => ({
              center: [
                destination.worldPosition[0],
                destination.worldPosition[1] + destination.collisionHalfHeight,
                destination.worldPosition[2]
              ],
              radius: destination.collisionRadius
            })),
        maxWorldRadius: 396,
        minY: 0.8
      },
      movementState: playerState.movementState,
      orbit: arrivalFraming
        ? {
            ...nextCameraState.orbit,
            distance: Math.max(nextCameraState.orbit.distance, arrivalDistance),
            pitch: Math.max(nextCameraState.orbit.pitch, arrivalPitch),
            yaw: selectedDestination
              ? resolveCameraYawToward(selectedDestination.point, selectedDestination.worldPosition)
              : nextCameraState.orbit.yaw
          }
        : nextCameraState.orbit,
      playerPosition: cameraAnchor,
      reducedMotion,
      settings:
        arrivalFraming && selectedDestination
          ? {
              ...nextCameraState.settings,
              maxDistance: Math.max(nextCameraState.settings.maxDistance, arrivalDistance)
            }
          : nextCameraState.settings
    });
    const mode = resolveCameraMode({
      cinematicTravelRequested: navigationState.activeTravel?.mode === "cinematic",
      interactionActive: playerState.interactionAligning || playerState.interactionRequested,
      panelOpen: playerState.paused || playerState.commandModeRequested || playerState.mapRequested,
      reducedMotion,
      settings: nextCameraState.settings
    });
    const pose: CameraPose = {
      ...desiredPose,
      mode,
      target: resolveArrivalCameraTarget({
        destinationPosition: selectedDestination?.worldPosition ?? null,
        destinationRadius: selectedDestination?.worldRadius ?? 0,
        focusHeight: selectedDestination?.arrivalFocusHeight,
        frameArrival: arrivalFraming,
        playerPosition: cameraAnchor,
        playerTarget: desiredPose.target
      })
    };
    const smoothing = reducedMotion ? 24 : nextCameraState.settings.motionSmoothing;
    const smoothPose = initializedRef.current && !snapArrival;
    const nextPosition = smoothPose
      ? dampVector(
          [
            perspectiveCamera.position.x,
            perspectiveCamera.position.y,
            perspectiveCamera.position.z
          ],
          pose.position,
          smoothing,
          delta
        )
      : pose.position;
    const nextTarget = smoothPose
      ? dampVector(currentTargetRef.current, pose.target, smoothing, delta)
      : pose.target;
    const nextFov = smoothPose
      ? dampValue(perspectiveCamera.fov, pose.fov, smoothing, delta)
      : pose.fov;
    const cameraShake =
      nextCameraState.settings.cameraShakeEnabled &&
      !reducedMotion &&
      playerState.movementState === "sprint"
        ? Math.sin(clock.elapsedTime * 19) * 0.018
        : 0;

    perspectiveCamera.position.set(nextPosition[0], nextPosition[1] + cameraShake, nextPosition[2]);
    perspectiveCamera.lookAt(nextTarget[0], nextTarget[1], nextTarget[2]);
    if (Math.abs(perspectiveCamera.fov - nextFov) > 0.01) {
      perspectiveCamera.fov = nextFov;
      perspectiveCamera.updateProjectionMatrix();
    }

    currentTargetRef.current = nextTarget;
    if (snapArrival) {
      arrivalSequenceRef.current = navigationState.arrivalSuppressedUntilMilliseconds;
    }
    initializedRef.current = true;

    const publishedKey = [
      pose.mode,
      pose.collisionShortened ? "shortened" : "clear",
      nextFov.toFixed(1),
      nextPosition.map((value) => value.toFixed(1)).join(","),
      nextTarget.map((value) => value.toFixed(1)).join(",")
    ].join(":");

    if (publishedKey !== lastPublishedRef.current) {
      nextCameraState.setCameraPose({
        ...pose,
        fov: nextFov,
        position: nextPosition,
        target: nextTarget
      });
      lastPublishedRef.current = publishedKey;
    }
  });

  return null;
}
