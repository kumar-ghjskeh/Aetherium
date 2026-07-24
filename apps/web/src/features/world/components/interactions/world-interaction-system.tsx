import { useFrame } from "@react-three/fiber";
import React from "react";

import {
  rankWorldInteractions,
  selectActiveInteraction,
  type WorldInteraction
} from "../../engine/interaction-system";
import { useWorldInteractionStore } from "../../state/interaction-store";
import { usePlayerStore } from "../../state/player-store";
import { DiagnosticInteractionMarkers } from "./world-interaction-markers";

export function WorldInteractionSystem({
  interactions,
  reducedMotion
}: Readonly<{
  interactions: WorldInteraction[];
  reducedMotion: boolean;
}>): React.ReactElement {
  const lastInteractionPressedRef = React.useRef(false);

  React.useEffect(() => {
    const store = useWorldInteractionStore.getState();
    store.setInteractions(interactions);
    return () => {
      useWorldInteractionStore.getState().setInteractions([]);
    };
  }, [interactions]);

  useFrame(() => {
    const playerState = usePlayerStore.getState();
    const interactionStore = useWorldInteractionStore.getState();
    const ranked = rankWorldInteractions({
      interactions: interactionStore.interactions,
      playerFacingRadians: playerState.facingRadians,
      playerPosition: playerState.position
    });
    const activeInteraction = selectActiveInteraction(ranked);
    const activeInteractionId = activeInteraction?.id ?? null;

    if (interactionStore.activeInteractionId !== activeInteractionId) {
      interactionStore.setActiveInteractionId(activeInteractionId);
    }

    const interactionPressed = playerState.interactionRequested;
    if (interactionPressed && !lastInteractionPressedRef.current && activeInteraction) {
      interactionStore.requestActivation(activeInteraction.id);
    }
    lastInteractionPressedRef.current = interactionPressed;

    const shouldAlign = Boolean(activeInteraction && interactionPressed && !reducedMotion);
    if (playerState.interactionAligning !== shouldAlign) {
      usePlayerStore.getState().setInteractionAligning(shouldAlign);
    }
  });

  return <DiagnosticInteractionMarkers />;
}
