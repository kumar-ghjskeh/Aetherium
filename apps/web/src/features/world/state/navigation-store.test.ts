import { beforeEach, describe, expect, it } from "vitest";

import type { WorldDestination, WorldTravelPlan } from "../engine/navigation-system";
import { WORLD_ARRIVAL_FRAMING_MILLISECONDS, useWorldNavigationStore } from "./navigation-store";

const destination: WorldDestination = {
  accessibilityLabel: "Travel to Library",
  backendLocationId: "library",
  commandRoute: "/app/library",
  current: false,
  id: "knowledge-library",
  name: "Knowledge Library",
  point: [180, 1.1, -240],
  theme: "knowledge",
  unlocked: true,
  visited: false,
  worldPosition: [180, 0, -240],
  worldRadius: 50
};

const plan: WorldTravelPlan = {
  durationSeconds: 6,
  from: [0, 1.1, 0],
  mode: "cinematic",
  startedAtMilliseconds: 1000,
  target: destination
};

describe("world navigation store", () => {
  beforeEach(() => {
    useWorldNavigationStore.setState({
      activeTravel: null,
      arrivalSuppressedUntilMilliseconds: 0,
      destinationId: null,
      mapOpen: false,
      selectedMode: "walk",
      skipRequested: false,
      syncMessage: null,
      syncStatus: "idle"
    });
  });

  it("opens the map, selects a mode and destination, and starts travel", () => {
    const navigation = useWorldNavigationStore.getState();
    navigation.openMap();
    navigation.setSelectedMode("cinematic");
    navigation.selectDestination(destination.id);
    navigation.startTravel(plan);

    expect(useWorldNavigationStore.getState()).toMatchObject({
      activeTravel: plan,
      destinationId: "knowledge-library",
      mapOpen: false,
      selectedMode: "cinematic",
      skipRequested: false
    });
  });

  it("supports travel skipping, completion, and visible sync failures", () => {
    const navigation = useWorldNavigationStore.getState();
    navigation.startTravel(plan);
    useWorldNavigationStore.getState().requestSkip();
    expect(useWorldNavigationStore.getState().skipRequested).toBe(true);

    useWorldNavigationStore.getState().completeTravel();
    useWorldNavigationStore.getState().setSyncError("World service unavailable.");

    expect(useWorldNavigationStore.getState()).toMatchObject({
      activeTravel: null,
      skipRequested: false,
      syncMessage: "World service unavailable.",
      syncStatus: "error"
    });
    expect(useWorldNavigationStore.getState().arrivalSuppressedUntilMilliseconds).toBeGreaterThan(
      Date.now()
    );
    expect(
      useWorldNavigationStore.getState().arrivalSuppressedUntilMilliseconds
    ).toBeLessThanOrEqual(Date.now() + WORLD_ARRIVAL_FRAMING_MILLISECONDS);
  });
});
