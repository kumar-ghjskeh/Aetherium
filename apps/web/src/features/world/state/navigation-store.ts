import { create } from "zustand";

import type {
  WorldDestination,
  WorldTravelMode,
  WorldTravelPlan
} from "../engine/navigation-system";

type WorldSyncStatus = "idle" | "syncing" | "error";

export const WORLD_ARRIVAL_FRAMING_MILLISECONDS = 6_000;

interface WorldNavigationState {
  activeTravel: WorldTravelPlan | null;
  arrivalSuppressedUntilMilliseconds: number;
  destinationId: string | null;
  mapOpen: boolean;
  selectedMode: WorldTravelMode;
  skipRequested: boolean;
  syncMessage: string | null;
  syncStatus: WorldSyncStatus;
  closeMap: () => void;
  completeTravel: () => void;
  openMap: () => void;
  requestSkip: () => void;
  selectDestination: (destinationId: string | null) => void;
  setSelectedMode: (mode: WorldTravelMode) => void;
  setSyncError: (message: string) => void;
  setSyncIdle: () => void;
  setSyncing: (destination: WorldDestination) => void;
  startTravel: (plan: WorldTravelPlan) => void;
  toggleMap: () => void;
}

export const useWorldNavigationStore = create<WorldNavigationState>((set) => ({
  activeTravel: null,
  arrivalSuppressedUntilMilliseconds: 0,
  closeMap: () => set({ mapOpen: false }),
  completeTravel: () =>
    set({
      activeTravel: null,
      arrivalSuppressedUntilMilliseconds: Date.now() + WORLD_ARRIVAL_FRAMING_MILLISECONDS,
      skipRequested: false
    }),
  destinationId: null,
  mapOpen: false,
  openMap: () => set({ mapOpen: true }),
  requestSkip: () => set({ skipRequested: true }),
  selectedMode: "walk",
  selectDestination: (destinationId) => set({ destinationId }),
  setSelectedMode: (selectedMode) => set({ selectedMode }),
  setSyncError: (syncMessage) => set({ syncMessage, syncStatus: "error" }),
  setSyncIdle: () => set({ syncMessage: null, syncStatus: "idle" }),
  setSyncing: (destination) =>
    set({ syncMessage: `Saving arrival at ${destination.name}...`, syncStatus: "syncing" }),
  skipRequested: false,
  startTravel: (activeTravel) =>
    set({
      activeTravel,
      mapOpen: false,
      skipRequested: false,
      syncMessage: null,
      syncStatus: "idle"
    }),
  syncMessage: null,
  syncStatus: "idle",
  toggleMap: () => set((state) => ({ mapOpen: !state.mapOpen }))
}));
