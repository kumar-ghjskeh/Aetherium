import type { PerformancePreset } from "@aetherium/shared-types";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import React from "react";
import * as THREE from "three";

import type { AIObservatoryOverviewData } from "../../engine/ai-observatory-system";
import type { AchievementHallOverviewData } from "../../engine/achievement-hall-system";
import type { CentralPlazaOverviewData } from "../../engine/central-plaza-system";
import type { CodingArenaOverviewData } from "../../engine/coding-arena-system";
import type { HabitGardenOverviewData } from "../../engine/habit-garden-system";
import type { KnowledgeLibraryOverviewData } from "../../engine/knowledge-library-system";
import type { LearningAcademyOverviewData } from "../../engine/learning-academy-system";
import type { ProjectDockOverviewData } from "../../engine/project-dock-system";
import type { ProgressTowerOverviewData } from "../../engine/progress-tower-system";
import type { PersonalSanctuaryOverviewData } from "../../engine/personal-sanctuary-system";
import type { WorldTimeMode } from "../../engine/time-manager";
import type { WorldWeatherMode } from "../../engine/weather-manager";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import {
  createRoutePoints,
  generateEnvironmentProps,
  generateRiverRibbonData,
  generateTerrainMeshData,
  resolveEnvironmentDensityBudget,
  resolveRiverCenterX,
  sampleTerrain,
  TERRAIN_SEED,
  WORLD_TERRAIN_ROUTES,
  WORLD_THEME_COLORS
} from "../../engine/terrain-system";
import { CentralPlazaVerticalSlice } from "../locations/central-plaza";
import { AIObservatoryDistrict } from "../locations/ai-observatory";
import { HabitGardenDistrict } from "../locations/habit-garden";
import { KnowledgeLibraryDistrict } from "../locations/knowledge-library";
import { LearningAcademyDistrict } from "../locations/learning-academy";
import { ProjectDockDistrict } from "../locations/project-dock";
import { ProgressTowerDistrict } from "../locations/progress-tower";
import { CodingArenaDistrict } from "../locations/coding-arena";
import { AchievementHallDistrict } from "../locations/achievement-hall";
import { PersonalSanctuaryDistrict } from "../locations/personal-sanctuary";
import { DynamicWorldAtmosphere } from "../effects/dynamic-world-atmosphere";
import { useWorldNavigationStore } from "../../state/navigation-store";

