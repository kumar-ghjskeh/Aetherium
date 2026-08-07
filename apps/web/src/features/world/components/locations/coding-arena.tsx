import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildCodingArenaViewModel,
  type CodingArenaOverviewData,
  type ExercisePylonViewModel,
  type SnippetConsoleViewModel
} from "../../engine/coding-arena-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const ARENA_LOCATION = WORLD_LOCATIONS_MANIFEST.find((location) => location.id === "coding-arena");

export function CodingArenaDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: CodingArenaOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildCodingArenaViewModel(overview), [overview]);
  const location = ARENA_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.52, z]} rotation={location.rotation}>
      <ArenaArchitecture
        reducedMotion={reducedMotion}
        runnerAvailable={viewModel.runnerAvailable}
        runnerStatusLabel={viewModel.runnerStatusLabel}
      />
      <SnippetConsoles consoles={viewModel.snippetConsoles} />
      <ExercisePylons pylons={viewModel.exercisePylons} reducedMotion={reducedMotion} />
      {viewModel.snippetConsoles.length === 0 && viewModel.exercisePylons.length === 0 ? (
        <Text
          anchorX="center"
          anchorY="middle"
          color="#d9f9ff"
          fontSize={0.58}
          maxWidth={18}
          position={[0, 2.4, 17]}
          textAlign="center"
        >
          Save a snippet or create an exercise to activate the arena floor
        </Text>
      ) : null}
      <Text
        anchorX="center"
        anchorY="middle"
        color="#eafcff"
        fontSize={1.7}
        maxWidth={26}
        position={[0, 14.2, -13]}
        textAlign="center"
      >
        Coding Arena
      </Text>
    </group>
  );
}

function ArenaArchitecture({
  reducedMotion,
  runnerAvailable,
  runnerStatusLabel
}: Readonly<{
  reducedMotion: boolean;
  runnerAvailable: boolean;
  runnerStatusLabel: string;
}>): React.ReactElement {
  const outerRingRef = React.useRef<THREE.Group>(null);
  const innerRingRef = React.useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (reducedMotion) {
      return;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y += delta * 0.1;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.16;
    }
  });

  const runnerColor = runnerAvailable ? "#79d7a6" : "#f0c766";

  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[40, 44, 1.1, 96]} />
        <meshStandardMaterial color="#142833" metalness={0.38} roughness={0.48} />
      </mesh>
      <mesh receiveShadow position={[0, 0.62, 2]}>
        <cylinderGeometry args={[32, 36, 0.36, 96]} />
        <meshStandardMaterial color="#243e49" metalness={0.34} roughness={0.44} />
      </mesh>
      <mesh position={[0, 0.84, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[28, 0.22, 10, 128]} />
        <meshStandardMaterial
          color="#55d9f2"
          emissive="#14768a"
          emissiveIntensity={0.42}
          metalness={0.34}
          roughness={0.28}
        />
      </mesh>
      <ArenaStands />
      <group position={[0, 7.2, -6]}>
        <mesh castShadow>
          <cylinderGeometry args={[3.8, 5.4, 13, 12]} />
          <meshStandardMaterial color="#172c38" metalness={0.46} roughness={0.36} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <octahedronGeometry args={[2.55, 0]} />
          <meshStandardMaterial
            color="#b7f7ff"
            emissive="#28b9d2"
            emissiveIntensity={0.62}
            metalness={0.26}
            roughness={0.2}
          />
        </mesh>
        <group ref={outerRingRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[8.8, 0.18, 10, 96]} />
            <meshStandardMaterial color="#55d9f2" emissive="#14768a" emissiveIntensity={0.42} />
          </mesh>
          <mesh rotation={[Math.PI / 3, 0, Math.PI / 2]}>
            <torusGeometry args={[6.6, 0.12, 8, 80]} />
            <meshStandardMaterial color="#8be8ff" emissive="#1d7186" emissiveIntensity={0.3} />
          </mesh>
        </group>
        <mesh ref={innerRingRef} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[4.6, 0.1, 8, 72]} />
          <meshStandardMaterial color="#d8f7ff" emissive="#2c8194" emissiveIntensity={0.28} />
        </mesh>
      </group>
      <group position={[0, 3.2, 29]}>
        <mesh castShadow>
          <boxGeometry args={[18, 6, 4.8]} />
          <meshStandardMaterial color="#182a33" metalness={0.42} roughness={0.42} />
        </mesh>
        <mesh position={[0, 0, -2.48]}>
          <boxGeometry args={[13.6, 3.2, 0.14]} />
          <meshStandardMaterial
            color={runnerColor}
            emissive={runnerColor}
            emissiveIntensity={runnerAvailable ? 0.42 : 0.24}
            metalness={0.18}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 0, -2.62]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[1.1, 0.2, 8, 4]} />
          <meshStandardMaterial color="#07171e" metalness={0.62} roughness={0.3} />
        </mesh>
        <Text
          anchorX="center"
          anchorY="middle"
          color="#eafcff"
          fontSize={0.32}
          maxWidth={12}
          position={[0, -2.08, -2.62]}
          textAlign="center"
        >
          {runnerStatusLabel}
        </Text>
      </group>
      <pointLight color="#55d9f2" distance={96} intensity={1.7} position={[0, 10, -5]} />
    </group>
  );
}

