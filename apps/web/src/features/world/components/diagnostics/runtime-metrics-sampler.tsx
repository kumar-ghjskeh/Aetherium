import { useFrame, useThree } from "@react-three/fiber";
import React from "react";

import type { WorldRuntimeMetrics } from "./runtime-diagnostics-panel";

export function RuntimeMetricsSampler({
  onMetrics
}: Readonly<{
  onMetrics: (metrics: WorldRuntimeMetrics) => void;
}>): null {
  const { gl, scene } = useThree();
  const frames = React.useRef(0);
  const elapsedSeconds = React.useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    elapsedSeconds.current += delta;

    if (elapsedSeconds.current < 0.5) {
      return;
    }

    const fps = frames.current / elapsedSeconds.current;
    onMetrics({
      activeObjects: scene.children.length,
      drawCalls: gl.info.render.calls,
      fps,
      frameTimeMs: 1000 / Math.max(fps, 1),
      pixelRatio: gl.getPixelRatio(),
      triangles: gl.info.render.triangles
    });

    frames.current = 0;
    elapsedSeconds.current = 0;
  });

  return null;
}
