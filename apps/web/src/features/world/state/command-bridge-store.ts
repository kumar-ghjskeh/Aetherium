import { create } from "zustand";

interface WorldCommandBridgeState {
  close: () => void;
  open: () => void;
  overlayOpen: boolean;
  toggle: () => void;
}

export const useWorldCommandBridgeStore = create<WorldCommandBridgeState>((set) => ({
  close: () => set({ overlayOpen: false }),
  open: () => set({ overlayOpen: true }),
  overlayOpen: false,
  toggle: () => set((state) => ({ overlayOpen: !state.overlayOpen }))
}));
