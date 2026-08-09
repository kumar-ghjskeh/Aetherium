import type { WorldFeatureFlags, WorldSceneManifest } from "@aetherium/shared-types";

export type WorldRuntimeReadinessStatus = "checking" | "ready" | "fallback";

export type WorldRuntimeFallbackReason =
  "backend_flag_disabled" | "manifest_disabled" | "reduced_motion" | "unsupported_webgl2";

export interface WorldRuntimeReadiness {
  message: string;
  reason: WorldRuntimeFallbackReason | null;
  status: WorldRuntimeReadinessStatus;
}

export interface WorldRuntimeReadinessInput {
  featureFlags: WorldFeatureFlags | null;
  sceneManifest: WorldSceneManifest | null;
  systemReducedMotion: boolean;
  userReducedMotion: boolean;
  webgl2Supported: boolean | null;
}

export function detectWebGL2Support(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2");
  return context !== null;
}

export function resolveWorldRuntimeReadiness({
  featureFlags,
  sceneManifest,
  systemReducedMotion,
  userReducedMotion,
  webgl2Supported
}: WorldRuntimeReadinessInput): WorldRuntimeReadiness {
  if (featureFlags === null || sceneManifest === null || webgl2Supported === null) {
    return {
      message: "Checking visual World Mode capabilities.",
      reason: null,
      status: "checking"
    };
  }

  if (!featureFlags.visualWorldEnabled) {
    return {
      message: "The Aetherium backend has not enabled visual World Mode for this account.",
      reason: "backend_flag_disabled",
      status: "fallback"
    };
  }

  if (!sceneManifest.visualRuntimeAvailable) {
    return {
      message: "The scene manifest does not expose a visual runtime yet.",
      reason: "manifest_disabled",
      status: "fallback"
    };
  }

  if (userReducedMotion || systemReducedMotion) {
    return {
      message: "Reduced motion is enabled, so Command Mode remains the active interface.",
      reason: "reduced_motion",
      status: "fallback"
    };
  }

  if (!webgl2Supported) {
    return {
      message: "This browser did not provide a WebGL2 context.",
      reason: "unsupported_webgl2",
      status: "fallback"
    };
  }

  return {
    message: "Diagnostic visual runtime is ready.",
    reason: null,
    status: "ready"
  };
}
