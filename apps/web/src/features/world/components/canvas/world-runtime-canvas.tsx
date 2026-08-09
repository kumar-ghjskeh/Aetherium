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
import * as THREE from "three";

import { buildCentralPlazaViewModel } from "../../engine/central-plaza-system";
import type { WorldCommandIntent } from "../../engine/command-bridge-system";
import { buildDiagnosticWorldInteractions } from "../../engine/interaction-manifest";
import { resolveGraphicsPresetSettings } from "../../engine/performance-manager";
import {
  buildWorldDestinations,
  createWorldTravelPlan,
  type WorldDestination
} from "../../engine/navigation-system";
import type { CentralPlazaOverviewData } from "../../engine/central-plaza-system";
import type { AchievementHallOverviewData } from "../../engine/achievement-hall-system";
import type { CodingArenaOverviewData } from "../../engine/coding-arena-system";
import type { AIObservatoryOverviewData } from "../../engine/ai-observatory-system";
import type { KnowledgeLibraryOverviewData } from "../../engine/knowledge-library-system";
import type { HabitGardenOverviewData } from "../../engine/habit-garden-system";
import type { LearningAcademyOverviewData } from "../../engine/learning-academy-system";
import type { ProjectDockOverviewData } from "../../engine/project-dock-system";
import type { ProgressTowerOverviewData } from "../../engine/progress-tower-system";
import type { PersonalSanctuaryOverviewData } from "../../engine/personal-sanctuary-system";
import { loadSavedWorldRuntimeState, saveWorldRuntimeState } from "../../engine/save-sync";
import { useWorldCommandBridgeStore } from "../../state/command-bridge-store";
import { useWorldCameraStore } from "../../state/camera-store";
import { useWorldSettingsStore } from "../../state/settings-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";
import { useWorldPerformanceStore } from "../../state/performance-store";
import { WorldCameraRig } from "../camera/world-camera-rig";
import { PlayerController } from "../character/player-controller";
import { WorldAudioRuntime } from "../audio/world-audio-runtime";
import { RuntimeMetricsSampler } from "../diagnostics/runtime-metrics-sampler";
import { RuntimeDiagnosticsPanel } from "../diagnostics/runtime-diagnostics-panel";
import {
  WorldEnvironmentScene,
  WorldTerrainCollision
} from "../environments/world-environment-scene";
import { WorldInteractionPrompt } from "../interactions/world-interaction-prompt";
import { WorldInteractionSystem } from "../interactions/world-interaction-system";
import { WorldArrivalTracker } from "../navigation/world-arrival-tracker";
import { WorldLocationMarkers } from "../navigation/world-location-markers";
import { WorldCommandBridge } from "../navigation/world-command-bridge";
import { WorldInstantTravelCoordinator } from "../navigation/world-instant-travel-coordinator";
import { WorldNavigationOverlay } from "../navigation/world-navigation-overlay";
import { CentralPlazaOverviewPanel } from "../ui/central-plaza-overview-panel";
import { AIObservatoryPanel } from "../ui/ai-observatory-panel";
import { KnowledgeLibraryPanel } from "../ui/knowledge-library-panel";
import { HabitGardenPanel } from "../ui/habit-garden-panel";
import { LearningAcademyPanel } from "../ui/learning-academy-panel";
import { ProjectDockPanel } from "../ui/project-dock-panel";
import { ProgressTowerPanel } from "../ui/progress-tower-panel";
import { CodingArenaPanel } from "../ui/coding-arena-panel";
import { AchievementHallPanel } from "../ui/achievement-hall-panel";
import { PersonalSanctuaryPanel } from "../ui/personal-sanctuary-panel";
import { WorldAtmosphereControls } from "../ui/world-atmosphere-controls";
import { WorldAccessibilityControls } from "../ui/world-accessibility-controls";

