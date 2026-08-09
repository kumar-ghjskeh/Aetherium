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
  completedTeleportSequence: number;
  gamepadInput: GamepadInputSnapshot | null;
  inputMode: "gamepad" | "keyboard";
  interactionAligning: boolean;
  movementDisabled: boolean;
  paused: boolean;
  pendingTeleport: [number, number, number] | null;
  pressedKeys: string[];
  teleportSequence: number;
  consumeTeleport: () => void;
  requestTeleport: (position: readonly [number, number, number]) => void;
  setActionState: (state: PlayerActionState) => void;
  setGamepadInput: (input: GamepadInputSnapshot | null) => void;
  setInteractionAligning: (aligning: boolean) => void;
  setKeyPressed: (key: string, pressed: boolean) => void;
  setMovementDisabled: (disabled: boolean) => void;
  setPlayerRuntimeState: (state: PlayerRuntimeState) => void;
  togglePaused: () => void;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  commandModeRequested: false,
  completedTeleportSequence: 0,
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
  pendingTeleport: null,
  planarSpeed: 0,
  position: [0, 1.1, 0],
  pressedKeys: [],
  consumeTeleport: () =>
    set((state) => ({
      completedTeleportSequence: state.teleportSequence,
      pendingTeleport: null
    })),
  requestTeleport: (position) =>
    set((state) => ({
      grounded: true,
      movementState: "idle",
      pendingTeleport: [...position],
      planarSpeed: 0,
      position: [...position],
      teleportSequence: state.teleportSequence + 1,
      velocity: { x: 0, z: 0 }
    })),
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
  setMovementDisabled: (movementDisabled) => set({ movementDisabled }),
  setPlayerRuntimeState: (runtimeState) => set(runtimeState),
  teleportSequence: 0,
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  velocity: { x: 0, z: 0 }
}));
