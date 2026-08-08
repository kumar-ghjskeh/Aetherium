import type { PerformancePreset } from "@aetherium/shared-types";
import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";

import {
  resolveWorldTimeFraction,
  resolveWorldTimeSnapshot,
  type WorldTimeMode
} from "../../engine/time-manager";
import {
  createDeterministicAtmospherePoints,
  resolveWorldWeatherBudget,
  type WorldWeatherMode
} from "../../engine/weather-manager";

const ATMOSPHERE_SEED = 80421;

export function DynamicWorldAtmosphere({
  graphicsPreset,
  reducedMotion,
  timeMode,
  weatherEnabled,
  weatherMode
}: Readonly<{
  graphicsPreset: PerformancePreset;
  reducedMotion: boolean;
  timeMode: WorldTimeMode;
  weatherEnabled: boolean;
  weatherMode: WorldWeatherMode;
}>): React.ReactElement {
  const scene = useThree((state) => state.scene);
  const skyMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const sunMeshRef = React.useRef<THREE.Mesh>(null);
  const sunMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const sunLightRef = React.useRef<THREE.DirectionalLight>(null);
  const hemisphereLightRef = React.useRef<THREE.HemisphereLight>(null);
  const ambientLightRef = React.useRef<THREE.AmbientLight>(null);
  const backgroundColor = React.useMemo(() => new THREE.Color("#07101f"), []);
  const fog = React.useMemo(
    () => new THREE.Fog("#0a1622", 120, graphicsPreset === "low" ? 560 : 780),
    [graphicsPreset]
  );

  React.useEffect(() => {
    scene.background = backgroundColor;
    scene.fog = fog;
    return () => {
      if (scene.background === backgroundColor) {
        scene.background = null;
      }
      if (scene.fog === fog) {
        scene.fog = null;
      }
    };
  }, [backgroundColor, fog, scene]);

  useFrame(({ clock }) => {
    const effectiveTimeMode = reducedMotion && timeMode === "cycle" ? "day" : timeMode;
    const snapshot = resolveWorldTimeSnapshot(
      resolveWorldTimeFraction({ elapsedSeconds: clock.elapsedTime, mode: effectiveTimeMode })
    );
    backgroundColor.set(snapshot.backgroundColor);
    fog.color.set(snapshot.fogColor);

    if (skyMaterialRef.current) {
      skyMaterialRef.current.color.set(snapshot.skyColor);
    }
    if (sunMaterialRef.current) {
      sunMaterialRef.current.color.set(snapshot.sunColor);
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.position.set(...snapshot.sunPosition);
    }
    if (sunLightRef.current) {
      sunLightRef.current.color.set(snapshot.sunColor);
      sunLightRef.current.intensity = snapshot.sunIntensity;
      sunLightRef.current.position.set(...snapshot.sunPosition);
    }
    if (hemisphereLightRef.current) {
      hemisphereLightRef.current.intensity = snapshot.hemisphereIntensity;
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(snapshot.ambientColor);
      ambientLightRef.current.intensity = snapshot.ambientIntensity;
    }
  });

  return (
    <>
      <mesh frustumCulled={false} scale={720}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial fog={false} ref={skyMaterialRef} side={THREE.BackSide} />
      </mesh>
      <mesh frustumCulled={false} ref={sunMeshRef} scale={13}>
        <sphereGeometry args={[1, 20, 12]} />
        <meshBasicMaterial fog={false} ref={sunMaterialRef} />
      </mesh>
      <hemisphereLight color="#dfefff" groundColor="#21322e" ref={hemisphereLightRef} />
      <directionalLight
        castShadow={graphicsPreset === "high"}
        ref={sunLightRef}
        shadow-camera-far={420}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
      />
      <ambientLight ref={ambientLightRef} />
      <WorldWeatherLayers
        graphicsPreset={graphicsPreset}
        reducedMotion={reducedMotion}
        weatherEnabled={weatherEnabled}
        weatherMode={weatherMode}
      />
    </>
  );
}

