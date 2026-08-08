import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildAchievementHallViewModel,
  type AchievementExhibitViewModel,
  type AchievementHallOverviewData,
  type CertificatePlaqueViewModel,
  type CompletedProjectExhibitViewModel,
  type WorldUnlockExhibitViewModel
} from "../../engine/achievement-hall-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const HALL_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "achievement-hall"
);

export function AchievementHallDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: AchievementHallOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildAchievementHallViewModel(overview), [overview]);
  const location = HALL_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.5, z]} rotation={location.rotation}>
      <HallArchitecture reducedMotion={reducedMotion} />
      <AchievementExhibits exhibits={viewModel.achievementExhibits} reducedMotion={reducedMotion} />
      <CertificateGallery plaques={viewModel.certificatePlaques} />
      <CompletedProjectGallery exhibits={viewModel.completedProjectExhibits} />
      <WorldUnlockGallery exhibits={viewModel.worldUnlockExhibits} reducedMotion={reducedMotion} />
      {viewModel.achievementExhibits.length === 0 ? (
        <Text
          anchorX="center"
          anchorY="middle"
          color="#fff5dc"
          fontSize={0.55}
          maxWidth={24}
          position={[0, 3, 1]}
          textAlign="center"
        >
          Completed milestones will open the first exhibit
        </Text>
      ) : null}
      <Text
        anchorX="center"
        anchorY="middle"
        color="#fff7e4"
        fontSize={1.62}
        maxWidth={30}
        position={[0, 25.5, -18.5]}
        textAlign="center"
      >
        Achievement Hall
      </Text>
    </group>
  );
}

function HallArchitecture({
  reducedMotion
}: Readonly<{ reducedMotion: boolean }>): React.ReactElement {
  const laurelRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (laurelRef.current && !reducedMotion) {
      laurelRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.18;
    }
  });

  return (
    <group>
      <mesh receiveShadow>
        <boxGeometry args={[68, 1.2, 54]} />
        <meshStandardMaterial color="#d8d4c8" metalness={0.12} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.72, 0]} receiveShadow>
        <boxGeometry args={[57, 0.28, 44]} />
        <meshStandardMaterial color="#40505a" metalness={0.3} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 9, -23.5]}>
        <boxGeometry args={[68, 18, 2.4]} />
        <meshStandardMaterial color="#bec5c5" metalness={0.2} roughness={0.48} />
      </mesh>
      {[-29, -19, -9, 9, 19, 29].map((x) => (
        <group key={x} position={[x, 8.5, -18.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.35, 1.65, 17, 12]} />
            <meshStandardMaterial color="#e5e1d7" metalness={0.14} roughness={0.5} />
          </mesh>
          <mesh position={[0, 8.8, 0]}>
            <boxGeometry args={[4.2, 1.1, 3.1]} />
            <meshStandardMaterial color="#c9b274" metalness={0.38} roughness={0.34} />
          </mesh>
        </group>
      ))}
      <group position={[0, 13.5, -19.5]} ref={laurelRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[6.2, 0.34, 10, 48, Math.PI * 1.55]} />
          <meshStandardMaterial color="#f0c766" emissive="#8a6418" emissiveIntensity={0.28} />
        </mesh>
        <mesh rotation={[0, Math.PI, -Math.PI / 2]}>
          <torusGeometry args={[6.2, 0.34, 10, 48, Math.PI * 1.55]} />
          <meshStandardMaterial color="#f0c766" emissive="#8a6418" emissiveIntensity={0.28} />
        </mesh>
      </group>
      <mesh position={[0, 5, -19.5]}>
        <octahedronGeometry args={[2.6, 0]} />
        <meshStandardMaterial
          color="#fff3bd"
          emissive="#f0c766"
          emissiveIntensity={0.5}
          metalness={0.24}
          roughness={0.22}
        />
      </mesh>
      <pointLight color="#f0c766" distance={120} intensity={1.9} position={[0, 16, -8]} />
    </group>
  );
}

