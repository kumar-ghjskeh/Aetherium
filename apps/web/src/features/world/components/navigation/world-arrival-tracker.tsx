import { useFrame } from "@react-three/fiber";
import React from "react";

import { resolveEnteredDestination, type WorldDestination } from "../../engine/navigation-system";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";

export function WorldArrivalTracker({
  destinations,
  onArrive
}: Readonly<{
  destinations: WorldDestination[];
  onArrive: (destination: WorldDestination) => Promise<void> | void;
}>): React.ReactElement | null {
  const lastCheckRef = React.useRef(0);

  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastCheckRef.current < 0.75) {
      return;
    }
    lastCheckRef.current = clock.elapsedTime;
    if (useWorldNavigationStore.getState().activeTravel) {
      return;
    }
    const destination = resolveEnteredDestination(usePlayerStore.getState().position, destinations);
    if (destination) {
      void onArrive(destination);
    }
  });

  return null;
}
