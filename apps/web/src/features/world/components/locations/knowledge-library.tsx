import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";

import {
  buildKnowledgeLibraryViewModel,
  type KnowledgeLibraryFileDisplay,
  type KnowledgeLibraryOverviewData
} from "../../engine/knowledge-library-system";
import { sampleTerrain } from "../../engine/terrain-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";

const LIBRARY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "knowledge-library"
);

const FILE_TONE_COLORS: Record<KnowledgeLibraryFileDisplay["tone"], string> = {
  failed: "#ffb55e",
  favorite: "#f0c766",
  processing: "#82e6f0",
  ready: "#7d68ff",
  standard: "#b8c7d5"
};

export function KnowledgeLibraryDistrict({
  overview,
  reducedMotion
}: Readonly<{
  overview: KnowledgeLibraryOverviewData;
  reducedMotion: boolean;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildKnowledgeLibraryViewModel(overview), [overview]);
  const location = LIBRARY_LOCATION;

  if (!location) {
    return null;
  }

  const [x, , z] = location.position;
  const terrain = sampleTerrain(x, z);

  return (
    <group position={[x, terrain.height + 0.42, z]} rotation={location.rotation}>
      <LibraryExterior
        readyFileCount={viewModel.featuredFiles.length}
        reducedMotion={reducedMotion}
      />
      <InstancedLibraryTablets slotCount={viewModel.displaySlotCount} />
      <CollectionShelves collections={viewModel.collections} />
      <FeaturedFileDisplays files={viewModel.featuredFiles} />
      <TagConstellation tags={viewModel.tagLabels} />
      <Text
        anchorX="center"
        anchorY="middle"
        color="#d9f4ff"
        fontSize={1.7}
        maxWidth={34}
        position={[0, 10.7, -16.5]}
        textAlign="center"
      >
        Knowledge Library
      </Text>
    </group>
  );
}

function LibraryExterior({
  readyFileCount,
  reducedMotion
}: Readonly<{
  readyFileCount: number;
  reducedMotion: boolean;
}>): React.ReactElement {
  const ringRef = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ringRef.current || reducedMotion) {
      return;
    }
    ringRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group>
      <mesh receiveShadow>
        <cylinderGeometry args={[34, 39, 1.4, 96]} />
        <meshStandardMaterial color="#1d2c38" metalness={0.18} roughness={0.56} />
      </mesh>
      <mesh castShadow position={[0, 4.1, -5.5]}>
        <boxGeometry args={[46, 8.2, 24]} />
        <meshStandardMaterial color="#293b48" metalness={0.16} roughness={0.52} />
      </mesh>
      <mesh castShadow position={[0, 11.2, -5.5]}>
        <sphereGeometry args={[16.5, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#35556a"
          emissive="#0a2534"
          emissiveIntensity={0.18}
          metalness={0.22}
          roughness={0.28}
        />
      </mesh>
      <mesh castShadow position={[0, 5.7, -17.7]}>
        <boxGeometry args={[14, 9.6, 2.6]} />
        <meshStandardMaterial color="#3d5262" metalness={0.18} roughness={0.5} />
      </mesh>
      <mesh position={[0, 5.3, -19.1]}>
        <boxGeometry args={[9.6, 6.4, 0.18]} />
        <meshStandardMaterial
          color="#8be8ff"
          emissive="#1c6f86"
          emissiveIntensity={0.42}
          metalness={0.16}
          roughness={0.22}
        />
      </mesh>
      <group ref={ringRef} position={[0, 15.2, -5.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[18.8, 0.18, 8, 128]} />
          <meshStandardMaterial color="#8be8ff" emissive="#237486" emissiveIntensity={0.36} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2.7]}>
          <torusGeometry args={[12.8, 0.13, 8, 96]} />
          <meshStandardMaterial color="#b9a8ff" emissive="#4a31d8" emissiveIntensity={0.32} />
        </mesh>
      </group>
      <LibraryColumns />
      <pointLight
        color="#83dff2"
        distance={80}
        intensity={Math.min(2.1, 0.8 + readyFileCount * 0.08)}
        position={[0, 10, -18]}
      />
    </group>
  );
}

function LibraryColumns(): React.ReactElement {
  return (
    <group>
      {[-18, -10, 10, 18].map((x) => (
        <mesh castShadow key={x} position={[x, 4.8, -18.8]}>
          <cylinderGeometry args={[0.7, 0.9, 8.6, 16]} />
          <meshStandardMaterial color="#556b78" metalness={0.12} roughness={0.58} />
        </mesh>
      ))}
    </group>
  );
}

