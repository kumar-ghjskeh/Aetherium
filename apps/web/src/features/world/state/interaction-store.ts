import { create } from "zustand";

import {
  resolveInteractionActivation,
  type WorldInteraction,
  type WorldInteractionActivationResult,
  type WorldInteractionStatus
} from "../engine/interaction-system";

interface InteractionStoreState {
  activationResult: WorldInteractionActivationResult | null;
  activeInteractionId: string | null;
  clearActivationResult: () => void;
  getActiveInteraction: () => WorldInteraction | null;
  interactions: WorldInteraction[];
  requestActivation: (interactionId: string) => void;
  setActiveInteractionId: (interactionId: string | null) => void;
  setInteractions: (interactions: WorldInteraction[]) => void;
  setInteractionStatus: (
    interactionId: string,
    status: WorldInteractionStatus,
    message?: string
  ) => void;
}

export const useWorldInteractionStore = create<InteractionStoreState>((set, get) => ({
  activationResult: null,
  activeInteractionId: null,
  clearActivationResult: () => set({ activationResult: null }),
  getActiveInteraction: () => {
    const { activeInteractionId, interactions } = get();
    return interactions.find((interaction) => interaction.id === activeInteractionId) ?? null;
  },
  interactions: [],
  requestActivation: (interactionId) =>
    set((state) => {
      const interaction = state.interactions.find((item) => item.id === interactionId);
      return {
        activationResult: interaction
          ? resolveInteractionActivation(interaction)
          : {
              interactionId,
              kind: "blocked",
              message: "This interaction is no longer available."
            }
      };
    }),
  setActiveInteractionId: (interactionId) => set({ activeInteractionId: interactionId }),
  setInteractions: (interactions) =>
    set((state) => ({
      activeInteractionId: interactions.some(
        (interaction) => interaction.id === state.activeInteractionId
      )
        ? state.activeInteractionId
        : null,
      interactions
    })),
  setInteractionStatus: (interactionId, status, message) =>
    set((state) => ({
      interactions: state.interactions.map((interaction) => {
        if (interaction.id !== interactionId) {
          return interaction;
        }

        const updated: WorldInteraction = { ...interaction, status };
        if ((status === "disabled" || status === "permission_denied") && message) {
          return { ...updated, disabledReason: message };
        }
        if (status === "error" && message) {
          return { ...updated, errorMessage: message };
        }
        return updated;
      })
    }))
}));
