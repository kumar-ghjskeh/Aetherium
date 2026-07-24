import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildAIObservatoryViewModel,
  type AIObservatoryOverviewData,
  type AIProbeState,
  type AIProbeViewModel
} from "../../engine/ai-observatory-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const OBSERVATORY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "ai-observatory"
);

const STATE_COLORS: Record<AIProbeState, string> = {
  error: "#ffb55e",
  greeting: "#f0c766",
  idle: "#8be8ff",
  listening: "#77d98b",
  offline: "#667487",
  retrieving: "#b9a8ff",
  speaking: "#82e6f0",
  thinking: "#7d68ff",
  waiting: "#d8dee9"
};

export function AIObservatoryDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: AIObservatoryOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildAIObservatoryViewModel(overview), [overview]);
  const location = OBSERVATORY_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.68, z]} rotation={location.rotation}>
      <ObservatoryExterior
        activeProbeCount={viewModel.probes.length}
        reducedMotion={reducedMotion}
      />
      <MentorProbeRing probes={viewModel.probes} reducedMotion={reducedMotion} />
      <ObservatoryStatusTerminals viewModel={viewModel} />
      <Text
        anchorX="center"
        anchorY="middle"
        color="#eff9ff"
        fontSize={1.65}
        maxWidth={31}
        position={[0, 13.8, -17.4]}
        textAlign="center"
      >
        AI Observatory
      </Text>
    </group>
  );
}

function ObservatoryExterior({
  activeProbeCount,
  reducedMotion
}: Readonly<{
  activeProbeCount: number;
  reducedMotion: boolean;
}>): React.ReactElement {
  const ringRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!ringRef.current || reducedMotion) {
      return;
    }
    ringRef.current.rotation.y += delta * 0.16;
    ringRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.24) * 0.018;
  });

  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[31, 36, 1.2, 96]} />
        <meshStandardMaterial color="#182436" metalness={0.26} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 4.2, -3.5]}>
        <cylinderGeometry args={[24, 27, 7.9, 96]} />
        <meshStandardMaterial color="#26384b" metalness={0.24} roughness={0.38} />
      </mesh>
      <mesh position={[0, 10.4, -3.5]}>
        <sphereGeometry args={[24.4, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#355670"
          depthWrite={false}
          emissive="#142b48"
          emissiveIntensity={0.28}
          metalness={0.32}
          opacity={0.46}
          roughness={0.2}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0, 5.2, -27.8]}>
        <boxGeometry args={[13.5, 8.8, 2.1]} />
        <meshStandardMaterial color="#334a5d" metalness={0.24} roughness={0.42} />
      </mesh>
      <mesh position={[0, 5.1, -29.02]}>
        <boxGeometry args={[9.6, 5.7, 0.16]} />
        <meshStandardMaterial
          color="#b9a8ff"
          emissive="#4931c8"
          emissiveIntensity={0.44}
          metalness={0.2}
          roughness={0.18}
        />
      </mesh>
      <ObservatoryColumns />
      <group ref={ringRef} position={[0, 13.4, -3.5]}>
        <mesh rotation={[Math.PI / 2.22, 0, 0.24]}>
          <torusGeometry args={[28, 0.18, 10, 144]} />
          <meshStandardMaterial color="#8be8ff" emissive="#236c82" emissiveIntensity={0.42} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2.8]}>
          <torusGeometry args={[18, 0.13, 10, 120]} />
          <meshStandardMaterial color="#7d68ff" emissive="#3328bf" emissiveIntensity={0.38} />
        </mesh>
        <mesh rotation={[Math.PI / 1.86, 0, Math.PI / 4.4]}>
          <torusGeometry args={[10.5, 0.09, 8, 96]} />
          <meshStandardMaterial color="#f0c766" emissive="#7b5b12" emissiveIntensity={0.25} />
        </mesh>
      </group>
      <pointLight
        color="#aeb8ff"
        distance={110}
        intensity={Math.min(2.35, 1.15 + activeProbeCount * 0.16)}
        position={[0, 13.5, -3]}
      />
    </group>
  );
}