function InstancedLibraryTablets({
  slotCount
}: Readonly<{
  slotCount: number;
}>): React.ReactElement {
  const tabletRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  React.useLayoutEffect(() => {
    if (!tabletRef.current) {
      return;
    }

    for (let index = 0; index < slotCount; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const shelf = Math.floor(index / 2) % 16;
      const row = Math.floor(index / 32);
      dummy.position.set(side * (12 + shelf * 0.7), 2.2 + row * 1.12, 5.6 + shelf * 0.06);
      dummy.rotation.set(0, side * 0.12, 0);
      dummy.scale.set(0.82, 0.82 + (index % 5) * 0.04, 0.82);
      dummy.updateMatrix();
      tabletRef.current.setMatrixAt(index, dummy.matrix);
    }
    tabletRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, slotCount]);

  return (
    <instancedMesh args={[undefined, undefined, slotCount]} ref={tabletRef}>
      <boxGeometry args={[0.36, 1.05, 0.12]} />
      <meshStandardMaterial color="#6f8190" metalness={0.2} roughness={0.48} />
    </instancedMesh>
  );
}

function CollectionShelves({
  collections
}: Readonly<{
  collections: ReturnType<typeof buildKnowledgeLibraryViewModel>["collections"];
}>): React.ReactElement {
  return (
    <group>
      {collections.map((collection) => (
        <group key={collection.id} position={collection.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[5.4, 1.8, 1]} />
            <meshStandardMaterial color="#22303b" metalness={0.2} roughness={0.54} />
          </mesh>
          <mesh position={[0, 0.18, -0.56]}>
            <boxGeometry args={[4.7, 0.72, 0.08]} />
            <meshStandardMaterial
              color="#8be8ff"
              emissive="#195f73"
              emissiveIntensity={0.32}
              metalness={0.16}
              roughness={0.26}
            />
          </mesh>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#edf9fb"
            fontSize={0.34}
            maxWidth={4.2}
            position={[0, 0.22, -0.65]}
            textAlign="center"
          >
            {collection.label}
          </Text>
          <Text
            anchorX="center"
            anchorY="middle"
            color="#b9d7df"
            fontSize={0.22}
            maxWidth={4.3}
            position={[0, -0.18, -0.66]}
            textAlign="center"
          >
            {collection.fileCount} files
          </Text>
        </group>
      ))}
    </group>
  );
}

function FeaturedFileDisplays({
  files
}: Readonly<{
  files: KnowledgeLibraryFileDisplay[];
}>): React.ReactElement {
  return (
    <group>
      {files.map((file) => {
        const color = FILE_TONE_COLORS[file.tone];
        return (
          <group key={file.id} position={file.position}>
            <mesh castShadow rotation={[0.08, 0, 0]}>
              <boxGeometry args={[1.45, 2.05, 0.22]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={file.tone === "failed" ? 0.28 : 0.42}
                metalness={0.18}
                roughness={0.26}
              />
            </mesh>
            <mesh position={[0, -1.22, 0.08]}>
              <cylinderGeometry args={[0.8, 1.05, 0.18, 20]} />
              <meshStandardMaterial color="#263540" metalness={0.16} roughness={0.55} />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#eef7fb"
              fontSize={0.22}
              maxWidth={3.2}
              position={[0, 1.35, 0]}
              textAlign="center"
            >
              {file.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function TagConstellation({
  tags
}: Readonly<{
  tags: string[];
}>): React.ReactElement {
  return (
    <group position={[0, 8.2, 8]}>
      {tags.slice(0, 8).map((tag, index) => {
        const angle = (index / Math.max(tags.length, 1)) * Math.PI * 2;
        return (
          <group
            key={tag}
            position={[Math.sin(angle) * 9.5, Math.cos(angle * 1.7) * 1.4, Math.cos(angle) * 4.6]}
          >
            <mesh>
              <octahedronGeometry args={[0.48, 1]} />
              <meshStandardMaterial
                color="#b9a8ff"
                emissive="#4a31d8"
                emissiveIntensity={0.42}
                metalness={0.18}
                roughness={0.28}
              />
            </mesh>
            <Text
              anchorX="center"
              anchorY="middle"
              color="#d9f4ff"
              fontSize={0.2}
              maxWidth={3.2}
              position={[0, -0.92, 0]}
              textAlign="center"
            >
              {tag}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
