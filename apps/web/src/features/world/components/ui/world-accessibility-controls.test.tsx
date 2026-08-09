import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_CAMERA_SETTINGS } from "../../engine/camera-system";
import { useWorldAudioStore } from "../../state/audio-store";
import { useWorldCameraStore } from "../../state/camera-store";
import { useWorldSettingsStore } from "../../state/settings-store";
import { WorldAccessibilityControls } from "./world-accessibility-controls";

describe("WorldAccessibilityControls", () => {
  beforeEach(() => {
    useWorldSettingsStore.setState({
      accessibilityPanelOpen: false,
      highContrastEnabled: false,
      particlesEnabled: true,
      reducedMotionEnabled: false,
      textScale: "default",
      weatherEnabled: true
    });
    useWorldCameraStore.setState({
      settings: {
        ...DEFAULT_CAMERA_SETTINGS,
        cameraShakeEnabled: true,
        cinematicTravelEnabled: true
      }
    });
    useWorldAudioStore.setState({ captionsEnabled: true, reducedSensory: false });
  });

  it("opens as a focused dialog and restores focus when closed", async () => {
    render(<WorldAccessibilityControls />);
    const trigger = screen.getByRole("button", { name: "Access" });
    fireEvent.click(trigger);

    const close = screen.getByRole("button", { name: "Close accessibility settings" });
    await waitFor(() => expect(close).toHaveFocus());
    fireEvent.click(close);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("coordinates motion, visual, and sensory accessibility state", () => {
    render(<WorldAccessibilityControls />);
    fireEvent.click(screen.getByRole("button", { name: "Access" }));

    fireEvent.click(screen.getByRole("checkbox", { name: /Reduced motion/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Weather particles/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /High contrast/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Dynamic weather/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Largest" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Sound captions/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Reduced sensory audio/ }));

    expect(useWorldSettingsStore.getState()).toMatchObject({
      highContrastEnabled: true,
      particlesEnabled: false,
      reducedMotionEnabled: true,
      textScale: "largest",
      weatherEnabled: false
    });
    expect(useWorldCameraStore.getState().settings).toMatchObject({
      cameraShakeEnabled: false,
      cinematicTravelEnabled: false
    });
    expect(useWorldAudioStore.getState()).toMatchObject({
      captionsEnabled: false,
      reducedSensory: true
    });
  });
});
