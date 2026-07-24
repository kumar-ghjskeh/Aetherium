import { useThree } from "@react-three/fiber";
import React from "react";

import { usePlayerStore } from "../state/player-store";
import { useWorldCameraStore } from "../state/camera-store";

export function useWorldCameraInput(): void {
  const { gl } = useThree();
  const recenter = useWorldCameraStore((state) => state.recenter);
  const setDistance = useWorldCameraStore((state) => state.setDistance);
  const setOrbitDelta = useWorldCameraStore((state) => state.setOrbitDelta);

  React.useEffect(() => {
    const element = gl.domElement;
    let draggingPointerId: number | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.button !== 2) {
        return;
      }

      draggingPointerId = event.pointerId;
      element.setPointerCapture(event.pointerId);
      element.focus();
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (draggingPointerId !== event.pointerId) {
        return;
      }

      setOrbitDelta(event.movementX, event.movementY);
      event.preventDefault();
    };

    const clearPointer = (event: PointerEvent) => {
      if (draggingPointerId === event.pointerId) {
        draggingPointerId = null;
      }
    };

    const onWheel = (event: WheelEvent) => {
      const currentDistance = useWorldCameraStore.getState().orbit.distance;
      setDistance(currentDistance + event.deltaY * 0.006);
      event.preventDefault();
    };

    const onContextMenu = (event: MouseEvent) => event.preventDefault();

    element.tabIndex = 0;
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", clearPointer);
    element.addEventListener("pointercancel", clearPointer);
    element.addEventListener("lostpointercapture", clearPointer);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("contextmenu", onContextMenu);
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", clearPointer);
      element.removeEventListener("pointercancel", clearPointer);
      element.removeEventListener("lostpointercapture", clearPointer);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl.domElement, setDistance, setOrbitDelta]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyR" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      recenter(usePlayerStore.getState().facingRadians);
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [recenter]);
}
