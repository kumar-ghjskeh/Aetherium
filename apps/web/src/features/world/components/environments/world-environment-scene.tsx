import type { PerformancePreset } from "@aetherium/shared-types";
import { Line, Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import React from "react";
import * as THREE from "three";

import type { AIObservatoryOverviewData } from "../../engine/ai-observatory-system";
import type { CentralPlazaOverviewData } from "../../engine/central-plaza-system";
import type { CodingArenaOverviewData } from "../../engine/coding-arena-system";
import type { HabitGardenOverviewData } from "../../engine/habit-garden-system";
import type { KnowledgeLibraryOverviewData } from "../../engine/knowledge-library-system";
import type { LearningAcademyOverviewData } from "../../engine/learning-academy-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import {
  createRoutePoints,
  generateEnvironmentProps,
  generateRiverRibbonData,
  generateTerrainMeshData,
  resolveEnvironmentDensityBudget,
  resolveRiverCenterX,
  sampleTerrain,
  TERRAIN_HALF_SIZE_METERS,
  TERRAIN_SEED,
  WORLD_TERRAIN_ROUTES,
  WORLD_THEME_COLORS
} from "../../engine/terrain-system";
import { CentralPlazaVerticalSlice } from "../locations/central-plaza";
import { AIObservatoryDistrict } from "../locations/ai-observatory";
import { HabitGardenDistrict } from "../locations/habit-garden";
import { KnowledgeLibraryDistrict } from "../locations/knowledge-library";
import { LearningAcademyDistrict } from "../locations/learning-academy";
import { CodingArenaDistrict } from "../locations/coding-arena";

export function WorldEnvironmentScene({
  aiObservatoryOverview,
  codingArenaOverview,
  graphicsPreset,
  habitGardenOverview,
  learningAcademyOverview,
  libraryOverview,
  plazaOverview,
  reducedMotion
}: Readonly<{
  aiObservatoryOverview: AIObservatoryOverviewData;
  codingArenaOverview: CodingArenaOverviewData;
  graphicsPreset: PerformancePreset;
  habitGardenOverview: HabitGardenOverviewData;
  learningAcademyOverview: LearningAcademyOverviewData;
  libraryOverview: KnowledgeLibraryOverviewData;
  plazaOverview: CentralPlazaOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement {
  return (
    <>
      <Sky azimuth={0.2} distance={450000} inclination={0.5} turbidity={4.2} />
      <color args={["#07101f"]} attach="background" />
      <fog args={["#0a1622", 120, graphicsPreset === "low" ? 560 : 780]} attach="fog" />

      <hemisphereLight color="#dfefff" groundColor="#21322e" intensity={1.35} />
      <directionalLight
        castShadow={graphicsPreset === "high"}
        color="#fff8ea"
        intensity={2.45}
        position={[120, 210, 90]}
      />
      <ambientLight color="#617590" intensity={0.58} />

      <TerrainMesh />
      <TerrainCollision />
      <RiverRibbon reducedMotion={reducedMotion} />
      <WaterfallSheets reducedMotion={reducedMotion} />
      <TerrainRoutes />
      <DistrictFoundationMarkers />
      <EnvironmentProps graphicsPreset={graphicsPreset} reducedMotion={reducedMotion} />
      <CentralPlazaVerticalSlice overview={plazaOverview} reducedMotion={reducedMotion} />
      <KnowledgeLibraryDistrict overview={libraryOverview} reducedMotion={reducedMotion} />
      <AIObservatoryDistrict overview={aiObservatoryOverview} reducedMotion={reducedMotion} />
      <HabitGardenDistrict overview={habitGardenOverview} reducedMotion={reducedMotion} />
      <LearningAcademyDistrict overview={learningAcademyOverview} reducedMotion={reducedMotion} />
      <CodingArenaDistrict overview={codingArenaOverview} reducedMotion={reducedMotion} />
    </>
  );
}

function TerrainMesh(): React.ReactElement {
  const geometry = React.useMemo(() => {
    const data = generateTerrainMeshData();
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    bufferGeometry.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    bufferGeometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    bufferGeometry.computeVertexNormals();
    return bufferGeometry;
  }, []);

  React.useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial metalness={0.04} roughness={0.92} vertexColors />
    </mesh>
  );
}

function TerrainCollision(): React.ReactElement {
  return (
    <RigidBody colliders={false} type="fixed">
      <CuboidCollider
        args={[TERRAIN_HALF_SIZE_METERS, 0.16, TERRAIN_HALF_SIZE_METERS]}
        position={[0, -0.18, 0]}
      />
    </RigidBody>
  );
}

function RiverRibbon({
  reducedMotion
}: Readonly<{
  reducedMotion: boolean;
}>): React.ReactElement {
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const geometry = React.useMemo(() => {
    const data = generateRiverRibbonData();
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    bufferGeometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    bufferGeometry.computeVertexNormals();
    return bufferGeometry;
  }, []);

  React.useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material || reducedMotion) {
      return;
    }
    material.opacity = 0.52 + Math.sin(clock.elapsedTime * 0.7) * 0.04;
  });

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshStandardMaterial
        color="#4bbcd2"
        depthWrite={false}
        emissive="#092f3a"
        emissiveIntensity={0.18}
        metalness={0.1}
        opacity={0.54}
        ref={materialRef}
        roughness={0.28}
        transparent
      />
    </mesh>
  );
}

