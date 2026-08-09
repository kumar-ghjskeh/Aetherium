import type { PerformancePreset } from "@aetherium/shared-types";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import React from "react";

export function WorldPostProcessing({
  graphicsPreset,
  highContrast
}: Readonly<{
  graphicsPreset: PerformancePreset;
  highContrast: boolean;
}>): React.ReactElement | null {
  if (graphicsPreset === "low" || highContrast) {
    return null;
  }

  return (
    <EffectComposer depthBuffer={false} multisampling={0}>
      <Bloom
        intensity={graphicsPreset === "high" ? 0.34 : 0.24}
        luminanceSmoothing={0.22}
        luminanceThreshold={0.88}
        mipmapBlur
        radius={0.42}
      />
      <Vignette darkness={0.24} eskil={false} offset={0.18} />
    </EffectComposer>
  );
}
