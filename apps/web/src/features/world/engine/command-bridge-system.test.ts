import { describe, expect, it } from "vitest";

import {
  createWorldModeHref,
  parseWorldCommandIntent,
  resolveWorldLocationForCommandRoute
} from "./command-bridge-system";

describe("world command bridge", () => {
  it("maps nested Command Mode routes to their world districts", () => {
    expect(resolveWorldLocationForCommandRoute("/app/library/file-1")?.id).toBe(
      "knowledge-library"
    );
    expect(resolveWorldLocationForCommandRoute("/app")?.id).toBe("central-plaza");
  });

  it("creates and parses typed world travel links", () => {
    const href = createWorldModeHref({ backendLocationId: "library", mode: "instant" });
    expect(href).toBe("/app/world?destination=library&mode=instant");
    expect(parseWorldCommandIntent(new URLSearchParams(href.split("?")[1]))).toEqual({
      backendLocationId: "library",
      mode: "instant"
    });
  });

  it("rejects unknown destinations and defaults invalid travel modes safely", () => {
    expect(parseWorldCommandIntent(new URLSearchParams("destination=unknown"))).toBeNull();
    expect(
      parseWorldCommandIntent(new URLSearchParams("destination=habit_garden&mode=warp"))
    ).toEqual({ backendLocationId: "habit_garden", mode: "cinematic" });
  });
});
