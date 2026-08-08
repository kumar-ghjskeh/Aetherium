import type { WorldProfile } from "@aetherium/shared-types";
import Link from "next/link";
import React from "react";

import {
  createWorldTravelPlan,
  type WorldDestination,
  type WorldTravelMode
} from "../../engine/navigation-system";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";

const TRAVEL_MODES: Array<{ id: WorldTravelMode; label: string }> = [
  { id: "walk", label: "Walk" },
  { id: "cinematic", label: "Cinematic" },
  { id: "instant", label: "Instant" }
];

export function WorldNavigationOverlay({
  destinations,
  profile,
  reducedMotion
}: Readonly<{
  destinations: WorldDestination[];
  profile: WorldProfile;
  reducedMotion: boolean;
}>): React.ReactElement {
  const activeTravel = useWorldNavigationStore((state) => state.activeTravel);
  const closeMap = useWorldNavigationStore((state) => state.closeMap);
  const destinationId = useWorldNavigationStore((state) => state.destinationId);
  const mapOpen = useWorldNavigationStore((state) => state.mapOpen);
  const openMap = useWorldNavigationStore((state) => state.openMap);
  const requestSkip = useWorldNavigationStore((state) => state.requestSkip);
  const selectedMode = useWorldNavigationStore((state) => state.selectedMode);
  const selectDestination = useWorldNavigationStore((state) => state.selectDestination);
  const setSelectedMode = useWorldNavigationStore((state) => state.setSelectedMode);
  const startTravel = useWorldNavigationStore((state) => state.startTravel);
  const syncMessage = useWorldNavigationStore((state) => state.syncMessage);
  const syncStatus = useWorldNavigationStore((state) => state.syncStatus);
  const mapRequested = usePlayerStore((state) => state.mapRequested);
  const playerPosition = usePlayerStore((state) => state.position);
  const setMovementDisabled = usePlayerStore((state) => state.setMovementDisabled);
  const previousMapRequestRef = React.useRef(false);
  const selectedDestination =
    destinations.find((destination) => destination.id === destinationId) ?? null;
  const currentDestination =
    destinations.find(
      (destination) => destination.backendLocationId === profile.currentLocationId
    ) ?? null;
  const previousDestination = profile.lastVisitedLocationId
    ? destinations.find(
        (destination) => destination.backendLocationId === profile.lastVisitedLocationId
      )
    : null;

  React.useEffect(() => {
    if (mapRequested && !previousMapRequestRef.current) {
      useWorldNavigationStore.getState().toggleMap();
    }
    previousMapRequestRef.current = mapRequested;
  }, [mapRequested]);

  React.useEffect(() => {
    setMovementDisabled(mapOpen || activeTravel !== null);
    return () => setMovementDisabled(false);
  }, [activeTravel, mapOpen, setMovementDisabled]);

  React.useEffect(() => {
    if (!mapOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMap();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeMap, mapOpen]);

  const chooseDestination = (destination: WorldDestination) => {
    if (!destination.unlocked) {
      return;
    }
    selectDestination(destination.id);
    if (selectedMode === "walk") {
      closeMap();
      return;
    }
    startTravel(
      createWorldTravelPlan({
        destination,
        from: playerPosition,
        mode: selectedMode,
        reducedMotion,
        startedAtMilliseconds: performance.now()
      })
    );
  };

  return (
    <>
      <button aria-expanded={mapOpen} className="world-map-button" onClick={openMap} type="button">
        Map
      </button>

      {activeTravel ? (
        <aside aria-live="polite" className="world-travel-status">
          <span>{activeTravel.mode === "cinematic" ? "Cinematic travel" : "Fast travel"}</span>
          <strong>{activeTravel.target.name}</strong>
          {activeTravel.mode === "cinematic" ? (
            <button onClick={requestSkip} type="button">
              Skip travel
            </button>
          ) : null}
        </aside>
      ) : null}

      {syncStatus !== "idle" ? (
        <p className={`world-location-sync world-location-sync-${syncStatus}`} role="status">
          {syncMessage}
        </p>
      ) : null}

      {mapOpen ? (
        <section
          aria-label="Aetherium world map"
          aria-modal="true"
          className="world-map-overlay"
          role="dialog"
        >
          <header>
            <div>
              <span>World Navigation</span>
              <strong>{currentDestination?.name ?? "Aetherium"}</strong>
            </div>
            <button aria-label="Close world map" onClick={closeMap} type="button">
              Close
            </button>
          </header>

          <div aria-label="Travel mode" className="world-travel-modes" role="group">
            {TRAVEL_MODES.map((mode) => (
              <button
                aria-pressed={selectedMode === mode.id}
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="world-map-layout">
            <div aria-label="World destination map" className="world-map-plot">
              <div className="world-map-river" />
              {destinations.map((destination) => {
                const left = ((destination.worldPosition[0] + 400) / 800) * 100;
                const top = 100 - ((destination.worldPosition[2] + 400) / 800) * 100;
                return (
                  <button
                    aria-label={`${destination.name}${destination.unlocked ? "" : ", locked"}`}
                    className="world-map-marker"
                    data-current={destination.current}
                    data-selected={destination.id === destinationId}
                    data-unlocked={destination.unlocked}
                    disabled={!destination.unlocked}
                    key={destination.id}
                    onClick={() => selectDestination(destination.id)}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    type="button"
                  >
                    <i />
                    <span>{destination.name}</span>
                  </button>
                );
              })}
            </div>

            <aside className="world-map-detail">
              {selectedDestination ? (
                <>
                  <span>
                    {selectedDestination.visited ? "Visited destination" : "New destination"}
                  </span>
                  <h2>{selectedDestination.name}</h2>
                  <dl>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedDestination.unlocked ? "Unlocked" : "Locked"}</dd>
                    </div>
                    <div>
                      <dt>Travel</dt>
                      <dd>{selectedMode}</dd>
                    </div>
                  </dl>
                  <button
                    disabled={!selectedDestination.unlocked}
                    onClick={() => chooseDestination(selectedDestination)}
                    type="button"
                  >
                    {selectedMode === "walk" ? "Set walking destination" : `Travel ${selectedMode}`}
                  </button>
                  <Link href={selectedDestination.commandRoute}>Open now in Command Mode</Link>
                </>
              ) : (
                <p>Select an unlocked destination.</p>
              )}
              {previousDestination && previousDestination.id !== selectedDestination?.id ? (
                <button onClick={() => selectDestination(previousDestination.id)} type="button">
                  Continue from {previousDestination.name}
                </button>
              ) : null}
            </aside>
          </div>
        </section>
      ) : null}
    </>
  );
}
