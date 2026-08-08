import type { WorldLocationId } from "@aetherium/shared-types";

import type { Vector3Tuple } from "../engine/camera-system";
import type { WorldInteractionType } from "../engine/interaction-system";

export type WorldDistrictId =
  | "achievement-hall"
  | "ai-observatory"
  | "central-plaza"
  | "coding-arena"
  | "habit-garden"
  | "knowledge-library"
  | "learning-academy"
  | "personal-sanctuary"
  | "progress-tower"
  | "project-dock";

export type WorldThemeId =
  | "achievement"
  | "aetherium"
  | "coding"
  | "growth"
  | "knowledge"
  | "learning"
  | "personal"
  | "productivity"
  | "project"
  | "research";

export type WorldAssetKind =
  "audio" | "image" | "model" | "procedural" | "registry_placeholder" | "texture";

export type WorldAssetLicense =
  "cc0" | "mit" | "original" | "original_procedural" | "public_domain";

export type WorldLodProfile = "diagnostic" | "hero-building" | "landmark" | "medium-prop";

export interface WorldThemeManifestEntry {
  accentColor: string;
  id: WorldThemeId;
  materialFamily: string;
  name: string;
}

export interface WorldAssetManifestEntry {
  attributionRequired?: boolean;
  author?: string;
  compression?: "basis" | "draco" | "ktx2" | "lossless" | "meshopt" | "not_applicable";
  id: string;
  kind: WorldAssetKind;
  license: WorldAssetLicense;
  lodProfile: WorldLodProfile;
  notes: string;
  path?: string;
  sha256?: string;
  sizeBudgetBytes?: number;
  source?: string;
}

export interface WorldEnvironmentZoneManifestEntry {
  fogColor: string;
  id: string;
  name: string;
  performanceTier: "balanced" | "high" | "low";
  radius: number;
}

export interface WorldAudioZoneManifestEntry {
  ambientLayer: string;
  id: string;
  musicLayer: string;
  name: string;
  radius: number;
}

export interface WorldLocationManifestEntry {
  accessibilityLabel: string;
  assetId: string;
  audioZone: string;
  backendLocationId: WorldLocationId;
  commandRoute: string;
  environmentZone: string;
  fastTravelPoint: Vector3Tuple;
  id: WorldDistrictId;
  interactionRadius: number;
  lodProfile: WorldLodProfile;
  name: string;
  performanceBudgetKey: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  theme: WorldThemeId;
  worldRadius: number;
}

export interface WorldSpawnManifestEntry {
  facingRadians: number;
  id: string;
  locationId: WorldDistrictId;
  position: Vector3Tuple;
}

export interface WorldFastTravelManifestEntry {
  accessibilityLabel: string;
  id: string;
  locationId: WorldDistrictId;
  point: Vector3Tuple;
}

export interface WorldCameraRouteManifestEntry {
  durationSeconds: number;
  fromLocationId: WorldDistrictId;
  id: string;
  skippable: boolean;
  toLocationId: WorldDistrictId;
  waypointIds: string[];
}

export interface WorldInteractionManifestEntry {
  accessibilityLabel: string;
  commandRoute: string;
  gamepadAction: "primary";
  id: string;
  keyboardAction: "KeyE";
  locationId: WorldDistrictId;
  position: Vector3Tuple;
  prompt: string;
  radius: number;
  type: WorldInteractionType;
}

export interface WorldManifest {
  audioZones: WorldAudioZoneManifestEntry[];
  assets: WorldAssetManifestEntry[];
  cameraRoutes: WorldCameraRouteManifestEntry[];
  environmentZones: WorldEnvironmentZoneManifestEntry[];
  fastTravel: WorldFastTravelManifestEntry[];
  generatedBy: "source_controlled_manifest";
  interactions: WorldInteractionManifestEntry[];
  locations: WorldLocationManifestEntry[];
  manifestVersion: number;
  spawns: WorldSpawnManifestEntry[];
  themes: WorldThemeManifestEntry[];
  worldBoundsMeters: {
    depth: number;
    width: number;
  };
}

export interface WorldManifestValidationResult {
  errors: string[];
  valid: boolean;
}

