import type { PerformancePreset } from "@aetherium/shared-types";

import { WORLD_LOCATIONS_MANIFEST } from "../manifests/locations.manifest";
import { WORLD_THEMES_MANIFEST } from "../manifests/themes.manifest";
import type { WorldDistrictId, WorldThemeId } from "../schemas/world-manifest-schema";
import type { Vector3Tuple } from "./camera-system";

export const TERRAIN_WORLD_SIZE_METERS = 800;
export const TERRAIN_HALF_SIZE_METERS = TERRAIN_WORLD_SIZE_METERS / 2;
export const TERRAIN_GRID_SEGMENTS = 96;
export const TERRAIN_SEED = "aetherium-terrain-v1";

export type TerrainSurface = "grass" | "mountain" | "path" | "stone" | "wetland";
export type EnvironmentPropKind = "cloud" | "mist" | "rock";

export interface TerrainSample {
  height: number;
  riverCenterX: number;
  riverDistance: number;
  surface: TerrainSurface;
}

export interface TerrainMeshData {
  colors: Float32Array;
  indices: Uint32Array;
  positions: Float32Array;
  vertexCount: number;
}

export interface RiverRibbonData {
  indices: Uint32Array;
  positions: Float32Array;
}

export interface TerrainRoute {
  id: string;
  locationId: WorldDistrictId;
  name: string;
  points: Vector3Tuple[];
  theme: WorldThemeId;
}

export interface EnvironmentProp {
  id: string;
  kind: EnvironmentPropKind;
  position: Vector3Tuple;
  rotationY: number;
  scale: Vector3Tuple;
}

export interface EnvironmentDensityBudget {
  cloudCount: number;
  mistCount: number;
  rockCount: number;
}

const SURFACE_COLORS: Record<TerrainSurface, readonly [number, number, number]> = {
  grass: hexToRgb("#315d45"),
  mountain: hexToRgb("#77818a"),
  path: hexToRgb("#766b5a"),
  stone: hexToRgb("#52616b"),
  wetland: hexToRgb("#274347")
};

export const WORLD_TERRAIN_ROUTES: TerrainRoute[] = WORLD_LOCATIONS_MANIFEST.filter(
  (location) => location.id !== "central-plaza"
).map((location) => {
  const bendX = location.position[0] * 0.42;
  const bendZ = location.position[2] * 0.34;
  const points: Vector3Tuple[] = [[0, 0, 0], [bendX, 0, bendZ], location.fastTravelPoint];
  return {
    id: `route-central-${location.id}`,
    locationId: location.id,
    name: `Central route to ${location.name}`,
    points,
    theme: location.theme
  };
});

export const WORLD_THEME_COLORS = new Map(
  WORLD_THEMES_MANIFEST.map((theme) => [theme.id, theme.accentColor])
);

export function resolveRiverCenterX(z: number): number {
  return Math.sin((z + 82) * 0.0105) * 34 + Math.sin((z - 140) * 0.006) * 18;
}

const DISTRICT_PLATEAUS = WORLD_LOCATIONS_MANIFEST.map((location) => ({
  centerHeight: sampleRawTerrainHeight(location.position[0], location.position[2]),
  innerRadius: location.worldRadius + 18,
  outerRadius: location.worldRadius + 46,
  position: location.position
}));

export function sampleTerrain(x: number, z: number): TerrainSample {
  const borderDistance = Math.max(Math.abs(x), Math.abs(z)) / TERRAIN_HALF_SIZE_METERS;
  const riverCenterX = resolveRiverCenterX(z);
  const riverDistance = Math.abs(x - riverCenterX);
  let height = sampleRawTerrainHeight(x, z);
  for (const plateau of DISTRICT_PLATEAUS) {
    const distance = Math.hypot(x - plateau.position[0], z - plateau.position[2]);
    if (distance >= plateau.outerRadius) {
      continue;
    }
    const plateauBlend = 1 - smoothstep(plateau.innerRadius, plateau.outerRadius, distance);
    height += (plateau.centerHeight - height) * plateauBlend;
  }
  return {
    height: Number(height.toFixed(3)),
    riverCenterX,
    riverDistance,
    surface: resolveTerrainSurface(x, z, height, riverDistance, borderDistance)
  };
}

