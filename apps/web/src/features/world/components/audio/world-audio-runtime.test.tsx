import type { UserPreferences } from "@aetherium/shared-types";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldAudioEngine } from "../../engine/procedural-audio-engine";
import { useWorldAudioStore } from "../../state/audio-store";
import { WorldAudioRuntime } from "./world-audio-runtime";

const preferences: UserPreferences = {
  aiMemoryEnabled: false,
  ambientAudioEnabled: true,
  backgroundMusicEnabled: false,
  cameraEffectsEnabled: false,
  createdAt: "2026-01-01T00:00:00Z",
  defaultInterfaceMode: "command",
  id: "preferences-1",
  locale: "en-US",
  performancePreset: "balanced",
  productAnalyticsEnabled: false,
  reducedMotion: false,
  theme: "dark",
  timeZone: "UTC",
  updatedAt: "2026-01-01T00:00:00Z"
};

function createFakeEngine(): WorldAudioEngine & { setPaused: ReturnType<typeof vi.fn> } {
  return {
    applyMix: vi.fn(),
    playCue: vi.fn(),
    setListener: vi.fn(),
    setPaused: vi.fn(),
    setZone: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn()
  };
}

describe("WorldAudioRuntime", () => {
  beforeEach(() => {
    useWorldAudioStore.setState({
      ambientEnabled: true,
      ambientVolume: 0.62,
      captionsEnabled: true,
      effectsVolume: 0.72,
      masterVolume: 0.78,
      musicEnabled: true,
      musicVolume: 0.48,
      muted: false,
      performancePreset: "balanced",
      reducedSensory: false
    });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  it("requires explicit activation and hydrates saved music and ambience preferences", async () => {
    const engine = createFakeEngine();
    render(<WorldAudioRuntime engineFactory={() => engine} preferences={preferences} />);

    expect(screen.getByRole("button", { name: "Enable world audio" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enable world audio" }));

    await waitFor(() => expect(engine.start).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(/World audio enabled/u)).toBeInTheDocument());
    expect(useWorldAudioStore.getState()).toMatchObject({
      ambientEnabled: true,
      musicEnabled: false
    });
  });

  it("updates transient volumes and pauses audio when the tab is hidden", async () => {
    const engine = createFakeEngine();
    render(<WorldAudioRuntime engineFactory={() => engine} preferences={preferences} />);
    fireEvent.click(screen.getByRole("button", { name: "Enable world audio" }));
    await waitFor(() => expect(screen.getByLabelText("Master volume")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Master volume"), { target: { value: "0.4" } });
    expect(useWorldAudioStore.getState().masterVolume).toBe(0.4);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(engine.setPaused).toHaveBeenCalledWith(true);
    expect(screen.getByText(/paused while this tab is hidden/u)).toBeInTheDocument();
  });
});
