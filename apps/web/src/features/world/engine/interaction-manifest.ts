import type {
  WorldDeepLinkPage,
  WorldLocationId,
  WorldLocationPage
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";
import type { WorldInteraction, WorldInteractionType } from "./interaction-system";

interface DiagnosticInteractionLayout {
  accessibilityLabel: string;
  locationId: WorldLocationId;
  position: Vector3Tuple;
  prompt: string;
  type: WorldInteractionType;
}

const DIAGNOSTIC_INTERACTION_LAYOUT: readonly DiagnosticInteractionLayout[] = [
  {
    accessibilityLabel: "Open the Knowledge Library in Command Mode",
    locationId: "library",
    position: [3.4, 0.36, -2.8],
    prompt: "Open Library",
    type: "open_file_collection"
  },
  {
    accessibilityLabel: "Ask an AI mentor in Command Mode",
    locationId: "ai_hall",
    position: [-3.4, 0.36, -2.8],
    prompt: "Ask AI",
    type: "start_ai_conversation"
  },
  {
    accessibilityLabel: "Open Habit Garden in Command Mode",
    locationId: "habit_garden",
    position: [3.4, 0.36, 2.8],
    prompt: "Open Habits",
    type: "open_habit_dashboard"
  },
  {
    accessibilityLabel: "Open analytics in Command Mode",
    locationId: "command_center",
    position: [-3.4, 0.36, 2.8],
    prompt: "Open Analytics",
    type: "open_analytics"
  },
  {
    accessibilityLabel: "Open the Project Workshop in Command Mode",
    locationId: "project_workshop",
    position: [0, 0.36, -5.2],
    prompt: "Open Projects",
    type: "open_project"
  },
  {
    accessibilityLabel: "Open Achievement Hall in Command Mode",
    locationId: "achievement_hall",
    position: [0, 0.36, 5.2],
    prompt: "Open Achievements",
    type: "open_achievement_display"
  }
];

const FALLBACK_ROUTES: Partial<Record<WorldLocationId, string>> = {
  achievement_hall: "/app/achievements",
  ai_hall: "/app/ai",
  command_center: "/app/analytics",
  habit_garden: "/app/habits",
  library: "/app/library",
  project_workshop: "/app/projects"
};

export function buildDiagnosticWorldInteractions({
  deepLinks,
  locationPage
}: Readonly<{
  deepLinks: WorldDeepLinkPage;
  locationPage: WorldLocationPage;
}>): WorldInteraction[] {
  const deepLinksByLocation = new Map(deepLinks.items.map((link) => [link.locationId, link]));
  const locationsById = new Map(locationPage.items.map((location) => [location.id, location]));

  return DIAGNOSTIC_INTERACTION_LAYOUT.map((layout) => {
    const deepLink = deepLinksByLocation.get(layout.locationId);
    const location = locationsById.get(layout.locationId);
    const unlocked = location?.unlocked ?? true;
    const commandRoute =
      deepLink?.commandRoute ??
      location?.commandRoute ??
      FALLBACK_ROUTES[layout.locationId] ??
      "/app";

    const interaction: WorldInteraction = {
      accessibilityLabel: layout.accessibilityLabel,
      commandRoute,
      gamepadAction: "primary",
      id: `diagnostic-${layout.locationId}`,
      keyboardAction: "KeyE",
      locationId: layout.locationId,
      permission: "allowed",
      position: layout.position,
      prompt: layout.prompt,
      radius: 2.35,
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
