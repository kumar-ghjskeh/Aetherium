const WORLD_RUNTIME_STORAGE_KEY = "aetherium:world:runtime-state:v1";
const WORLD_RUNTIME_STATE_TTL_MS = 12 * 60 * 60 * 1000;

export interface SavedWorldRuntimeState {
  backendLocationId: string;
  facingRadians: number;
  position: readonly [number, number, number];
  savedAtMilliseconds: number;
  version: 1;
}

type WorldRuntimeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function isFinitePosition(value: unknown): value is [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) {
    return false;
  }
  const x: unknown = value[0];
  const y: unknown = value[1];
  const z: unknown = value[2];
  return (
    typeof x === "number" &&
    Number.isFinite(x) &&
    Math.abs(x) <= 430 &&
    typeof y === "number" &&
    Number.isFinite(y) &&
    y >= -12 &&
    y <= 240 &&
    typeof z === "number" &&
    Number.isFinite(z) &&
    Math.abs(z) <= 430
  );
}

export function parseSavedWorldRuntimeState(
  rawValue: string,
  nowMilliseconds = Date.now()
): SavedWorldRuntimeState | null {
  try {
    const value: unknown = JSON.parse(rawValue);
    if (!value || typeof value !== "object") {
      return null;
    }
    const candidate = value as Partial<SavedWorldRuntimeState>;
    if (
      candidate.version !== 1 ||
      typeof candidate.backendLocationId !== "string" ||
      candidate.backendLocationId.length === 0 ||
      typeof candidate.facingRadians !== "number" ||
      !Number.isFinite(candidate.facingRadians) ||
      typeof candidate.savedAtMilliseconds !== "number" ||
      nowMilliseconds - candidate.savedAtMilliseconds > WORLD_RUNTIME_STATE_TTL_MS ||
      candidate.savedAtMilliseconds > nowMilliseconds + 60_000 ||
      !isFinitePosition(candidate.position)
    ) {
      return null;
    }
    return {
      backendLocationId: candidate.backendLocationId,
      facingRadians: candidate.facingRadians,
      position: candidate.position,
      savedAtMilliseconds: candidate.savedAtMilliseconds,
      version: 1
    };
  } catch {
    return null;
  }
}

export function loadSavedWorldRuntimeState(
  storage: WorldRuntimeStorage,
  nowMilliseconds = Date.now()
): SavedWorldRuntimeState | null {
  const rawValue = storage.getItem(WORLD_RUNTIME_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }
  const parsed = parseSavedWorldRuntimeState(rawValue, nowMilliseconds);
  if (!parsed) {
    storage.removeItem(WORLD_RUNTIME_STORAGE_KEY);
  }
  return parsed;
}

export function saveWorldRuntimeState(
  storage: WorldRuntimeStorage,
  state: Omit<SavedWorldRuntimeState, "version">
): void {
  storage.setItem(WORLD_RUNTIME_STORAGE_KEY, JSON.stringify({ ...state, version: 1 }));
}