function sampleRawTerrainHeight(x: number, z: number): number {
  const borderDistance = Math.max(Math.abs(x), Math.abs(z)) / TERRAIN_HALF_SIZE_METERS;
  const radialDistance = Math.hypot(x, z) / (Math.SQRT2 * TERRAIN_HALF_SIZE_METERS);
  const mountainLift =
    Math.pow(smoothstep(0.62, 1, borderDistance), 2) * 78 +
    Math.pow(smoothstep(0.76, 1, radialDistance), 2) * 36;
  const rollingLift =
    Math.sin(x * 0.012 + 0.8) * 1.7 +
    Math.cos(z * 0.014 - 0.35) * 1.4 +
    Math.sin((x + z) * 0.0065) * 1.2;
  const terraceLift = smoothstep(0.22, 0.72, radialDistance) * 7.5;
  const riverDistance = Math.abs(x - resolveRiverCenterX(z));
  const riverCut = smoothstep(44, 0, riverDistance) * 3.3;
  const centralPlateau = smoothstep(88, 24, Math.hypot(x, z));
  const rawHeight = mountainLift + terraceLift + rollingLift - riverCut;
  return rawHeight * (1 - centralPlateau) + 0.26 * centralPlateau;
}

export function isInsideTerrainBounds(position: Vector3Tuple, marginMeters = 0): boolean {
  const limit = TERRAIN_HALF_SIZE_METERS - marginMeters;
  return Math.abs(position[0]) <= limit && Math.abs(position[2]) <= limit;
}

export function resolveEnvironmentDensityBudget(
  preset: PerformancePreset
): EnvironmentDensityBudget {
  if (preset === "low") {
    return { cloudCount: 5, mistCount: 8, rockCount: 18 };
  }
  if (preset === "high") {
    return { cloudCount: 14, mistCount: 24, rockCount: 44 };
  }
  return { cloudCount: 9, mistCount: 16, rockCount: 30 };
}

export function generateTerrainMeshData(
  segments = TERRAIN_GRID_SEGMENTS,
  sizeMeters = TERRAIN_WORLD_SIZE_METERS
): TerrainMeshData {
  const verticesPerSide = segments + 1;
  const vertexCount = verticesPerSide * verticesPerSide;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(segments * segments * 6);
  const halfSize = sizeMeters / 2;
  let vertexOffset = 0;

  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    const z = -halfSize + (zIndex / segments) * sizeMeters;
    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const x = -halfSize + (xIndex / segments) * sizeMeters;
      const sample = sampleTerrain(x, z);
      const color = SURFACE_COLORS[sample.surface];
      positions[vertexOffset * 3] = x;
      positions[vertexOffset * 3 + 1] = sample.height;
      positions[vertexOffset * 3 + 2] = z;
      colors[vertexOffset * 3] = color[0];
      colors[vertexOffset * 3 + 1] = color[1];
      colors[vertexOffset * 3 + 2] = color[2];
      vertexOffset += 1;
    }
  }

  let indexOffset = 0;
  for (let zIndex = 0; zIndex < segments; zIndex += 1) {
    for (let xIndex = 0; xIndex < segments; xIndex += 1) {
      const topLeft = zIndex * verticesPerSide + xIndex;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + verticesPerSide;
      const bottomRight = bottomLeft + 1;
      indices[indexOffset] = topLeft;
      indices[indexOffset + 1] = bottomLeft;
      indices[indexOffset + 2] = topRight;
      indices[indexOffset + 3] = topRight;
      indices[indexOffset + 4] = bottomLeft;
      indices[indexOffset + 5] = bottomRight;
      indexOffset += 6;
    }
  }

  return { colors, indices, positions, vertexCount };
}

