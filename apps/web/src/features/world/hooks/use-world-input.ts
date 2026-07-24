import React from "react";

import { normalizeInputKey } from "../engine/input-system";
import { usePlayerStore } from "../state/player-store";

export function useWorldInput(): void {
  const setGamepadInput = usePlayerStore((state) => state.setGamepadInput);
  const setKeyPressed = usePlayerStore((state) => state.setKeyPressed);
  const togglePaused = usePlayerStore((state) => state.togglePaused);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = normalizeInputKey(event.code || event.key);
      if (
        WORLD_CAPTURED_KEYS.has(normalizedKey) &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
      }
      if (normalizedKey === "escape" && !event.repeat) {
        togglePaused();
      }
      setKeyPressed(normalizedKey, true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      setKeyPressed(normalizeInputKey(event.code || event.key), false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setKeyPressed, togglePaused]);

  React.useEffect(() => {
    let frameId = 0;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads?.() ?? [];
      const connectedGamepad = Array.from(gamepads).find(Boolean);
      if (connectedGamepad) {
        setGamepadInput({
          axes: [...connectedGamepad.axes],
          buttons: connectedGamepad.buttons.map((button) => button.pressed)
        });
      } else {
        setGamepadInput(null);
      }
      frameId = window.requestAnimationFrame(pollGamepad);
    };

    frameId = window.requestAnimationFrame(pollGamepad);
    return () => {
      window.cancelAnimationFrame(frameId);
      setGamepadInput(null);
    };
  }, [setGamepadInput]);
}

const WORLD_CAPTURED_KEYS = new Set([
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowup",
  "enter",
  "escape",
  "keye",
  "keym",
  "keys",
  "keyw",
  "keya",
  "keyd",
  "shift",
  "shiftleft",
  "shiftright",
  "tab"
]);
