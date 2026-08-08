import type { UserPreferences } from "@aetherium/shared-types";
import React from "react";

import {
  formatWorldAudioCaption,
  resolveFootstepInterval,
  resolveWorldAudioMix,
  resolveWorldAudioZone,
  type WorldAudioCue
} from "../../engine/audio-system";
import {
  ProceduralWorldAudioEngine,
  type WorldAudioEngine
} from "../../engine/procedural-audio-engine";
import { useWorldAudioStore } from "../../state/audio-store";
import { useWorldInteractionStore } from "../../state/interaction-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";

type AudioRuntimeStatus = "idle" | "starting" | "ready" | "error";

const createDefaultEngine = (): WorldAudioEngine => new ProceduralWorldAudioEngine();

export function WorldAudioRuntime({
  engineFactory = createDefaultEngine,
  panelOpen = false,
  preferences
}: Readonly<{
  engineFactory?: () => WorldAudioEngine;
  panelOpen?: boolean;
  preferences: UserPreferences;
}>): React.ReactElement {
  const engineRef = React.useRef<WorldAudioEngine | null>(null);
  const lastStepAtRef = React.useRef(0);
  const currentZoneIdRef = React.useRef<string | null>(null);
  const [status, setStatus] = React.useState<AudioRuntimeStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState("Audio is off until you enable it.");

  const ambientEnabled = useWorldAudioStore((state) => state.ambientEnabled);
  const ambientVolume = useWorldAudioStore((state) => state.ambientVolume);
  const captionsEnabled = useWorldAudioStore((state) => state.captionsEnabled);
  const effectsVolume = useWorldAudioStore((state) => state.effectsVolume);
  const hydratePreferences = useWorldAudioStore((state) => state.hydratePreferences);
  const masterVolume = useWorldAudioStore((state) => state.masterVolume);
  const musicEnabled = useWorldAudioStore((state) => state.musicEnabled);
  const musicVolume = useWorldAudioStore((state) => state.musicVolume);
  const muted = useWorldAudioStore((state) => state.muted);
  const performancePreset = useWorldAudioStore((state) => state.performancePreset);
  const reducedSensory = useWorldAudioStore((state) => state.reducedSensory);

  React.useEffect(() => {
    hydratePreferences(preferences);
  }, [hydratePreferences, preferences]);

  React.useEffect(
    () => () => {
      engineRef.current?.stop();
      engineRef.current = null;
    },
    []
  );

  React.useEffect(() => {
    if (status !== "ready") {
      return;
    }
    engineRef.current?.applyMix(
      resolveWorldAudioMix({
        ambientEnabled,
        ambientVolume,
        effectsVolume,
        masterVolume,
        musicEnabled,
        musicVolume,
        muted,
        panelOpen,
        performancePreset,
        reducedSensory
      })
    );
  }, [
    ambientEnabled,
    ambientVolume,
    effectsVolume,
    masterVolume,
    musicEnabled,
    musicVolume,
    muted,
    panelOpen,
    performancePreset,
    reducedSensory,
    status
  ]);

  React.useEffect(() => {
    if (status !== "ready") {
      return;
    }
    let lastListenerUpdate = 0;
    const updatePlayerAudio = (player: ReturnType<typeof usePlayerStore.getState>) => {
      const now = performance.now();
      if (now - lastListenerUpdate < 80) {
        return;
      }
      lastListenerUpdate = now;
      const engine = engineRef.current;
      engine?.setListener(player.position, player.facingRadians);
      const zone = resolveWorldAudioZone(player.position);
      if (zone?.id !== currentZoneIdRef.current) {
        currentZoneIdRef.current = zone?.id ?? null;
        engine?.setZone(zone);
        if (captionsEnabled) {
          setCaption(formatWorldAudioCaption(zone));
        }
      }

      const footstepInterval = player.grounded
        ? resolveFootstepInterval(player.movementState)
        : null;
      if (footstepInterval && now - lastStepAtRef.current >= footstepInterval) {
        lastStepAtRef.current = now;
        engine?.playCue("footstep");
      }
    };
    updatePlayerAudio(usePlayerStore.getState());
    return usePlayerStore.subscribe(updatePlayerAudio);
  }, [captionsEnabled, status]);

  React.useEffect(() => {
    if (status !== "ready") {
      return;
    }
    let previousActivationKey = "";
    return useWorldInteractionStore.subscribe((interactionState) => {
      const result = interactionState.activationResult;
      const activationKey = result ? `${result.interactionId}:${result.kind}` : "";
      if (!result || activationKey === previousActivationKey) {
        return;
      }
      previousActivationKey = activationKey;
      const interaction = interactionState.interactions.find(
        (candidate) => candidate.id === result.interactionId
      );
      const cue: WorldAudioCue =
        interaction?.type === "start_ai_conversation"
          ? "mentor"
          : interaction?.type === "open_achievement_display"
            ? "achievement"
            : "interaction";
      engineRef.current?.playCue(cue);
      if (captionsEnabled) {
        setCaption(
          result.kind === "blocked" ? `Unavailable: ${result.message}` : "Interface opened."
        );
      }
    });
  }, [captionsEnabled, status]);

  React.useEffect(() => {
    if (status !== "ready") {
      return;
    }
    let previousTravel = useWorldNavigationStore.getState().activeTravel;
    return useWorldNavigationStore.subscribe((navigation) => {
      if (navigation.activeTravel && navigation.activeTravel !== previousTravel) {
        engineRef.current?.playCue("travel");
        if (captionsEnabled) {
          setCaption(`Travel started: ${navigation.activeTravel.target.name}.`);
        }
      }
      previousTravel = navigation.activeTravel;
    });
  }, [captionsEnabled, status]);

  React.useEffect(() => {
    if (status !== "ready") {
      return;
    }
    const updateVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      engineRef.current?.setPaused(hidden);
      if (hidden && captionsEnabled) {
        setCaption("World audio paused while this tab is hidden.");
      }
    };
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, [captionsEnabled, status]);

  const startAudio = React.useCallback(async () => {
    setStatus("starting");
    setError(null);
    try {
      const engine = engineFactory();
      await engine.start();
      engineRef.current = engine;
      setCaption("World audio enabled. Move between districts to hear zone changes.");
      setStatus("ready");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "World audio could not start.");
      setStatus("error");
    }
  }, [engineFactory]);

  return (
    <>
      <WorldAudioControls error={error} onStart={() => void startAudio()} status={status} />
      {captionsEnabled && status === "ready" ? (
        <output aria-live="polite" className="world-sound-caption">
          <span>Sound</span>
          {caption}
        </output>
      ) : null}
    </>
  );
}

