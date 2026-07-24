import type {
  WorldCameraRouteManifestEntry,
  WorldFastTravelManifestEntry,
  WorldSpawnManifestEntry
} from "../schemas/world-manifest-schema";
import { WORLD_LOCATIONS_MANIFEST } from "./locations.manifest";

export const WORLD_SPAWNS_MANIFEST: WorldSpawnManifestEntry[] = [
  {
    facingRadians: 0,
    id: "spawn-central-plaza",
    locationId: "central-plaza",
    position: [0, 1.1, 24]
  }
];

export const WORLD_FAST_TRAVEL_MANIFEST: WorldFastTravelManifestEntry[] =
  WORLD_LOCATIONS_MANIFEST.map((location) => ({
    accessibilityLabel: `Fast travel to ${location.name}`,
    id: `fast-travel-${location.id}`,
    locationId: location.id,
    point: location.fastTravelPoint
  }));

export const WORLD_CAMERA_ROUTES_MANIFEST: WorldCameraRouteManifestEntry[] = [
  {
    durationSeconds: 6,
    fromLocationId: "central-plaza",
    id: "route-central-to-library",
    skippable: true,
    toLocationId: "knowledge-library",
    waypointIds: ["river-bridge", "library-approach"]
  },
  {
    durationSeconds: 6,
    fromLocationId: "central-plaza",
    id: "route-central-to-observatory",
    skippable: true,
    toLocationId: "ai-observatory",
    waypointIds: ["north-path", "observatory-rise"]
  },
  {
    durationSeconds: 5,
    fromLocationId: "central-plaza",
    id: "route-central-to-garden",
    skippable: true,
    toLocationId: "habit-garden",
    waypointIds: ["east-grove", "garden-gate"]
  }
];
