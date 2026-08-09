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

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 horizonColor;
  uniform vec3 zenithColor;
  varying vec3 vWorldPosition;

  void main() {
    float height = normalize(vWorldPosition - cameraPosition).y;
    float blend = smoothstep(-0.12, 0.72, height);
    gl_FragColor = vec4(mix(horizonColor, zenithColor, blend), 1.0);
  }
`;

export function DynamicWorldAtmosphere({
  graphicsPreset,
  particlesEnabled,
  reducedMotion,
  timeMode,
  weatherEnabled,
  weatherMode
}: Readonly<{
  graphicsPreset: PerformancePreset;
  particlesEnabled: boolean;
  reducedMotion: boolean;
  timeMode: WorldTimeMode;
  weatherEnabled: boolean;
  weatherMode: WorldWeatherMode;
}>): React.ReactElement {
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const skyMeshRef = React.useRef<THREE.Mesh>(null);
  const sunMeshRef = React.useRef<THREE.Mesh>(null);
  const sunHaloMeshRef = React.useRef<THREE.Mesh>(null);
  const sunMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const sunHaloMaterialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const sunLightRef = React.useRef<THREE.DirectionalLight>(null);
  const hemisphereLightRef = React.useRef<THREE.HemisphereLight>(null);
  const ambientLightRef = React.useRef<THREE.AmbientLight>(null);
  const backgroundColor = React.useMemo(() => new THREE.Color("#07101f"), []);
  const horizonColor = React.useMemo(() => new THREE.Color("#69a8c2"), []);
  const sunDirection = React.useMemo(() => new THREE.Vector3(), []);
  const sunTarget = React.useMemo(() => new THREE.Object3D(), []);
  const sunWorldPosition = React.useMemo(() => new THREE.Vector3(), []);
  const zenithColor = React.useMemo(() => new THREE.Color("#17445b"), []);
  const skyUniforms = React.useMemo(
    () => ({
      horizonColor: { value: horizonColor },
      zenithColor: { value: zenithColor }
    }),
    [horizonColor, zenithColor]
  );
  const fog = React.useMemo(
    () =>
      new THREE.Fog(
        "#0a1622",
        graphicsPreset === "low" ? 170 : 230,
        graphicsPreset === "low" ? 620 : 900
      ),
    [graphicsPreset]
  );

  React.useEffect(() => {
    scene.background = backgroundColor;
    scene.fog = fog;
    scene.add(sunTarget);
    if (sunLightRef.current) {
      sunLightRef.current.target = sunTarget;
    }
    return () => {
      if (scene.background === backgroundColor) {
        scene.background = null;
      }
      if (scene.fog === fog) {
        scene.fog = null;
      }
      scene.remove(sunTarget);
    };
  }, [backgroundColor, fog, scene, sunTarget]);

  useFrame(({ clock }) => {
    const effectiveTimeMode = reducedMotion && timeMode === "cycle" ? "day" : timeMode;
    const snapshot = resolveWorldTimeSnapshot(
      resolveWorldTimeFraction({ elapsedSeconds: clock.elapsedTime, mode: effectiveTimeMode })
    );
    backgroundColor.set(snapshot.backgroundColor);
    fog.color.set(snapshot.fogColor);

    if (skyMeshRef.current) {
      skyMeshRef.current.position.copy(camera.position);
    }

    horizonColor.set(snapshot.skyColor);
    zenithColor.set(snapshot.backgroundColor);
    if (sunMaterialRef.current) {
      sunMaterialRef.current.color.set(snapshot.sunColor);
    }
    if (sunHaloMaterialRef.current) {
      sunHaloMaterialRef.current.color.set(snapshot.sunColor);
      sunHaloMaterialRef.current.opacity = snapshot.phase === "day" ? 0.09 : 0.05;
    }
    sunDirection.set(...snapshot.sunPosition).normalize();
    if (sunDirection.y < 0.18) {
      sunDirection
        .set(-sunDirection.x, Math.abs(sunDirection.y) + 0.3, -sunDirection.z)
        .normalize();
    }
    sunWorldPosition.copy(camera.position).addScaledVector(sunDirection, 520);
    if (sunMeshRef.current) {
      sunMeshRef.current.position.copy(sunWorldPosition);
    }
    if (sunHaloMeshRef.current) {
      sunHaloMeshRef.current.position.copy(sunWorldPosition);
    }
    if (sunLightRef.current) {
      sunLightRef.current.color.set(snapshot.sunColor);
      sunLightRef.current.intensity = snapshot.sunIntensity;
      sunTarget.position.set(camera.position.x, camera.position.y - 4, camera.position.z);
      sunTarget.updateMatrixWorld();
      sunLightRef.current.position.copy(sunTarget.position).addScaledVector(sunDirection, 180);
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
      <mesh frustumCulled={false} ref={skyMeshRef} scale={720}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial
          depthWrite={false}
          fragmentShader={SKY_FRAGMENT_SHADER}
          side={THREE.BackSide}
          uniforms={skyUniforms}
          vertexShader={SKY_VERTEX_SHADER}
        />
      </mesh>
      <mesh frustumCulled={false} ref={sunMeshRef} scale={13}>
        <sphereGeometry args={[1, 20, 12]} />
        <meshBasicMaterial fog={false} ref={sunMaterialRef} />
      </mesh>
      <mesh frustumCulled={false} ref={sunHaloMeshRef} scale={24}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          opacity={0.08}
          ref={sunHaloMaterialRef}
          transparent
        />
      </mesh>
      <hemisphereLight color="#dfefff" groundColor="#21322e" ref={hemisphereLightRef} />
      <directionalLight
        castShadow={graphicsPreset !== "low"}
        ref={sunLightRef}
        shadow-bias={-0.0004}
        shadow-camera-far={420}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-mapSize-height={graphicsPreset === "high" ? 2048 : 1024}
        shadow-mapSize-width={graphicsPreset === "high" ? 2048 : 1024}
      />
      <directionalLight color="#87aac0" intensity={0.28} position={[-180, 110, -140]} />
      <ambientLight ref={ambientLightRef} />
      <WorldWeatherLayers
        graphicsPreset={graphicsPreset}
        particlesEnabled={particlesEnabled}
        reducedMotion={reducedMotion}
        weatherEnabled={weatherEnabled}
        weatherMode={weatherMode}
      />
    </>
  );
}

function WorldWeatherLayers({
  graphicsPreset,
  particlesEnabled,
  reducedMotion,
  weatherEnabled,
  weatherMode
}: Readonly<{
  graphicsPreset: PerformancePreset;
  particlesEnabled: boolean;
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
          count: particlesEnabled ? budget.rainDropCount : 0,
          height: [30, 160],
          radius: 360,
          seed: ATMOSPHERE_SEED + 41
        }),
        3
      )
    );
    return geometry;
  }, [budget.rainDropCount, particlesEnabled]);

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

      {particlesEnabled && budget.rainDropCount > 0 ? (
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
