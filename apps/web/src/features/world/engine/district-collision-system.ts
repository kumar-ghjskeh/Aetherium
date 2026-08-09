import type { Vector3Tuple } from "./camera-system";
import type { WorldDestination } from "./navigation-system";

export interface WorldDistrictCollisionProfile {
  halfHeight: number;
  position: Vector3Tuple;
  radius: number;
}

export function resolveDistrictCollisionProfile(
  destination: WorldDestination
): WorldDistrictCollisionProfile {
  return {
    halfHeight: destination.collisionHalfHeight,
    position: [
      destination.worldPosition[0],
      destination.worldPosition[1] + destination.collisionHalfHeight,
      destination.worldPosition[2]
    ],
    radius: destination.collisionRadius
  };
}