function WorldAudioControls({
  error,
  onStart,
  status
}: Readonly<{
  error: string | null;
  onStart: () => void;
  status: AudioRuntimeStatus;
}>): React.ReactElement {
  const ambientEnabled = useWorldAudioStore((state) => state.ambientEnabled);
  const ambientVolume = useWorldAudioStore((state) => state.ambientVolume);
  const captionsEnabled = useWorldAudioStore((state) => state.captionsEnabled);
  const effectsVolume = useWorldAudioStore((state) => state.effectsVolume);
  const masterVolume = useWorldAudioStore((state) => state.masterVolume);
  const musicEnabled = useWorldAudioStore((state) => state.musicEnabled);
  const musicVolume = useWorldAudioStore((state) => state.musicVolume);
  const muted = useWorldAudioStore((state) => state.muted);
  const reducedSensory = useWorldAudioStore((state) => state.reducedSensory);
  const setAmbientVolume = useWorldAudioStore((state) => state.setAmbientVolume);
  const setCaptionsEnabled = useWorldAudioStore((state) => state.setCaptionsEnabled);
  const setEffectsVolume = useWorldAudioStore((state) => state.setEffectsVolume);
  const setMasterVolume = useWorldAudioStore((state) => state.setMasterVolume);
  const setMusicVolume = useWorldAudioStore((state) => state.setMusicVolume);
  const setMuted = useWorldAudioStore((state) => state.setMuted);
  const setReducedSensory = useWorldAudioStore((state) => state.setReducedSensory);

  return (
    <details className="world-audio-controls">
      <summary>
        <span>Audio</span>
        <strong>{status === "ready" ? (muted ? "Muted" : "Active") : "Off"}</strong>
      </summary>
      {status !== "ready" ? (
        <button disabled={status === "starting"} onClick={onStart} type="button">
          {status === "starting" ? "Starting audio..." : "Enable world audio"}
        </button>
      ) : (
        <>
          <VolumeControl label="Master volume" onChange={setMasterVolume} value={masterVolume} />
          <VolumeControl
            disabled={!musicEnabled}
            label="Music volume"
            onChange={setMusicVolume}
            value={musicVolume}
          />
          <VolumeControl
            disabled={!ambientEnabled}
            label="Ambient volume"
            onChange={setAmbientVolume}
            value={ambientVolume}
          />
          <VolumeControl label="Effects volume" onChange={setEffectsVolume} value={effectsVolume} />
          <label className="world-audio-check">
            <input
              checked={muted}
              onChange={(event) => setMuted(event.target.checked)}
              type="checkbox"
            />
            Mute all audio
          </label>
          <label className="world-audio-check">
            <input
              checked={reducedSensory}
              onChange={(event) => setReducedSensory(event.target.checked)}
              type="checkbox"
            />
            Reduced sensory audio
          </label>
          <label className="world-audio-check">
            <input
              checked={captionsEnabled}
              onChange={(event) => setCaptionsEnabled(event.target.checked)}
              type="checkbox"
            />
            Sound captions
          </label>
        </>
      )}
      {error ? <small role="alert">{error}</small> : null}
      <small>
        Music and ambience follow saved preferences. Volume controls apply to this visit.
      </small>
    </details>
  );
}

function VolumeControl({
  disabled = false,
  label,
  onChange,
  value
}: Readonly<{
  disabled?: boolean;
  label: string;
  onChange: (value: number) => void;
  value: number;
}>): React.ReactElement {
  const inputId = React.useId();
  return (
    <div className="world-audio-volume">
      <div className="world-audio-volume-heading">
        <label htmlFor={inputId}>{label}</label>
        <output aria-label={`${label} level`}>{Math.round(value * 100)}%</output>
      </div>
      <input
        disabled={disabled}
        id={inputId}
        max="1"
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        step="0.05"
        type="range"
        value={value}
      />
    </div>
  );
}
