import type { WorldDeepLinkPage, WorldLocationPage } from "@aetherium/shared-types";

import { WORLD_INTERACTIONS_MANIFEST } from "../manifests/interactions.manifest";
import { WORLD_LOCATIONS_MANIFEST } from "../manifests/locations.manifest";
import type { WorldInteraction } from "./interaction-system";

export function buildDiagnosticWorldInteractions({
  deepLinks,
  locationPage
}: Readonly<{
  deepLinks: WorldDeepLinkPage;
  locationPage: WorldLocationPage;
}>): WorldInteraction[] {
  const deepLinksByLocation = new Map(deepLinks.items.map((link) => [link.locationId, link]));
  const locationsById = new Map(locationPage.items.map((location) => [location.id, location]));
  const worldLocationsById = new Map(
    WORLD_LOCATIONS_MANIFEST.map((location) => [location.id, location])
  );

  return WORLD_INTERACTIONS_MANIFEST.map((layout) => {
    const worldLocation = worldLocationsById.get(layout.locationId);
    const backendLocationId = worldLocation?.backendLocationId ?? "central_plaza";
    const deepLink = deepLinksByLocation.get(backendLocationId);
    const location = locationsById.get(backendLocationId);
    const unlocked = location?.unlocked ?? true;
    const commandRoute = deepLink?.commandRoute ?? location?.commandRoute ?? layout.commandRoute;

    const interaction: WorldInteraction = {
      accessibilityLabel: layout.accessibilityLabel,
      commandRoute,
      gamepadAction: layout.gamepadAction,
      id: layout.id,
      keyboardAction: layout.keyboardAction,
      locationId: backendLocationId,
      permission: "allowed",
      position: layout.position,
      prompt: layout.prompt,
      radius: layout.radius,
      status: unlocked ? "available" : "permission_denied",
      type: layout.type
    };

    return unlocked
      ? interaction
      : {
          ...interaction,
          disabledReason: "Locked until the location is unlocked."
        };
  });
}
