import type { AetheriumApiClient } from "@aetherium/api-client";
import { AetheriumApiError } from "@aetherium/api-client";
import type { HealthCheckResponse, PublicUser } from "@aetherium/shared-types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";
import { AuthProvider, useAuth } from "./auth-provider";
import { ProtectedCommandMode } from "../command/protected-command-mode";

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
    auth: {
      login: vi.fn(() => Promise.resolve({ user })),
      logout: vi.fn(() => Promise.resolve()),
      me: vi.fn(() => Promise.resolve(user)),
      register: vi.fn(() => Promise.resolve({ user })),
      ...overrides
    },
    health: {
      live: vi.fn(() => Promise.resolve(health)),
      ready: vi.fn(() => Promise.resolve(health))
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