export function WorldRuntimeCanvas({
  achievementHallOverview,
  aiObservatoryOverview,
  codingArenaOverview,
  deepLinks,
  habitGardenOverview,
  initialIntent,
  learningAcademyOverview,
  libraryOverview,
  locationPage,
  onVisitLocation,
  personalSanctuaryOverview,
  plazaOverview,
  preferences,
  profile,
  projectDockOverview,
  progressTowerOverview,
  sceneManifest
}: Readonly<{
  achievementHallOverview: AchievementHallOverviewData;
  aiObservatoryOverview: AIObservatoryOverviewData;
  codingArenaOverview: CodingArenaOverviewData;
  deepLinks: WorldDeepLinkPage;
  habitGardenOverview: HabitGardenOverviewData;
  initialIntent?: WorldCommandIntent | null;
  learningAcademyOverview: LearningAcademyOverviewData;
  libraryOverview: KnowledgeLibraryOverviewData;
  locationPage: WorldLocationPage;
  onVisitLocation: (locationId: string) => Promise<WorldProfile>;
  personalSanctuaryOverview: PersonalSanctuaryOverviewData;
  plazaOverview: CentralPlazaOverviewData;
  preferences: UserPreferences;
  profile: WorldProfile;
  projectDockOverview: ProjectDockOverviewData;
  progressTowerOverview: ProgressTowerOverviewData;
  sceneManifest: WorldSceneManifest;
}>): React.ReactElement {
  const [pageVisible, setPageVisible] = React.useState(true);
  const commandOverlayOpen = useWorldCommandBridgeStore((state) => state.overlayOpen);
  const accessibilityPanelOpen = useWorldSettingsStore((state) => state.accessibilityPanelOpen);
  const graphicsPreset = useWorldSettingsStore((state) => state.graphicsPreset);
  const highContrastEnabled = useWorldSettingsStore((state) => state.highContrastEnabled);
  const particlesEnabled = useWorldSettingsStore((state) => state.particlesEnabled);
  const reducedMotionEnabled = useWorldSettingsStore((state) => state.reducedMotionEnabled);
  const textScale = useWorldSettingsStore((state) => state.textScale);
  const timeMode = useWorldSettingsStore((state) => state.timeMode);
  const weatherEnabled = useWorldSettingsStore((state) => state.weatherEnabled);
  const weatherMode = useWorldSettingsStore((state) => state.weatherMode);
  const setGraphicsPreset = useWorldSettingsStore((state) => state.setGraphicsPreset);
  const setReducedMotionEnabled = useWorldSettingsStore((state) => state.setReducedMotionEnabled);
  const setCameraShakeEnabled = useWorldCameraStore((state) => state.setCameraShakeEnabled);
  const effectiveGraphicsTier = useWorldPerformanceStore((state) => state.effectiveTier);
  const initialSpawnAppliedRef = React.useRef(false);
  const lastSyncedLocationRef = React.useRef(profile.currentLocationId);
  const [savedRuntimeState] = React.useState(() =>
    typeof window === "undefined" ? null : loadSavedWorldRuntimeState(window.sessionStorage)
  );
  const restoredRuntimeState =
    !initialIntent && savedRuntimeState?.backendLocationId === profile.currentLocationId
      ? savedRuntimeState
      : null;

  React.useEffect(() => {
    setGraphicsPreset(preferences.performancePreset);
  }, [preferences.performancePreset, setGraphicsPreset]);

  React.useEffect(() => {
    setReducedMotionEnabled(preferences.reducedMotion);
    setCameraShakeEnabled(preferences.cameraEffectsEnabled && !preferences.reducedMotion);
  }, [
    preferences.cameraEffectsEnabled,
    preferences.reducedMotion,
    setCameraShakeEnabled,
    setReducedMotionEnabled
  ]);

  React.useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const preset = resolveGraphicsPresetSettings(graphicsPreset, effectiveGraphicsTier);
  const initialRendererPreset = resolveGraphicsPresetSettings(
    preferences.performancePreset,
    effectiveGraphicsTier
  );
  const rendererOptions = React.useMemo<THREE.WebGLRendererParameters>(
    () => ({
      antialias: initialRendererPreset.antialias,
      powerPreference: initialRendererPreset.tier === "low" ? "low-power" : "high-performance",
      preserveDrawingBuffer: process.env.NEXT_PUBLIC_AETHERIUM_WORLD_VISUAL_TEST === "true"
    }),
    [initialRendererPreset.antialias, initialRendererPreset.tier]
  );
  const runtimeActive = pageVisible && !commandOverlayOpen && !accessibilityPanelOpen;
  const interactions = React.useMemo(
    () => buildDiagnosticWorldInteractions({ deepLinks, locationPage }),
    [deepLinks, locationPage]
  );
  const destinations = React.useMemo(() => buildWorldDestinations(locationPage), [locationPage]);

  React.useEffect(() => {
    lastSyncedLocationRef.current = profile.currentLocationId;
  }, [profile.currentLocationId]);

  React.useEffect(() => {
    if (initialSpawnAppliedRef.current) {
      return;
    }
    const requestedDestination = initialIntent
      ? destinations.find(
          (destination) => destination.backendLocationId === initialIntent.backendLocationId
        )
      : null;
    if (requestedDestination?.unlocked) {
      initialSpawnAppliedRef.current = true;
      const navigation = useWorldNavigationStore.getState();
      navigation.selectDestination(requestedDestination.id);
      if (initialIntent?.mode === "walk") {
        return;
      }
      navigation.startTravel(
        createWorldTravelPlan({
          destination: requestedDestination,
          from: usePlayerStore.getState().position,
          mode: initialIntent?.mode ?? "cinematic",
          reducedMotion: reducedMotionEnabled,
          startedAtMilliseconds: performance.now()
        })
      );
      return;
    }
    if (restoredRuntimeState) {
      initialSpawnAppliedRef.current = true;
      usePlayerStore.setState({
        facingRadians: restoredRuntimeState.facingRadians,
        position: [...restoredRuntimeState.position]
      });
      return;
    }
    const initialDestination =
      destinations.find(
        (destination) => destination.backendLocationId === profile.currentLocationId
      ) ??
      destinations.find((destination) => destination.backendLocationId === profile.spawnLocationId);
    if (!initialDestination || !initialDestination.unlocked) {
      return;
    }
    initialSpawnAppliedRef.current = true;
    const navigation = useWorldNavigationStore.getState();
    navigation.selectDestination(initialDestination.id);
    navigation.startTravel(
      createWorldTravelPlan({
        destination: initialDestination,
        from: usePlayerStore.getState().position,
        mode: "instant",
        reducedMotion: reducedMotionEnabled,
        startedAtMilliseconds: performance.now()
      })
    );
  }, [
    destinations,
    initialIntent,
    reducedMotionEnabled,
    profile.currentLocationId,
    profile.spawnLocationId,
    restoredRuntimeState
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let lastSavedAt = 0;
    const persist = (player = usePlayerStore.getState()) => {
      const now = Date.now();
      if (now - lastSavedAt < 500) {
        return;
      }
      lastSavedAt = now;
      saveWorldRuntimeState(window.sessionStorage, {
        backendLocationId: lastSyncedLocationRef.current,
        facingRadians: player.facingRadians,
        position: player.position,
        savedAtMilliseconds: now
      });
    };
    const unsubscribe = usePlayerStore.subscribe(persist);
    return () => {
      unsubscribe();
      lastSavedAt = 0;
      persist();
    };
  }, []);

  const handleArrival = React.useCallback(
    async (destination: WorldDestination) => {
      const navigation = useWorldNavigationStore.getState();
      navigation.selectDestination(destination.id);
      if (lastSyncedLocationRef.current === destination.backendLocationId) {
        return;
      }
      lastSyncedLocationRef.current = destination.backendLocationId;
      navigation.setSyncing(destination);
      try {
        await onVisitLocation(destination.backendLocationId);
        navigation.setSyncIdle();
      } catch (arrivalError) {
        lastSyncedLocationRef.current = profile.currentLocationId;
        navigation.setSyncError(
          arrivalError instanceof Error ? arrivalError.message : "Location could not be saved."
        );
      }
    },
    [onVisitLocation, profile.currentLocationId]
  );

  return (
    <section className="world-runtime-shell" aria-label="Aetherium terrain foundation World Mode">
      <div
        className="world-runtime-frame"
        data-high-contrast={highContrastEnabled}
        data-particles={particlesEnabled}
        data-reduced-motion={reducedMotionEnabled}
        data-text-scale={textScale}
      >
        <Canvas
          aria-label="Terrain foundation 3D world runtime"
          camera={{ far: 1200, fov: 52, near: 0.1, position: [10, 7, 12] }}
          dpr={initialRendererPreset.targetPixelRatio}
          frameloop={runtimeActive ? "always" : "never"}
          gl={rendererOptions}
          onCreated={({ gl }) => {
            gl.setClearColor("#07101f", 1);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1;
          }}
          shadows={preset.shadows}
        >
          <WorldEnvironmentScene
            achievementHallOverview={achievementHallOverview}
            aiObservatoryOverview={aiObservatoryOverview}
            codingArenaOverview={codingArenaOverview}
            graphicsPreset={effectiveGraphicsTier}
            habitGardenOverview={habitGardenOverview}
            learningAcademyOverview={learningAcademyOverview}
            libraryOverview={libraryOverview}
            personalSanctuaryOverview={personalSanctuaryOverview}
            plazaOverview={plazaOverview}
            projectDockOverview={projectDockOverview}
            progressTowerOverview={progressTowerOverview}
            reducedMotion={reducedMotionEnabled}
            particlesEnabled={particlesEnabled}
            timeMode={timeMode}
            weatherEnabled={weatherEnabled}
            weatherMode={weatherMode}
          />
          <React.Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]} paused={!runtimeActive}>
              <WorldTerrainCollision />
              <PlayerController
                initialFacingRadians={restoredRuntimeState?.facingRadians}
                initialPosition={restoredRuntimeState?.position}
                onArrive={handleArrival}
                reducedMotion={reducedMotionEnabled}
              />
              <RuntimeMetricsSampler />
            </Physics>
          </React.Suspense>
          <WorldArrivalTracker destinations={destinations} onArrive={handleArrival} />
          <WorldLocationMarkers destinations={destinations} reducedMotion={reducedMotionEnabled} />
          <WorldInteractionSystem
            interactions={interactions}
            reducedMotion={reducedMotionEnabled}
          />
          <WorldCameraRig destinations={destinations} reducedMotion={reducedMotionEnabled} />
        </Canvas>

        <RuntimeDiagnosticsPanel
          locationPage={locationPage}
          pageVisible={pageVisible}
          profile={profile}
        />
        <WorldInstantTravelCoordinator onArrive={handleArrival} />

        <WorldInteractionPrompt />
        <WorldNavigationOverlay
          destinations={destinations}
          profile={profile}
          reducedMotion={reducedMotionEnabled}
        />
        <WorldAtmosphereControls />
        <WorldAudioRuntime
          panelOpen={commandOverlayOpen || accessibilityPanelOpen}
          preferences={preferences}
        />
        <WorldAccessibilityControls />
        <WorldCommandBridge
          continueRoute={
            buildCentralPlazaViewModel(plazaOverview).terminals.find(
              (terminal) => terminal.id === "continue-activity"
            )?.commandRoute ?? "/app"
          }
          destinations={destinations}
          reducedMotion={reducedMotionEnabled}
        />
        <CentralPlazaOverviewPanel overview={plazaOverview} />
        <KnowledgeLibraryPanel overview={libraryOverview} />
        <AIObservatoryPanel overview={aiObservatoryOverview} />
        <HabitGardenPanel overview={habitGardenOverview} />
        <LearningAcademyPanel overview={learningAcademyOverview} />
        <CodingArenaPanel overview={codingArenaOverview} />
        <ProjectDockPanel overview={projectDockOverview} />
        <ProgressTowerPanel overview={progressTowerOverview} />
        <AchievementHallPanel overview={achievementHallOverview} />
        <PersonalSanctuaryPanel overview={personalSanctuaryOverview} />

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
