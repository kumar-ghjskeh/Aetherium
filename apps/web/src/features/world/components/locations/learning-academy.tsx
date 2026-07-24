import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildLearningAcademyViewModel,
  type CourseHallViewModel,
  type LearningAcademyOverviewData,
  type LessonStationViewModel,
  type SubjectWingViewModel
} from "../../engine/learning-academy-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const ACADEMY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "learning-academy"
);

const ACCESS_COLORS: Record<SubjectWingViewModel["accessState"], string> = {
  guided: "#8be8ff",
  open: "#d8f2ff",
  review: "#b9a8ff"
};

export function LearningAcademyDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: LearningAcademyOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildLearningAcademyViewModel(overview), [overview]);
  const location = ACADEMY_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.54, z]} rotation={location.rotation}>
      <AcademyArchitecture
        masteryAverage={viewModel.masteryAverageLabel}
        reducedMotion={reducedMotion}
        wingCount={viewModel.wings.length}
      />
      <SubjectWings wings={viewModel.wings} />
      <CourseHalls halls={viewModel.courseHalls} />
      <LessonStations stations={viewModel.lessonStations} reducedMotion={reducedMotion} />
      {viewModel.wings.length === 0 ? (
        <Text
          anchorX="center"
          anchorY="middle"
          color="#eef8ff"
          fontSize={0.58}
          maxWidth={18}
          position={[0, 2.7, 18]}
          textAlign="center"
        >
          Create subjects and topics to open the first academy wing
        </Text>
      ) : null}
      <Text
        anchorX="center"
        anchorY="middle"
        color="#f4fbff"
        fontSize={1.62}
        maxWidth={28}
        position={[0, 13.2, -14]}
        textAlign="center"
      >
        Learning Academy
      </Text>
    </group>
  );
}

function AcademyArchitecture({
  masteryAverage,
  reducedMotion,
  wingCount
}: Readonly<{
  masteryAverage: string;
  reducedMotion: boolean;
  wingCount: number;
}>): React.ReactElement {
  const ringRef = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ringRef.current || reducedMotion) {
      return;
    }
    ringRef.current.rotation.y += delta * 0.08;
  });

  const beaconIntensity = Math.min(2.1, 0.7 + wingCount * 0.18);

  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[38, 44, 1.2, 96]} />
        <meshStandardMaterial color="#263441" metalness={0.12} roughness={0.7} />
      </mesh>
      <mesh receiveShadow position={[0, 0.68, 5]}>
        <boxGeometry args={[58, 0.42, 46]} />
        <meshStandardMaterial color="#344757" metalness={0.14} roughness={0.64} />
      </mesh>
      <mesh castShadow position={[0, 5.5, -10]}>
        <boxGeometry args={[28, 9.4, 24]} />
        <meshStandardMaterial color="#d8f2ff" metalness={0.08} roughness={0.46} />
      </mesh>
      <mesh castShadow position={[0, 11.5, -10]}>
        <cylinderGeometry args={[9.8, 12.4, 3.2, 6]} />
        <meshStandardMaterial
          color="#e7f8ff"
          emissive="#275f7a"
          emissiveIntensity={0.16}
          metalness={0.1}
          roughness={0.42}
        />
      </mesh>
      <mesh castShadow position={[0, 8, -25]}>
        <boxGeometry args={[18, 13.8, 2.4]} />
        <meshStandardMaterial color="#f4fbff" metalness={0.08} roughness={0.44} />
      </mesh>
      <mesh position={[0, 8, -26.28]}>
        <boxGeometry args={[11.5, 7.8, 0.18]} />
        <meshStandardMaterial
          color="#8be8ff"
          emissive="#1b6f8d"
          emissiveIntensity={0.42}
          metalness={0.14}
          roughness={0.24}
        />
      </mesh>
      <AcademyColumns />
      <group ref={ringRef} position={[0, 14.2, -10]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[16.8, 0.13, 8, 128]} />
          <meshStandardMaterial color="#8be8ff" emissive="#237486" emissiveIntensity={0.28} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 3]}>
          <torusGeometry args={[11.4, 0.1, 8, 96]} />
          <meshStandardMaterial color="#d8f2ff" emissive="#3f8aa2" emissiveIntensity={0.22} />
        </mesh>
      </group>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#1d3948"
        fontSize={0.38}
        maxWidth={8}
        position={[0, 7.9, -26.42]}
        textAlign="center"
      >
        {masteryAverage} mastery signal
      </Text>
      <pointLight
        color="#cdefff"
        distance={100}
        intensity={beaconIntensity}
        position={[0, 12, -8]}
      />
    </group>
  );
}

