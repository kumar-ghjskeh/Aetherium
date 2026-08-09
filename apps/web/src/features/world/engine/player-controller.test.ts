import { describe, expect, it } from "vitest";

import type { MovementIntent } from "./input-system";
import {
  applyPlanarAcceleration,
  movementSpeedForState,
  resolveFacingRadians,
  resolvePlayerMovementState,
  resolveTerrainGrounding
} from "./player-controller";

const idleIntent: MovementIntent = {
  commandModeRequested: false,
  interactRequested: false,
  magnitude: 0,
  mapRequested: false,
  pauseRequested: false,
  sprinting: false,
  xAxis: 0,
  zAxis: 0
};

const forwardIntent: MovementIntent = {
  ...idleIntent,
  magnitude: 1,
  sprinting: true,
  zAxis: -1
};

describe("player controller engine", () => {
  it("resolves idle, sprint, reduced-motion walk, and pause states", () => {
    expect(
      resolvePlayerMovementState({
        grounded: true,
        intent: idleIntent,
        interactionAligning: false,
        movementDisabled: false,
        paused: false,
        previousGrounded: true,
        reducedMotion: false
      })
    ).toBe("idle");

    expect(
      resolvePlayerMovementState({
        grounded: true,
        intent: forwardIntent,
        interactionAligning: false,
        movementDisabled: false,
        paused: false,
        previousGrounded: true,
        reducedMotion: false
      })
    ).toBe("sprint");

    expect(
      resolvePlayerMovementState({
        grounded: true,
        intent: forwardIntent,
        interactionAligning: false,
        movementDisabled: false,
        paused: false,
        previousGrounded: true,
        reducedMotion: true
      })
    ).toBe("walk");

    expect(
      resolvePlayerMovementState({
        grounded: true,
        intent: forwardIntent,
        interactionAligning: false,
        movementDisabled: false,
        paused: true,
        previousGrounded: true,
        reducedMotion: false
      })
    ).toBe("paused");
  });

  it("resolves falling and landing transitions", () => {
    expect(
      resolvePlayerMovementState({
        grounded: false,
        intent: idleIntent,
        interactionAligning: false,
        movementDisabled: false,
        paused: false,
        previousGrounded: true,
        reducedMotion: false
      })
    ).toBe("falling");

    expect(
      resolvePlayerMovementState({
        grounded: true,
        intent: idleIntent,
        interactionAligning: false,
        movementDisabled: false,
        paused: false,
        previousGrounded: false,
        reducedMotion: false
      })
    ).toBe("landing");
  });

  it("accelerates toward target velocity and brakes toward zero", () => {
    const moving = applyPlanarAcceleration({
      currentVelocity: { x: 0, z: 0 },
      deltaSeconds: 0.1,
      intent: forwardIntent,
      movementState: "sprint",
      reducedMotion: false
    });

    expect(moving.z).toBeLessThan(0);
    expect(Math.abs(moving.z)).toBeLessThanOrEqual(movementSpeedForState("sprint", false));

    const braking = applyPlanarAcceleration({
      currentVelocity: moving,
      deltaSeconds: 0.2,
      intent: idleIntent,
      movementState: "idle",
      reducedMotion: false
    });

    expect(Math.abs(braking.z)).toBeLessThan(Math.abs(moving.z));
  });

  it("stops immediately when paused", () => {
    const stopped = applyPlanarAcceleration({
      currentVelocity: { x: 2, z: -3 },
      deltaSeconds: 0.016,
      intent: forwardIntent,
      movementState: "paused",
      reducedMotion: false
    });

    expect(stopped).toEqual({ x: 0, z: 0 });
  });

  it("turns smoothly toward movement direction", () => {
    const next = resolveFacingRadians(0, { ...idleIntent, magnitude: 1, xAxis: 1 }, 0.016);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(Math.PI / 2);
  });

  it("corrects terrain penetration without preserving downward velocity", () => {
    expect(
      resolveTerrainGrounding({
        clearance: 0.82,
        groundHeight: 2,
        positionY: -5,
        velocityY: -18
      })
    ).toEqual({ corrected: true, grounded: true, positionY: 2.82, velocityY: 0 });
  });

  it("preserves airborne motion above the ground envelope", () => {
    expect(
      resolveTerrainGrounding({
        clearance: 0.82,
        groundHeight: 2,
        positionY: 5,
        velocityY: -3
      })
    ).toEqual({ corrected: false, grounded: false, positionY: 5, velocityY: -3 });
  });
});
