import { describe, expect, it } from "vitest";

import { WORLD_LOCATIONS_MANIFEST } from "../manifests/locations.manifest";
import {
  createRoutePoints,
  generateEnvironmentProps,
  generateRiverRibbonData,
  generateTerrainMeshData,
  isInsideTerrainBounds,
  resolveEnvironmentDensityBudget,
  sampleTerrain,
  TERRAIN_HALF_SIZE_METERS,
  TERRAIN_WORLD_SIZE_METERS,
  WORLD_TERRAIN_ROUTES
} from "./terrain-system";

describe("terrain system", () => {
  it("keeps the central plaza low while lifting the mountain perimeter", () => {
    const center = sampleTerrain(0, 0);
    const mountain = sampleTerrain(TERRAIN_HALF_SIZE_METERS, TERRAIN_HALF_SIZE_METERS);

    expect(center.height).toBeLessThan(1);
    expect(mountain.height).toBeGreaterThan(70);
    expect(isInsideTerrainBounds([0, 0, 0], 0)).toBe(true);
    expect(isInsideTerrainBounds([TERRAIN_HALF_SIZE_METERS + 1, 0, 0], 0)).toBe(false);
  });

  it("carves a river corridor through the terrain", () => {
    const river = sampleTerrain(0, 240);
    const upland = sampleTerrain(150, 240);

    expect(river.riverDistance).toBeLessThan(38);
    expect(river.surface).toBe("wetland");
    expect(upland.height).toBeGreaterThan(river.height);
  });

  it("generates stable terrain mesh and river ribbon sizes", () => {
    const terrain = generateTerrainMeshData(8, TERRAIN_WORLD_SIZE_METERS);
    const river = generateRiverRibbonData(8, 24);

    expect(terrain.vertexCount).toBe(81);
    expect(terrain.positions).toHaveLength(243);
    expect(terrain.colors).toHaveLength(243);
    expect(terrain.indices).toHaveLength(384);
    expect(river.positions).toHaveLength(54);
    expect(river.indices).toHaveLength(48);
  });

  it("creates one central route for every non-plaza district", () => {
    expect(WORLD_TERRAIN_ROUTES).toHaveLength(WORLD_LOCATIONS_MANIFEST.length - 1);
    expect(WORLD_TERRAIN_ROUTES.map((route) => route.locationId)).toContain("knowledge-library");

    const libraryRoute = WORLD_TERRAIN_ROUTES.find(
      (route) => route.locationId === "knowledge-library"
    )!;
    expect(createRoutePoints(libraryRoute)[0]).toEqual([0, expect.any(Number), 0]);
  });

  it("blends each fast-travel approach into its district plateau", () => {
    for (const location of WORLD_LOCATIONS_MANIFEST) {
      const center = sampleTerrain(location.position[0], location.position[2]);
      const approach = sampleTerrain(location.fastTravelPoint[0], location.fastTravelPoint[2]);

      expect(Math.abs(approach.height - center.height), location.name).toBeLessThan(0.2);
    }
  });

  it("scales environment detail by graphics preset", () => {
    const low = resolveEnvironmentDensityBudget("low");
    const high = resolveEnvironmentDensityBudget("high");

    expect(high.rockCount).toBeGreaterThan(low.rockCount);
    expect(high.treeCount).toBeGreaterThan(low.treeCount);
    expect(high.groundCoverCount).toBeGreaterThan(low.groundCoverCount);
    expect(high.mistCount).toBeGreaterThan(low.mistCount);
    expect(high.cloudCount).toBeGreaterThan(low.cloudCount);
  });

  it("generates deterministic bounded environment props from a seed", () => {
    const budget = {
      cloudCount: 2,
      groundCoverCount: 2,
      mistCount: 2,
      rockCount: 2,
      treeCount: 2
    };
    const first = generateEnvironmentProps("fixed-seed", budget);
    const second = generateEnvironmentProps("fixed-seed", budget);

    expect(second).toEqual(first);
    expect(first).toHaveLength(10);
    for (const prop of first) {
      expect(isInsideTerrainBounds(prop.position, 0)).toBe(true);
    }
  });
});
