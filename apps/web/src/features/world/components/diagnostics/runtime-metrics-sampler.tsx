import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import React from "react";
import * as THREE from "three";

import {
  advanceAutomaticPerformance,
  createAutomaticPerformanceState,
  estimateSceneTriangles,
  resolveGraphicsPresetSettings,
  resolvePerformanceWarning,
  resolveTargetPixelRatio,
  type AutomaticPerformanceState,
  type WorldRuntimeMetrics
} from "../../engine/performance-manager";
import { useWorldPerformanceStore } from "../../state/performance-store";
import { useWorldSettingsStore } from "../../state/settings-store";

interface ChromiumPerformanceMemory {
  usedJSHeapSize: number;
}

function readUsedJsHeapMb(): number | null {
  const browserPerformance = performance as Performance & {
    memory?: ChromiumPerformanceMemory;
  };
  return browserPerformance.memory
    ? browserPerformance.memory.usedJSHeapSize / (1024 * 1024)
    : null;
}

export function RuntimeMetricsSampler(): null {
  const { camera, gl, scene } = useThree();
  const { world } = useRapier();
  const graphicsPreset = useWorldSettingsStore((state) => state.graphicsPreset);
  const effectiveTier = useWorldPerformanceStore((state) => state.effectiveTier);
  const setEffectiveTier = useWorldPerformanceStore((state) => state.setEffectiveTier);
  const setMetrics = useWorldPerformanceStore((state) => state.setMetrics);
  const automaticStateRef = React.useRef<AutomaticPerformanceState>(
    createAutomaticPerformanceState(1)
  );
  const frames = React.useRef(0);
  const elapsedSeconds = React.useRef(0);

  React.useEffect(() => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    if (graphicsPreset === "automatic") {
      const automaticState = createAutomaticPerformanceState(devicePixelRatio);
      automaticStateRef.current = automaticState;
      setEffectiveTier(automaticState.effectiveTier);
      gl.setPixelRatio(automaticState.pixelRatio);
      return;
    }

    const settings = resolveGraphicsPresetSettings(graphicsPreset);
    setEffectiveTier(settings.tier);
    gl.setPixelRatio(resolveTargetPixelRatio(devicePixelRatio, settings));
  }, [gl, graphicsPreset, setEffectiveTier]);

  React.useEffect(() => {
    const settings = resolveGraphicsPresetSettings(graphicsPreset, effectiveTier);
    camera.far = settings.viewDistance;
    camera.updateProjectionMatrix();
  }, [camera, effectiveTier, graphicsPreset]);

  useFrame((_, delta) => {
    frames.current += 1;
    elapsedSeconds.current += delta;

    if (elapsedSeconds.current < 0.75) {
      return;
    }

    const fps = frames.current / elapsedSeconds.current;
    let activeMeshes = 0;
    scene.traverse((object) => {
      if (object.visible && object instanceof THREE.Mesh) {
        activeMeshes += 1;
      }
    });
    const settings = resolveGraphicsPresetSettings(graphicsPreset, effectiveTier);
    const physicsBodies = world.bodies.len();
    const baseMetrics = {
      activeMeshes,
      drawCalls: gl.info.render.calls,
      fps,
      frameTimeMs: 1000 / Math.max(fps, 1),
      jsHeapUsedMb: readUsedJsHeapMb(),
      loadedAssets: gl.info.memory.geometries + gl.info.memory.textures,
      physicsBodies,
      pixelRatio: gl.getPixelRatio(),
      textureMemoryEstimateMb: gl.info.memory.textures * 4,
      triangles: estimateSceneTriangles(scene)
    };
    const memoryWarning = resolvePerformanceWarning(baseMetrics, settings);
    let metrics: WorldRuntimeMetrics = { ...baseMetrics, memoryWarning };

    if (graphicsPreset === "automatic") {
      const nextAutomaticState = advanceAutomaticPerformance(automaticStateRef.current, {
        fps: metrics.fps,
        frameTimeMs: metrics.frameTimeMs,
        memoryWarning: metrics.memoryWarning !== null
      });
      automaticStateRef.current = nextAutomaticState;
      if (gl.getPixelRatio() !== nextAutomaticState.pixelRatio) {
        gl.setPixelRatio(nextAutomaticState.pixelRatio);
      }
      if (effectiveTier !== nextAutomaticState.effectiveTier) {
        setEffectiveTier(nextAutomaticState.effectiveTier);
      }
      metrics = { ...metrics, pixelRatio: nextAutomaticState.pixelRatio };
    }

    setMetrics(metrics);
    frames.current = 0;
    elapsedSeconds.current = 0;
  });

  return null;
}
