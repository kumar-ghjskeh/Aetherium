import { describe, expect, it } from "vitest";

import { resolveNextMenuIndex, resolveWorldMenuAction } from "./accessible-navigation-system";

function gamepad({
  axes = [0, 0],
  pressed = []
}: Readonly<{ axes?: number[]; pressed?: number[] }>) {
  const buttons = Array.from({ length: 16 }, (_, index) => pressed.includes(index));
  return { axes, buttons };
}

describe("accessible world menu navigation", () => {
  it("maps rising standard gamepad controls to menu actions", () => {
    const neutral = gamepad({});
    expect(resolveWorldMenuAction(gamepad({ pressed: [0] }), neutral)).toBe("activate");
    expect(resolveWorldMenuAction(gamepad({ pressed: [1] }), neutral)).toBe("close");
    expect(resolveWorldMenuAction(gamepad({ pressed: [13] }), neutral)).toBe("next");
    expect(resolveWorldMenuAction(gamepad({ axes: [0, -0.8] }), neutral)).toBe("previous");
  });

  it("does not repeat an action while a button or axis remains held", () => {
    const held = gamepad({ axes: [0, 0.9], pressed: [0] });
    expect(resolveWorldMenuAction(held, held)).toBeNull();
  });

  it("wraps focus at either end of a menu", () => {
    expect(resolveNextMenuIndex({ currentIndex: 2, direction: "next", itemCount: 3 })).toBe(0);
    expect(resolveNextMenuIndex({ currentIndex: 0, direction: "previous", itemCount: 3 })).toBe(2);
    expect(resolveNextMenuIndex({ currentIndex: -1, direction: "next", itemCount: 3 })).toBe(0);
  });
});
