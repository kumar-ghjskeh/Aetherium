import { beforeEach, describe, expect, it } from "vitest";

import { useWorldCommandBridgeStore } from "./command-bridge-store";

describe("world command bridge store", () => {
  beforeEach(() => useWorldCommandBridgeStore.setState({ overlayOpen: false }));

  it("opens, closes, and toggles the Command Mode overlay", () => {
    useWorldCommandBridgeStore.getState().open();
    expect(useWorldCommandBridgeStore.getState().overlayOpen).toBe(true);
    useWorldCommandBridgeStore.getState().toggle();
    expect(useWorldCommandBridgeStore.getState().overlayOpen).toBe(false);
  });
});
