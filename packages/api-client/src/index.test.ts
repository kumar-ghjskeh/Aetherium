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
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });
  });

  it("posts registration payloads with credentials", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            user: {
              createdAt: "2026-07-17T00:00:00Z",
              displayName: "Sai",
              email: "sai@example.com",
              id: "11111111-1111-4111-8111-111111111111",
              isEmailVerified: false,
              lastLoginAt: null
            }
          }),
          { status: 201 }
        )
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await client.auth.register({
      displayName: "Sai",
      email: "sai@example.com",
      password: "StrongPass123!"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/register", {
      body: JSON.stringify({
        displayName: "Sai",
        email: "sai@example.com",
        password: "StrongPass123!"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("throws typed API errors", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              code: "invalid_credentials",
              message: "Email or password is incorrect."
            }
          }),
          { status: 401 }
        )
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.auth.login({ email: "sai@example.com", password: "WrongPass123!" })
    ).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401
    });
  });
});
