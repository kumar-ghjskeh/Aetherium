import { describe, expect, it } from "vitest";

import { createMovementIntent, normalizeInputKey, shouldCaptureWorldKey } from "./input-system";

describe("world input system", () => {
  it("normalizes keyboard codes for stable lookup", () => {
    expect(normalizeInputKey("KeyW")).toBe("keyw");
    expect(normalizeInputKey("ArrowLeft")).toBe("arrowleft");
  });

  it("maps WASD and arrow keys into normalized movement axes", () => {
    const intent = createMovementIntent({
      keys: new Set(["keyw", "keyd", "shiftleft"])
    });

    expect(intent.xAxis).toBeCloseTo(1 / Math.SQRT2);
    expect(intent.zAxis).toBeCloseTo(-1 / Math.SQRT2);
    expect(intent.magnitude).toBeCloseTo(1);
    expect(intent.sprinting).toBe(true);
  });

  it("applies gamepad dead zones and button actions", () => {
    const intent = createMovementIntent({
      gamepad: {
        axes: [0.1, -0.72],
        buttons: [true, false, false, false, false, false, false, true, true, false]
      },
      keys: new Set()
    });

    expect(intent.xAxis).toBe(0);
    expect(intent.zAxis).toBeCloseTo(-0.72);
    expect(intent.interactRequested).toBe(true);
    expect(intent.mapRequested).toBe(true);
    expect(intent.sprinting).toBe(true);
  });

  it("reserves Tab for focused interfaces and captures it on the world surface", () => {
    expect(
      shouldCaptureWorldKey({
        defaultPrevented: false,
        insideDialog: false,
        interactiveTarget: false,
        key: "tab",
        worldSurfaceFocused: true
      })
    ).toBe(true);
    expect(
      shouldCaptureWorldKey({
        defaultPrevented: false,
        insideDialog: true,
        interactiveTarget: true,
        key: "tab",
        worldSurfaceFocused: false
      })
    ).toBe(false);
  });
});
