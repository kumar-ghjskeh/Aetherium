import { describe, expect, it } from "vitest";

import {
  loadSavedWorldRuntimeState,
  parseSavedWorldRuntimeState,
  saveWorldRuntimeState
} from "./save-sync";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value)
  };
}

describe("world runtime save sync", () => {
  it("round-trips bounded session-only player state", () => {
    const storage = createStorage();
    saveWorldRuntimeState(storage, {
      backendLocationId: "library",
      facingRadians: 1.2,
      position: [184, 12, -220],
      savedAtMilliseconds: 10_000
    });
    expect(loadSavedWorldRuntimeState(storage, 11_000)).toMatchObject({
      backendLocationId: "library",
      position: [184, 12, -220],
      version: 1
    });
  });

  it("rejects stale, future, malformed, and out-of-bounds state", () => {
    expect(
      parseSavedWorldRuntimeState(
        JSON.stringify({
          backendLocationId: "library",
          facingRadians: 0,
          position: [900, 0, 0],
          savedAtMilliseconds: 100,
          version: 1
        }),
        200
      )
    ).toBeNull();
    expect(parseSavedWorldRuntimeState("not-json", 200)).toBeNull();
  });
});
