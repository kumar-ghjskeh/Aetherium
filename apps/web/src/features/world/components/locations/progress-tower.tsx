import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildProgressTowerViewModel,
  type ProgressTowerMetricViewModel,
  type ProgressTowerOverviewData,
  type ProgressTowerTrendViewModel
} from "../../engine/progress-tower-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const TOWER_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "progress-tower"
);

export function ProgressTowerDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: ProgressTowerOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildProgressTowerViewModel(overview), [overview]);
  const location = TOWER_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.5, z]} rotation={location.rotation}>
      <TowerArchitecture reducedMotion={reducedMotion} />
      <MetricFloors metrics={viewModel.metricSignals} />
      <StudyTrendColumns trends={viewModel.trendSignals} />
      <Text
        anchorX="center"
        anchorY="middle"
        color="#eefbff"
        fontSize={1.68}
        maxWidth={28}
        position={[0, 64, 0]}
        textAlign="center"
      >
        Progress Tower
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#91dfea"
        fontSize={0.46}
        maxWidth={24}
        position={[0, 61.6, 0]}
        textAlign="center"
      >
        {viewModel.activityLabel}
      </Text>
    </group>
  );
}

function TowerArchitecture({
  reducedMotion
}: Readonly<{ reducedMotion: boolean }>): React.ReactElement {
  const crownRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (crownRef.current && !reducedMotion) {
      crownRef.current.rotation.y = clock.elapsedTime * 0.12;
    }
  });

  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[30, 34, 2.4, 12]} />
        <meshStandardMaterial color="#26333c" metalness={0.42} roughness={0.44} />
      </mesh>
      <mesh castShadow position={[0, 27, 0]}>
        <cylinderGeometry args={[6.2, 11.5, 52, 12]} />
        <meshStandardMaterial color="#dce8ec" metalness={0.38} roughness={0.34} />
      </mesh>
      <mesh position={[0, 28, 0]}>
        <cylinderGeometry args={[6.45, 11.8, 47, 12, 1, true]} />
        <meshStandardMaterial
          color="#2c9fb5"
          emissive="#174e5a"
          emissiveIntensity={0.24}
          metalness={0.26}
          roughness={0.28}
          wireframe
        />
      </mesh>
      {[0, 1, 2, 3].map((index) => {
        const angle = (index / 4) * Math.PI * 2;
        return (
          <mesh
            castShadow
            key={index}
            position={[Math.cos(angle) * 11.5, 25, Math.sin(angle) * 11.5]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[3.4, 42, 2.2]} />
            <meshStandardMaterial color="#4b5e68" metalness={0.56} roughness={0.33} />
          </mesh>
        );
      })}
      <group ref={crownRef} position={[0, 55, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9.5, 0.38, 10, 48]} />
          <meshStandardMaterial color="#82e6f0" emissive="#2e7e89" emissiveIntensity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[6.8, 0.18, 8, 40]} />
          <meshStandardMaterial color="#b8a7ff" emissive="#6554bd" emissiveIntensity={0.5} />
        </mesh>
      </group>
      <mesh position={[0, 58, 0]}>
        <octahedronGeometry args={[3.2, 0]} />
        <meshStandardMaterial
          color="#e9fbff"
          emissive="#82e6f0"
          emissiveIntensity={0.62}
          metalness={0.2}
          roughness={0.18}
        />
      </mesh>
      <pointLight color="#82e6f0" distance={130} intensity={2.1} position={[0, 42, 0]} />
    </group>
  );
}

function MetricFloors({
  metrics
}: Readonly<{ metrics: ProgressTowerMetricViewModel[] }>): React.ReactElement {
  return (
    <group>
      {metrics.slice(0, 12).map((metric, index) => {
        const height = 7 + index * 3.65;
        return (
          <group key={metric.id} position={[0, height, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[12.6 - index * 0.28, 0.24, 8, 48]} />
              <meshStandardMaterial
                color={metric.available ? metric.accent : "#64757b"}
                emissive={metric.available ? metric.accent : "#2b3538"}
                emissiveIntensity={metric.signalStrength}
                metalness={0.38}
                roughness={0.32}
              />
            </mesh>
            {index < 6 ? (
              <Text
                anchorX="left"
                anchorY="middle"
                color={metric.available ? "#eefbff" : "#9aa8ac"}
                fontSize={0.28}
                maxWidth={8.4}
                position={[12.8 - index * 0.28, 0, 0]}
              >
                {`${metric.label}: ${metric.valueLabel}`}
              </Text>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function StudyTrendColumns({
  trends
}: Readonly<{ trends: ProgressTowerTrendViewModel[] }>): React.ReactElement {
  const visibleTrends = trends.slice(-8);

  return (
    <group position={[0, 1.5, 21]}>
      {visibleTrends.map((trend, index) => {
        const height = 1.2 + trend.heightScale * 8;
        const x = (index - (visibleTrends.length - 1) / 2) * 2.8;
        return (
          <group key={trend.id} position={[x, 0, 0]}>
            <mesh castShadow position={[0, height / 2, 0]}>
              <boxGeometry args={[1.65, height, 1.65]} />
              <meshStandardMaterial
                color="#82e6f0"
                emissive="#216a76"
                emissiveIntensity={trend.studyMinutes > 0 ? 0.4 : 0.12}
                metalness={0.32}
                roughness={0.3}
              />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#e8faff"
              fontSize={0.22}
              maxWidth={2.5}
              position={[0, height + 0.65, 0]}
              textAlign="center"
            >
              {`${trend.studyMinutes}m`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
