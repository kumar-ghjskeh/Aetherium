import type { WorldFeatureFlags, WorldSceneManifest } from "@aetherium/shared-types";
import React from "react";

import {
  detectWebGL2Support,
  resolveWorldRuntimeReadiness,
  type WorldRuntimeReadiness
} from "../engine/world-runtime";

interface UseWorldRuntimeReadinessInput {
  checkVersion: number;
  featureFlags: WorldFeatureFlags | null;
  sceneManifest: WorldSceneManifest | null;
  userReducedMotion: boolean;
}

export function useWorldRuntimeReadiness({
  checkVersion,
  featureFlags,
  sceneManifest,
  userReducedMotion
}: UseWorldRuntimeReadinessInput): WorldRuntimeReadiness {
  const [systemReducedMotion, setSystemReducedMotion] = React.useState(false);
  const [webgl2Supported, setWebgl2Supported] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const mediaQuery =
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const updateReducedMotion = () => {
      setSystemReducedMotion(mediaQuery?.matches ?? false);
    };

    updateReducedMotion();
    setWebgl2Supported(detectWebGL2Support());

    mediaQuery?.addEventListener?.("change", updateReducedMotion);
    return () => {
      mediaQuery?.removeEventListener?.("change", updateReducedMotion);
    };
  }, [checkVersion]);

  return React.useMemo(
    () =>
      resolveWorldRuntimeReadiness({
        featureFlags,
        sceneManifest,
        systemReducedMotion,
        userReducedMotion,
        webgl2Supported
      }),
    [featureFlags, sceneManifest, systemReducedMotion, userReducedMotion, webgl2Supported]
  );
}
