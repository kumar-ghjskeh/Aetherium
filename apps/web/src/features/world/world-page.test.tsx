import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  WorldDeepLinkPage,
  WorldFeatureFlags,
  WorldLocationPage,
  WorldProfile,
  WorldSceneManifest
} from "@aetherium/shared-types";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUnusedWorldClient } from "../../test/api-client";
import { WorldPage } from "./world-page";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: Readonly<{
    children: React.ReactNode;
    href: string;
  }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const profile: WorldProfile = {
  createdAt: "2026-07-22T00:00:00Z",
  currentLocationId: "central_plaza",
  id: "55555555-5555-4555-8555-555555555555",
  lastVisitedLocationId: null,
  preferredNavigationMethod: "command_palette",
  spawnLocationId: "central_plaza",
  tutorialCompleted: false,
  unlockedLocationIds: ["central_plaza", "library", "habit_garden", "command_center"],
  updatedAt: "2026-07-22T00:00:00Z",
  visitedLocationIds: ["central_plaza"],
  worldStateVersion: 1
};

const locations: WorldLocationPage = {
  currentLocationId: "central_plaza",
  items: [
    {
      category: "hub",
      commandRoute: "/app",
      current: true,
      deepLinkEntityTypes: ["dashboard"],
      defaultUnlocked: true,
      description: "Spawn and overview location.",
      futureSceneKey: "central-plaza",
      id: "central_plaza",
      spawn: true,
      subtitle: "Daily command hub",
      title: "Central Plaza",
      unlockDependencyIds: [],
      unlocked: true,
      visited: true,
      visualStatus: "data_contract_ready"
    },
    {
      category: "vault",
      commandRoute: "/app/library",
      current: false,
      deepLinkEntityTypes: ["file", "file_chunk"],
      defaultUnlocked: true,
      description: "Destination for files and citations.",
      futureSceneKey: "knowledge-library",
      id: "library",
      spawn: false,
      subtitle: "Personal Vault and sources",
      title: "Knowledge Library",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    }
  ],
  total: 2,
  unlockedCount: 4,
  visitedCount: 1
};

const deepLinks: WorldDeepLinkPage = {
  items: [
    {
      commandRoute: "/app/library",
      entityTypes: ["file", "file_chunk"],
      label: "Knowledge Library",
      locationId: "library",
      notes: "Command route for future spatial navigation.",
      routePattern: "/app/library{?entityId,sourceId}"
    }
  ],
  total: 1
};

const sceneManifest: WorldSceneManifest = {
  implementationStatus: "data_contract_only",
  locations: [
    {
      allowedToRender: false,
      assetBundleKey: null,
      commandRoute: "/app/library",
      disabledReason: "Visual World Mode is intentionally not implemented.",
      futureSceneKey: "knowledge-library",
      implementationStatus: "data_contract_ready",
      locationId: "library",
      title: "Knowledge Library"
    }
  ],
  manifestVersion: 1,
  visualRuntimeAvailable: false
};

const featureFlags: WorldFeatureFlags = {
  commandModeFallbackRequired: true,
  dataContractsEnabled: true,
  reason: "Data contracts only.",
  sceneManifestEnabled: true,
  visualWorldEnabled: false
};

function createClient(overrides: Partial<AetheriumApiClient["world"]> = {}): AetheriumApiClient {
  return {
    world: {
      ...createUnusedWorldClient(),
      getFeatureFlags: vi.fn(() => Promise.resolve(featureFlags)),
      getProfile: vi.fn(() => Promise.resolve(profile)),
      getSceneManifest: vi.fn(() => Promise.resolve(sceneManifest)),
      listDeepLinks: vi.fn(() => Promise.resolve(deepLinks)),
      listLocations: vi.fn(() => Promise.resolve(locations)),
      ...overrides
    }
  } as AetheriumApiClient;
}

describe("WorldPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders non-visual world data contracts", async () => {
    const client = createClient();
    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "World Data Foundation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Visual World Mode is not implemented" })
    ).toBeInTheDocument();
    expect(screen.getByText("Data only")).toBeInTheDocument();
    expect(screen.getByText("central_plaza")).toBeInTheDocument();
    expect(screen.getAllByText("Knowledge Library").length).toBeGreaterThan(0);
    expect(screen.getAllByText("/app/library").length).toBeGreaterThan(0);

    await waitFor(() => expect(client.world.listLocations).toHaveBeenCalledTimes(1));
    expect(client.world.getSceneManifest).toHaveBeenCalledTimes(1);
    expect(client.world.getFeatureFlags).toHaveBeenCalledTimes(1);
  });

  it("shows an accessible error state when contracts are unavailable", async () => {
    const client = createClient({
      listLocations: vi.fn(() => Promise.reject(new Error("World service unavailable.")))
    });

    render(<WorldPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("World service unavailable.");
  });
});
