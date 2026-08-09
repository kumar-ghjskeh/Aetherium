import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type { WorldDestination } from "../../engine/navigation-system";
import { useWorldCommandBridgeStore } from "../../state/command-bridge-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { WorldCommandBridge } from "./world-command-bridge";

const destinations: WorldDestination[] = [
  {
    accessibilityLabel: "Knowledge Library district",
    backendLocationId: "library",
    commandRoute: "/app/library",
    current: false,
    id: "knowledge-library",
    name: "Knowledge Library",
    point: [166, 8, -214],
    theme: "knowledge",
    unlocked: true,
    visited: true,
    worldPosition: [184, 8, -246],
    worldRadius: 58
  }
];

describe("WorldCommandBridge", () => {
  beforeEach(() => {
    useWorldCommandBridgeStore.setState({ overlayOpen: false });
    useWorldNavigationStore.setState({ activeTravel: null });
  });

  it("opens a searchable bridge with Open Now and Travel There actions", () => {
    render(
      <WorldCommandBridge
        continueRoute="/app/learning"
        destinations={destinations}
        reducedMotion={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Command" }));
    expect(screen.getByRole("dialog", { name: "Command Mode bridge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Now" })).toHaveAttribute("href", "/app/library");

    fireEvent.click(screen.getByRole("button", { name: "Travel There" }));
    expect(useWorldNavigationStore.getState().activeTravel?.target.id).toBe("knowledge-library");
    expect(useWorldCommandBridgeStore.getState().overlayOpen).toBe(false);
  });

  it("shows an honest empty search state", () => {
    useWorldCommandBridgeStore.setState({ overlayOpen: true });
    render(
      <WorldCommandBridge continueRoute="/app" destinations={destinations} reducedMotion={true} />
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "Search world destinations" }), {
      target: { value: "Observatory" }
    });
    expect(screen.getByText("No matching world destination.")).toBeInTheDocument();
  });

  it("traps keyboard focus and restores it to the trigger when closed", async () => {
    render(
      <WorldCommandBridge continueRoute="/app" destinations={destinations} reducedMotion={false} />
    );
    const trigger = screen.getByRole("button", { name: "Command" });
    fireEvent.click(trigger);

    const search = await screen.findByRole("searchbox", { name: "Search world destinations" });
    await waitFor(() => expect(search).toHaveFocus());
    fireEvent.keyDown(search, { key: "Tab" });
    expect(screen.getByRole("link", { name: "Open Now" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog", { name: "Command Mode bridge" })).not.toBeInTheDocument();
  });
});
