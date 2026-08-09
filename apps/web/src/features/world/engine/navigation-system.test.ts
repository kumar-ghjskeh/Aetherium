import type { WorldLocationPage } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import {
  buildWorldDestinations,
  createWorldTravelPlan,
  resolveDestinationLabelFace,
  resolveEnteredDestination,
  sampleWorldTravelPlan
} from "./navigation-system";
import { sampleTerrain } from "./terrain-system";

const locations: WorldLocationPage = {
  currentLocationId: "central_plaza",
  items: [
    {
      category: "hub",
      commandRoute: "/app",
      current: true,
      deepLinkEntityTypes: ["dashboard"],
      defaultUnlocked: true,
      description: "Central hub",
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

describe("world navigation system", () => {
  it("maps the ten scene locations to backend ownership and terrain-aware travel points", () => {
    const destinations = buildWorldDestinations(locations);
    const library = destinations.find((destination) => destination.id === "knowledge-library");

    expect(destinations).toHaveLength(10);
    expect(library).toMatchObject({
      arrivalCameraDistance: 24,
      arrivalFocusHeight: 15,
      backendLocationId: "library",
      collisionHalfHeight: 14,
      collisionRadius: 18,
      commandRoute: "/app/library",
      unlocked: true,
      visited: false
    });
    expect(library?.point[1]).toBeCloseTo(
      sampleTerrain(library?.point[0] ?? 0, library?.point[2] ?? 0).height + 0.82,
      3
    );
  });

  it("creates skippable cinematic movement and exact instant travel", () => {
    const destination = buildWorldDestinations(locations).find(
      (item) => item.id === "knowledge-library"
    )!;
    const cinematic = createWorldTravelPlan({
      destination,
      from: [0, 1.1, 0],
      mode: "cinematic",
      reducedMotion: false,
      startedAtMilliseconds: 1000
    });
    const midpoint = sampleWorldTravelPlan(
      cinematic,
      1000 + (cinematic.durationSeconds * 1000) / 2
    );
    const finished = sampleWorldTravelPlan(cinematic, 1000 + cinematic.durationSeconds * 1000);
    const instant = createWorldTravelPlan({
      destination,
      from: [0, 1.1, 0],
      mode: "instant",
      reducedMotion: false,
      startedAtMilliseconds: 1000
    });

    expect(cinematic.durationSeconds).toBeGreaterThan(0);
    expect(midpoint.progress).toBeCloseTo(0.5);
    expect(midpoint.position[1]).toBeGreaterThan(
      sampleTerrain(midpoint.position[0], midpoint.position[2]).height
    );
    expect(finished).toMatchObject({ complete: true, progress: 1 });
    expect(finished.position).toEqual(destination.point);
    expect(sampleWorldTravelPlan(instant, 1000)).toEqual({
      complete: true,
      position: destination.point,
      progress: 1
    });
  });

  it("turns cinematic travel into instant travel for reduced motion", () => {
    const destination = buildWorldDestinations(locations)[0]!;
    const plan = createWorldTravelPlan({
      destination,
      from: [20, 1.1, 20],
      mode: "cinematic",
      reducedMotion: true,
      startedAtMilliseconds: 0
    });

    expect(plan.durationSeconds).toBe(0);
  });

  it("resolves walking arrivals only for unlocked districts", () => {
    const destinations = buildWorldDestinations(locations);
    const library = destinations.find((destination) => destination.id === "knowledge-library")!;
    const lockedSanctuary = destinations.find(
      (destination) => destination.id === "personal-sanctuary"
    )!;

    expect(resolveEnteredDestination(library.worldPosition, destinations)?.id).toBe(
      "knowledge-library"
    );
    expect(resolveEnteredDestination(lockedSanctuary.worldPosition, destinations)).toBeNull();
  });

  it("faces location labels toward their authored travel approach", () => {
    const destinations = buildWorldDestinations(locations);
    const plaza = destinations.find((destination) => destination.id === "central-plaza")!;
    const dock = destinations.find((destination) => destination.id === "project-dock")!;

    expect(resolveDestinationLabelFace(plaza)).toBe("front");
    expect(resolveDestinationLabelFace(dock)).toBe("back");
  });
});
