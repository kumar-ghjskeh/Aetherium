import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { useWorldSettingsStore } from "../../state/settings-store";
import { WorldAtmosphereControls } from "./world-atmosphere-controls";

describe("WorldAtmosphereControls", () => {
  beforeEach(() => {
    useWorldSettingsStore.setState({
      timeMode: "cycle",
      weatherEnabled: true,
      weatherMode: "automatic"
    });
  });

  it("selects deterministic screenshot time and weather states", () => {
    render(<WorldAtmosphereControls />);

    fireEvent.click(screen.getByRole("button", { name: "Sunset" }));
    fireEvent.change(screen.getByLabelText("Weather pattern"), { target: { value: "mist" } });

    expect(useWorldSettingsStore.getState()).toMatchObject({
      timeMode: "sunset",
      weatherMode: "mist"
    });
    expect(screen.getByRole("button", { name: "Sunset" })).toHaveAttribute("aria-pressed", "true");
  });

  it("disables weather selection when dynamic weather is turned off", () => {
    render(<WorldAtmosphereControls />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Dynamic weather" }));

    expect(screen.getByLabelText("Weather pattern")).toBeDisabled();
    expect(useWorldSettingsStore.getState().weatherEnabled).toBe(false);
  });
});