export function WorldEnvironmentScene({
  achievementHallOverview,
  aiObservatoryOverview,
  codingArenaOverview,
  graphicsPreset,
  habitGardenOverview,
  learningAcademyOverview,
  libraryOverview,
  particlesEnabled,
  personalSanctuaryOverview,
  plazaOverview,
  projectDockOverview,
  progressTowerOverview,
  reducedMotion,
  timeMode,
  weatherEnabled,
  weatherMode
}: Readonly<{
  achievementHallOverview: AchievementHallOverviewData;
  aiObservatoryOverview: AIObservatoryOverviewData;
  codingArenaOverview: CodingArenaOverviewData;
  graphicsPreset: PerformancePreset;
  habitGardenOverview: HabitGardenOverviewData;
  learningAcademyOverview: LearningAcademyOverviewData;
  libraryOverview: KnowledgeLibraryOverviewData;
  particlesEnabled: boolean;
  personalSanctuaryOverview: PersonalSanctuaryOverviewData;
  plazaOverview: CentralPlazaOverviewData;
  projectDockOverview: ProjectDockOverviewData;
  progressTowerOverview: ProgressTowerOverviewData;
  reducedMotion: boolean;
  timeMode: WorldTimeMode;
  weatherEnabled: boolean;
  weatherMode: WorldWeatherMode;
}>): React.ReactElement {
  const activeDistrictId = useWorldNavigationStore(
    (state) => state.destinationId ?? "central-plaza"
  );

  return (
    <>
      <DynamicWorldAtmosphere
        graphicsPreset={graphicsPreset}
        particlesEnabled={particlesEnabled}
        reducedMotion={reducedMotion}
        timeMode={timeMode}
        weatherEnabled={weatherEnabled}
        weatherMode={weatherMode}
      />

      <TerrainMesh />
      <RiverRibbon reducedMotion={reducedMotion} />
      <WaterfallSheets reducedMotion={reducedMotion} />
      <TerrainRoutes />
      <DistrictApproachDressing districtId={activeDistrictId} reducedMotion={reducedMotion} />
      <DistrictFoundationMarkers />
      <EnvironmentProps graphicsPreset={graphicsPreset} reducedMotion={reducedMotion} />
      {activeDistrictId === "central-plaza" ? (
        <CentralPlazaVerticalSlice overview={plazaOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "knowledge-library" ? (
        <KnowledgeLibraryDistrict overview={libraryOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "ai-observatory" ? (
        <AIObservatoryDistrict overview={aiObservatoryOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "habit-garden" ? (
        <HabitGardenDistrict overview={habitGardenOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "learning-academy" ? (
        <LearningAcademyDistrict overview={learningAcademyOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "coding-arena" ? (
        <CodingArenaDistrict overview={codingArenaOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "project-dock" ? (
        <ProjectDockDistrict overview={projectDockOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "progress-tower" ? (
        <ProgressTowerDistrict overview={progressTowerOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "achievement-hall" ? (
        <AchievementHallDistrict overview={achievementHallOverview} reducedMotion={reducedMotion} />
      ) : null}
      {activeDistrictId === "personal-sanctuary" ? (
        <PersonalSanctuaryDistrict
          overview={personalSanctuaryOverview}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </>
  );
}

function createTerrainGeometry(): THREE.BufferGeometry {
  const data = generateTerrainMeshData();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function TerrainMesh(): React.ReactElement {
  const geometry = React.useMemo(createTerrainGeometry, []);

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

export function WorldTerrainCollision(): React.ReactElement {
  const geometry = React.useMemo(createTerrainGeometry, []);

  React.useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  return (
    <RigidBody colliders="trimesh" type="fixed">
      <mesh geometry={geometry} visible={false} />
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
          location.id !== "coding-arena" &&
          location.id !== "project-dock" &&
          location.id !== "progress-tower" &&
          location.id !== "achievement-hall" &&
          location.id !== "personal-sanctuary"
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

function DistrictApproachDressing({
  districtId,
  reducedMotion
}: Readonly<{
  districtId: string;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const crystalRef = React.useRef<THREE.InstancedMesh>(null);
  const postRef = React.useRef<THREE.InstancedMesh>(null);
  const location = WORLD_LOCATIONS_MANIFEST.find((candidate) => candidate.id === districtId);

  React.useLayoutEffect(() => {
    if (!location || !crystalRef.current || !postRef.current) {
      return;
    }
    const post = postRef.current;
    const crystal = crystalRef.current;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const radius = location.worldRadius * 0.63;
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      position.set(Math.cos(angle) * radius, 1.4, Math.sin(angle) * radius);
      quaternion.setFromEuler(new THREE.Euler(0, -angle, 0));
      scale.set(0.34, 2.8, 0.34);
      matrix.compose(position, quaternion, scale);
      post.setMatrixAt(index, matrix);

      position.set(Math.cos(angle) * radius, 3.25, Math.sin(angle) * radius);
      scale.set(0.62, 0.95, 0.62);
      matrix.compose(position, quaternion, scale);
      crystal.setMatrixAt(index, matrix);
    }
    post.instanceMatrix.needsUpdate = true;
    crystal.instanceMatrix.needsUpdate = true;
  }, [location]);

  useFrame(({ clock }) => {
    if (!reducedMotion && crystalRef.current) {
      crystalRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.018;
    }
  });

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);
  const accent = WORLD_THEME_COLORS.get(location.theme) ?? "#8be8ff";
  const ringRadius = location.worldRadius * 0.63;

  return (
    <group position={[x, terrain.height + 0.2, z]} rotation={location.rotation}>
      <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius, 0.38, 8, 96]} />
        <meshStandardMaterial
          color="#819097"
          emissive={accent}
          emissiveIntensity={0.08}
          metalness={0.32}
          roughness={0.52}
        />
      </mesh>
      <instancedMesh args={[undefined, undefined, 12]} castShadow ref={postRef}>
        <cylinderGeometry args={[1, 1.3, 1, 6]} />
        <meshStandardMaterial color="#293942" metalness={0.42} roughness={0.46} />
      </instancedMesh>
      <instancedMesh args={[undefined, undefined, 12]} ref={crystalRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.65}
          metalness={0.18}
          roughness={0.22}
        />
      </instancedMesh>
    </group>
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

  const rocks = React.useMemo(() => props.filter((prop) => prop.kind === "rock"), [props]);
  const trees = React.useMemo(() => props.filter((prop) => prop.kind === "tree"), [props]);
  const groundCover = React.useMemo(
    () => props.filter((prop) => prop.kind === "ground_cover"),
    [props]
  );

  return (
    <>
      <InstancedRocks props={rocks} />
      <InstancedTrees props={trees} reducedMotion={reducedMotion} />
      <InstancedGroundCover props={groundCover} />
    </>
  );
}

function InstancedRocks({
  props
}: Readonly<{ props: ReturnType<typeof generateEnvironmentProps> }>): React.ReactElement {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);

  React.useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    for (const [index, prop] of props.entries()) {
      position.set(...prop.position);
      quaternion.setFromEuler(new THREE.Euler(0, prop.rotationY, 0));
      scale.set(...prop.scale);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [props]);

  return (
    <instancedMesh args={[undefined, undefined, props.length]} castShadow ref={meshRef}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3e4b50" metalness={0.08} roughness={0.86} />
    </instancedMesh>
  );
}

function InstancedTrees({
  props,
  reducedMotion
}: Readonly<{
  props: ReturnType<typeof generateEnvironmentProps>;
  reducedMotion: boolean;
}>): React.ReactElement {
  const groupRef = React.useRef<THREE.Group>(null);
  const trunkRef = React.useRef<THREE.InstancedMesh>(null);
  const canopyRef = React.useRef<THREE.InstancedMesh>(null);

  React.useLayoutEffect(() => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    if (!trunk || !canopy) {
      return;
    }
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    for (const [index, prop] of props.entries()) {
      quaternion.setFromEuler(new THREE.Euler(0, prop.rotationY, 0));
      const height = prop.scale[1];
      position.set(prop.position[0], prop.position[1] + height * 0.32, prop.position[2]);
      scale.set(prop.scale[0] * 0.3, height * 0.64, prop.scale[2] * 0.3);
      matrix.compose(position, quaternion, scale);
      trunk.setMatrixAt(index, matrix);

      position.set(prop.position[0], prop.position[1] + height * 0.82, prop.position[2]);
      scale.set(prop.scale[0] * 2.35, height * 0.44, prop.scale[2] * 2.35);
      matrix.compose(position, quaternion, scale);
      canopy.setMatrixAt(index, matrix);
      const cherryZone = prop.position[0] > 130 && prop.position[2] > 90;
      canopy.setColorAt(index, new THREE.Color(cherryZone ? "#b87192" : "#315f48"));
    }
    trunk.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
    if (canopy.instanceColor) {
      canopy.instanceColor.needsUpdate = true;
    }
  }, [props]);

  useFrame(({ clock }) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.24) * 0.0025;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh args={[undefined, undefined, props.length]} castShadow ref={trunkRef}>
        <cylinderGeometry args={[1, 1.28, 1, 6]} />
        <meshStandardMaterial color="#493b31" roughness={0.88} />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, props.length]}
        castShadow
        receiveShadow
        ref={canopyRef}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial metalness={0.02} roughness={0.86} />
      </instancedMesh>
    </group>
  );
}

function InstancedGroundCover({
  props
}: Readonly<{ props: ReturnType<typeof generateEnvironmentProps> }>): React.ReactElement {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);

  React.useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    for (const [index, prop] of props.entries()) {
      position.set(prop.position[0], prop.position[1] + prop.scale[1] * 0.5, prop.position[2]);
      quaternion.setFromEuler(new THREE.Euler(0, prop.rotationY, 0));
      scale.set(...prop.scale);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [props]);

  return (
    <instancedMesh args={[undefined, undefined, props.length]} receiveShadow ref={meshRef}>
      <coneGeometry args={[0.7, 1, 5]} />
      <meshStandardMaterial color="#456f4f" roughness={0.9} />
    </instancedMesh>
  );
}
