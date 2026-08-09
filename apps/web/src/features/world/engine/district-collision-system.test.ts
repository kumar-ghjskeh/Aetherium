import { describe, expect, it } from "vitest";

import type { WorldDestination } from "./navigation-system";
import { resolveDistrictCollisionProfile } from "./district-collision-system";

const destination: WorldDestination = {
  accessibilityLabel: "Travel to Progress Tower",
  arrivalCameraDistance: 14,
  arrivalFocusHeight: 29,
  backendLocationId: "command_center",
  collisionHalfHeight: 29,
  collisionRadius: 9,
  commandRoute: "/app/analytics",
  current: false,
  id: "progress-tower",
  name: "Progress Tower",
  point: [300, 28, -25],
  theme: "productivity",
  unlocked: true,
  visited: true,
  worldPosition: [340, 38, -52],
  worldRadius: 54
};

describe("world district collision", () => {
  it("centers a bounded cylinder on the authored landmark volume", () => {
    expect(resolveDistrictCollisionProfile(destination)).toEqual({
      halfHeight: 29,
      position: [340, 67, -52],
      radius: 9
    });
  });
});
