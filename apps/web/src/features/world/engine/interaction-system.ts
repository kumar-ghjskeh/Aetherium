import type { WorldLocationId } from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export type WorldInteractionType =
  | "continue_last_activity"
  | "enter_location"
  | "fast_travel"
  | "open_achievement_display"
  | "open_analytics"
  | "open_application_panel"
  | "open_file_collection"
  | "open_habit_dashboard"
  | "open_project"
  | "read_notification"
  | "start_ai_conversation"
  | "start_lesson";

export type WorldInteractionStatus =
  "available" | "disabled" | "error" | "loading" | "permission_denied";

export type WorldInteractionKeyboardAction = "Enter" | "KeyE";

export type WorldInteractionGamepadAction = "primary";

export interface WorldInteraction {
  accessibilityLabel: string;
  backendRoute?: string;
  commandRoute: string;
  disabledReason?: string;
  errorMessage?: string;
  gamepadAction: WorldInteractionGamepadAction;
  id: string;
  keyboardAction: WorldInteractionKeyboardAction;
  locationId: WorldLocationId;
  permission: "allowed" | "unknown";
  position: Vector3Tuple;
  prompt: string;
  radius: number;
  status: WorldInteractionStatus;
  type: WorldInteractionType;
}

export interface RankedWorldInteraction {
  distance: number;
  facingScore: number;
  interaction: WorldInteraction;
  priorityScore: number;
}

export type WorldInteractionActivationResult =
  | {
      interactionId: string;
      kind: "blocked";
      message: string;
    }
  | {
      interactionId: string;
      kind: "command_route";
      route: string;
    }
  | {
      interactionId: string;
      kind: "loading";
      message: string;
    };

export function isInteractionWithinRadius(
  interaction: WorldInteraction,
  playerPosition: Vector3Tuple
): boolean {
  return interactionDistance(interaction, playerPosition) <= interaction.radius;
}

export function interactionDistance(
  interaction: Pick<WorldInteraction, "position">,
  playerPosition: Vector3Tuple
): number {
  return Math.hypot(
    interaction.position[0] - playerPosition[0],
    interaction.position[1] - playerPosition[1],
    interaction.position[2] - playerPosition[2]
  );
}

export function rankWorldInteractions({
  interactions,
  playerFacingRadians,
  playerPosition
}: Readonly<{
  interactions: readonly WorldInteraction[];
  playerFacingRadians: number;
  playerPosition: Vector3Tuple;
}>): RankedWorldInteraction[] {
  const playerForward = [Math.sin(playerFacingRadians), -Math.cos(playerFacingRadians)] as const;

  return interactions
    .filter((interaction) => isInteractionWithinRadius(interaction, playerPosition))
    .map((interaction) => {
      const distance = interactionDistance(interaction, playerPosition);
      const planarVector = [
        interaction.position[0] - playerPosition[0],
        interaction.position[2] - playerPosition[2]
      ] as const;
      const planarLength = Math.hypot(planarVector[0], planarVector[1]) || 1;
      const facingScore =
        (playerForward[0] * planarVector[0] + playerForward[1] * planarVector[1]) / planarLength;
      const unavailablePenalty = interaction.status === "available" ? 0 : 1.25;

      return {
        distance,
        facingScore,
        interaction,
        priorityScore: distance - facingScore * 0.45 + unavailablePenalty
      };
    })
    .sort((left, right) => left.priorityScore - right.priorityScore);
}

export function selectActiveInteraction(
  rankedInteractions: readonly RankedWorldInteraction[]
): WorldInteraction | null {
  return rankedInteractions[0]?.interaction ?? null;
}

export function canActivateInteraction(interaction: WorldInteraction): boolean {
  return interaction.status === "available" && interaction.permission === "allowed";
}

export function resolveInteractionActivation(
  interaction: WorldInteraction
): WorldInteractionActivationResult {
  if (interaction.status === "loading") {
    return {
      interactionId: interaction.id,
      kind: "loading",
      message: "This destination is still loading."
    };
  }

  if (interaction.status === "error") {
    return {
      interactionId: interaction.id,
      kind: "blocked",
      message: interaction.errorMessage ?? "This destination is unavailable."
    };
  }

  if (!canActivateInteraction(interaction)) {
    return {
      interactionId: interaction.id,
      kind: "blocked",
      message: interaction.disabledReason ?? "You do not have access to this destination."
    };
  }

  return {
    interactionId: interaction.id,
    kind: "command_route",
    route: interaction.commandRoute
  };
}
