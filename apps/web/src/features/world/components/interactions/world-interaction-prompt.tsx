import { useRouter } from "next/navigation";
import React from "react";

import { canActivateInteraction } from "../../engine/interaction-system";
import { useWorldInteractionStore } from "../../state/interaction-store";

export function WorldInteractionPrompt(): React.ReactElement | null {
  const router = useRouter();
  const activationResult = useWorldInteractionStore((state) => state.activationResult);
  const activeInteractionId = useWorldInteractionStore((state) => state.activeInteractionId);
  const clearActivationResult = useWorldInteractionStore((state) => state.clearActivationResult);
  const interactions = useWorldInteractionStore((state) => state.interactions);
  const requestActivation = useWorldInteractionStore((state) => state.requestActivation);
  const activeInteraction =
    interactions.find((interaction) => interaction.id === activeInteractionId) ?? null;

  React.useEffect(() => {
    if (activationResult?.kind !== "command_route") {
      return;
    }

    router.push(activationResult.route);
    clearActivationResult();
  }, [activationResult, clearActivationResult, router]);

  if (!activeInteraction) {
    return null;
  }

  const blockedMessage =
    activationResult?.kind === "blocked" && activationResult.interactionId === activeInteraction.id
      ? activationResult.message
      : null;
  const loadingMessage =
    activationResult?.kind === "loading" && activationResult.interactionId === activeInteraction.id
      ? activationResult.message
      : null;
  const available = canActivateInteraction(activeInteraction);

  return (
    <aside
      aria-label={activeInteraction.accessibilityLabel}
      aria-live="polite"
      className={`world-interaction-prompt world-interaction-prompt--${activeInteraction.status}`}
      role="status"
    >
      <span>{activeInteraction.type.replaceAll("_", " ")}</span>
      <strong>{activeInteraction.prompt}</strong>
      <small>
        {blockedMessage ??
          loadingMessage ??
          (available
            ? "Press E or gamepad primary to open in Command Mode."
            : activeInteraction.disabledReason)}
      </small>
      <button
        className="world-runtime-button"
        disabled={!available}
        onClick={() => requestActivation(activeInteraction.id)}
        type="button"
      >
        Open
      </button>
    </aside>
  );
}
