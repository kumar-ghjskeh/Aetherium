import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildProjectDockViewModel,
  type ProjectBerthViewModel,
  type ProjectDockOverviewData,
  type ProjectMilestoneSignalViewModel
} from "../../engine/project-dock-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const DOCK_LOCATION = WORLD_LOCATIONS_MANIFEST.find((location) => location.id === "project-dock");

export function ProjectDockDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: ProjectDockOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildProjectDockViewModel(overview), [overview]);
  const location = DOCK_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.5, z]} rotation={location.rotation}>
      <DockArchitecture reducedMotion={reducedMotion} />
      <ProjectBerths berths={viewModel.projectBerths} reducedMotion={reducedMotion} />
      <MilestoneSignals signals={viewModel.milestoneSignals} />
      <BlockerBeacons blockers={viewModel.blockerSignals} reducedMotion={reducedMotion} />
    </group>
  );
}

function DockArchitecture({
  reducedMotion
}: Readonly<{ reducedMotion: boolean }>): React.ReactElement {
  const craneArmRef = React.useRef<THREE.Group>(null);
  const hookRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (reducedMotion) {
      return;
    }
    if (craneArmRef.current) {
      craneArmRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.12;
    }
    if (hookRef.current) {
      hookRef.current.position.y = -5.5 + Math.sin(clock.elapsedTime * 0.7) * 0.35;
    }
  });

  return (
    <group>
      <mesh receiveShadow>
        <boxGeometry args={[72, 1.1, 50]} />
        <meshStandardMaterial color="#263238" metalness={0.28} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.62, -8]} receiveShadow>
        <boxGeometry args={[64, 0.28, 24]} />
        <meshStandardMaterial color="#38484d" metalness={0.34} roughness={0.52} />
      </mesh>
      <DockWater />
      {[-31, -18, -6, 6, 18, 31].map((x) => (
        <mesh key={x} position={[x, 0.7, 18]} receiveShadow>
          <boxGeometry args={[7.2, 0.48, 15]} />
          <meshStandardMaterial color="#4a3c31" metalness={0.18} roughness={0.68} />
        </mesh>
      ))}
      <group position={[-31, 8.8, 8]}>
        <mesh castShadow>
          <boxGeometry args={[3.4, 17.2, 3.4]} />
          <meshStandardMaterial color="#6c4b2f" metalness={0.42} roughness={0.42} />
        </mesh>
        <group ref={craneArmRef} position={[0, 7.2, 0]}>
          <mesh castShadow position={[11, 0, 0]}>
            <boxGeometry args={[25, 1.2, 1.8]} />
            <meshStandardMaterial color="#ffb066" metalness={0.4} roughness={0.38} />
          </mesh>
          <mesh position={[17, -3.2, 0]}>
            <boxGeometry args={[0.14, 6.4, 0.14]} />
            <meshStandardMaterial color="#d7e3e4" metalness={0.7} roughness={0.28} />
          </mesh>
          <mesh ref={hookRef} position={[17, -5.5, 0]}>
            <torusGeometry args={[0.65, 0.18, 8, 20, Math.PI * 1.5]} />
            <meshStandardMaterial color="#f0c766" metalness={0.62} roughness={0.3} />
          </mesh>
        </group>
      </group>
      <group position={[27, 4.4, 8]}>
        <mesh castShadow>
          <boxGeometry args={[13, 7.8, 9]} />
          <meshStandardMaterial color="#34484d" metalness={0.34} roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.6, -4.58]}>
          <boxGeometry args={[9.4, 3.4, 0.16]} />
          <meshStandardMaterial
            color="#ffb066"
            emissive="#8a3e18"
            emissiveIntensity={0.36}
            metalness={0.24}
            roughness={0.28}
          />
        </mesh>
      </group>
      <pointLight color="#ffb066" distance={94} intensity={1.55} position={[0, 12, 5]} />
    </group>
  );
}

