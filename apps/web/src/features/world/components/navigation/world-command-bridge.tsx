import Link from "next/link";
import React from "react";

import { createWorldTravelPlan, type WorldDestination } from "../../engine/navigation-system";
import { useWorldCommandBridgeStore } from "../../state/command-bridge-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";

export function WorldCommandBridge({
  continueRoute,
  destinations,
  reducedMotion
}: Readonly<{
  continueRoute: string;
  destinations: WorldDestination[];
  reducedMotion: boolean;
}>): React.ReactElement {
  const close = useWorldCommandBridgeStore((state) => state.close);
  const open = useWorldCommandBridgeStore((state) => state.open);
  const overlayOpen = useWorldCommandBridgeStore((state) => state.overlayOpen);
  const commandModeRequested = usePlayerStore((state) => state.commandModeRequested);
  const previousCommandRequestRef = React.useRef(false);

  React.useEffect(() => {
    if (commandModeRequested && !previousCommandRequestRef.current) {
      useWorldCommandBridgeStore.getState().toggle();
    }
    previousCommandRequestRef.current = commandModeRequested;
  }, [commandModeRequested]);

  React.useEffect(() => {
    if (!overlayOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") {
        if (event.key === "Tab") {
          event.preventDefault();
        }
        close();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [close, overlayOpen]);

  return (
    <>
      <button
        aria-expanded={overlayOpen}
        className="world-command-button"
        onClick={open}
        type="button"
      >
        Command
      </button>
      {overlayOpen ? (
        <WorldCommandPanel
          continueRoute={continueRoute}
          destinations={destinations}
          onClose={close}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </>
  );
}

function WorldCommandPanel({
  continueRoute,
  destinations,
  onClose,
  reducedMotion
}: Readonly<{
  continueRoute: string;
  destinations: WorldDestination[];
  onClose: () => void;
  reducedMotion: boolean;
}>): React.ReactElement {
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const playerPosition = usePlayerStore((state) => state.position);
  const startTravel = useWorldNavigationStore((state) => state.startTravel);
  const filteredDestinations = destinations.filter((destination) =>
    destination.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  React.useEffect(() => searchRef.current?.focus(), []);

  const travelThere = (destination: WorldDestination) => {
    if (!destination.unlocked) {
      return;
    }
    startTravel(
      createWorldTravelPlan({
        destination,
        from: playerPosition,
        mode: "cinematic",
        reducedMotion,
        startedAtMilliseconds: performance.now()
      })
    );
    onClose();
  };

  return (
    <section
      aria-label="Command Mode bridge"
      aria-modal="true"
      className="world-command-overlay"
      role="dialog"
    >
      <header>
        <div>
          <span>Command Mode</span>
          <strong>Open data now or travel to its district</strong>
        </div>
        <button aria-label="Close Command Mode bridge" onClick={onClose} type="button">
          Close
        </button>
      </header>

      <div className="world-command-primary-actions">
        <Link href={continueRoute}>Continue last activity</Link>
        <Link href="/app">Open Command Center</Link>
        <Link href="/app/settings">Settings</Link>
      </div>

      <label className="world-command-search">
        Search world destinations
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Library, habits, coding..."
          ref={searchRef}
          type="search"
          value={query}
        />
      </label>

      {filteredDestinations.length === 0 ? (
        <p className="empty-note">No matching world destination.</p>
      ) : (
        <div aria-label="World destinations" className="world-command-destinations">
          {filteredDestinations.map((destination) => (
            <article data-unlocked={destination.unlocked} key={destination.id}>
              <div>
                <strong>{destination.name}</strong>
                <span>
                  {destination.current
                    ? "Current district"
                    : destination.unlocked
                      ? destination.visited
                        ? "Visited"
                        : "Ready to discover"
                      : "Locked"}
                </span>
              </div>
              <Link href={destination.commandRoute}>Open Now</Link>
              <button
                disabled={!destination.unlocked}
                onClick={() => travelThere(destination)}
                type="button"
              >
                Travel There
              </button>
            </article>
          ))}
        </div>
      )}
      <footer>
        <span>Tab returns to the world</span>
        <small>World rendering pauses while this bridge is open.</small>
      </footer>
    </section>
  );
}
