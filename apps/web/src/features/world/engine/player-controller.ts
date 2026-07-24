import type { MovementIntent } from "./input-system";

export type PlayerMovementState =
  "falling" | "idle" | "interacting" | "jog" | "landing" | "paused" | "sprint" | "walk";

export interface PlanarVelocity {
  x: number;
  z: number;
}

export interface MovementStateInput {
  grounded: boolean;
  intent: MovementIntent;
  interactionAligning: boolean;
  movementDisabled: boolean;
  paused: boolean;
  previousGrounded: boolean;
  reducedMotion: boolean;
}

export interface AccelerationInput {
  currentVelocity: PlanarVelocity;
  deltaSeconds: number;
  intent: MovementIntent;
  movementState: PlayerMovementState;
  reducedMotion: boolean;
}

export function resolvePlayerMovementState({
  grounded,
  intent,
  interactionAligning,
  movementDisabled,
  paused,
  previousGrounded,
  reducedMotion
}: MovementStateInput): PlayerMovementState {
  if (paused || movementDisabled) {
    return "paused";
  }

  if (interactionAligning || intent.interactRequested) {
    return "interacting";
  }

  if (!grounded) {
    return "falling";
  }

  if (!previousGrounded && grounded) {
    return "landing";
  }

  if (intent.magnitude < 0.05) {
    return "idle";
  }

  if (intent.sprinting && !reducedMotion && intent.magnitude > 0.65) {
    return "sprint";
  }

  if (intent.magnitude < 0.58 || reducedMotion) {
    return "walk";
  }

  return "jog";
}

export function movementSpeedForState(
  movementState: PlayerMovementState,
  reducedMotion: boolean
): number {
  if (movementState === "walk") {
    return reducedMotion ? 1.35 : 1.75;
  }
  if (movementState === "jog") {
    return 3.25;
  }
  if (movementState === "sprint") {
    return 5.4;
  }
  return 0;
}

export function applyPlanarAcceleration({
  currentVelocity,
  deltaSeconds,
  intent,
  movementState,
  reducedMotion
}: AccelerationInput): PlanarVelocity {
  if (movementState === "paused" || movementState === "interacting") {
    return { x: 0, z: 0 };
  }

  const speed = movementSpeedForState(movementState, reducedMotion);
  const target = {
    x: intent.xAxis * speed,
    z: intent.zAxis * speed
  };
  const braking = intent.magnitude < 0.05 || speed === 0;
  const acceleration = braking ? 16 : movementState === "sprint" ? 13 : 10;
  const maxDelta = acceleration * Math.max(deltaSeconds, 0);

  return {
    x: approach(currentVelocity.x, target.x, maxDelta),
    z: approach(currentVelocity.z, target.z, maxDelta)
  };
}

export function resolveFacingRadians(
  currentRadians: number,
  intent: MovementIntent,
  deltaSeconds: number
): number {
  if (intent.magnitude < 0.05) {
    return currentRadians;
  }

  const targetRadians = Math.atan2(intent.xAxis, -intent.zAxis);
  const shortestDelta = Math.atan2(
    Math.sin(targetRadians - currentRadians),
    Math.cos(targetRadians - currentRadians)
  );
  const turnStep = Math.min(Math.abs(shortestDelta), deltaSeconds * 10);
  return currentRadians + Math.sign(shortestDelta) * turnStep;
}

function approach(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}