function DockWater(): React.ReactElement {
  return (
    <group>
      {[-24, -12, 0, 12, 24].map((x) => (
        <mesh key={x} position={[x, 0.42, 18]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 14]} />
          <meshStandardMaterial
            color="#2f91a3"
            depthWrite={false}
            emissive="#123b43"
            emissiveIntensity={0.16}
            metalness={0.08}
            opacity={0.58}
            roughness={0.24}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

function ProjectBerths({
  berths,
  reducedMotion
}: Readonly<{
  berths: ProjectBerthViewModel[];
  reducedMotion: boolean;
}>): React.ReactElement {
  return (
    <group>
      {berths.map((berth, index) => (
        <ProjectBerth berth={berth} key={berth.id} reducedMotion={reducedMotion} seed={index} />
      ))}
    </group>
  );
}

function ProjectBerth({
  berth,
  reducedMotion,
  seed
}: Readonly<{
  berth: ProjectBerthViewModel;
  reducedMotion: boolean;
  seed: number;
}>): React.ReactElement {
  const beaconRef = React.useRef<THREE.Mesh>(null);
  const hullHeight = 2.8 + berth.heightScale * 7.2;

  useFrame(({ clock }) => {
    if (!beaconRef.current || reducedMotion) {
      return;
    }
    beaconRef.current.rotation.y = clock.elapsedTime * 0.3 + seed * 0.4;
  });

  return (
    <group position={berth.position}>
      <mesh receiveShadow>
        <boxGeometry args={[8.6, 0.5, 13.2]} />
        <meshStandardMaterial color="#58493c" metalness={0.18} roughness={0.66} />
      </mesh>
      <mesh castShadow position={[0, hullHeight / 2 + 0.35, 0]}>
        <boxGeometry args={[5.8, hullHeight, 8.8]} />
        <meshStandardMaterial
          color={berth.constructionState === "completed" ? "#d8c6a9" : "#4f6265"}
          metalness={berth.constructionState === "completed" ? 0.22 : 0.38}
          roughness={0.42}
          wireframe={berth.constructionState === "archived"}
        />
      </mesh>
      {berth.constructionState === "under_construction" ? (
        <group>
          {[-3.6, 3.6].map((x) => (
            <mesh key={x} position={[x, hullHeight * 0.52, 0]}>
              <boxGeometry args={[0.24, hullHeight + 2, 10.8]} />
              <meshStandardMaterial color="#ffb066" metalness={0.5} roughness={0.34} />
            </mesh>
          ))}
          {[2.2, 5.2, 8.2]
            .filter((height) => height <= hullHeight + 1)
            .map((height) => (
              <mesh key={height} position={[0, height, 0]}>
                <boxGeometry args={[8, 0.18, 10.6]} />
                <meshStandardMaterial color="#83989b" metalness={0.44} roughness={0.38} />
              </mesh>
            ))}
        </group>
      ) : null}
      {berth.constructionState === "completed" ? (
        <mesh castShadow position={[0, hullHeight + 1.4, 0]}>
          <cylinderGeometry args={[2.5, 3.4, 2.8, 6]} />
          <meshStandardMaterial
            color={berth.accent}
            emissive={berth.accent}
            emissiveIntensity={0.16}
            metalness={0.34}
            roughness={0.32}
          />
        </mesh>
      ) : null}
      <mesh ref={beaconRef} position={[0, hullHeight + 2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.1, 8, 42]} />
        <meshStandardMaterial
          color={berth.accent}
          emissive={berth.accent}
          emissiveIntensity={0.34}
        />
      </mesh>
      {berth.blockerCount > 0 ? (
        <mesh position={[2.8, hullHeight + 1.5, -3]}>
          <octahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial color="#ff826f" emissive="#b52d23" emissiveIntensity={0.58} />
        </mesh>
      ) : null}
    </group>
  );
}

function MilestoneSignals({
  signals
}: Readonly<{
  signals: ProjectMilestoneSignalViewModel[];
}>): React.ReactElement {
  return (
    <group>
      {signals.map((signal, index) => {
        const angle = (index / Math.max(signals.length, 1)) * Math.PI * 2;
        return (
          <group key={signal.id} position={[Math.cos(angle) * 15, 1.4, 6 + Math.sin(angle) * 8]}>
            <mesh>
              <cylinderGeometry args={[0.62, 0.9, 2.6, 12]} />
              <meshStandardMaterial
                color={signal.accent}
                emissive={signal.accent}
                emissiveIntensity={0.28}
                metalness={0.3}
                roughness={0.34}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BlockerBeacons({
  blockers,
  reducedMotion
}: Readonly<{
  blockers: Array<{ id: string; title: string }>;
  reducedMotion: boolean;
}>): React.ReactElement {
  return (
    <group position={[25, 2.3, -13]}>
      {blockers.map((blocker, index) => (
        <group key={blocker.id} position={[index * 3.2 - (blockers.length - 1) * 1.6, 0, 0]}>
          <mesh rotation={[0, reducedMotion ? 0 : index * 0.45, 0]}>
            <octahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial color="#ff826f" emissive="#b52d23" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
