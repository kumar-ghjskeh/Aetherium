import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import { usePlayerStore } from "../../state/player-store";

export function PlayerAvatar(): React.ReactElement {
  const movementState = usePlayerStore((state) => state.movementState);
  const groupRef = React.useRef<THREE.Group>(null);
  const gaitTime = React.useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const moving =
      movementState === "walk" || movementState === "jog" || movementState === "sprint";
    const gaitSpeed = movementState === "sprint" ? 11 : movementState === "jog" ? 8 : 5;
    gaitTime.current += moving ? delta * gaitSpeed : delta * 1.8;
    const bob = moving ? Math.sin(gaitTime.current) * 0.035 : Math.sin(gaitTime.current) * 0.01;
    groupRef.current.position.y = bob;
    groupRef.current.rotation.z = moving ? Math.sin(gaitTime.current) * 0.025 : 0;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow position={[0, 0.58, 0]}>
        <capsuleGeometry args={[0.34, 0.82, 6, 14]} />
        <meshStandardMaterial color="#1d2433" metalness={0.12} roughness={0.58} />
      </mesh>
      <mesh castShadow position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.3, 18, 14]} />
        <meshStandardMaterial color="#121823" metalness={0.08} roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.2, -0.27]}>
        <boxGeometry args={[0.3, 0.09, 0.025]} />
        <meshStandardMaterial color="#82e6f0" emissive="#135968" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.72, -0.36]}>
        <boxGeometry args={[0.16, 0.22, 0.03]} />
        <meshStandardMaterial color="#7d68ff" emissive="#24175e" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}
