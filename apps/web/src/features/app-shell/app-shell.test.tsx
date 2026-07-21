import type { AetheriumApiClient } from "@aetherium/api-client";
import { AetheriumApiError } from "@aetherium/api-client";
import type {
  AuditLogPage,
  DomainEvent,
  DomainEventPage,
  HealthCheckResponse,
  Notification,
  NotificationPage,
  PublicUser,
  UserPreferences,
  WorldProfile
} from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../auth/auth-provider";
import { createUnusedFilesClient, createUnusedMentorsClient } from "../../test/api-client";
import { AppDashboard } from "./app-dashboard";
import { AppShell } from "./app-shell";
import { SectionPage } from "./section-page";

const push = vi.fn();
const replace = vi.fn();
let pathname = "/app";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...props
  }: Readonly<{
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }>) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, replace })
}));

const user: PublicUser = {
  createdAt: "2026-07-17T00:00:00Z",
  displayName: "Sai",
  email: "sai@example.com",
  id: "11111111-1111-4111-8111-111111111111",
  isEmailVerified: false,
  lastLoginAt: null
};

const health: HealthCheckResponse = {
  checks: {},
  service: "api",
  status: "ok",
  version: "0.1.0"
};

const preferences: UserPreferences = {
  aiMemoryEnabled: false,
  ambientAudioEnabled: false,
  backgroundMusicEnabled: false,
  cameraEffectsEnabled: false,
  createdAt: "2026-07-20T00:00:00Z",
  defaultInterfaceMode: "command",
  id: "44444444-4444-4444-8444-444444444444",
  locale: "en-US",
  performancePreset: "automatic",
  productAnalyticsEnabled: false,
  reducedMotion: false,
  theme: "system",
  timeZone: "UTC",
  updatedAt: "2026-07-20T00:00:00Z"
};

const worldProfile: WorldProfile = {
  createdAt: "2026-07-20T00:00:00Z",
  currentLocationId: "central_plaza",
  id: "55555555-5555-4555-8555-555555555555",
  lastVisitedLocationId: null,
  preferredNavigationMethod: "command_palette",
  spawnLocationId: "central_plaza",
  tutorialCompleted: false,
  unlockedLocationIds: ["central_plaza", "library", "habit_garden"],
  updatedAt: "2026-07-20T00:00:00Z",
  visitedLocationIds: ["central_plaza"],
  worldStateVersion: 1
};

const unreadNotification: Notification = {
  actionUrl: "/app/settings",
  body: "Your command shell is ready.",
  createdAt: "2026-07-20T00:00:00Z",
  id: "33333333-3333-4333-8333-333333333333",
  notificationType: "system",
  readAt: null,
  severity: "info",
  title: "Command Mode ready"
};

const readNotification: Notification = {
  ...unreadNotification,
  readAt: "2026-07-20T00:01:00Z"
};

const notificationPage: NotificationPage = {
  items: [unreadNotification],
  limit: 5,
  offset: 0,
  total: 1,
  unreadCount: 1
};

const emptyAuditLogPage: AuditLogPage = {
  items: [],
  limit: 20,
  offset: 0,
  total: 0
};

const domainEvent: DomainEvent = {
  createdAt: "2026-07-20T00:00:00Z",
  eventType: "user.preference_updated",
  id: "22222222-2222-4222-8222-222222222222",
  idempotencyKey: "test-event",
  occurredAt: "2026-07-20T00:00:00Z",
  payload: {}
};

const emptyDomainEventPage: DomainEventPage = {
  items: [],
  limit: 20,
  offset: 0,
  total: 0
};

function unauthenticatedError(): AetheriumApiError {
  return new AetheriumApiError(401, {
    error: {
      code: "unauthenticated",
      message: "Authentication is required."
    }
  });
}

