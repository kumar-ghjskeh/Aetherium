import type { GamepadInputSnapshot } from "./input-system";

export type WorldMenuAction = "activate" | "close" | "next" | "previous";

const GAMEPAD_AXIS_THRESHOLD = 0.62;

export function resolveWorldMenuAction(
  current: GamepadInputSnapshot | null,
  previous: GamepadInputSnapshot | null
): WorldMenuAction | null {
  if (!current) {
    return null;
  }

  if (isRisingButton(current, previous, 0)) {
    return "activate";
  }
  if (isRisingButton(current, previous, 1)) {
    return "close";
  }

  const currentVertical = current.axes[1] ?? 0;
  const previousVertical = previous?.axes[1] ?? 0;
  const currentHorizontal = current.axes[0] ?? 0;
  const previousHorizontal = previous?.axes[0] ?? 0;
  const nextPressed =
    isRisingButton(current, previous, 13) ||
    isRisingButton(current, previous, 15) ||
    crossedPositiveThreshold(currentVertical, previousVertical) ||
    crossedPositiveThreshold(currentHorizontal, previousHorizontal);
  if (nextPressed) {
    return "next";
  }

  const previousPressed =
    isRisingButton(current, previous, 12) ||
    isRisingButton(current, previous, 14) ||
    crossedNegativeThreshold(currentVertical, previousVertical) ||
    crossedNegativeThreshold(currentHorizontal, previousHorizontal);
  return previousPressed ? "previous" : null;
}

export function resolveNextMenuIndex({
  currentIndex,
  direction,
  itemCount
}: Readonly<{
  currentIndex: number;
  direction: "next" | "previous";
  itemCount: number;
}>): number {
  if (itemCount <= 0) {
    return -1;
  }
  if (currentIndex < 0) {
    return direction === "next" ? 0 : itemCount - 1;
  }
  const offset = direction === "next" ? 1 : -1;
  return (currentIndex + offset + itemCount) % itemCount;
}

function isRisingButton(
  current: GamepadInputSnapshot,
  previous: GamepadInputSnapshot | null,
  index: number
): boolean {
  return current.buttons[index] === true && previous?.buttons[index] !== true;
}

function crossedPositiveThreshold(current: number, previous: number): boolean {
  return current >= GAMEPAD_AXIS_THRESHOLD && previous < GAMEPAD_AXIS_THRESHOLD;
}

function crossedNegativeThreshold(current: number, previous: number): boolean {
  return current <= -GAMEPAD_AXIS_THRESHOLD && previous > -GAMEPAD_AXIS_THRESHOLD;
}