function ArenaStands(): React.ReactElement {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 31, 4.8, 2]} rotation={[0, 0, side * -0.08]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[8.5, 8.2, 43]} />
            <meshStandardMaterial color="#203943" metalness={0.3} roughness={0.5} />
          </mesh>
          {[0, 1, 2].map((tier) => (
            <mesh key={tier} position={[side * -4.4, -2.4 + tier * 2.3, 0]}>
              <boxGeometry args={[1.3, 0.38, 37 - tier * 5]} />
              <meshStandardMaterial
                color={tier === 1 ? "#55d9f2" : "#6e8f9c"}
                emissive={tier === 1 ? "#126779" : "#182b33"}
                emissiveIntensity={tier === 1 ? 0.24 : 0.04}
                metalness={0.36}
                roughness={0.42}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function SnippetConsoles({
  consoles
}: Readonly<{
  consoles: SnippetConsoleViewModel[];
}>): React.ReactElement {
  return (
    <group>
      {consoles.map((console) => (
        <group key={console.id} position={console.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6.8, 2.8, 4.8]} />
            <meshStandardMaterial color="#11242d" metalness={0.44} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.66, -0.6]} rotation={[-0.36, 0, 0]}>
            <boxGeometry args={[5.4, 0.16, 2.2]} />
            <meshStandardMaterial
              color={console.accent}
              emissive={console.accent}
              emissiveIntensity={0.34}
              metalness={0.22}
              roughness={0.24}
            />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#effcff"
            fontSize={0.25}
            maxWidth={5.6}
            position={[0, 0.18, -2.46]}
            textAlign="center"
          >
            {console.title}
          </Text>
          <Text
            anchorX="center"
            anchorY="middle"
            color={console.accent}
            fontSize={0.18}
            maxWidth={5.4}
            position={[0, -0.2, -2.48]}
            textAlign="center"
          >
            {console.languageLabel}
          </Text>
        </group>
      ))}
    </group>
  );
}

function ExercisePylons({
  pylons,
  reducedMotion
}: Readonly<{
  pylons: ExercisePylonViewModel[];
  reducedMotion: boolean;
}>): React.ReactElement {
  return (
    <group>
      {pylons.map((pylon, index) => (
        <ExercisePylon key={pylon.id} pylon={pylon} reducedMotion={reducedMotion} seed={index} />
      ))}
    </group>
  );
}

function ExercisePylon({
  pylon,
  reducedMotion,
  seed
}: Readonly<{
  pylon: ExercisePylonViewModel;
  reducedMotion: boolean;
  seed: number;
}>): React.ReactElement {
  const ringRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || reducedMotion) {
      return;
    }
    ringRef.current.rotation.y = clock.elapsedTime * 0.3 + seed * 0.34;
  });

  return (
    <group position={pylon.position}>
      <mesh receiveShadow>
        <cylinderGeometry args={[2.15, 2.6, 0.5, 24]} />
        <meshStandardMaterial color="#1d333d" metalness={0.38} roughness={0.44} />
      </mesh>
      <mesh castShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.62, 0.9, 3.2, 8]} />
        <meshStandardMaterial
          color={pylon.accent}
          emissive={pylon.accent}
          emissiveIntensity={0.34}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 3.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.22, 0.08, 8, 44]} />
        <meshStandardMaterial
          color={pylon.accent}
          emissive={pylon.accent}
          emissiveIntensity={0.34}
        />
      </mesh>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#eafcff"
        fontSize={0.2}
        maxWidth={4.4}
        position={[0, -0.62, 0]}
        textAlign="center"
      >
        {pylon.title}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color={pylon.accent}
        fontSize={0.15}
        maxWidth={4.2}
        position={[0, -0.92, 0]}
        textAlign="center"
      >
        {pylon.difficulty} - {pylon.languageLabel}
      </Text>
    </group>
  );
}
