import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildCentralPlazaViewModel,
  type CentralPlazaOverviewData,
  type CentralPlazaTerminalViewModel
} from "../../engine/central-plaza-system";
import { sampleTerrain } from "../../engine/terrain-system";

const PLAZA_ARCH_LAYOUT: readonly [number, number, number][] = [
  [0, -25.5, 0],
  [25.5, 0, Math.PI / 2],
  [0, 25.5, Math.PI],
  [-25.5, 0, -Math.PI / 2]
];

export function CentralPlazaVerticalSlice({
  overview,
  reducedMotion
}: Readonly<{
  overview: CentralPlazaOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement {
  const viewModel = React.useMemo(() => buildCentralPlazaViewModel(overview), [overview]);
  const terrain = React.useMemo(() => sampleTerrain(0, 0), []);

  return (
    <group position={[0, terrain.height + 0.38, 0]}>
      <CentralPlazaBase />
      <CentralCrystal reducedMotion={reducedMotion} />
      <PlazaWaterChannels reducedMotion={reducedMotion} />
      <PlazaArches />
      {viewModel.terminals.map((terminal) => (
        <CentralPlazaTerminal key={terminal.id} terminal={terminal} />
      ))}
    </group>
  );
}

function CentralPlazaBase(): React.ReactElement {
  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[27, 31, 0.8, 96]} />
        <meshStandardMaterial color="#1d2b35" metalness={0.22} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[21.5, 22.8, 0.34, 96]} />
        <meshStandardMaterial color="#344a55" metalness={0.18} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <torusGeometry args={[23.6, 0.28, 12, 96]} />
        <meshStandardMaterial color="#78dce8" emissive="#164c59" emissiveIntensity={0.28} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <torusGeometry args={[12.2, 0.12, 8, 96]} />
        <meshStandardMaterial color="#d8f7ff" emissive="#2b7e91" emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
}

function CentralCrystal({
  reducedMotion
}: Readonly<{
  reducedMotion: boolean;
}>): React.ReactElement {
  const crystalRef = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!crystalRef.current || reducedMotion) {
      return;
    }
    crystalRef.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={crystalRef}>
      <mesh castShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[2.9, 4.2, 3.6, 12]} />
        <meshStandardMaterial color="#111923" metalness={0.35} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 7.2, 0]}>
        <octahedronGeometry args={[3.7, 2]} />
        <meshStandardMaterial
          color="#9f8bff"
          emissive="#4a31d8"
          emissiveIntensity={1.05}
          metalness={0.18}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 7.2, 0]} scale={[1.28, 1.28, 1.28]}>
        <octahedronGeometry args={[3.7, 1]} />
        <meshStandardMaterial
          color="#c9f8ff"
          depthWrite={false}
          emissive="#6dddf0"
          emissiveIntensity={0.45}
          opacity={0.16}
          transparent
        />
      </mesh>
      <pointLight color="#8ecdf8" distance={58} intensity={1.4} position={[0, 8.5, 0]} />
    </group>
  );
}

function PlazaWaterChannels({
  reducedMotion
}: Readonly<{
  reducedMotion: boolean;
}>): React.ReactElement {
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!materialRef.current || reducedMotion) {
      return;
    }
    materialRef.current.opacity = 0.38 + Math.sin(clock.elapsedTime * 0.9) * 0.04;
  });

  return (
    <group position={[0, 0.55, 0]}>
      {[0, Math.PI / 2].map((rotation) => (
        <mesh key={rotation} rotation={[0, rotation, 0]}>
          <boxGeometry args={[2.2, 0.08, 35]} />
          <meshStandardMaterial
            color="#83e8f6"
            depthWrite={false}
            emissive="#207586"
            emissiveIntensity={0.35}
            opacity={0.38}
            ref={materialRef}
            roughness={0.2}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function PlazaArches(): React.ReactElement {
  return (
    <group>
      {PLAZA_ARCH_LAYOUT.map(([x, z, rotation]) => (
        <group key={`${x}-${z}`} position={[x, 1.9, z]} rotation={[0, rotation, 0]}>
          <mesh castShadow position={[-2.6, 0.9, 0]}>
            <cylinderGeometry args={[0.42, 0.56, 3.6, 12]} />
            <meshStandardMaterial color="#435565" metalness={0.14} roughness={0.58} />
          </mesh>
          <mesh castShadow position={[2.6, 0.9, 0]}>
            <cylinderGeometry args={[0.42, 0.56, 3.6, 12]} />
            <meshStandardMaterial color="#435565" metalness={0.14} roughness={0.58} />
          </mesh>
          <mesh castShadow position={[0, 2.78, 0]}>
            <boxGeometry args={[6.1, 0.52, 0.9]} />
            <meshStandardMaterial color="#556a78" metalness={0.18} roughness={0.54} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CentralPlazaTerminal({
  terminal
}: Readonly<{
  terminal: CentralPlazaTerminalViewModel;
}>): React.ReactElement {
  const [x, y, z] = terminal.position;
  const faceCenterRotation = Math.atan2(x, z);

  return (
    <group position={[x, y, z]} rotation={[0, faceCenterRotation, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4.1, 1.35, 1.05]} />
        <meshStandardMaterial color="#101a23" metalness={0.36} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.34, -0.56]}>
        <boxGeometry args={[3.55, 0.72, 0.08]} />
        <meshStandardMaterial
          color={terminal.themeColor}
          emissive={terminal.themeColor}
          emissiveIntensity={0.36}
          metalness={0.16}
          roughness={0.24}
        />
      </mesh>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#eef7fb"
        fontSize={0.36}
        maxWidth={3.2}
        position={[0, 0.38, -0.63]}
        textAlign="center"
      >
        {terminal.label}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#c8eaf0"
        fontSize={0.22}
        maxWidth={3.1}
        position={[0, 0.02, -0.64]}
        textAlign="center"
      >
        {terminal.value}
      </Text>
      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[1.7, 2.05, 0.28, 24]} />
        <meshStandardMaterial color="#2d3942" metalness={0.2} roughness={0.55} />
      </mesh>
    </group>
  );
}
