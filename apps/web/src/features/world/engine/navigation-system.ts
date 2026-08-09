import type { WorldLocationPage } from "@aetherium/shared-types";

import {
  WORLD_CAMERA_ROUTES_MANIFEST,
  WORLD_FAST_TRAVEL_MANIFEST
} from "../manifests/travel.manifest";
import { WORLD_LOCATIONS_MANIFEST } from "../manifests/locations.manifest";
import type { Vector3Tuple } from "./camera-system";
import { clamp } from "./camera-system";
import { sampleTerrain } from "./terrain-system";

export type WorldTravelMode = "walk" | "cinematic" | "instant";

export const PLAYER_GROUND_CLEARANCE_METERS = 0.82;

export interface WorldDestination {
  accessibilityLabel: string;
  backendLocationId: string;
  commandRoute: string;
  current: boolean;
  id: string;
  name: string;
  point: Vector3Tuple;
  theme: string;
  unlocked: boolean;
  visited: boolean;
  worldPosition: Vector3Tuple;
  worldRadius: number;
}

export interface WorldTravelPlan {
  durationSeconds: number;
  from: Vector3Tuple;
  mode: Exclude<WorldTravelMode, "walk">;
  startedAtMilliseconds: number;
  target: WorldDestination;
}

export interface WorldTravelSample {
  complete: boolean;
  position: Vector3Tuple;
  progress: number;
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function buildWorldDestinations(locationPage: WorldLocationPage): WorldDestination[] {
  const backendBySceneKey = new Map(
    locationPage.items.map((location) => [location.futureSceneKey, location])
  );
  const travelByLocation = new Map(
    WORLD_FAST_TRAVEL_MANIFEST.map((destination) => [destination.locationId, destination])
  );

  return WORLD_LOCATIONS_MANIFEST.map((location) => {
    const backend = backendBySceneKey.get(location.id);
    const travel = travelByLocation.get(location.id);
    const [x, , z] = travel?.point ?? location.fastTravelPoint;
    const travelHeight = sampleTerrain(x, z).height + PLAYER_GROUND_CLEARANCE_METERS;
    return {
      accessibilityLabel: travel?.accessibilityLabel ?? `Travel to ${location.name}`,
      backendLocationId: backend?.id ?? location.backendLocationId,
      commandRoute: backend?.commandRoute ?? location.commandRoute,
      current: backend?.current ?? false,
      id: location.id,
      name: location.name,
      point: [x, travelHeight, z],
      theme: location.theme,
      unlocked: backend?.unlocked ?? location.id === "central-plaza",
      visited: backend?.visited ?? false,
      worldPosition: [
        location.position[0],
        sampleTerrain(location.position[0], location.position[2]).height,
        location.position[2]
      ],
      worldRadius: location.worldRadius
    };
  });
}

export function createWorldTravelPlan({
  destination,
  from,
  mode,
  reducedMotion,
  startedAtMilliseconds
}: {
  destination: WorldDestination;
  from: Vector3Tuple;
  mode: Exclude<WorldTravelMode, "walk">;
  reducedMotion: boolean;
  startedAtMilliseconds: number;
}): WorldTravelPlan {
  const authoredRoute = WORLD_CAMERA_ROUTES_MANIFEST.find(
    (route) => route.toLocationId === destination.id
  );
  const distance = Math.hypot(destination.point[0] - from[0], destination.point[2] - from[2]);
  const durationSeconds =
    mode === "instant" || reducedMotion
      ? 0
      : (authoredRoute?.durationSeconds ?? clamp(distance / 85, 4, 8));

  return { durationSeconds, from, mode, startedAtMilliseconds, target: destination };
}

export function sampleWorldTravelPlan(
  plan: WorldTravelPlan,
  nowMilliseconds: number
): WorldTravelSample {
  if (plan.durationSeconds <= 0) {
    return { complete: true, position: plan.target.point, progress: 1 };
  }

  const progress = clamp(
    (nowMilliseconds - plan.startedAtMilliseconds) / (plan.durationSeconds * 1000),
    0,
    1
  );
  if (progress >= 1) {
    return { complete: true, position: plan.target.point, progress: 1 };
  }
  const eased = easeInOutCubic(progress);
  const x = plan.from[0] + (plan.target.point[0] - plan.from[0]) * eased;
  const z = plan.from[2] + (plan.target.point[2] - plan.from[2]) * eased;
  const terrainHeight = sampleTerrain(x, z).height + PLAYER_GROUND_CLEARANCE_METERS;
  const arcHeight = plan.mode === "cinematic" ? Math.sin(Math.PI * progress) * 2.6 : 0;

  return {
    complete: progress >= 1,
    position: [x, terrainHeight + arcHeight, z],
    progress
  };
}

export function resolveEnteredDestination(
  position: Vector3Tuple,
  destinations: WorldDestination[]
): WorldDestination | null {
  let closest: WorldDestination | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const destination of destinations) {
    if (!destination.unlocked) {
      continue;
    }
    const distance = Math.hypot(
      position[0] - destination.worldPosition[0],
      position[2] - destination.worldPosition[2]
    );
    const arrivalRadius = Math.min(destination.worldRadius, 48);
    if (distance <= arrivalRadius && distance < closestDistance) {
      closest = destination;
      closestDistance = distance;
    }
  }
  return closest;
}
