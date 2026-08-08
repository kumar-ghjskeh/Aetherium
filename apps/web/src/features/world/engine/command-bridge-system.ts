import { WORLD_LOCATIONS_MANIFEST } from "../manifests/locations.manifest";
import type { WorldTravelMode } from "./navigation-system";

export interface WorldCommandIntent {
  backendLocationId: string;
  mode: WorldTravelMode;
}

const TRAVEL_MODES = new Set<WorldTravelMode>(["walk", "cinematic", "instant"]);

export function resolveWorldLocationForCommandRoute(pathname: string) {
  if (pathname === "/app/world" || pathname.startsWith("/app/world/")) {
    return undefined;
  }
  return [...WORLD_LOCATIONS_MANIFEST]
    .sort((left, right) => right.commandRoute.length - left.commandRoute.length)
    .find(
      (location) =>
        pathname === location.commandRoute || pathname.startsWith(`${location.commandRoute}/`)
    );
}

export function resolveWorldLocationByBackendId(backendLocationId: string) {
  return WORLD_LOCATIONS_MANIFEST.find(
    (location) => location.backendLocationId === backendLocationId
  );
}

export function createWorldModeHref({
  backendLocationId,
  mode = "cinematic"
}: {
  backendLocationId: string;
  mode?: WorldTravelMode;
}): string {
  const location = resolveWorldLocationByBackendId(backendLocationId);
  if (!location) {
    return "/app/world";
  }
  const query = new URLSearchParams({ destination: location.backendLocationId, mode });
  return `/app/world?${query.toString()}`;
}

export function parseWorldCommandIntent(params: URLSearchParams): WorldCommandIntent | null {
  const destination = params.get("destination");
  const rawMode = params.get("mode") ?? "cinematic";
  if (!destination || !resolveWorldLocationByBackendId(destination)) {
    return null;
  }
  const mode = TRAVEL_MODES.has(rawMode as WorldTravelMode)
    ? (rawMode as WorldTravelMode)
    : "cinematic";
  return { backendLocationId: destination, mode };
}
