import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import {
  buildPersonalSanctuaryViewModel,
  type PersonalSanctuaryOverviewData,
  type SanctuaryAvatarViewModel,
  type SanctuaryRecordViewModel,
  type SanctuaryStatusViewModel
} from "../../engine/personal-sanctuary-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const SANCTUARY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "personal-sanctuary"
);

export function PersonalSanctuaryDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: PersonalSanctuaryOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildPersonalSanctuaryViewModel(overview), [overview]);
  const location = SANCTUARY_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.7, z]} rotation={location.rotation}>
      <SanctuaryArchitecture />
      <AvatarFocus
        avatar={viewModel.avatar}
        displayName={viewModel.displayName}
        headline={viewModel.headline}
        reducedMotion={reducedMotion}
      />
      <RecordAlcove
        accent="#ffb066"
        heading="Favorite projects"
        position={[-22, 1.5, 4]}
        records={viewModel.favoriteProjects}
      />
      <RecordAlcove
        accent="#82b6ff"
        heading="Favorite resources"
        position={[22, 1.5, 4]}
        records={viewModel.favoriteResources}
      />
      <CertificateWalk records={viewModel.certificates} />
      <ProfileLinkMarkers records={viewModel.links} />
      <PrivacyCircle statuses={viewModel.privacyStatuses} />
      <SettingsBeacons statuses={viewModel.settingStatuses} />
      <Text
        anchorX="center"
        anchorY="middle"
        color="#f8fbff"
        fontSize={1.45}
        maxWidth={26}
        position={[0, 18.8, -17]}
        textAlign="center"
      >
        Personal Sanctuary
      </Text>
    </group>
  );
}

function SanctuaryArchitecture(): React.ReactElement {
  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[36, 39, 1.4, 48]} />
        <meshStandardMaterial color="#d7d8d1" metalness={0.08} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.82, 0]} receiveShadow>
        <cylinderGeometry args={[31, 34, 0.28, 48]} />
        <meshStandardMaterial color="#293943" metalness={0.22} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13, 29, 48]} />
        <meshStandardMaterial
          color="#2b8999"
          emissive="#0a3944"
          emissiveIntensity={0.22}
          metalness={0.12}
          opacity={0.52}
          roughness={0.22}
          transparent
        />
      </mesh>
      <mesh position={[0, 1.14, 0]} receiveShadow>
        <cylinderGeometry args={[12, 13, 0.46, 36]} />
        <meshStandardMaterial color="#e7e4db" metalness={0.12} roughness={0.55} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        const px = Math.cos(angle) * 25.5;
        const pz = Math.sin(angle) * 25.5;
        return (
          <group key={index} position={[px, 7, pz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.78, 1.12, 12, 10]} />
              <meshStandardMaterial color="#d8d8cf" metalness={0.12} roughness={0.6} />
            </mesh>
            <mesh position={[0, 6.1, 0]}>
              <sphereGeometry args={[1.05, 16, 10]} />
              <meshStandardMaterial color="#91d8df" emissive="#276b75" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 13.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[25.5, 0.72, 10, 64]} />
        <meshStandardMaterial color="#a7bec2" metalness={0.35} roughness={0.32} />
      </mesh>
      <mesh castShadow position={[0, 15.2, 0]}>
        <cylinderGeometry args={[3, 8.5, 2.2, 8, 1, true]} />
        <meshStandardMaterial
          color="#c9f3f6"
          emissive="#295c66"
          emissiveIntensity={0.2}
          metalness={0.16}
          opacity={0.7}
          roughness={0.2}
          transparent
        />
      </mesh>
      <pointLight color="#8de8ed" distance={115} intensity={1.55} position={[0, 15, 0]} />
    </group>
  );
}

function AvatarFocus({
  avatar,
  displayName,
  headline,
  reducedMotion
}: Readonly<{
  avatar: SanctuaryAvatarViewModel;
  displayName: string;
  headline: string;
  reducedMotion: boolean;
}>): React.ReactElement {
  const avatarRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (avatarRef.current && !reducedMotion) {
      avatarRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.24;
      avatarRef.current.position.y = 5.3 + Math.sin(clock.elapsedTime * 0.65) * 0.22;
    }
  });

  return (
    <group>
      <mesh castShadow position={[0, 2.25, 0]}>
        <cylinderGeometry args={[4.4, 5.4, 2.2, 12]} />
        <meshStandardMaterial color="#52626a" metalness={0.3} roughness={0.4} />
      </mesh>
      <group position={[0, 5.3, 0]} ref={avatarRef}>
        <AvatarShape avatar={avatar} />
        <mesh position={[0, -2.6, 0]}>
          <cylinderGeometry args={[1.05, 1.65, 3.4, 8]} />
          <meshStandardMaterial color="#1d2936" metalness={0.28} roughness={0.46} />
        </mesh>
        <mesh position={[0, -4, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[2.6, 5.2, 10]} />
          <meshStandardMaterial color="#222d3b" metalness={0.18} roughness={0.58} />
        </mesh>
      </group>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        fontSize={0.65}
        maxWidth={12}
        position={[0, 1.02, 5.8]}
        textAlign="center"
      >
        {displayName}
      </Text>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#b9dfe4"
        fontSize={0.27}
        maxWidth={13}
        position={[0, 0.68, 6.2]}
        textAlign="center"
      >
        {headline}
      </Text>
    </group>
  );
}