function WorldWeatherLayers({
  graphicsPreset,
  reducedMotion,
  weatherEnabled,
  weatherMode
}: Readonly<{
  graphicsPreset: PerformancePreset;
  reducedMotion: boolean;
  weatherEnabled: boolean;
  weatherMode: WorldWeatherMode;
}>): React.ReactElement {
  const cloudRef = React.useRef<THREE.Group>(null);
  const rainRef = React.useRef<THREE.Points>(null);
  const timeBucket = Math.floor(new Date().getUTCHours() / 3);
  const budget = React.useMemo(
    () =>
      resolveWorldWeatherBudget({
        enabled: weatherEnabled,
        mode: weatherMode,
        performancePreset: graphicsPreset,
        reducedMotion,
        seed: ATMOSPHERE_SEED,
        timeBucket
      }),
    [graphicsPreset, reducedMotion, timeBucket, weatherEnabled, weatherMode]
  );
  const cloudPositions = React.useMemo(
    () =>
      createDeterministicAtmospherePoints({
        count: budget.cloudCount,
        height: [105, 185],
        radius: 330,
        seed: ATMOSPHERE_SEED + 11
      }),
    [budget.cloudCount]
  );
  const mistPositions = React.useMemo(
    () =>
      createDeterministicAtmospherePoints({
        count: budget.mistCount,
        height: [5, 24],
        radius: 300,
        seed: ATMOSPHERE_SEED + 23
      }),
    [budget.mistCount]
  );
  const rainGeometry = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        createDeterministicAtmospherePoints({
          count: budget.rainDropCount,
          height: [30, 160],
          radius: 360,
          seed: ATMOSPHERE_SEED + 41
        }),
        3
      )
    );
    return geometry;
  }, [budget.rainDropCount]);

  React.useEffect(
    () => () => {
      rainGeometry.dispose();
    },
    [rainGeometry]
  );

  useFrame(({ clock }, delta) => {
    if (!budget.animated) {
      return;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * budget.windStrength * 0.0025;
    }
    if (rainRef.current) {
      rainRef.current.position.y = -((clock.elapsedTime * 26) % 130);
      rainRef.current.position.x = Math.sin(clock.elapsedTime * 0.17) * budget.windStrength * 5;
    }
  });

  return (
    <>
      <group ref={cloudRef}>
        {Array.from({ length: budget.cloudCount }, (_, index) => (
          <mesh
            key={`atmosphere-cloud-${index}`}
            position={[
              cloudPositions[index * 3] ?? 0,
              cloudPositions[index * 3 + 1] ?? 0,
              cloudPositions[index * 3 + 2] ?? 0
            ]}
            scale={[28 + (index % 3) * 8, 7 + (index % 2) * 3, 15 + (index % 4) * 4]}
          >
            <sphereGeometry args={[1, 12, 6]} />
            <meshStandardMaterial
              color={budget.weather === "rain" ? "#84949f" : "#d8e5ef"}
              depthWrite={false}
              opacity={budget.weather === "clear" ? 0.1 : 0.2}
              roughness={1}
              transparent
            />
          </mesh>
        ))}
      </group>

      {Array.from({ length: budget.mistCount }, (_, index) => (
        <mesh
          key={`atmosphere-mist-${index}`}
          position={[
            mistPositions[index * 3] ?? 0,
            mistPositions[index * 3 + 1] ?? 0,
            mistPositions[index * 3 + 2] ?? 0
          ]}
          scale={[14 + (index % 4) * 4, 2.6, 8 + (index % 3) * 3]}
        >
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial
            color="#ccecf6"
            depthWrite={false}
            emissive="#184b58"
            emissiveIntensity={0.06}
            opacity={budget.weather === "mist" ? 0.16 : 0.07}
            transparent
          />
        </mesh>
      ))}

      {budget.rainDropCount > 0 ? (
        <points
          frustumCulled={false}
          geometry={rainGeometry}
          ref={rainRef}
          rotation={[0, 0, -0.08]}
        >
          <pointsMaterial
            color="#b9e6f0"
            depthWrite={false}
            opacity={0.52}
            size={0.42}
            sizeAttenuation
            transparent
          />
        </points>
      ) : null}
    </>
  );
}