function AchievementExhibits({
  exhibits,
  reducedMotion
}: Readonly<{
  exhibits: AchievementExhibitViewModel[];
  reducedMotion: boolean;
}>): React.ReactElement {
  return (
    <group>
      {exhibits.map((exhibit, index) => (
        <AchievementExhibit
          exhibit={exhibit}
          index={index}
          key={exhibit.id}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function AchievementExhibit({
  exhibit,
  index,
  reducedMotion
}: Readonly<{
  exhibit: AchievementExhibitViewModel;
  index: number;
  reducedMotion: boolean;
}>): React.ReactElement {
  const trophyRef = React.useRef<THREE.Group>(null);
  const scale = exhibit.rarity === "milestone" ? 1.25 : exhibit.rarity === "focused" ? 1.08 : 0.94;

  useFrame(({ clock }) => {
    if (trophyRef.current && !reducedMotion) {
      trophyRef.current.rotation.y = clock.elapsedTime * 0.18 + index * 0.35;
    }
  });

  return (
    <group position={exhibit.position}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[2.1, 2.6, 2.4, 8]} />
        <meshStandardMaterial color="#57636a" metalness={0.44} roughness={0.36} />
      </mesh>
      <group position={[0, 4.1, 0]} ref={trophyRef} scale={scale}>
        <TrophyShape accent={exhibit.accent} rarity={exhibit.rarity} />
      </group>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#fff7e8"
        fontSize={0.24}
        maxWidth={5.8}
        position={[0, -0.35, 0]}
        textAlign="center"
      >
        {exhibit.title}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color={exhibit.accent}
        fontSize={0.17}
        maxWidth={5.6}
        position={[0, -0.72, 0]}
        textAlign="center"
      >
        {`${exhibit.categoryLabel} - ${exhibit.pointsLabel}`}
      </Text>
    </group>
  );
}

function TrophyShape({
  accent,
  rarity
}: Readonly<{
  accent: string;
  rarity: AchievementExhibitViewModel["rarity"];
}>): React.ReactElement {
  const material = (
    <meshStandardMaterial
      color={accent}
      emissive={accent}
      emissiveIntensity={0.34}
      metalness={0.4}
      roughness={0.25}
    />
  );

  if (rarity === "milestone") {
    return (
      <mesh castShadow>
        <dodecahedronGeometry args={[1.7, 0]} />
        {material}
      </mesh>
    );
  }
  if (rarity === "focused") {
    return (
      <mesh castShadow>
        <octahedronGeometry args={[1.8, 0]} />
        {material}
      </mesh>
    );
  }
  return (
    <mesh castShadow>
      <icosahedronGeometry args={[1.55, 0]} />
      {material}
    </mesh>
  );
}

function CertificateGallery({
  plaques
}: Readonly<{ plaques: CertificatePlaqueViewModel[] }>): React.ReactElement {
  return (
    <group position={[0, 10, -22.1]}>
      {plaques.map((plaque, index) => {
        const x = (index - (plaques.length - 1) / 2) * 8.4;
        return (
          <group key={plaque.id} position={[x, index % 2 === 0 ? 0 : 5.2, 0]}>
            <mesh>
              <boxGeometry args={[7.2, 4.2, 0.32]} />
              <meshStandardMaterial color="#243541" metalness={0.34} roughness={0.38} />
            </mesh>
            <mesh position={[0, 0, 0.2]}>
              <boxGeometry args={[6.65, 3.65, 0.08]} />
              <meshStandardMaterial color="#f0c766" emissive="#765614" emissiveIntensity={0.22} />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#fff8e7"
              fontSize={0.2}
              maxWidth={5.9}
              position={[0, 0, 0.27]}
              textAlign="center"
            >
              {plaque.title}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function CompletedProjectGallery({
  exhibits
}: Readonly<{ exhibits: CompletedProjectExhibitViewModel[] }>): React.ReactElement {
  return (
    <group position={[-27, 1.2, 0]}>
      {exhibits.map((exhibit, index) => (
        <group key={exhibit.id} position={[0, 0, index * 8 - (exhibits.length - 1) * 4]}>
          <mesh castShadow position={[0, 2.4, 0]}>
            <boxGeometry args={[5, 4.2, 5]} />
            <meshStandardMaterial color="#ffb066" metalness={0.32} roughness={0.38} />
          </mesh>
          <mesh position={[0, 5.4, 0]}>
            <cylinderGeometry args={[1.4, 2.1, 2.2, 6]} />
            <meshStandardMaterial color="#f0c766" emissive="#8a6418" emissiveIntensity={0.25} />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#fff4df"
            fontSize={0.21}
            maxWidth={5.8}
            position={[0, -0.5, 0]}
            textAlign="center"
          >
            {exhibit.name}
          </Text>
        </group>
      ))}
    </group>
  );
}

function WorldUnlockGallery({
  exhibits,
  reducedMotion
}: Readonly<{
  exhibits: WorldUnlockExhibitViewModel[];
  reducedMotion: boolean;
}>): React.ReactElement {
  const groupRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.1;
    }
  });

  return (
    <group position={[27, 4.2, 0]} ref={groupRef}>
      {exhibits.map((exhibit, index) => (
        <group key={exhibit.id} position={[0, 0, index * 7 - (exhibits.length - 1) * 3.5]}>
          <mesh castShadow>
            <octahedronGeometry args={[1.8, 0]} />
            <meshStandardMaterial color="#b8a7ff" emissive="#6d5ac7" emissiveIntensity={0.45} />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#f1ebff"
            fontSize={0.18}
            maxWidth={5.5}
            position={[0, -2.6, 0]}
            textAlign="center"
          >
            {exhibit.locationLabel}
          </Text>
        </group>
      ))}
    </group>
  );
}