function AcademyColumns(): React.ReactElement {
  return (
    <group>
      {[-20, -12, -4, 4, 12, 20].map((x) => (
        <mesh castShadow key={x} position={[x, 5.4, -24.8]}>
          <cylinderGeometry args={[0.58, 0.82, 9.2, 16]} />
          <meshStandardMaterial color="#bcd9e5" metalness={0.08} roughness={0.5} />
        </mesh>
      ))}
      {[-28, 28].map((x) => (
        <mesh castShadow key={x} position={[x, 4.4, 5]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
          <boxGeometry args={[8.5, 7.8, 28]} />
          <meshStandardMaterial color="#42586a" metalness={0.1} roughness={0.58} />
        </mesh>
      ))}
    </group>
  );
}

function SubjectWings({
  wings
}: Readonly<{
  wings: SubjectWingViewModel[];
}>): React.ReactElement {
  return (
    <group>
      {wings.map((wing) => {
        const accessColor = ACCESS_COLORS[wing.accessState];
        return (
          <group key={wing.id} position={wing.position}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[8.5, 3.8, 6.5]} />
              <meshStandardMaterial color="#385064" metalness={0.12} roughness={0.52} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
              <octahedronGeometry args={[1.4 + wing.masteryIntensity * 0.9, 0]} />
              <meshStandardMaterial
                color={wing.color}
                emissive={wing.color}
                emissiveIntensity={0.14 + wing.masteryIntensity * 0.42}
                metalness={0.16}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, -1.94, 0]}>
              <boxGeometry args={[7.2, 0.18, 5.4]} />
              <meshStandardMaterial
                color={accessColor}
                emissive={accessColor}
                emissiveIntensity={0.28}
                metalness={0.12}
                roughness={0.28}
              />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#f5fbff"
              fontSize={0.32}
              maxWidth={6.8}
              position={[0, 0.36, -3.36]}
              textAlign="center"
            >
              {wing.label}
            </Text>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#c7d8e3"
              fontSize={0.22}
              maxWidth={6.8}
              position={[0, -0.02, -3.38]}
              textAlign="center"
            >
              {wing.masteryLabel} - {wing.accessState}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function CourseHalls({
  halls
}: Readonly<{
  halls: CourseHallViewModel[];
}>): React.ReactElement {
  return (
    <group>
      {halls.map((hall) => (
        <group key={hall.id} position={hall.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[7.2, 3.2, 5.4]} />
            <meshStandardMaterial color="#24394c" metalness={0.16} roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <sphereGeometry args={[2.4, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color="#d8f2ff"
              emissive="#407c99"
              emissiveIntensity={0.12 + hall.illumination * 0.34}
              metalness={0.12}
              roughness={0.38}
            />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#eef8ff"
            fontSize={0.25}
            maxWidth={5.8}
            position={[0, 0.15, -2.82]}
            textAlign="center"
          >
            {hall.label}
          </Text>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#c4d6e2"
            fontSize={0.18}
            maxWidth={5.6}
            position={[0, -0.18, -2.83]}
            textAlign="center"
          >
            {hall.detail}
          </Text>
        </group>
      ))}
    </group>
  );
}

function LessonStations({
  reducedMotion,
  stations
}: Readonly<{
  reducedMotion: boolean;
  stations: LessonStationViewModel[];
}>): React.ReactElement {
  return (
    <group>
      {stations.map((station, index) => (
        <LessonStation
          key={station.id}
          reducedMotion={reducedMotion}
          seed={index}
          station={station}
        />
      ))}
    </group>
  );
}

function LessonStation({
  reducedMotion,
  seed,
  station
}: Readonly<{
  reducedMotion: boolean;
  seed: number;
  station: LessonStationViewModel;
}>): React.ReactElement {
  const ringRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || reducedMotion) {
      return;
    }
    ringRef.current.rotation.y = clock.elapsedTime * 0.28 + seed * 0.2;
  });

  return (
    <group position={station.position}>
      <mesh receiveShadow>
        <cylinderGeometry args={[2.2, 2.55, 0.34, 28]} />
        <meshStandardMaterial color="#283b48" metalness={0.12} roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.62, 0.84, 2.2, 18]} />
        <meshStandardMaterial
          color={station.color}
          emissive={station.color}
          emissiveIntensity={station.state === "completed" ? 0.5 : 0.28}
          metalness={0.18}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 2.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.04, 8, 48]} />
        <meshStandardMaterial
          color={station.color}
          emissive={station.color}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#f6fbff"
        fontSize={0.21}
        maxWidth={4.4}
        position={[0, -0.62, 0]}
        textAlign="center"
      >
        {station.label}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#c6d8e4"
        fontSize={0.16}
        maxWidth={4.2}
        position={[0, -0.92, 0]}
        textAlign="center"
      >
        {station.topicLabel}
      </Text>
    </group>
  );
}
