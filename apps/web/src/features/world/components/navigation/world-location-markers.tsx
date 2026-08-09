import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import { resolveDestinationLabelFace, type WorldDestination } from "../../engine/navigation-system";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { WorldTextLabel } from "../ui/world-text-label";

const THEME_COLORS: Record<string, string> = {
  achievement: "#f0c766",
  coding: "#55d9f2",
  habit: "#77d98b",
  knowledge: "#82b6ff",
  learning: "#7cb7ff",
  mentor: "#b8a7ff",
  personal: "#91d8df",
  progress: "#ffffff",
  project: "#ffb066",
  system: "#d9e9ef"
};

export function WorldLocationMarkers({
  destinations,
  reducedMotion
}: Readonly<{
  destinations: WorldDestination[];
  reducedMotion: boolean;
}>): React.ReactElement {
  const destinationId = useWorldNavigationStore((state) => state.destinationId);

  return (
    <group>
      {destinations.map((destination) => (
        <LocationMarker
          destination={destination}
          key={destination.id}
          reducedMotion={reducedMotion}
          selected={destination.id === destinationId}
        />
      ))}
    </group>
  );
}

function LocationMarker({
  destination,
  reducedMotion,
  selected
}: Readonly<{
  destination: WorldDestination;
  reducedMotion: boolean;
  selected: boolean;
}>): React.ReactElement {
  const ringRef = React.useRef<THREE.Mesh>(null);
  const color = destination.unlocked ? (THEME_COLORS[destination.theme] ?? "#ffffff") : "#6d7477";

  useFrame(({ clock }) => {
    if (ringRef.current && !reducedMotion && (selected || destination.current)) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.36;
      const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.08;
      ringRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      position={[
        destination.worldPosition[0],
        destination.worldPosition[1] + 2,
        destination.worldPosition[2]
      ]}
    >
      <mesh castShadow position={[0, 4, 0]}>
        <cylinderGeometry args={[0.36, 0.72, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected || destination.current ? 0.52 : 0.18}
          opacity={destination.unlocked ? 0.9 : 0.42}
          transparent={!destination.unlocked}
        />
      </mesh>
      <mesh position={[0, 8.4, 0]} ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[selected ? 2.3 : 1.5, 0.2, 8, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.36} />
      </mesh>
      {destination.id === "project-dock" ? null : (
        <WorldTextLabel
          anchorX="center"
          anchorY="middle"
          color={destination.unlocked ? "#f5fbff" : "#a7adb0"}
          fontSize={selected || destination.current ? 0.55 : 0.36}
          maxWidth={12}
          mirrorX={resolveDestinationLabelFace(destination) === "back"}
          position={[0, 10.2, 0]}
          textAlign="center"
        >
          {destination.unlocked ? destination.name : `${destination.name} - Locked`}
        </WorldTextLabel>
      )}
    </group>
  );
}
