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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";
import { AuthProvider, useAuth } from "./auth-provider";
import { ProtectedCommandMode } from "../command/protected-command-mode";
import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedProjectsClient
} from "../../test/api-client";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams()
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

const emptyAuditLogPage: AuditLogPage = {
  items: [],
  limit: 20,
  offset: 0,
  total: 0
};

const domainEvent: DomainEvent = {
  createdAt: "2026-07-20T00:00:00Z",
  eventType: "user.registered",
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

const notification: Notification = {
  actionUrl: null,
  body: "Ready",
  createdAt: "2026-07-20T00:00:00Z",
  id: "33333333-3333-4333-8333-333333333333",
  notificationType: "system",
  readAt: "2026-07-20T00:00:00Z",
  severity: "info",
  title: "Ready"
};

const emptyNotificationPage: NotificationPage = {
  items: [],
  limit: 20,
  offset: 0,
  total: 0,
  unreadCount: 0
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
  unlockedLocationIds: ["central_plaza"],
  updatedAt: "2026-07-20T00:00:00Z",
  visitedLocationIds: ["central_plaza"],
  worldStateVersion: 1
};

function unauthenticatedError(): AetheriumApiError {
  return new AetheriumApiError(401, {
    error: {
      code: "unauthenticated",
      message: "Authentication is required."
    }
  });
}

function invalidCredentialsError(): AetheriumApiError {
  return new AetheriumApiError(401, {
    error: {
      code: "invalid_credentials",
      message: "Email or password is incorrect."
    }
  });
}

function createClient(overrides: Partial<AetheriumApiClient["auth"]>): AetheriumApiClient {
  return {
    ai: {
      answerDocumentQuestion: vi.fn(() => Promise.reject(new Error("unused"))),
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
    achievements: createUnusedAchievementsClient(),
    analytics: createUnusedAnalyticsClient(),
    auditLogs: {
      list: vi.fn(() => Promise.resolve(emptyAuditLogPage))
    },
    auth: {
      login: vi.fn(() => Promise.resolve({ user })),
      logout: vi.fn(() => Promise.resolve()),
      me: vi.fn(() => Promise.resolve(user)),
      register: vi.fn(() => Promise.resolve({ user })),
      ...overrides
    },
    domainEvents: {
      create: vi.fn(() => Promise.resolve(domainEvent)),
      list: vi.fn(() => Promise.resolve(emptyDomainEventPage))
    },
    files: createUnusedFilesClient(),
    habits: createUnusedHabitsClient(),
    health: {
      live: vi.fn(() => Promise.resolve(health)),
      ready: vi.fn(() => Promise.resolve(health))
    },
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: {
      list: vi.fn(() => Promise.resolve(emptyNotificationPage)),
      markRead: vi.fn(() => Promise.resolve(notification))
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
      )
    },
    projects: createUnusedProjectsClient(),
    settings: {
      getPreferences: vi.fn(() => Promise.resolve(preferences)),
      updatePreferences: vi.fn(() => Promise.resolve(preferences))
    },
    world: {
      getProfile: vi.fn(() => Promise.resolve(worldProfile)),
      updateProfile: vi.fn(() => Promise.resolve(worldProfile)),
      visit: vi.fn(() => Promise.resolve(worldProfile))
    }
  };
}

function renderWithAuth(children: React.ReactElement, client: AetheriumApiClient): void {
  render(<AuthProvider client={client}>{children}</AuthProvider>);
}

describe("auth UI", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
  });

  it("validates registration form fields", async () => {
    const client = createClient({ me: vi.fn(() => Promise.reject(unauthenticatedError())) });
    renderWithAuth(<AuthForm client={client} mode="register" />, client);

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Display name is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 12 characters.")).toBeInTheDocument();
  });

  it("validates login form fields", async () => {
    const client = createClient({ me: vi.fn(() => Promise.reject(unauthenticatedError())) });
    renderWithAuth(<AuthForm client={client} mode="login" />, client);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("handles successful authenticated-user state", async () => {
    const client = createClient({});

    function Probe(): React.ReactElement {
      const auth = useAuth();
      return <div>{auth.status === "authenticated" ? auth.user?.email : auth.status}</div>;
    }

    renderWithAuth(<Probe />, client);

    expect(await screen.findByText("sai@example.com")).toBeInTheDocument();
  });

  it("shows non-revealing invalid credential errors", async () => {
    const client = createClient({
      login: vi.fn(() => Promise.reject(invalidCredentialsError())),
      me: vi.fn(() => Promise.reject(unauthenticatedError()))
    });
    renderWithAuth(<AuthForm client={client} mode="login" />, client);

    await userEvent.type(screen.getByLabelText("Email"), "sai@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "WrongPass123!");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });

  it("redirects anonymous users away from protected Command Mode", async () => {
    const onRedirect = vi.fn();
    const client = createClient({ me: vi.fn(() => Promise.reject(unauthenticatedError())) });
    renderWithAuth(<ProtectedCommandMode onRedirect={onRedirect} />, client);

    await waitFor(() => expect(onRedirect).toHaveBeenCalledWith("/login?next=/command"));
  });

  it("clears auth state on logout", async () => {
    const client = createClient({ logout: vi.fn(() => Promise.resolve()) });
    renderWithAuth(<ProtectedCommandMode />, client);

    expect(await screen.findByText("sai@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});
