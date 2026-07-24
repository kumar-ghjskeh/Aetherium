import { Grid, Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import React from "react";
import type * as THREE from "three";

export function DiagnosticScene(): React.ReactElement {
  const beaconRef = React.useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <>
      <Sky azimuth={0.24} distance={450000} inclination={0.48} turbidity={3.8} />
      <color args={["#07101f"]} attach="background" />
      <fog args={["#07101f", 38, 140]} attach="fog" />

      <directionalLight color="#ffffff" intensity={2.2} position={[12, 18, 8]} />

      <mesh position={[0, -0.04, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#182b2d" metalness={0.05} roughness={0.86} />
      </mesh>
      <RigidBody colliders={false} type="fixed">
        <CuboidCollider args={[21, 0.08, 21]} position={[0, -0.08, 0]} />
      </RigidBody>

      <Grid
        args={[42, 42]}
        cellColor="#2d7782"
        cellSize={1}
        fadeDistance={34}
        fadeStrength={1.8}
        followCamera={false}
        infiniteGrid={false}
        position={[0, 0.02, 0]}
        sectionColor="#82e6f0"
        sectionSize={5}
      />

      <mesh castShadow position={[0, 1.25, 0]} ref={beaconRef}>
        <octahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial
          color="#7d68ff"
          emissive="#2f24a7"
          emissiveIntensity={0.75}
          metalness={0.22}
          roughness={0.38}
        />
      </mesh>

      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[1.9, 2.3, 0.84, 40]} />
        <meshStandardMaterial color="#283b48" metalness={0.18} roughness={0.62} />
      </mesh>
    </>
  );
}