function WaterfallSheets({
  reducedMotion
}: Readonly<{
  reducedMotion: boolean;
}>): React.ReactElement {
  const waterfalls = React.useMemo(
    () =>
      [
        { height: 24, id: "north-falls", width: 34, z: -356 },
        { height: 16, id: "garden-falls", width: 26, z: 178 },
        { height: 19, id: "south-falls", width: 30, z: 354 }
      ].map((fall) => {
        const x = resolveRiverCenterX(fall.z);
        const sample = sampleTerrain(x, fall.z);
        return {
          ...fall,
          position: [x, sample.height + fall.height * 0.45, fall.z] as const
        };
      }),
    []
  );

  return (
    <>
      {waterfalls.map((fall) => (
        <group key={fall.id} position={fall.position}>
          <mesh rotation={[0, 0.04, 0]}>
            <planeGeometry args={[fall.width, fall.height, 1, 8]} />
            <meshStandardMaterial
              color="#bfefff"
              depthWrite={false}
              emissive="#2f9fb5"
              emissiveIntensity={reducedMotion ? 0.15 : 0.28}
              opacity={0.42}
              roughness={0.2}
              transparent
            />
          </mesh>
          <mesh position={[0, -fall.height * 0.47, 0]}>
            <cylinderGeometry args={[fall.width * 0.3, fall.width * 0.46, 0.16, 28]} />
            <meshStandardMaterial color="#d8f8ff" depthWrite={false} opacity={0.22} transparent />
          </mesh>
        </group>
      ))}
    </>
  );
}

function TerrainRoutes(): React.ReactElement {
  return (
    <>
      {WORLD_TERRAIN_ROUTES.map((route) => (
        <Line
          color={WORLD_THEME_COLORS.get(route.theme) ?? "#d8ded6"}
          depthWrite={false}
          key={route.id}
          lineWidth={3.5}
          opacity={0.42}
          points={createRoutePoints(route)}
          transparent
        />
      ))}
    </>
  );
}

function DistrictFoundationMarkers(): React.ReactElement {
  return (
    <>
      {WORLD_LOCATIONS_MANIFEST.filter(
        (location) =>
          location.id !== "central-plaza" &&
          location.id !== "knowledge-library" &&
          location.id !== "ai-observatory" &&
          location.id !== "habit-garden" &&
          location.id !== "learning-academy" &&
          location.id !== "coding-arena"
      ).map((location) => {
        const [x, , z] = location.position;
        const terrain = sampleTerrain(x, z);
        const color = WORLD_THEME_COLORS.get(location.theme) ?? "#ffffff";
        return (
          <group key={location.id} position={[x, terrain.height + 0.18, z]}>
            <mesh receiveShadow>
              <cylinderGeometry args={[10, 11, 0.36, 32]} />
              <meshStandardMaterial color="#263340" metalness={0.16} roughness={0.78} />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[0.8, 1.25, 4.2, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.18}
                metalness={0.2}
                roughness={0.42}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function EnvironmentProps({
  graphicsPreset,
  reducedMotion
}: Readonly<{
  graphicsPreset: PerformancePreset;
  reducedMotion: boolean;
}>): React.ReactElement {
  const props = React.useMemo(
    () =>
      generateEnvironmentProps(
        TERRAIN_SEED,
        resolveEnvironmentDensityBudget(reducedMotion ? "low" : graphicsPreset)
      ),
    [graphicsPreset, reducedMotion]
  );

  return (
    <>
      {props.map((prop) => {
        if (prop.kind === "cloud") {
          return (
            <mesh
              key={prop.id}
              position={prop.position}
              rotation={[0, prop.rotationY, 0]}
              scale={prop.scale}
            >
              <sphereGeometry args={[1, 16, 8]} />
              <meshStandardMaterial
                color="#d8e5ef"
                depthWrite={false}
                opacity={0.2}
                roughness={1}
                transparent
              />
            </mesh>
          );
        }
        if (prop.kind === "mist") {
          return (
            <mesh
              key={prop.id}
              position={prop.position}
              rotation={[0, prop.rotationY, 0]}
              scale={prop.scale}
            >
              <sphereGeometry args={[1, 12, 6]} />
              <meshStandardMaterial
                color="#ccecf6"
                depthWrite={false}
                emissive="#184b58"
                emissiveIntensity={0.08}
                opacity={0.16}
                transparent
              />
            </mesh>
          );
        }
        return (
          <mesh
            castShadow
            key={prop.id}
            position={prop.position}
            rotation={[0, prop.rotationY, 0]}
            scale={prop.scale}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#59666a" metalness={0.06} roughness={0.82} />
          </mesh>
        );
      })}
    </>
  );
}