function createClient(
  overrides: Partial<{
    auth: Partial<AetheriumApiClient["auth"]>;
    files: Partial<AetheriumApiClient["files"]>;
    mentors: Partial<AetheriumApiClient["mentors"]>;
    notifications: Partial<AetheriumApiClient["notifications"]>;
    search: Partial<AetheriumApiClient["search"]>;
    settings: Partial<AetheriumApiClient["settings"]>;
    world: Partial<AetheriumApiClient["world"]>;
  }> = {}
): AetheriumApiClient {
  return {
    ai: {
      completeChat: vi.fn(() => Promise.reject(new Error("unused"))),
      createEmbeddings: vi.fn(() => Promise.reject(new Error("unused"))),
      listConsent: vi.fn(() => Promise.reject(new Error("unused"))),
      listModelConfigs: vi.fn(() => Promise.reject(new Error("unused"))),
      listProviders: vi.fn(() => Promise.reject(new Error("unused"))),
      listUsage: vi.fn(() => Promise.reject(new Error("unused"))),
      streamChat: vi.fn(() => Promise.reject(new Error("unused"))),
      updateConsent: vi.fn(() => Promise.reject(new Error("unused"))),
      updateModelConfig: vi.fn(() => Promise.reject(new Error("unused")))
    },
    auditLogs: {
      list: vi.fn(() => Promise.resolve(emptyAuditLogPage))
    },
    auth: {
      login: vi.fn(() => Promise.resolve({ user })),
      logout: vi.fn(() => Promise.resolve()),
      me: vi.fn(() => Promise.resolve(user)),
      register: vi.fn(() => Promise.resolve({ user })),
      ...overrides.auth
    },
    domainEvents: {
      create: vi.fn(() => Promise.resolve(domainEvent)),
      list: vi.fn(() => Promise.resolve(emptyDomainEventPage))
    },
    files: { ...createUnusedFilesClient(), ...overrides.files },
    health: {
      live: vi.fn(() => Promise.resolve(health)),
      ready: vi.fn(() => Promise.resolve(health))
    },
    mentors: { ...createUnusedMentorsClient(), ...(overrides.mentors ?? {}) },
    notifications: {
      list: vi.fn(() => Promise.resolve(notificationPage)),
      markRead: vi.fn(() => Promise.resolve(readNotification)),
      ...overrides.notifications
    },
    search: {
      recent: vi.fn(() => Promise.resolve({ items: [], limit: 20, offset: 0, total: 0 })),
      run: vi.fn(() =>
        Promise.resolve({
          items: [],
          limit: 20,
          mode: "hybrid" as const,
          offset: 0,
          query: "",
          semanticEnabled: false,
          total: 0
        })
      ),
      ...overrides.search
    },
    settings: {
      getPreferences: vi.fn(() => Promise.resolve(preferences)),
      updatePreferences: vi.fn((payload) => Promise.resolve({ ...preferences, ...payload })),
      ...overrides.settings
    },
    world: {
      getProfile: vi.fn(() => Promise.resolve(worldProfile)),
      updateProfile: vi.fn(() => Promise.resolve(worldProfile)),
      visit: vi.fn(() => Promise.resolve(worldProfile)),
      ...overrides.world
    }
  };
}

function renderShell(
  client: AetheriumApiClient,
  children: React.ReactNode = <AppDashboard />,
  onRedirect?: (target: string) => void
): void {
  const shell = onRedirect ? (
    <AppShell client={client} onRedirect={onRedirect}>
      {children}
    </AppShell>
  ) : (
    <AppShell client={client}>{children}</AppShell>
  );

  render(<AuthProvider client={client}>{shell}</AuthProvider>);
}

