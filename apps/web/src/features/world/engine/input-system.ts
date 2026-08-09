export interface GamepadInputSnapshot {
  axes: readonly number[];
  buttons: readonly boolean[];
}

export interface MovementIntent {
  commandModeRequested: boolean;
  interactRequested: boolean;
  mapRequested: boolean;
  magnitude: number;
  pauseRequested: boolean;
  sprinting: boolean;
  xAxis: number;
  zAxis: number;
}

const DEAD_ZONE = 0.18;

export function normalizeInputKey(key: string): string {
  return key.toLowerCase();
}

export function shouldCaptureWorldKey({
  defaultPrevented,
  insideDialog,
  interactiveTarget,
  key,
  worldSurfaceFocused
}: Readonly<{
  defaultPrevented: boolean;
  insideDialog: boolean;
  interactiveTarget: boolean;
  key: string;
  worldSurfaceFocused: boolean;
}>): boolean {
  if (defaultPrevented || insideDialog || interactiveTarget) {
    return false;
  }
  return key !== "tab" || worldSurfaceFocused;
}

export function createMovementIntent({
  gamepad,
  keys
}: Readonly<{
  gamepad?: GamepadInputSnapshot | null;
  keys: ReadonlySet<string>;
}>): MovementIntent {
  let xAxis = 0;
  let zAxis = 0;

  if (keys.has("keya") || keys.has("arrowleft")) {
    xAxis -= 1;
  }
  if (keys.has("keyd") || keys.has("arrowright")) {
    xAxis += 1;
  }
  if (keys.has("keyw") || keys.has("arrowup")) {
    zAxis -= 1;
  }
  if (keys.has("keys") || keys.has("arrowdown")) {
    zAxis += 1;
  }

  if (gamepad) {
    const gamepadX = Math.abs(gamepad.axes[0] ?? 0) >= DEAD_ZONE ? (gamepad.axes[0] ?? 0) : 0;
    const gamepadZ = Math.abs(gamepad.axes[1] ?? 0) >= DEAD_ZONE ? (gamepad.axes[1] ?? 0) : 0;
    xAxis += gamepadX;
    zAxis += gamepadZ;
  }

  const rawMagnitude = Math.hypot(xAxis, zAxis);
  const magnitude = Math.min(1, rawMagnitude);
  if (rawMagnitude > 1) {
    xAxis /= rawMagnitude;
    zAxis /= rawMagnitude;
  }

  return {
    commandModeRequested: keys.has("tab") || Boolean(gamepad?.buttons[1]),
    interactRequested: keys.has("keye") || keys.has("enter") || Boolean(gamepad?.buttons[0]),
    magnitude,
    mapRequested: keys.has("keym") || Boolean(gamepad?.buttons[8]),
    pauseRequested: keys.has("escape") || Boolean(gamepad?.buttons[9]),
    sprinting:
      keys.has("shiftleft") ||
      keys.has("shiftright") ||
      keys.has("shift") ||
      Boolean(gamepad?.buttons[7]),
    xAxis,
    zAxis
  };
}
