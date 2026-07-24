import { create } from "zustand";

import {
  DEFAULT_CAMERA_SETTINGS,
  clamp,
  clampCameraOrbit,
  normalizeRadians,
  type CameraMode,
  type CameraOrbit,
  type CameraPose,
  type CameraSettings,
  type Vector3Tuple
} from "../engine/camera-system";

interface CameraStoreState {
  collisionShortened: boolean;
  fov: number;
  mode: CameraMode;
  orbit: CameraOrbit;
  position: Vector3Tuple;
  recenter: (playerFacingRadians: number) => void;
  setBaseFov: (fov: number) => void;
  setCameraPose: (pose: CameraPose) => void;
  setCameraShakeEnabled: (enabled: boolean) => void;
  setCinematicTravelEnabled: (enabled: boolean) => void;
  setDistance: (distance: number) => void;
  setInvertY: (enabled: boolean) => void;
  setMotionSmoothing: (smoothing: number) => void;
  setOrbitDelta: (deltaX: number, deltaY: number) => void;
  setSensitivity: (sensitivity: number) => void;
  settings: CameraSettings;
  target: Vector3Tuple;
}

const INITIAL_ORBIT: CameraOrbit = {
  distance: DEFAULT_CAMERA_SETTINGS.distance,
  pitch: 0.22,
  yaw: 0
};

export const useWorldCameraStore = create<CameraStoreState>((set) => ({
  collisionShortened: false,
  fov: DEFAULT_CAMERA_SETTINGS.baseFov,
  mode: "follow",
  orbit: INITIAL_ORBIT,
  position: [0, 4, 8],
  recenter: (playerFacingRadians) =>
    set((state) => ({
      orbit: clampCameraOrbit(
        {
          ...state.orbit,
          yaw: normalizeRadians(playerFacingRadians)
        },
        state.settings
      )
    })),
  setBaseFov: (fov) =>
    set((state) => ({
      settings: { ...state.settings, baseFov: clamp(fov, 45, 72) }
    })),
  setCameraPose: (pose) =>
    set({
      collisionShortened: pose.collisionShortened,
      fov: pose.fov,
      mode: pose.mode,
      position: pose.position,
      target: pose.target
    }),
  setCameraShakeEnabled: (enabled) =>
    set((state) => ({ settings: { ...state.settings, cameraShakeEnabled: enabled } })),
  setCinematicTravelEnabled: (enabled) =>
    set((state) => ({ settings: { ...state.settings, cinematicTravelEnabled: enabled } })),
  setDistance: (distance) =>
    set((state) => ({
      orbit: clampCameraOrbit({ ...state.orbit, distance }, state.settings),
      settings: {
        ...state.settings,
        distance: clamp(distance, state.settings.minDistance, state.settings.maxDistance)
      }
    })),
  setInvertY: (enabled) => set((state) => ({ settings: { ...state.settings, invertY: enabled } })),
  setMotionSmoothing: (smoothing) =>
    set((state) => ({ settings: { ...state.settings, motionSmoothing: clamp(smoothing, 0, 24) } })),
  setOrbitDelta: (deltaX, deltaY) =>
    set((state) => {
      const yawDelta = -deltaX * state.settings.sensitivity * 0.003;
      const pitchDelta =
        (state.settings.invertY ? deltaY : -deltaY) * state.settings.sensitivity * 0.0024;
      return {
        orbit: clampCameraOrbit(
          {
            ...state.orbit,
            pitch: state.orbit.pitch + pitchDelta,
            yaw: state.orbit.yaw + yawDelta
          },
          state.settings
        )
      };
    }),
  setSensitivity: (sensitivity) =>
    set((state) => ({
      settings: { ...state.settings, sensitivity: clamp(sensitivity, 0.2, 1.8) }
    })),
  settings: DEFAULT_CAMERA_SETTINGS,
  target: [0, 1.35, 0]
}));
