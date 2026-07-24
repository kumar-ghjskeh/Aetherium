import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildHabitGardenViewModel,
  type HabitGardenOverviewData,
  type HabitPlantHealth,
  type HabitPlantStage,
  type HabitPlantViewModel
} from "../../engine/habit-garden-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const GARDEN_LOCATION = WORLD_LOCATIONS_MANIFEST.find((location) => location.id === "habit-garden");

const STAGE_COLORS: Record<HabitPlantStage, string> = {
  bloom: "#bfc66a",
  dormant: "#7c8f92",
  grove: "#77d98b",
  seedling: "#8fd1c7",
  sprout: "#a8c879"
};

const HEALTH_EMISSIVE: Record<HabitPlantHealth, number> = {
  steady: 0.14,
  thriving: 0.34,
  warming: 0.08
};

export function HabitGardenDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: HabitGardenOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildHabitGardenViewModel(overview), [overview]);
  const location = GARDEN_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.42, z]} rotation={location.rotation}>
      <GardenTerraces
        growthPoints={overview.summary.gardenGrowthPoints}
        reducedMotion={reducedMotion}
      />
      <HabitPlantBeds plants={viewModel.plants} reducedMotion={reducedMotion} />
      <PermanentGardenFeatures count={viewModel.permanentFeatureCount} />
      <Text
        anchorX="center"
        anchorY="middle"
        color="#efffee"
        fontSize={1.55}
        maxWidth={29}
        position={[0, 9.4, -20]}
        textAlign="center"
      >
        Habit Garden
      </Text>
    </group>
  );
}

function GardenTerraces({
  growthPoints,
  reducedMotion
}: Readonly<{
  growthPoints: number;
  reducedMotion: boolean;
}>): React.ReactElement {
  const waterRef = React.useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!waterRef.current || reducedMotion) {
      return;
    }
    waterRef.current.opacity = 0.48 + Math.sin(clock.elapsedTime * 0.55) * 0.04;
  });

  const canopyIntensity = Math.min(1.9, 0.7 + growthPoints * 0.015);

  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[37, 43, 1.1, 96]} />
        <meshStandardMaterial color="#223827" metalness={0.08} roughness={0.76} />
      </mesh>
      <mesh receiveShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[26, 31, 0.72, 96]} />
        <meshStandardMaterial color="#314730" metalness={0.06} roughness={0.74} />
      </mesh>
      <mesh receiveShadow position={[0, 0.84, -2]}>
        <cylinderGeometry args={[14, 18, 0.58, 80]} />
        <meshStandardMaterial color="#405739" metalness={0.06} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.2, -2]}>
        <cylinderGeometry args={[6.2, 8.8, 0.18, 64]} />
        <meshStandardMaterial
          color="#82e6f0"
          depthWrite={false}
          emissive="#1b6f74"
          emissiveIntensity={0.22}
          metalness={0.12}
          opacity={0.5}
          ref={waterRef}
          roughness={0.22}
          transparent
        />
      </mesh>
      <GardenWaterChannels />
      <mesh position={[0, 6.4, -2]}>
        <sphereGeometry args={[6.6, 32, 16]} />
        <meshStandardMaterial
          color="#77d98b"
          depthWrite={false}
          emissive="#2c7042"
          emissiveIntensity={0.16}
          opacity={0.12 + canopyIntensity * 0.03}
          transparent
        />
      </mesh>
      <pointLight color="#9be58e" distance={95} intensity={canopyIntensity} position={[0, 9, -2]} />
    </group>
  );
}

