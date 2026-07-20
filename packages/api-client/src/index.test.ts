import { describe, expect, it, vi } from "vitest";

import { createAetheriumApiClient } from "./index";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    },
    status
  });
}

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

  it("updates user preferences through the settings API", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          aiMemoryEnabled: false,
          ambientAudioEnabled: false,
          backgroundMusicEnabled: false,
          cameraEffectsEnabled: false,
          createdAt: "2026-07-20T00:00:00Z",
          defaultInterfaceMode: "command",
          id: "22222222-2222-4222-8222-222222222222",
          locale: "en-US",
          performancePreset: "automatic",
          productAnalyticsEnabled: true,
          reducedMotion: true,
          theme: "dark",
          timeZone: "UTC",
          updatedAt: "2026-07-20T00:00:00Z"
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.settings.updatePreferences({
        productAnalyticsEnabled: true,
        reducedMotion: true,
        theme: "dark",
        timeZone: "UTC"
      })
    ).resolves.toMatchObject({
      productAnalyticsEnabled: true,
      reducedMotion: true,
      theme: "dark"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/settings/preferences", {
      body: JSON.stringify({
        productAnalyticsEnabled: true,
        reducedMotion: true,
        theme: "dark",
        timeZone: "UTC"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });
  });

  it("visits a non-visual world location through the world API", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          createdAt: "2026-07-20T00:00:00Z",
          currentLocationId: "library",
          id: "33333333-3333-4333-8333-333333333333",
          lastVisitedLocationId: "central_plaza",
          preferredNavigationMethod: "command_palette",
          spawnLocationId: "central_plaza",
          tutorialCompleted: false,
          unlockedLocationIds: ["central_plaza", "library"],
          updatedAt: "2026-07-20T00:00:00Z",
          visitedLocationIds: ["central_plaza", "library"],
          worldStateVersion: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.world.visit({ idempotencyKey: "visit-library-1", locationId: "library" })
    ).resolves.toMatchObject({
      currentLocationId: "library",
      lastVisitedLocationId: "central_plaza"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/world/visit", {
      body: JSON.stringify({ idempotencyKey: "visit-library-1", locationId: "library" }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("lists domain events with query parameters", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            {
              createdAt: "2026-07-20T00:00:00Z",
              eventType: "habit.logged",
              id: "44444444-4444-4444-8444-444444444444",
              idempotencyKey: "habit-log-1",
              occurredAt: "2026-07-20T00:00:00Z",
              payload: { habitId: "demo" }
            }
          ],
          limit: 1,
          offset: 0,
          total: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.domainEvents.list({ eventType: "habit.logged", limit: 1, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/domain-events?eventType=habit.logged&limit=1&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("marks notifications as read", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          actionUrl: null,
          body: "Your standalone Aetherium account is ready.",
          createdAt: "2026-07-20T00:00:00Z",
          id: "55555555-5555-4555-8555-555555555555",
          notificationType: "system",
          readAt: "2026-07-20T00:01:00Z",
          severity: "success",
          title: "Welcome to Aetherium"
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.notifications.markRead("55555555-5555-4555-8555-555555555555")
    ).resolves.toMatchObject({
      readAt: "2026-07-20T00:01:00Z"
    });
  });

  it("lists audit logs with pagination", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            {
              action: "user.registered",
              createdAt: "2026-07-20T00:00:00Z",
              entityId: "11111111-1111-4111-8111-111111111111",
              entityType: "user",
              id: "66666666-6666-4666-8666-666666666666",
              metadata: { source: "auth" }
            }
          ],
          limit: 20,
          offset: 0,
          total: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.auditLogs.list({ limit: 20, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/audit-logs?limit=20&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
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
