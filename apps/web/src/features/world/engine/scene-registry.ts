import {
  validateWorldManifest,
  type WorldDistrictId,
  type WorldManifest
} from "../schemas/world-manifest-schema";

export interface WorldSceneRegistry {
  getLocation: (locationId: WorldDistrictId) => NonNullable<WorldManifest["locations"][number]>;
  listFastTravelDestinations: () => WorldManifest["fastTravel"];
  listLocations: () => WorldManifest["locations"];
  listLocationInteractions: (locationId: WorldDistrictId) => WorldManifest["interactions"];
}

export function createWorldSceneRegistry(manifest: WorldManifest): WorldSceneRegistry {
  const validation = validateWorldManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Invalid Aetherium world manifest: ${validation.errors.join(" ")}`);
  }

  return {
    getLocation: (locationId) => {
      const location = manifest.locations.find((item) => item.id === locationId);
      if (!location) {
        throw new Error(`Unknown world location ${locationId}.`);
      }
      return location;
    },
    listFastTravelDestinations: () => manifest.fastTravel,
    listLocations: () => manifest.locations,
    listLocationInteractions: (locationId) =>
      manifest.interactions.filter((interaction) => interaction.locationId === locationId)
  };
}
