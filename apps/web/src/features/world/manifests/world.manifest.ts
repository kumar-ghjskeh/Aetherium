import type { WorldManifest } from "../schemas/world-manifest-schema";
import { WORLD_ASSETS_MANIFEST } from "./assets.manifest";
import { WORLD_AUDIO_MANIFEST } from "./audio.manifest";
import { WORLD_ENVIRONMENTS_MANIFEST } from "./environments.manifest";
import { WORLD_INTERACTIONS_MANIFEST } from "./interactions.manifest";
import { WORLD_LOCATIONS_MANIFEST } from "./locations.manifest";
import { WORLD_THEMES_MANIFEST } from "./themes.manifest";
import {
  WORLD_CAMERA_ROUTES_MANIFEST,
  WORLD_FAST_TRAVEL_MANIFEST,
  WORLD_SPAWNS_MANIFEST
} from "./travel.manifest";

export const AETHERIUM_WORLD_MANIFEST: WorldManifest = {
  assets: WORLD_ASSETS_MANIFEST,
  audioZones: WORLD_AUDIO_MANIFEST,
  cameraRoutes: WORLD_CAMERA_ROUTES_MANIFEST,
  environmentZones: WORLD_ENVIRONMENTS_MANIFEST,
  fastTravel: WORLD_FAST_TRAVEL_MANIFEST,
  generatedBy: "source_controlled_manifest",
  interactions: WORLD_INTERACTIONS_MANIFEST,
  locations: WORLD_LOCATIONS_MANIFEST,
  manifestVersion: 1,
  spawns: WORLD_SPAWNS_MANIFEST,
  themes: WORLD_THEMES_MANIFEST,
  worldBoundsMeters: {
    depth: 800,
    width: 800
  }
};
