import { describe, expect, it } from "vitest";

import type { WorldInteraction } from "./interaction-system";
import {
  canActivateInteraction,
  isInteractionWithinRadius,
  rankWorldInteractions,
  resolveInteractionActivation,
  selectActiveInteraction
} from "./interaction-system";

const baseInteraction: WorldInteraction = {
  accessibilityLabel: "Open Library",
  commandRoute: "/app/library",
  gamepadAction: "primary",
  id: "library",
  keyboardAction: "KeyE",
  locationId: "library",
  permission: "allowed",
  position: [0, 0, -2],
  prompt: "Open Library",
  radius: 3,
  status: "available",
  type: "open_file_collection"
};

describe("world interaction system", () => {
  it("detects whether the player is inside an interaction radius", () => {
    expect(isInteractionWithinRadius(baseInteraction, [0, 0, 0])).toBe(true);
    expect(isInteractionWithinRadius(baseInteraction, [0, 0, 6])).toBe(false);
  });

  it("ranks nearby interactions by distance and facing", () => {
    const ranked = rankWorldInteractions({
      interactions: [
        { ...baseInteraction, id: "behind", position: [0, 0, 2] },
        { ...baseInteraction, id: "ahead", position: [0, 0, -2] }
      ],
      playerFacingRadians: 0,
      playerPosition: [0, 0, 0]
    });

    expect(selectActiveInteraction(ranked)?.id).toBe("ahead");
  });

  it("blocks disabled and permission-denied interactions", () => {
    const denied: WorldInteraction = {
      ...baseInteraction,
      disabledReason: "Locked until the location is unlocked.",
      permission: "allowed",
      status: "permission_denied"
    };

    expect(canActivateInteraction(denied)).toBe(false);
    expect(resolveInteractionActivation(denied)).toEqual({
      interactionId: denied.id,
      kind: "blocked",
      message: "Locked until the location is unlocked."
    });
  });

  it("reports loading and error states without navigating", () => {
    expect(resolveInteractionActivation({ ...baseInteraction, status: "loading" })).toEqual({
      interactionId: baseInteraction.id,
      kind: "loading",
      message: "This destination is still loading."
    });

    expect(
      resolveInteractionActivation({
        ...baseInteraction,
        errorMessage: "The route failed to load.",
        status: "error"
      })
    ).toEqual({
      interactionId: baseInteraction.id,
      kind: "blocked",
      message: "The route failed to load."
    });
  });

  it("returns command route activation for available interactions", () => {
    expect(resolveInteractionActivation(baseInteraction)).toEqual({
      interactionId: baseInteraction.id,
      kind: "command_route",
      route: "/app/library"
    });
  });
});
