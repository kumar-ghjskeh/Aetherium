import Link from "next/link";
import React from "react";

import { useWorldDialogAccessibility } from "../../hooks/use-world-dialog-accessibility";
import { useWorldAudioStore } from "../../state/audio-store";
import { useWorldCameraStore } from "../../state/camera-store";
import { useWorldSettingsStore, type WorldTextScale } from "../../state/settings-store";

const TEXT_SCALE_OPTIONS: readonly { label: string; value: WorldTextScale }[] = [
  { label: "Default", value: "default" },
  { label: "Large", value: "large" },
  { label: "Largest", value: "largest" }
];

export function WorldAccessibilityControls(): React.ReactElement {
  const panelOpen = useWorldSettingsStore((state) => state.accessibilityPanelOpen);
  const highContrastEnabled = useWorldSettingsStore((state) => state.highContrastEnabled);
  const particlesEnabled = useWorldSettingsStore((state) => state.particlesEnabled);
  const reducedMotionEnabled = useWorldSettingsStore((state) => state.reducedMotionEnabled);
  const setPanelOpen = useWorldSettingsStore((state) => state.setAccessibilityPanelOpen);
  const setHighContrastEnabled = useWorldSettingsStore((state) => state.setHighContrastEnabled);
  const setParticlesEnabled = useWorldSettingsStore((state) => state.setParticlesEnabled);
  const setReducedMotionEnabled = useWorldSettingsStore((state) => state.setReducedMotionEnabled);
  const setTextScale = useWorldSettingsStore((state) => state.setTextScale);
  const setWeatherEnabled = useWorldSettingsStore((state) => state.setWeatherEnabled);
  const textScale = useWorldSettingsStore((state) => state.textScale);
  const weatherEnabled = useWorldSettingsStore((state) => state.weatherEnabled);
  const cameraSettings = useWorldCameraStore((state) => state.settings);
  const setCameraShakeEnabled = useWorldCameraStore((state) => state.setCameraShakeEnabled);
  const setCinematicTravelEnabled = useWorldCameraStore((state) => state.setCinematicTravelEnabled);
  const captionsEnabled = useWorldAudioStore((state) => state.captionsEnabled);
  const reducedSensory = useWorldAudioStore((state) => state.reducedSensory);
  const setCaptionsEnabled = useWorldAudioStore((state) => state.setCaptionsEnabled);
  const setReducedSensory = useWorldAudioStore((state) => state.setReducedSensory);
  const panelRef = React.useRef<HTMLElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const closePanel = React.useCallback(() => setPanelOpen(false), [setPanelOpen]);

  useWorldDialogAccessibility({
    active: panelOpen,
    containerRef: panelRef,
    initialFocusRef: closeRef,
    onClose: closePanel,
    returnFocusRef: triggerRef
  });

  const updateReducedMotion = (enabled: boolean) => {
    setReducedMotionEnabled(enabled);
    if (enabled) {
      setCameraShakeEnabled(false);
      setCinematicTravelEnabled(false);
    }
  };

  return (
    <>
      <button
        aria-expanded={panelOpen}
        className="world-accessibility-button"
        onClick={() => setPanelOpen(true)}
        ref={triggerRef}
        type="button"
      >
        Access
      </button>
      {panelOpen ? (
        <section
          aria-label="World accessibility settings"
          aria-modal="true"
          className="world-accessibility-overlay"
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
        >
          <header>
            <div>
              <span>World interface</span>
              <h2>Accessibility</h2>
            </div>
            <button
              aria-label="Close accessibility settings"
              onClick={closePanel}
              ref={closeRef}
              type="button"
            >
              Close
            </button>
          </header>

          <div className="world-accessibility-grid">
            <fieldset>
              <legend>Motion</legend>
              <AccessibilityToggle
                checked={reducedMotionEnabled}
                label="Reduced motion"
                onChange={updateReducedMotion}
              />
              <AccessibilityToggle
                checked={cameraSettings.cameraShakeEnabled}
                disabled={reducedMotionEnabled}
                label="Camera shake"
                onChange={setCameraShakeEnabled}
              />
              <AccessibilityToggle
                checked={cameraSettings.cinematicTravelEnabled}
                disabled={reducedMotionEnabled}
                label="Cinematic travel"
                onChange={setCinematicTravelEnabled}
              />
              <AccessibilityToggle
                checked={particlesEnabled}
                label="Weather particles"
                onChange={setParticlesEnabled}
              />
            </fieldset>

            <fieldset>
              <legend>Visual</legend>
              <AccessibilityToggle
                checked={highContrastEnabled}
                label="High contrast"
                onChange={setHighContrastEnabled}
              />
              <AccessibilityToggle
                checked={weatherEnabled}
                label="Dynamic weather"
                onChange={setWeatherEnabled}
              />
              <div>
                <span id="world-text-size-label">World UI text size</span>
                <div
                  aria-labelledby="world-text-size-label"
                  className="world-accessibility-segments"
                  role="radiogroup"
                >
                  {TEXT_SCALE_OPTIONS.map((option) => (
                    <button
                      aria-checked={textScale === option.value}
                      key={option.value}
                      onClick={() => setTextScale(option.value)}
                      role="radio"
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Audio</legend>
              <AccessibilityToggle
                checked={captionsEnabled}
                label="Sound captions"
                onChange={setCaptionsEnabled}
              />
              <AccessibilityToggle
                checked={reducedSensory}
                label="Reduced sensory audio"
                onChange={setReducedSensory}
              />
            </fieldset>
          </div>

          <footer>
            <Link href="/app">Use Command Mode</Link>
            <Link href="/app/settings">Open saved preferences</Link>
          </footer>
        </section>
      ) : null}
    </>
  );
}

function AccessibilityToggle({
  checked,
  disabled = false,
  label,
  onChange
}: Readonly<{
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}>): React.ReactElement {
  return (
    <label className="world-accessibility-toggle">
      <input
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
      <strong>{checked ? "On" : "Off"}</strong>
    </label>
  );
}
