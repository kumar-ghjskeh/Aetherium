import type { WorldLocationPage, WorldProfile } from "@aetherium/shared-types";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildWorldDestinations } from "../../engine/navigation-system";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";
import { WorldNavigationOverlay } from "./world-navigation-overlay";

vi.mock("next/link", () => ({
  default: ({ children, href }: Readonly<{ children: React.ReactNode; href: string }>) => (
    <a href={href}>{children}</a>
  )
}));

const locationPage: WorldLocationPage = {
  currentLocationId: "central_plaza",
  items: [
    {
      category: "hub",
      commandRoute: "/app",
      current: true,
      deepLinkEntityTypes: ["dashboard"],
      defaultUnlocked: true,
      description: "Hub",
      futureSceneKey: "central-plaza",
      id: "central_plaza",
      spawn: true,
      subtitle: "Hub",
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
      deepLinkEntityTypes: ["file"],
      defaultUnlocked: true,
      description: "Files",
      futureSceneKey: "knowledge-library",
      id: "library",
      spawn: false,
      subtitle: "Vault",
      title: "Knowledge Library",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    }
  ],
  total: 2,
  unlockedCount: 2,
  visitedCount: 1
};

const profile: WorldProfile = {
  createdAt: "2026-08-01T00:00:00Z",
  currentLocationId: "central_plaza",
  id: "world-profile-1",
  lastVisitedLocationId: null,
  preferredNavigationMethod: "direct",
  spawnLocationId: "central_plaza",
  tutorialCompleted: true,
  unlockedLocationIds: ["central_plaza", "library"],
  updatedAt: "2026-08-01T00:00:00Z",
  visitedLocationIds: ["central_plaza"],
  worldStateVersion: 1
};

describe("WorldNavigationOverlay", () => {
  beforeEach(() => {
    useWorldNavigationStore.setState({
      activeTravel: null,
      destinationId: null,
      mapOpen: false,
      selectedMode: "walk",
      skipRequested: false,
      syncMessage: null,
      syncStatus: "idle"
    });
    usePlayerStore.setState({
      completedTeleportSequence: 1,
      mapRequested: false,
      movementDisabled: false,
      pendingTeleport: null,
      position: [0, 1.1, 0]
    });
  });

  it("opens an accessible map and starts instant travel to an unlocked location", () => {
    const destinations = buildWorldDestinations(locationPage);
    render(
      <WorldNavigationOverlay destinations={destinations} profile={profile} reducedMotion={false} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    const map = screen.getByRole("dialog", { name: "Aetherium world map" });
    expect(within(map).getByRole("button", { name: "Personal Sanctuary, locked" })).toBeDisabled();

    fireEvent.click(within(map).getByRole("button", { name: "Instant" }));
    fireEvent.click(within(map).getByRole("button", { name: "Knowledge Library" }));
    fireEvent.click(within(map).getByRole("button", { name: "Travel instant" }));

    expect(useWorldNavigationStore.getState().activeTravel).toMatchObject({
      durationSeconds: 0,
      mode: "instant",
      target: { backendLocationId: "library", id: "knowledge-library" }
    });
    expect(screen.queryByRole("dialog", { name: "Aetherium world map" })).not.toBeInTheDocument();
  });

  it("keeps travel disabled until the initial physics teleport completes", () => {
    usePlayerStore.setState({ completedTeleportSequence: 0, pendingTeleport: [0, 0.82, 58] });
    const destinations = buildWorldDestinations(locationPage);
    render(
      <WorldNavigationOverlay destinations={destinations} profile={profile} reducedMotion={false} />
    );

    expect(screen.getByRole("button", { name: "Map" })).toBeDisabled();
  });

  it("supports keyboard/gamepad map requests and skippable cinematic travel", () => {
    const destinations = buildWorldDestinations(locationPage);
    render(
      <WorldNavigationOverlay destinations={destinations} profile={profile} reducedMotion={false} />
    );

    act(() => usePlayerStore.setState({ mapRequested: true }));
    const map = screen.getByRole("dialog", { name: "Aetherium world map" });
    fireEvent.click(within(map).getByRole("button", { name: "Cinematic" }));
    fireEvent.click(within(map).getByRole("button", { name: "Knowledge Library" }));
    fireEvent.click(within(map).getByRole("button", { name: "Travel cinematic" }));

    fireEvent.click(screen.getByRole("button", { name: "Skip travel" }));
    expect(useWorldNavigationStore.getState().skipRequested).toBe(true);
  });

  it("sets a walking destination without relocating the player", () => {
    const destinations = buildWorldDestinations(locationPage);
    render(
      <WorldNavigationOverlay destinations={destinations} profile={profile} reducedMotion={false} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    const map = screen.getByRole("dialog", { name: "Aetherium world map" });
    fireEvent.click(within(map).getByRole("button", { name: "Knowledge Library" }));
    fireEvent.click(within(map).getByRole("button", { name: "Set walking destination" }));

    expect(useWorldNavigationStore.getState()).toMatchObject({
      activeTravel: null,
      destinationId: "knowledge-library",
      mapOpen: false
    });
  });
});
