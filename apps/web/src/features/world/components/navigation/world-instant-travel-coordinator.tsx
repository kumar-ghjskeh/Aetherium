import React from "react";

import { resolveCameraYawToward } from "../../engine/camera-system";
import type { WorldDestination } from "../../engine/navigation-system";
import { useWorldCameraStore } from "../../state/camera-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { usePlayerStore } from "../../state/player-store";

export function WorldInstantTravelCoordinator({
  onArrive
}: Readonly<{
  onArrive: (destination: WorldDestination) => Promise<void> | void;
}>): null {
  const activeTravel = useWorldNavigationStore((state) => state.activeTravel);

  React.useEffect(() => {
    if (!activeTravel || activeTravel.durationSeconds > 0) {
      return;
    }

    usePlayerStore.getState().requestTeleport(activeTravel.target.point);
    useWorldCameraStore
      .getState()
      .recenter(
        resolveCameraYawToward(activeTravel.target.point, activeTravel.target.worldPosition)
      );
    useWorldNavigationStore.getState().completeTravel();
    void onArrive(activeTravel.target);
  }, [activeTravel, onArrive]);

  return null;
}