function GardenWaterChannels(): React.ReactElement {
  return (
    <group position={[0, 1.12, -2]}>
      {[
        { id: "east-west", rotation: [0, 0, 0] as const, scale: [48, 0.1, 1.5] as const },
        {
          id: "north-south",
          rotation: [0, Math.PI / 2, 0] as const,
          scale: [38, 0.1, 1.2] as const
        }
      ].map((channel) => (
        <mesh key={channel.id} rotation={channel.rotation} scale={channel.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#6ed9d6"
            depthWrite={false}
            emissive="#1b6f74"
            emissiveIntensity={0.18}
            opacity={0.34}
            roughness={0.24}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function HabitPlantBeds({
  plants,
  reducedMotion
}: Readonly<{
  plants: HabitPlantViewModel[];
  reducedMotion: boolean;
}>): React.ReactElement {
  if (plants.length === 0) {
    return (
      <Text
        anchorX="center"
        anchorY="middle"
        color="#dceede"
        fontSize={0.55}
        maxWidth={16}
        position={[0, 2.2, 8]}
        textAlign="center"
      >
        Create habits to plant the first garden beds
      </Text>
    );
  }

  return (
    <group>
      {plants.map((plant, index) => (
        <HabitPlant key={plant.id} plant={plant} reducedMotion={reducedMotion} seed={index} />
      ))}
    </group>
  );
}

function HabitPlant({
  plant,
  reducedMotion,
  seed
}: Readonly<{
  plant: HabitPlantViewModel;
  reducedMotion: boolean;
  seed: number;
}>): React.ReactElement {
  const groupRef = React.useRef<THREE.Group>(null);
  const stageColor = STAGE_COLORS[plant.stage];
  const emissiveIntensity = HEALTH_EMISSIVE[plant.health];

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) {
      return;
    }
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + seed) * 0.025;
  });

  return (
    <group ref={groupRef} position={plant.position} scale={plant.scale}>
      <mesh receiveShadow>
        <cylinderGeometry args={[2.25, 2.65, 0.28, 32]} />
        <meshStandardMaterial color="#263823" metalness={0.04} roughness={0.82} />
      </mesh>
      <PlantGeometry
        color={plant.color}
        emissiveIntensity={emissiveIntensity}
        stage={plant.stage}
      />
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.9, 0.045, 8, 72]} />
        <meshStandardMaterial color={stageColor} emissive={stageColor} emissiveIntensity={0.2} />
      </mesh>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#efffee"
        fontSize={0.28}
        maxWidth={4.8}
        position={[0, -0.82, 0]}
        textAlign="center"
      >
        {plant.label}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#c9dec9"
        fontSize={0.19}
        maxWidth={4.6}
        position={[0, -1.16, 0]}
        textAlign="center"
      >
        {plant.streakLabel}
      </Text>
    </group>
  );
}

function PlantGeometry({
  color,
  emissiveIntensity,
  stage
}: Readonly<{
  color: string;
  emissiveIntensity: number;
  stage: HabitPlantStage;
}>): React.ReactElement {
  if (stage === "dormant") {
    return (
      <group position={[0, 0.52, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.34, 1.2, 12]} />
          <meshStandardMaterial
            color="#7c8f92"
            emissive="#425345"
            emissiveIntensity={0.08}
            roughness={0.72}
          />
        </mesh>
        <mesh position={[0, 0.76, 0]}>
          <sphereGeometry args={[0.42, 16, 8]} />
          <meshStandardMaterial color="#8aa091" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (stage === "sprout" || stage === "seedling") {
    return (
      <group position={[0, 0.78, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.28, 1.45, 12]} />
          <meshStandardMaterial color="#6ca75d" roughness={0.7} />
        </mesh>
        {[-0.46, 0.46].map((x) => (
          <mesh key={x} position={[x, 0.38, 0]} rotation={[0, 0, x > 0 ? -0.65 : 0.65]}>
            <sphereGeometry args={[0.48, 16, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[0, 1.05, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.34, stage === "grove" ? 2.6 : 1.9, 14]} />
        <meshStandardMaterial color="#547b4a" roughness={0.68} />
      </mesh>
      {Array.from({ length: stage === "grove" ? 5 : 3 }, (_, index) => {
        const angle = (index / (stage === "grove" ? 5 : 3)) * Math.PI * 2;
        const radius = stage === "grove" ? 0.84 : 0.55;
        return (
          <mesh
            castShadow
            key={index}
            position={[
              Math.sin(angle) * radius,
              stage === "grove" ? 1.72 + (index % 2) * 0.24 : 1.2,
              Math.cos(angle) * radius
            ]}
          >
            <sphereGeometry args={[stage === "grove" ? 0.82 : 0.64, 20, 10]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              roughness={0.56}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function PermanentGardenFeatures({
  count
}: Readonly<{
  count: number;
}>): React.ReactElement {
  const featureCount = Math.min(count, 5);

  return (
    <group position={[0, 1.1, 20]}>
      {Array.from({ length: featureCount }, (_, index) => {
        const x = (index - (featureCount - 1) / 2) * 4.8;
        return (
          <group key={index} position={[x, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.74, 1.1, 0.5, 18]} />
              <meshStandardMaterial color="#35412c" metalness={0.12} roughness={0.62} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <octahedronGeometry args={[0.92, 0]} />
              <meshStandardMaterial
                color="#f0c766"
                emissive="#7b5b12"
                emissiveIntensity={0.36}
                metalness={0.24}
                roughness={0.28}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
