import type { PlayerMovementState } from "./player-controller";

export type CameraMode = "cinematic_travel" | "follow" | "interaction" | "map" | "panel";

export type Vector3Tuple = [number, number, number];

export interface CameraSettings {
  baseFov: number;
  cameraShakeEnabled: boolean;
  cinematicTravelEnabled: boolean;
  distance: number;
  invertY: boolean;
  maxDistance: number;
  maxPitch: number;
  minDistance: number;
  minPitch: number;
  motionSmoothing: number;
  sensitivity: number;
  shoulderOffset: number;
  sprintFovBoost: number;
  targetHeight: number;
}

export interface CameraOrbit {
  distance: number;
  pitch: number;
  yaw: number;
}

export interface CameraSphereBlocker {
  center: Vector3Tuple;
  radius: number;
}

export interface CameraCollisionConfig {
  blockers?: readonly CameraSphereBlocker[];
  maxWorldRadius?: number;
  minY?: number;
}

export interface CameraPose {
  collisionShortened: boolean;
  fov: number;
  mode: CameraMode;
  position: Vector3Tuple;
  target: Vector3Tuple;
}

export interface CameraPoseInput {
  collision?: CameraCollisionConfig;
  movementState: PlayerMovementState;
  orbit: CameraOrbit;
  playerPosition: Vector3Tuple;
  reducedMotion: boolean;
  settings: CameraSettings;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  baseFov: 52,
  cameraShakeEnabled: false,
  cinematicTravelEnabled: true,
  distance: 7.4,
  invertY: false,
  maxDistance: 11,
  maxPitch: 0.64,
  minDistance: 4.4,
  minPitch: -0.46,
  motionSmoothing: 9,
  sensitivity: 0.72,
  shoulderOffset: 0.72,
  sprintFovBoost: 4,
  targetHeight: 1.35
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampCameraOrbit(orbit: CameraOrbit, settings: CameraSettings): CameraOrbit {
  return {
    distance: clamp(orbit.distance, settings.minDistance, settings.maxDistance),
    pitch: clamp(orbit.pitch, settings.minPitch, settings.maxPitch),
    yaw: normalizeRadians(orbit.yaw)
  };
}

export function resolveCameraMode({
  cinematicTravelRequested,
  interactionActive,
  panelOpen,
  reducedMotion,
  settings
}: Readonly<{
  cinematicTravelRequested: boolean;
  interactionActive: boolean;
  panelOpen: boolean;
  reducedMotion: boolean;
  settings: CameraSettings;
}>): CameraMode {
  if (panelOpen) {
    return "panel";
  }

  if (interactionActive) {
    return "interaction";
  }

  if (cinematicTravelRequested && settings.cinematicTravelEnabled && !reducedMotion) {
    return "cinematic_travel";
  }

  return "follow";
}

export function resolveCameraFov({
  movementState,
  reducedMotion,
  settings
}: Readonly<{
  movementState: PlayerMovementState;
  reducedMotion: boolean;
  settings: CameraSettings;
}>): number {
  if (movementState === "sprint" && !reducedMotion) {
    return settings.baseFov + settings.sprintFovBoost;
  }

  return settings.baseFov;
}

export function calculateThirdPersonCameraPose({
  collision,
  movementState,
  orbit,
  playerPosition,
  reducedMotion,
  settings
}: CameraPoseInput): CameraPose {
  const clampedOrbit = clampCameraOrbit(orbit, settings);
  const distance = reducedMotion
    ? Math.min(clampedOrbit.distance, settings.distance)
    : clampedOrbit.distance;
  const pitch = reducedMotion ? Math.min(clampedOrbit.pitch, 0.28) : clampedOrbit.pitch;
  const target: Vector3Tuple = [
    playerPosition[0],
    playerPosition[1] + settings.targetHeight,
    playerPosition[2]
  ];
  const horizontalDistance = Math.cos(pitch) * distance;
  const position: Vector3Tuple = [
    target[0] +
      Math.sin(clampedOrbit.yaw) * horizontalDistance +
      Math.cos(clampedOrbit.yaw) * settings.shoulderOffset,
    target[1] + Math.sin(pitch) * distance,
    target[2] +
      Math.cos(clampedOrbit.yaw) * horizontalDistance -
      Math.sin(clampedOrbit.yaw) * settings.shoulderOffset
  ];
  const resolved = resolveCameraCollision(
    collision
      ? { collision, desiredPosition: position, target }
      : { desiredPosition: position, target }
  );

  return {
    collisionShortened: resolved.collisionShortened,
    fov: resolveCameraFov({ movementState, reducedMotion, settings }),
    mode: "follow",
    position: resolved.position,
    target
  };
}

export function resolveCameraCollision({
  collision,
  desiredPosition,
  target
}: Readonly<{
  collision?: CameraCollisionConfig;
  desiredPosition: Vector3Tuple;
  target: Vector3Tuple;
}>): { collisionShortened: boolean; position: Vector3Tuple } {
  let collisionShortened = false;
  let position = [...desiredPosition] as Vector3Tuple;

  for (const blocker of collision?.blockers ?? []) {
    const shortened = shortenSegmentBeforeSphere(target, position, blocker);
    if (shortened) {
      position = shortened;
      collisionShortened = true;
    }
  }

  if (collision?.minY !== undefined && position[1] < collision.minY) {
    position = [position[0], collision.minY, position[2]];
    collisionShortened = true;
  }

  if (collision?.maxWorldRadius !== undefined) {
    const radius = Math.hypot(position[0], position[2]);
    if (radius > collision.maxWorldRadius) {
      const scale = collision.maxWorldRadius / radius;
      position = [position[0] * scale, position[1], position[2] * scale];
      collisionShortened = true;
    }
  }

  return { collisionShortened, position };
}

export function dampValue(
  current: number,
  target: number,
  smoothing: number,
  deltaSeconds: number
): number {
  if (smoothing <= 0 || deltaSeconds <= 0) {
    return target;
  }

  return target + (current - target) * Math.exp(-smoothing * deltaSeconds);
}

export function dampVector(
  current: Vector3Tuple,
  target: Vector3Tuple,
  smoothing: number,
  deltaSeconds: number
): Vector3Tuple {
  return [
    dampValue(current[0], target[0], smoothing, deltaSeconds),
    dampValue(current[1], target[1], smoothing, deltaSeconds),
    dampValue(current[2], target[2], smoothing, deltaSeconds)
  ];
}

export function normalizeRadians(radians: number): number {
  return Math.atan2(Math.sin(radians), Math.cos(radians));
}

export function resolveCameraYawToward(from: Vector3Tuple, target: Vector3Tuple): number {
  return normalizeRadians(Math.atan2(from[0] - target[0], from[2] - target[2]));
}

export function shouldSnapArrivalCamera({
  arrivalSequence,
  frameArrival,
  previousArrivalSequence
}: Readonly<{
  arrivalSequence: number;
  frameArrival: boolean;
  previousArrivalSequence: number;
}>): boolean {
  return frameArrival && arrivalSequence > 0 && arrivalSequence !== previousArrivalSequence;
}

export function resolveArrivalCameraTarget({
  destinationPosition,
  destinationRadius,
  frameArrival,
  playerPosition,
  playerTarget
}: Readonly<{
  destinationPosition: Vector3Tuple | null;
  destinationRadius: number;
  frameArrival: boolean;
  playerPosition: Vector3Tuple;
  playerTarget: Vector3Tuple;
}>): Vector3Tuple {
  if (!destinationPosition || !frameArrival) {
    return playerTarget;
  }

  const distance = Math.hypot(
    destinationPosition[0] - playerPosition[0],
    destinationPosition[2] - playerPosition[2]
  );
  if (distance > Math.max(90, destinationRadius + 28)) {
    return playerTarget;
  }

  const landmarkFocusHeight = clamp(destinationRadius * 0.13, 5, 9);
  return [
    destinationPosition[0],
    destinationPosition[1] + landmarkFocusHeight,
    destinationPosition[2]
  ];
}

function shortenSegmentBeforeSphere(
  target: Vector3Tuple,
  desiredPosition: Vector3Tuple,
  blocker: CameraSphereBlocker
): Vector3Tuple | null {
  const direction = subtract(desiredPosition, target);
  const length = Math.hypot(direction[0], direction[1], direction[2]);
  if (length <= 0.0001) {
    return null;
  }

  const normalizedDirection: Vector3Tuple = [
    direction[0] / length,
    direction[1] / length,
    direction[2] / length
  ];
  const fromCenter = subtract(target, blocker.center);
  const b = dot(fromCenter, normalizedDirection);
  const c = dot(fromCenter, fromCenter) - blocker.radius * blocker.radius;
  const discriminant = b * b - c;

  if (discriminant < 0) {
    return null;
  }

  const entryDistance = -b - Math.sqrt(discriminant);
  const exitDistance = -b + Math.sqrt(discriminant);
  const hitDistance = entryDistance > 0 ? entryDistance : exitDistance;
  if (hitDistance <= 0 || hitDistance >= length) {
    return null;
  }

  const safeDistance = Math.max(1.2, hitDistance - 0.35);
  return [
    target[0] + normalizedDirection[0] * safeDistance,
    target[1] + normalizedDirection[1] * safeDistance,
    target[2] + normalizedDirection[2] * safeDistance
  ];
}

function subtract(left: Vector3Tuple, right: Vector3Tuple): Vector3Tuple {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function dot(left: Vector3Tuple, right: Vector3Tuple): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}
