import { create } from "zustand";

import type { GamepadInputSnapshot } from "../engine/input-system";
import type { PlanarVelocity, PlayerMovementState } from "../engine/player-controller";

export interface PlayerRuntimeState {
  facingRadians: number;
  grounded: boolean;
  movementState: PlayerMovementState;
  planarSpeed: number;
  position: [number, number, number];
  velocity: PlanarVelocity;
}

export interface PlayerActionState {
  commandModeRequested: boolean;
  interactionRequested: boolean;
  mapRequested: boolean;
}

interface PlayerStoreState extends PlayerRuntimeState, PlayerActionState {
  gamepadInput: GamepadInputSnapshot | null;
  inputMode: "gamepad" | "keyboard";
  interactionAligning: boolean;
  movementDisabled: boolean;
  paused: boolean;
  pressedKeys: string[];
  setActionState: (state: PlayerActionState) => void;
  setGamepadInput: (input: GamepadInputSnapshot | null) => void;
  setInteractionAligning: (aligning: boolean) => void;
  setKeyPressed: (key: string, pressed: boolean) => void;
  setPlayerRuntimeState: (state: PlayerRuntimeState) => void;
  togglePaused: () => void;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  commandModeRequested: false,
  facingRadians: 0,
  gamepadInput: null,
  grounded: true,
  inputMode: "keyboard",
  interactionAligning: false,
  interactionRequested: false,
  mapRequested: false,
  movementDisabled: false,
  movementState: "idle",
  paused: false,
  planarSpeed: 0,
  position: [0, 1.1, 0],
  pressedKeys: [],
  setActionState: (actionState) => set(actionState),
  setGamepadInput: (input) =>
    set({
      gamepadInput: input,
      inputMode: input ? "gamepad" : "keyboard"
    }),
  setInteractionAligning: (aligning) => set({ interactionAligning: aligning }),
  setKeyPressed: (key, pressed) =>
    set((state) => {
      const keySet = new Set(state.pressedKeys);
      if (pressed) {
        keySet.add(key);
      } else {
        keySet.delete(key);
      }
      return { inputMode: "keyboard", pressedKeys: [...keySet] };
    }),
  setPlayerRuntimeState: (runtimeState) => set(runtimeState),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  velocity: { x: 0, z: 0 }
}));
