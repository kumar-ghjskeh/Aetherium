import type { WorldDeepLinkPage, WorldLocationPage } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildDiagnosticWorldInteractions } from "./interaction-manifest";

const locationPage: WorldLocationPage = {
  currentLocationId: "central_plaza",
  items: [
    {
      category: "vault",
      commandRoute: "/app/library",
      current: false,
      deepLinkEntityTypes: ["file"],
      defaultUnlocked: true,
      description: "Files",
      futureSceneKey: "knowledge-library",
      id: "library",
      spawn: false,
      subtitle: "Vault",
      title: "Library",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    },
    {
      category: "achievements",
      commandRoute: "/app/achievements",
      current: false,
      deepLinkEntityTypes: ["achievement"],
      defaultUnlocked: false,
      description: "Milestones",
      futureSceneKey: "achievement-hall",
      id: "achievement_hall",
      spawn: false,
      subtitle: "Milestones",
      title: "Achievement Hall",
      unlockDependencyIds: [],
      unlocked: false,
      visited: false,
      visualStatus: "data_contract_ready"
    }
  ],
  total: 2,
  unlockedCount: 1,
  visitedCount: 0
};

const deepLinks: WorldDeepLinkPage = {
  items: [
    {
      commandRoute: "/app/library",
      entityTypes: ["file"],
      label: "Library",
      locationId: "library",
      notes: "Route",
      routePattern: "/app/library{?entityId}"
    }
  ],
  total: 1
};

describe("diagnostic world interaction manifest", () => {
  it("builds command-route interactions from world deep links and location unlock state", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });
    const library = interactions.find((interaction) => interaction.locationId === "library");
    const achievements = interactions.find(
      (interaction) => interaction.locationId === "achievement_hall"
    );

    expect(library?.commandRoute).toBe("/app/library");
    expect(library?.status).toBe("available");
    expect(achievements?.commandRoute).toBe("/app/achievements");
    expect(achievements?.status).toBe("permission_denied");
  });
});
