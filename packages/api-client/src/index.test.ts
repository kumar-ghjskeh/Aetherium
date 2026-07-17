import { describe, expect, it, vi } from "vitest";

import { createAetheriumApiClient } from "./index";

describe("createAetheriumApiClient", () => {
  it("fetches and validates API liveness", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            checks: {},
            service: "api",
            status: "ok",
            version: "0.1.0"
          }),
          {
            headers: {
              "Content-Type": "application/json"
            },
            status: 200
          }
        )
      )
    );

    const client = createAetheriumApiClient({
      baseUrl: "http://localhost:8000/",
      fetcher
    });

    await expect(client.health.live()).resolves.toEqual({
      checks: {},
      service: "api",
      status: "ok",
      version: "0.1.0"
    });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/health/live", {
      headers: {
        Accept: "application/json"
      }
    });
  });
});