export function validateWorldManifest(manifest: WorldManifest): WorldManifestValidationResult {
  const errors: string[] = [];
  const locationIds = new Set(manifest.locations.map((location) => location.id));
  const assetIds = new Set(manifest.assets.map((asset) => asset.id));
  const themeIds = new Set(manifest.themes.map((theme) => theme.id));
  const audioZoneIds = new Set(manifest.audioZones.map((zone) => zone.id));
  const environmentZoneIds = new Set(manifest.environmentZones.map((zone) => zone.id));

  collectDuplicateIds("location", manifest.locations, errors);
  collectDuplicateIds("asset", manifest.assets, errors);
  collectDuplicateIds("theme", manifest.themes, errors);
  collectDuplicateIds("audio zone", manifest.audioZones, errors);
  collectDuplicateIds("environment zone", manifest.environmentZones, errors);
  collectDuplicateIds("spawn", manifest.spawns, errors);
  collectDuplicateIds("fast travel", manifest.fastTravel, errors);
  collectDuplicateIds("camera route", manifest.cameraRoutes, errors);
  collectDuplicateIds("interaction", manifest.interactions, errors);

  for (const location of manifest.locations) {
    if (!assetIds.has(location.assetId)) {
      errors.push(`Location ${location.id} references unknown asset ${location.assetId}.`);
    }
    if (!themeIds.has(location.theme)) {
      errors.push(`Location ${location.id} references unknown theme ${location.theme}.`);
    }
    if (!audioZoneIds.has(location.audioZone)) {
      errors.push(`Location ${location.id} references unknown audio zone ${location.audioZone}.`);
    }
    if (!environmentZoneIds.has(location.environmentZone)) {
      errors.push(
        `Location ${location.id} references unknown environment zone ${location.environmentZone}.`
      );
    }
    if (!location.commandRoute.startsWith("/app")) {
      errors.push(`Location ${location.id} command route must stay inside Command Mode.`);
    }
    if (!isInsideWorldBounds(location.position, manifest)) {
      errors.push(`Location ${location.id} is outside the declared world bounds.`);
    }
  }

  for (const spawn of manifest.spawns) {
    if (!locationIds.has(spawn.locationId)) {
      errors.push(`Spawn ${spawn.id} references unknown location ${spawn.locationId}.`);
    }
    if (!isInsideWorldBounds(spawn.position, manifest)) {
      errors.push(`Spawn ${spawn.id} is outside the declared world bounds.`);
    }
  }

  for (const fastTravel of manifest.fastTravel) {
    if (!locationIds.has(fastTravel.locationId)) {
      errors.push(
        `Fast travel ${fastTravel.id} references unknown location ${fastTravel.locationId}.`
      );
    }
  }

  for (const route of manifest.cameraRoutes) {
    if (!locationIds.has(route.fromLocationId)) {
      errors.push(`Camera route ${route.id} references unknown origin ${route.fromLocationId}.`);
    }
    if (!locationIds.has(route.toLocationId)) {
      errors.push(`Camera route ${route.id} references unknown destination ${route.toLocationId}.`);
    }
    if (!route.skippable) {
      errors.push(`Camera route ${route.id} must be skippable.`);
    }
  }

  for (const interaction of manifest.interactions) {
    if (!locationIds.has(interaction.locationId)) {
      errors.push(
        `Interaction ${interaction.id} references unknown location ${interaction.locationId}.`
      );
    }
    if (!interaction.commandRoute.startsWith("/app")) {
      errors.push(`Interaction ${interaction.id} command route must stay inside Command Mode.`);
    }
  }

  return {
    errors,
    valid: errors.length === 0
  };
}

function collectDuplicateIds(
  label: string,
  entries: readonly { id: string }[],
  errors: string[]
): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      errors.push(`Duplicate ${label} id ${entry.id}.`);
    }
    seen.add(entry.id);
  }
}

function isInsideWorldBounds(position: Vector3Tuple, manifest: WorldManifest): boolean {
  const halfWidth = manifest.worldBoundsMeters.width / 2;
  const halfDepth = manifest.worldBoundsMeters.depth / 2;
  return Math.abs(position[0]) <= halfWidth && Math.abs(position[2]) <= halfDepth;
}
