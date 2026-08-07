import type {
  UserPreferences,
  WorldDeepLinkPage,
  WorldLocationPage,
  WorldProfile,
  WorldSceneManifest
} from "@aetherium/shared-types";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import React from "react";
import type * as THREE from "three";

import { buildDiagnosticWorldInteractions } from "../../engine/interaction-manifest";
import { resolveGraphicsPresetSettings } from "../../engine/performance-manager";
import type { CentralPlazaOverviewData } from "../../engine/central-plaza-system";
import type { CodingArenaOverviewData } from "../../engine/coding-arena-system";
import type { AIObservatoryOverviewData } from "../../engine/ai-observatory-system";
import type { KnowledgeLibraryOverviewData } from "../../engine/knowledge-library-system";
import type { HabitGardenOverviewData } from "../../engine/habit-garden-system";
import type { LearningAcademyOverviewData } from "../../engine/learning-academy-system";
import { useWorldSettingsStore } from "../../state/settings-store";
import { WorldCameraRig } from "../camera/world-camera-rig";
import { PlayerController } from "../character/player-controller";
import { RuntimeMetricsSampler } from "../diagnostics/runtime-metrics-sampler";
import {
  DEFAULT_RUNTIME_METRICS,
  RuntimeDiagnosticsPanel,
  type WorldRuntimeMetrics
} from "../diagnostics/runtime-diagnostics-panel";
import { WorldEnvironmentScene } from "../environments/world-environment-scene";
import { WorldInteractionPrompt } from "../interactions/world-interaction-prompt";
import { WorldInteractionSystem } from "../interactions/world-interaction-system";
import { CentralPlazaOverviewPanel } from "../ui/central-plaza-overview-panel";
import { AIObservatoryPanel } from "../ui/ai-observatory-panel";
import { KnowledgeLibraryPanel } from "../ui/knowledge-library-panel";
import { HabitGardenPanel } from "../ui/habit-garden-panel";
import { LearningAcademyPanel } from "../ui/learning-academy-panel";
import { CodingArenaPanel } from "../ui/coding-arena-panel";

export function WorldRuntimeCanvas({
  aiObservatoryOverview,
  codingArenaOverview,
  deepLinks,
  habitGardenOverview,
  learningAcademyOverview,
  libraryOverview,
  locationPage,
  plazaOverview,
  preferences,
  profile,
  sceneManifest
}: Readonly<{
  aiObservatoryOverview: AIObservatoryOverviewData;
  codingArenaOverview: CodingArenaOverviewData;
  deepLinks: WorldDeepLinkPage;
  habitGardenOverview: HabitGardenOverviewData;
  learningAcademyOverview: LearningAcademyOverviewData;
  libraryOverview: KnowledgeLibraryOverviewData;
  locationPage: WorldLocationPage;
  plazaOverview: CentralPlazaOverviewData;
  preferences: UserPreferences;
  profile: WorldProfile;
  sceneManifest: WorldSceneManifest;
}>): React.ReactElement {
  const [metrics, setMetrics] = React.useState<WorldRuntimeMetrics>(DEFAULT_RUNTIME_METRICS);
  const [pageVisible, setPageVisible] = React.useState(true);
  const graphicsPreset = useWorldSettingsStore((state) => state.graphicsPreset);
  const setGraphicsPreset = useWorldSettingsStore((state) => state.setGraphicsPreset);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);

  React.useEffect(() => {
    setGraphicsPreset(preferences.performancePreset);
  }, [preferences.performancePreset, setGraphicsPreset]);

  React.useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  React.useEffect(
    () => () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    },
    []
  );

  const preset = resolveGraphicsPresetSettings(graphicsPreset);
  const interactions = React.useMemo(
    () => buildDiagnosticWorldInteractions({ deepLinks, locationPage }),
    [deepLinks, locationPage]
  );

  return (
    <section className="world-runtime-shell" aria-label="Aetherium terrain foundation World Mode">
      <div className="world-runtime-frame">
        <Canvas
          aria-label="Terrain foundation 3D world runtime"
          camera={{ far: 1200, fov: 52, near: 0.1, position: [10, 7, 12] }}
          dpr={[1, preset.maxPixelRatio]}
          frameloop={pageVisible ? "always" : "never"}
          gl={{
            antialias: preset.antialias,
            powerPreference: graphicsPreset === "low" ? "low-power" : "high-performance"
          }}
          onCreated={({ gl }) => {
            rendererRef.current = gl;
            gl.setClearColor("#07101f", 1);
          }}
          shadows={preset.shadows}
        >
          <Physics gravity={[0, -9.81, 0]} paused={!pageVisible}>
            <WorldEnvironmentScene
              aiObservatoryOverview={aiObservatoryOverview}
              codingArenaOverview={codingArenaOverview}
              graphicsPreset={graphicsPreset}
              habitGardenOverview={habitGardenOverview}
              learningAcademyOverview={learningAcademyOverview}
              libraryOverview={libraryOverview}
              plazaOverview={plazaOverview}
              reducedMotion={preferences.reducedMotion}
            />
            <PlayerController reducedMotion={preferences.reducedMotion} />
            <WorldInteractionSystem
              interactions={interactions}
              reducedMotion={preferences.reducedMotion}
            />
          </Physics>
          <WorldCameraRig reducedMotion={preferences.reducedMotion} />
          <RuntimeMetricsSampler onMetrics={setMetrics} />
        </Canvas>

        <RuntimeDiagnosticsPanel
          locationPage={locationPage}
          metrics={metrics}
          pageVisible={pageVisible}
          profile={profile}
        />

        <WorldInteractionPrompt />
        <CentralPlazaOverviewPanel overview={plazaOverview} />
        <KnowledgeLibraryPanel overview={libraryOverview} />
        <AIObservatoryPanel overview={aiObservatoryOverview} />
        <HabitGardenPanel overview={habitGardenOverview} />
        <LearningAcademyPanel overview={learningAcademyOverview} />
        <CodingArenaPanel overview={codingArenaOverview} />

        <div className="world-runtime-label" aria-live="polite">
          <strong>World Mode district slices</strong>
          <span>
            {sceneManifest.locations.length} future locations, {deepLinks.total} deep-link contracts
          </span>
        </div>
      </div>
    </section>
  );
}