describe("Command Mode shell", () => {
  beforeEach(() => {
    pathname = "/app";
    push.mockReset();
    replace.mockReset();
  });

  it("renders authenticated shell data from the foundation APIs", async () => {
    const client = createClient();
    renderShell(client);

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getAllByText("Sai").length).toBeGreaterThan(0);
    expect(screen.getByText("sai@example.com")).toBeInTheDocument();
    expect(await screen.findByText("central_plaza")).toBeInTheDocument();
    expect(await screen.findByText("3 locations unlocked")).toBeInTheDocument();
    expect(client.settings.getPreferences).toHaveBeenCalledTimes(1);
    expect(client.world.getProfile).toHaveBeenCalledTimes(1);
    expect(client.notifications.list).toHaveBeenCalledWith({ limit: 5, offset: 0 });
  });

  it("redirects anonymous users to the login route", async () => {
    const onRedirect = vi.fn();
    const client = createClient({
      auth: { me: vi.fn(() => Promise.reject(unauthenticatedError())) }
    });
    renderShell(client, <AppDashboard />, onRedirect);

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/login?next=/app"));
  });

  it("opens the command palette with the keyboard and runs navigation actions", async () => {
    const client = createClient();
    renderShell(client);

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.keyboard("{Control>}k{/Control}");

    const palette = screen.getByRole("dialog", { name: "Command palette" });
    expect(within(palette).getByRole("button", { name: /Open settings/i })).toBeInTheDocument();

    await userEvent.click(within(palette).getByRole("button", { name: /Open settings/i }));

    expect(push).toHaveBeenCalledWith("/app/settings");
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
  });

  it("runs global search from the command palette and opens results", async () => {
    const client = createClient({
      search: {
        run: vi.fn(() =>
          Promise.resolve({
            items: [
              {
                createdAt: "2026-07-20T00:00:00Z",
                entityId: "77777777-7777-4777-8777-777777777777",
                entityType: "file_chunk" as const,
                id: "file_chunk:77777777-7777-4777-8777-777777777777",
                matchReason: "file_content" as const,
                openUrl:
                  "/app/library?file=11111111-1111-4111-8111-111111111111&chunk=77777777-7777-4777-8777-777777777777",
                score: 0.9,
                snippet: "Alpha systems notes.",
                source: {
                  chunkId: "77777777-7777-4777-8777-777777777777",
                  fileId: "11111111-1111-4111-8111-111111111111",
                  pageNumber: null,
                  sectionLabel: "document"
                },
                title: "Alpha Notes content",
                worldLocationId: "library"
              }
            ],
            limit: 8,
            mode: "hybrid" as const,
            offset: 0,
            query: "alpha",
            semanticEnabled: false,
            total: 1
          })
        )
      }
    });
    renderShell(client);

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.keyboard("{Control>}k{/Control}");
    await userEvent.type(screen.getByLabelText("Search Aetherium"), "alpha");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() =>
      expect(client.search.run).toHaveBeenCalledWith({ limit: 8, mode: "hybrid", query: "alpha" })
    );
    await userEvent.click(await screen.findByRole("button", { name: /Alpha Notes content/i }));

    expect(push).toHaveBeenCalledWith(
      "/app/library?file=11111111-1111-4111-8111-111111111111&chunk=77777777-7777-4777-8777-777777777777"
    );
  });

  it("marks notifications as read from the notification panel", async () => {
    const client = createClient();
    renderShell(client);

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(await screen.findByRole("button", { name: "Notifications, 1 unread" }));
    expect(screen.getByText("1 unread")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Command Mode ready/i }));

    expect(client.notifications.markRead).toHaveBeenCalledWith(unreadNotification.id);
    expect(await screen.findByText("0 unread")).toBeInTheDocument();
    expect(screen.getAllByText("Read").length).toBeGreaterThan(0);
  });

  it("shows a nonblocking error state when shell foundation data is unavailable", async () => {
    const client = createClient({
      settings: {
        getPreferences: vi.fn(() => Promise.reject(new Error("Aetherium data is unavailable.")))
      }
    });
    renderShell(client);

    expect(await screen.findByRole("alert")).toHaveTextContent("Aetherium data is unavailable.");
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  });

  it("persists settings changes through the shared API client", async () => {
    pathname = "/app/settings";
    const client = createClient();
    renderShell(client, <SectionPage section="settings" />);

    expect(await screen.findByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    await userEvent.selectOptions(await screen.findByLabelText("Theme"), "dark");

    await waitFor(() =>
      expect(client.settings.updatePreferences).toHaveBeenCalledWith({ theme: "dark" })
    );
  });
});