function ObservatoryColumns(): React.ReactElement {
  return (
    <group>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        return (
          <group key={index} position={[Math.sin(angle) * 25.5, 4.6, Math.cos(angle) * 25.5 - 3.5]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.64, 0.92, 8.4, 16]} />
              <meshStandardMaterial color="#52697d" metalness={0.18} roughness={0.5} />
            </mesh>
            <mesh position={[0, 4.6, 0]}>
              <octahedronGeometry args={[0.72, 0]} />
              <meshStandardMaterial
                color="#8be8ff"
                emissive="#236c82"
                emissiveIntensity={0.34}
                metalness={0.2}
                roughness={0.26}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MentorProbeRing({
  probes,
  reducedMotion
}: Readonly<{
  probes: AIProbeViewModel[];
  reducedMotion: boolean;
}>): React.ReactElement {
  return (
    <group position={[0, 5.4, -3.6]}>
      {probes.length === 0 ? (
        <Text
          anchorX="center"
          anchorY="middle"
          color="#d8e9f0"
          fontSize={0.62}
          maxWidth={15}
          position={[0, 1.2, 0]}
          textAlign="center"
        >
          No mentors configured
        </Text>
      ) : (
        probes.map((probe, index) => (
          <MentorProbe key={probe.id} probe={probe} reducedMotion={reducedMotion} seed={index} />
        ))
      )}
    </group>
  );
}

function MentorProbe({
  probe,
  reducedMotion,
  seed
}: Readonly<{
  probe: AIProbeViewModel;
  reducedMotion: boolean;
  seed: number;
}>): React.ReactElement {
  const groupRef = React.useRef<THREE.Group>(null);
  const stateColor = STATE_COLORS[probe.state];

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) {
      return;
    }
    const pulse = Math.sin(clock.elapsedTime * 1.2 + seed) * 0.12;
    groupRef.current.position.y = probe.position[1] + pulse;
    groupRef.current.rotation.y += 0.012 + seed * 0.001;
  });

  return (
    <group ref={groupRef} position={probe.position}>
      <mesh>
        <cylinderGeometry args={[1.55, 1.85, 0.16, 32]} />
        <meshStandardMaterial color="#1d2b39" metalness={0.22} roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, 0.05, 8, 72]} />
        <meshStandardMaterial color={stateColor} emissive={stateColor} emissiveIntensity={0.4} />
      </mesh>
      <ProbeCore probe={probe} stateColor={stateColor} />
      <StatusHalo stateColor={stateColor} />
      <Text
        anchorX="center"
        anchorY="middle"
        color="#eff9ff"
        fontSize={0.34}
        maxWidth={5.2}
        position={[0, -1.18, 0]}
        textAlign="center"
      >
        {probe.label}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#adc5cc"
        fontSize={0.21}
        maxWidth={5.2}
        position={[0, -1.58, 0]}
        textAlign="center"
      >
        {probe.state.replace("_", " ")}
      </Text>
    </group>
  );
}

function ProbeCore({
  probe,
  stateColor
}: Readonly<{
  probe: AIProbeViewModel;
  stateColor: string;
}>): React.ReactElement {
  const material = (
    <meshStandardMaterial
      color={probe.color}
      emissive={stateColor}
      emissiveIntensity={probe.state === "offline" ? 0.12 : 0.52}
      metalness={0.28}
      roughness={0.22}
    />
  );

  if (probe.shape === "crystal") {
    return (
      <mesh castShadow position={[0, 1.08, 0]}>
        <octahedronGeometry args={[0.92, 1]} />
        {material}
      </mesh>
    );
  }

  if (probe.shape === "ring") {
    return (
      <group position={[0, 1.08, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.86, 0.13, 12, 64]} />
          {material}
        </mesh>
        <mesh>
          <sphereGeometry args={[0.32, 24, 12]} />
          <meshStandardMaterial
            color="#eff9ff"
            emissive={stateColor}
            emissiveIntensity={0.4}
            metalness={0.2}
            roughness={0.2}
          />
        </mesh>
      </group>
    );
  }

  if (probe.shape === "spire") {
    return (
      <mesh castShadow position={[0, 1.08, 0]}>
        <coneGeometry args={[0.72, 1.9, 5]} />
        {material}
      </mesh>
    );
  }

  return (
    <mesh castShadow position={[0, 1.08, 0]}>
      <sphereGeometry args={[0.74, 32, 16]} />
      {material}
    </mesh>
  );
}

function StatusHalo({
  stateColor
}: Readonly<{
  stateColor: string;
}>): React.ReactElement {
  return (
    <group position={[0, 1.08, 0]}>
      <mesh rotation={[Math.PI / 2.4, 0, 0.2]}>
        <torusGeometry args={[1.22, 0.035, 8, 64]} />
        <meshStandardMaterial color={stateColor} emissive={stateColor} emissiveIntensity={0.36} />
      </mesh>
      <mesh rotation={[Math.PI / 1.82, 0, 1.2]}>
        <torusGeometry args={[1.02, 0.028, 8, 64]} />
        <meshStandardMaterial color="#d8f4ff" emissive={stateColor} emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
}

function ObservatoryStatusTerminals({
  viewModel
}: Readonly<{
  viewModel: ReturnType<typeof buildAIObservatoryViewModel>;
}>): React.ReactElement {
  const terminalData = [
    ["Mentors", viewModel.totalMentorLabel, -10],
    ["Conversations", viewModel.activeConversationLabel, 0],
    ["Providers", viewModel.configuredProviderLabel, 10]
  ] as const;

  return (
    <group position={[0, 1.4, -25.8]}>
      {terminalData.map(([label, value, x]) => (
        <group key={label} position={[x, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[6.6, 2.8, 0.9]} />
            <meshStandardMaterial color="#172635" metalness={0.24} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.12, -0.52]}>
            <boxGeometry args={[5.5, 1.8, 0.08]} />
            <meshStandardMaterial
              color="#8be8ff"
              emissive="#245f78"
              emissiveIntensity={0.34}
              metalness={0.2}
              roughness={0.2}
            />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#09202c"
            fontSize={0.26}
            maxWidth={4.8}
            position={[0, 0.4, -0.59]}
            textAlign="center"
          >
            {label}
          </Text>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#09202c"
            fontSize={0.2}
            maxWidth={4.8}
            position={[0, -0.14, -0.59]}
            textAlign="center"
          >
            {value}
          </Text>
        </group>
      ))}
    </group>
  );
}
