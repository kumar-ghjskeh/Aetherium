import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldDestination, WorldTravelPlan } from "../../engine/navigation-system";
import { useWorldCameraStore } from "../../state/camera-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";
import { WorldInstantTravelCoordinator } from "./world-instant-travel-coordinator";

const destination: WorldDestination = {
  accessibilityLabel: "Travel to Knowledge Library",
  backendLocationId: "library",
  commandRoute: "/app/library",
  current: false,
  id: "knowledge-library",
  name: "Knowledge Library",
  point: [100, 8, -130],
  theme: "knowledge",
  unlocked: true,
  visited: false,
  worldPosition: [120, 7, -160],
  worldRadius: 50
};

const plan: WorldTravelPlan = {
  durationSeconds: 0,
  from: [0, 1, 0],
  mode: "instant",
  startedAtMilliseconds: 10,
  target: destination
};

describe("WorldInstantTravelCoordinator", () => {
  beforeEach(() => {
    useWorldNavigationStore.setState({ activeTravel: null, skipRequested: false });
    useWorldCameraStore.getState().recenter(0);
    usePlayerStore.setState({ pendingTeleport: null, position: [0, 1.1, 0] });
  });

  it("completes instant travel without waiting for a physics frame", async () => {
    const onArrive = vi.fn();
    render(<WorldInstantTravelCoordinator onArrive={onArrive} />);

    act(() => useWorldNavigationStore.getState().startTravel(plan));

    await waitFor(() => expect(useWorldNavigationStore.getState().activeTravel).toBeNull());
    expect(usePlayerStore.getState().position).toEqual(destination.point);
    expect(usePlayerStore.getState().pendingTeleport).toEqual(destination.point);
    expect(useWorldCameraStore.getState().orbit.yaw).toBeCloseTo(Math.atan2(-20, 30));
    expect(onArrive).toHaveBeenCalledWith(destination);
  });
});
