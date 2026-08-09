import { beforeEach, describe, expect, it } from "vitest";

import { usePlayerStore } from "./player-store";

describe("player store teleport lifecycle", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      completedTeleportSequence: 0,
      pendingTeleport: null,
      position: [0, 1.1, 0],
      teleportSequence: 0,
      velocity: { x: 0, z: 0 }
    });
  });

  it("retains an instant destination until the physics controller consumes it", () => {
    usePlayerStore.getState().requestTeleport([18, 4, -27]);

    expect(usePlayerStore.getState().position).toEqual([18, 4, -27]);
    expect(usePlayerStore.getState().pendingTeleport).toEqual([18, 4, -27]);
    expect(usePlayerStore.getState().teleportSequence).toBe(1);
    expect(usePlayerStore.getState().velocity).toEqual({ x: 0, z: 0 });

    usePlayerStore.getState().consumeTeleport();
    expect(usePlayerStore.getState().pendingTeleport).toBeNull();
    expect(usePlayerStore.getState().completedTeleportSequence).toBe(1);
  });
});