export function generateRiverRibbonData(samples = 96, widthMeters = 24): RiverRibbonData {
  const positions = new Float32Array((samples + 1) * 2 * 3);
  const indices = new Uint32Array(samples * 6);
  let vertexOffset = 0;

  for (let index = 0; index <= samples; index += 1) {
    const z = -TERRAIN_HALF_SIZE_METERS + (index / samples) * TERRAIN_WORLD_SIZE_METERS;
    const centerX = resolveRiverCenterX(z);
    for (const side of [-1, 1]) {
      const x = centerX + side * (widthMeters / 2);
      const sample = sampleTerrain(x, z);
      positions[vertexOffset * 3] = x;
      positions[vertexOffset * 3 + 1] = sample.height + 0.16;
      positions[vertexOffset * 3 + 2] = z;
      vertexOffset += 1;
    }
  }

  let indexOffset = 0;
  for (let index = 0; index < samples; index += 1) {
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = leftA + 2;
    const rightB = leftA + 3;
    indices[indexOffset] = leftA;
    indices[indexOffset + 1] = leftB;
    indices[indexOffset + 2] = rightA;
    indices[indexOffset + 3] = rightA;
    indices[indexOffset + 4] = leftB;
    indices[indexOffset + 5] = rightB;
    indexOffset += 6;
  }

  return { indices, positions };
}

export function generateEnvironmentProps(
  seed = TERRAIN_SEED,
  budget: EnvironmentDensityBudget = resolveEnvironmentDensityBudget("balanced")
): EnvironmentProp[] {
  const random = createSeededRandom(seed);
  const props: EnvironmentProp[] = [];

  for (let index = 0; index < budget.rockCount; index += 1) {
    const position = findGroundPropPosition(random, 28);
    props.push({
      id: `rock-${index}`,
      kind: "rock",
      position,
      rotationY: random() * Math.PI * 2,
      scale: [1.6 + random() * 3.4, 0.8 + random() * 1.4, 1.4 + random() * 3.1]
    });
  }

  for (let index = 0; index < budget.mistCount; index += 1) {
    const z = -360 + random() * 720;
    const x = resolveRiverCenterX(z) + (random() - 0.5) * 24;
    const sample = sampleTerrain(x, z);
    props.push({
      id: `mist-${index}`,
      kind: "mist",
      position: [x, sample.height + 1.6 + random() * 2.6, z],
      rotationY: random() * Math.PI * 2,
      scale: [8 + random() * 13, 1.2 + random() * 2.1, 4 + random() * 8]
    });
  }

  for (let index = 0; index < budget.cloudCount; index += 1) {
    props.push({
      id: `cloud-${index}`,
      kind: "cloud",
      position: [-330 + random() * 660, 86 + random() * 34, -330 + random() * 660],
      rotationY: random() * Math.PI * 2,
      scale: [20 + random() * 36, 4 + random() * 7, 10 + random() * 22]
    });
  }

  return props;
}

export function createRoutePoints(route: TerrainRoute): Vector3Tuple[] {
  return route.points.map(([x, , z]) => {
    const sample = sampleTerrain(x, z);
    return [x, sample.height + 0.14, z];
  });
}

function findGroundPropPosition(random: () => number, minRiverDistance: number): Vector3Tuple {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = -360 + random() * 720;
    const z = -360 + random() * 720;
    const sample = sampleTerrain(x, z);
    if (Math.hypot(x, z) > 86 && sample.riverDistance > minRiverDistance && sample.height < 42) {
      return [x, sample.height + 0.28, z];
    }
  }
  return [110, sampleTerrain(110, 140).height + 0.28, 140];
}

function resolveTerrainSurface(
  x: number,
  z: number,
  height: number,
  riverDistance: number,
  borderDistance: number
): TerrainSurface {
  if (riverDistance < 38) {
    return "wetland";
  }
  if (isNearRoute(x, z, 10)) {
    return "path";
  }
  if (borderDistance > 0.78 || height > 48) {
    return "mountain";
  }
  if (height > 16) {
    return "stone";
  }
  return "grass";
}

function isNearRoute(x: number, z: number, widthMeters: number): boolean {
  return WORLD_TERRAIN_ROUTES.some((route) => {
    for (let index = 0; index < route.points.length - 1; index += 1) {
      if (
        distanceToSegment2D(
          x,
          z,
          route.points[index]![0],
          route.points[index]![2],
          route.points[index + 1]![0],
          route.points[index + 1]![2]
        ) <= widthMeters
      ) {
        return true;
      }
    }
    return false;
  });
}

function distanceToSegment2D(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) {
    return Math.hypot(px - ax, pz - az);
  }
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / lengthSquared, 0, 1);
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function createSeededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}
