import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  UserPreferences,
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

vi.mock("./components/canvas/world-runtime-canvas", async () => {
  const React = await import("react");
  return {
    WorldRuntimeCanvas: () =>
      React.createElement("div", { "data-testid": "world-runtime-canvas" }, "Mock runtime canvas")
  };
});

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
  implementationStatus: "runtime_foundation",
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
  visualRuntimeAvailable: true
};

const featureFlags: WorldFeatureFlags = {
  commandModeFallbackRequired: true,
  dataContractsEnabled: true,
  reason: "Diagnostic runtime enabled.",
  sceneManifestEnabled: true,
  visualWorldEnabled: true
};

const preferences: UserPreferences = {
  aiMemoryEnabled: false,
  ambientAudioEnabled: true,
  backgroundMusicEnabled: false,
  cameraEffectsEnabled: true,
  createdAt: "2026-07-22T00:00:00Z",
  defaultInterfaceMode: "command",
  id: "66666666-6666-4666-8666-666666666666",
  locale: "en-US",
  performancePreset: "balanced",
  productAnalyticsEnabled: false,
  reducedMotion: false,
  theme: "system",
  timeZone: "UTC",
  updatedAt: "2026-07-22T00:00:00Z"
};

function mockMatchMedia(matches = false): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  );
}

function mockWebGL2Support(supported: boolean): void {
  Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn((contextId: string) => (contextId === "webgl2" && supported ? {} : null))
  });
}

function createClient(
  overrides: Partial<AetheriumApiClient["world"]> = {},
  settingsOverrides: Partial<AetheriumApiClient["settings"]> = {}
): AetheriumApiClient {
  return {
    settings: {
      getPreferences: vi.fn(() => Promise.resolve(preferences)),
      updatePreferences: vi.fn(() => Promise.resolve(preferences)),
      ...settingsOverrides
    },
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
    vi.unstubAllGlobals();
    mockMatchMedia(false);
    mockWebGL2Support(true);
  });

  it("renders the lazy diagnostic runtime when visual prerequisites pass", async () => {
    const client = createClient();
    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "World Data Foundation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Visual World Mode runtime" })).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(await screen.findByTestId("world-runtime-canvas")).toBeInTheDocument();
    expect(screen.getByText("central_plaza")).toBeInTheDocument();
    expect(screen.getAllByText("Knowledge Library").length).toBeGreaterThan(0);
    expect(screen.getAllByText("/app/library").length).toBeGreaterThan(0);

    await waitFor(() => expect(client.world.listLocations).toHaveBeenCalledTimes(1));
    expect(client.world.getSceneManifest).toHaveBeenCalledTimes(1);
    expect(client.world.getFeatureFlags).toHaveBeenCalledTimes(1);
    expect(client.settings.getPreferences).toHaveBeenCalledTimes(1);
  });

  it("uses the command fallback when WebGL2 is unavailable", async () => {
    mockWebGL2Support(false);
    const client = createClient();

    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "3D runtime unavailable" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("This browser did not provide a stable WebGL2 context.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("world-runtime-canvas")).not.toBeInTheDocument();
  });

  it("uses the command fallback when reduced motion is enabled", async () => {
    const client = createClient(
      {},
      {
        getPreferences: vi.fn(() => Promise.resolve({ ...preferences, reducedMotion: true }))
      }
    );

    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "3D runtime unavailable" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reduced motion is enabled, so Command Mode remains the active interface.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("world-runtime-canvas")).not.toBeInTheDocument();
  });

  it("shows an accessible error state when contracts are unavailable", async () => {
    const client = createClient({
      listLocations: vi.fn(() => Promise.reject(new Error("World service unavailable.")))
    });

    render(<WorldPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("World service unavailable.");
  });
});
