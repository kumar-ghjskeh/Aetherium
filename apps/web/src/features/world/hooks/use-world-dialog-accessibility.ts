import React from "react";

import {
  resolveNextMenuIndex,
  resolveWorldMenuAction
} from "../engine/accessible-navigation-system";
import { usePlayerStore } from "../state/player-store";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function useWorldDialogAccessibility({
  active,
  containerRef,
  initialFocusRef,
  onClose,
  returnFocusRef
}: Readonly<{
  active: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}>): void {
  React.useEffect(() => {
    if (!active) {
      return;
    }

    const returnTarget = returnFocusRef?.current ?? document.activeElement;
    const focusInitialControl = () => {
      const container = containerRef.current;
      const target = initialFocusRef?.current ?? getFocusableElements(container)[0];
      target?.focus();
    };
    const focusFrame = window.requestAnimationFrame(focusInitialControl);

    const handleKeyDown = (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = resolveNextMenuIndex({
        currentIndex,
        direction: event.shiftKey ? "previous" : "next",
        itemCount: focusable.length
      });
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    let gamepadFrame = 0;
    let previousGamepad = usePlayerStore.getState().gamepadInput;
    const pollGamepad = () => {
      const currentGamepad = usePlayerStore.getState().gamepadInput;
      const action = resolveWorldMenuAction(currentGamepad, previousGamepad);
      previousGamepad = currentGamepad;
      const container = containerRef.current;
      if (container && action) {
        if (action === "close") {
          onClose();
        } else if (action === "activate") {
          (document.activeElement as HTMLElement | null)?.click();
        } else {
          const focusable = getFocusableElements(container);
          const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
          const nextIndex = resolveNextMenuIndex({
            currentIndex,
            direction: action,
            itemCount: focusable.length
          });
          focusable[nextIndex]?.focus();
        }
      }
      gamepadFrame = window.requestAnimationFrame(pollGamepad);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    gamepadFrame = window.requestAnimationFrame(pollGamepad);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.cancelAnimationFrame(gamepadFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (returnTarget instanceof HTMLElement && returnTarget.isConnected) {
        returnTarget.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, onClose, returnFocusRef]);
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true"
  );
}