function AvatarShape({
  avatar
}: Readonly<{ avatar: SanctuaryAvatarViewModel }>): React.ReactElement {
  const material = (
    <meshStandardMaterial
      color={avatar.accent}
      emissive={avatar.accent}
      emissiveIntensity={0.32}
      metalness={0.24}
      roughness={0.25}
    />
  );

  if (avatar.shape === "orb") {
    return (
      <mesh castShadow>
        <sphereGeometry args={[1.55, 20, 14]} />
        {material}
      </mesh>
    );
  }
  if (avatar.shape === "prism") {
    return (
      <mesh castShadow>
        <dodecahedronGeometry args={[1.65, 0]} />
        {material}
      </mesh>
    );
  }
  return (
    <mesh castShadow>
      <octahedronGeometry args={[1.75, 0]} />
      {material}
    </mesh>
  );
}

function RecordAlcove({
  accent,
  heading,
  position,
  records
}: Readonly<{
  accent: string;
  heading: string;
  position: [number, number, number];
  records: SanctuaryRecordViewModel[];
}>): React.ReactElement {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 4.5, 0]}>
        <boxGeometry args={[12, 9, 2]} />
        <meshStandardMaterial color="#34444e" metalness={0.23} roughness={0.5} />
      </mesh>
      <mesh position={[0, 8.6, 0]}>
        <boxGeometry args={[12.8, 0.42, 2.6]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} />
      </mesh>
      <Text
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        fontSize={0.34}
        maxWidth={10}
        position={[0, 7.5, 1.08]}
        textAlign="center"
      >
        {heading}
      </Text>
      {records.slice(0, 4).map((record, index) => (
        <group key={record.id} position={[0, 5.7 - index * 1.65, 1.16]}>
          <mesh>
            <boxGeometry args={[9.8, 1.05, 0.18]} />
            <meshStandardMaterial color="#182631" metalness={0.12} roughness={0.62} />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#e8f2f5"
            fontSize={0.19}
            maxWidth={8.8}
            position={[0, 0, 0.12]}
            textAlign="center"
          >
            {record.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function CertificateWalk({
  records
}: Readonly<{ records: SanctuaryRecordViewModel[] }>): React.ReactElement {
  return (
    <group position={[0, 1.6, -22]}>
      {records.slice(0, 5).map((record, index) => {
        const x = (index - (records.length - 1) / 2) * 6.2;
        return (
          <group key={record.id} position={[x, 2.8, 0]}>
            <mesh castShadow>
              <boxGeometry args={[5.2, 5.4, 0.9]} />
              <meshStandardMaterial color="#607076" metalness={0.24} roughness={0.42} />
            </mesh>
            <mesh position={[0, 0.25, 0.5]}>
              <circleGeometry args={[1.45, 20]} />
              <meshStandardMaterial color="#f0c766" emissive="#765614" emissiveIntensity={0.28} />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#fff7df"
              fontSize={0.15}
              maxWidth={4.5}
              position={[0, -2, 0.51]}
              textAlign="center"
            >
              {record.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function ProfileLinkMarkers({
  records
}: Readonly<{ records: SanctuaryRecordViewModel[] }>): React.ReactElement {
  return (
    <group position={[0, 1.7, 17]}>
      {records.slice(0, 4).map((record, index) => {
        const x = (index - (records.length - 1) / 2) * 5.8;
        return (
          <group key={record.id} position={[x, 1.3, 0]}>
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.2, 0.28, 8, 20]} />
              <meshStandardMaterial color="#b8a7ff" emissive="#4f4288" emissiveIntensity={0.26} />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#eee9ff"
              fontSize={0.13}
              maxWidth={4.6}
              position={[0, -2, 0]}
              textAlign="center"
            >
              {record.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function PrivacyCircle({
  statuses
}: Readonly<{ statuses: SanctuaryStatusViewModel[] }>): React.ReactElement {
  return (
    <group position={[-10, 1.7, 20]}>
      {statuses.map((status, index) => {
        const x = index * 6.5 - (statuses.length - 1) * 3.25;
        const accent = status.enabled ? "#77d98b" : "#9aa9b2";
        return (
          <group key={status.label} position={[x, 1.9, 0]}>
            <mesh castShadow rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[2.8, 2.8, 0.62]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#f4fbf7"
              fontSize={0.13}
              maxWidth={4.8}
              position={[0, -2.6, 0]}
              textAlign="center"
            >
              {`${status.label}: ${status.value}`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function SettingsBeacons({
  statuses
}: Readonly<{ statuses: SanctuaryStatusViewModel[] }>): React.ReactElement {
  return (
    <group position={[0, 1.45, 29]}>
      {statuses.map((status, index) => {
        const x = (index - (statuses.length - 1) / 2) * 5.4;
        return (
          <group key={status.label} position={[x, 1.6, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.7, 1.2, 3.2, 8]} />
              <meshStandardMaterial
                color={status.enabled ? "#91d8df" : "#66757c"}
                emissive={status.enabled ? "#276b75" : "#202b30"}
                emissiveIntensity={0.24}
              />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#e9f6f7"
              fontSize={0.12}
              maxWidth={4.5}
              position={[0, -2.25, 0]}
              textAlign="center"
            >
              {`${status.label}: ${status.value}`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
