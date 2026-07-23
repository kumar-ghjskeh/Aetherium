import { describe, expect, it } from "vitest";

import { resolveWorldRuntimeReadiness } from "./world-runtime";

const featureFlags = {
  commandModeFallbackRequired: true,
  dataContractsEnabled: true,
  reason: "Diagnostic runtime enabled.",
  sceneManifestEnabled: true,
  visualWorldEnabled: true
};

const sceneManifest = {
  implementationStatus: "runtime_foundation" as const,
  locations: [],
  manifestVersion: 1,
  visualRuntimeAvailable: true
};

describe("resolveWorldRuntimeReadiness", () => {
  it("returns ready when visual runtime requirements are met", () => {
    expect(
      resolveWorldRuntimeReadiness({
        featureFlags,
        sceneManifest,
        systemReducedMotion: false,
        userReducedMotion: false,
        webgl2Supported: true
      })
    ).toMatchObject({ reason: null, status: "ready" });
  });

  it("falls back when the backend visual flag is disabled", () => {
    expect(
      resolveWorldRuntimeReadiness({
        featureFlags: { ...featureFlags, visualWorldEnabled: false },
        sceneManifest,
        systemReducedMotion: false,
        userReducedMotion: false,
        webgl2Supported: true
      })
    ).toMatchObject({ reason: "backend_flag_disabled", status: "fallback" });
  });

  it("falls back for reduced motion", () => {
    expect(
      resolveWorldRuntimeReadiness({
        featureFlags,
        sceneManifest,
        systemReducedMotion: false,
        userReducedMotion: true,
        webgl2Supported: true
      })
    ).toMatchObject({ reason: "reduced_motion", status: "fallback" });
  });

  it("falls back when WebGL2 is unavailable", () => {
    expect(
      resolveWorldRuntimeReadiness({
        featureFlags,
        sceneManifest,
        systemReducedMotion: false,
        userReducedMotion: false,
        webgl2Supported: false
      })
    ).toMatchObject({ reason: "unsupported_webgl2", status: "fallback" });
  });
});
