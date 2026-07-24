import { describe, expect, it } from "vitest";

import { createWorldSceneRegistry } from "./scene-registry";
import { validateWorldManifest } from "../schemas/world-manifest-schema";
import { AETHERIUM_WORLD_MANIFEST } from "../manifests/world.manifest";

describe("Aetherium world manifest", () => {
  it("validates source-controlled world registries", () => {
    const validation = validateWorldManifest(AETHERIUM_WORLD_MANIFEST);

    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
  });

  it("defines the ten planned world districts inside the 800 meter world", () => {
    expect(AETHERIUM_WORLD_MANIFEST.worldBoundsMeters).toEqual({ depth: 800, width: 800 });
    expect(AETHERIUM_WORLD_MANIFEST.locations.map((location) => location.id)).toEqual([
      "central-plaza",
      "knowledge-library",
      "ai-observatory",
      "habit-garden",
      "learning-academy",
      "coding-arena",
      "project-dock",
      "progress-tower",
      "achievement-hall",
      "personal-sanctuary"
    ]);
  });

  it("exposes registry lookups without rendering final assets", () => {
    const registry = createWorldSceneRegistry(AETHERIUM_WORLD_MANIFEST);

    expect(registry.getLocation("knowledge-library").commandRoute).toBe("/app/library");
    expect(registry.listFastTravelDestinations()).toHaveLength(10);
    expect(registry.listLocationInteractions("achievement-hall")[0]?.commandRoute).toBe(
      "/app/achievements"
    );
  });

  it("rejects invalid manifests with broken references", () => {
    const firstLocation = AETHERIUM_WORLD_MANIFEST.locations[0]!;
    const validation = validateWorldManifest({
      ...AETHERIUM_WORLD_MANIFEST,
      locations: [
        {
          ...firstLocation,
          assetId: "missing-asset"
        }
      ]
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain("missing-asset");
  });
});
