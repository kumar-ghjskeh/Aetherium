import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  calculateThirdPersonCameraPose,
  dampValue,
  dampVector,
  resolveCameraMode,
  type CameraPose,
  type Vector3Tuple
} from "../../engine/camera-system";
import { useWorldCameraInput } from "../../hooks/use-world-camera-input";
import { useWorldCameraStore } from "../../state/camera-store";
import { usePlayerStore } from "../../state/player-store";

export function WorldCameraRig({
  reducedMotion
}: Readonly<{
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const { camera } = useThree();
  const initializedRef = React.useRef(false);
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
    const gamepad = playerState.gamepadInput;

    if (gamepad) {
      const cameraX = Math.abs(gamepad.axes[2] ?? 0) > 0.18 ? (gamepad.axes[2] ?? 0) : 0;
      const cameraY = Math.abs(gamepad.axes[3] ?? 0) > 0.18 ? (gamepad.axes[3] ?? 0) : 0;
      if (cameraX !== 0 || cameraY !== 0) {
        cameraState.setOrbitDelta(cameraX * delta * 540, cameraY * delta * 420);
      }
    }

    const nextCameraState = useWorldCameraStore.getState();
    const desiredPose = calculateThirdPersonCameraPose({
      collision: {
        blockers: [{ center: [0, 1.2, 0], radius: 2.7 }],
        maxWorldRadius: 22,
        minY: 0.8
      },
      movementState: playerState.movementState,
      orbit: nextCameraState.orbit,
      playerPosition: playerState.position,
      reducedMotion,
      settings: nextCameraState.settings
    });
    const mode = resolveCameraMode({
      cinematicTravelRequested: false,
      interactionActive: playerState.interactionAligning || playerState.interactionRequested,
      panelOpen: playerState.paused || playerState.commandModeRequested || playerState.mapRequested,
      reducedMotion,
      settings: nextCameraState.settings
    });
    const pose: CameraPose = {
      ...desiredPose,
      mode
    };
    const smoothing = reducedMotion ? 24 : nextCameraState.settings.motionSmoothing;
    const nextPosition = initializedRef.current
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
    const nextTarget = initializedRef.current
      ? dampVector(currentTargetRef.current, pose.target, smoothing, delta)
      : pose.target;
    const nextFov = dampValue(perspectiveCamera.fov, pose.fov, smoothing, delta);
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
