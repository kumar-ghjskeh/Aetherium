"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import { createAetheriumApiClient } from "@aetherium/api-client";
import type { PublicUser } from "@aetherium/shared-types";
import React from "react";

export type AuthStatus = "loading" | "authenticated" | "anonymous" | "unavailable";

export interface AuthState {
  error: string | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  status: AuthStatus;
  user: PublicUser | null;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function getAetheriumApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_AETHERIUM_API_BASE_URL ?? "http://localhost:8000";
}

export function createBrowserApiClient(): AetheriumApiClient {
  return createAetheriumApiClient({ baseUrl: getAetheriumApiBaseUrl() });
}

export function AuthProvider({
  children,
  client
}: Readonly<{
  children: React.ReactNode;
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setStatus("authenticated");
    } catch (authError) {
      if (authError instanceof Error && authError.message.includes("fetch")) {
        setStatus("unavailable");
        setError("Aetherium is unavailable. Check the API service and try again.");
        return;
      }
      setUser(null);
      setStatus("anonymous");
    }
  }, [apiClient]);

  const logout = React.useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, [apiClient]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ error, logout, refresh, status, user }),
    [error, logout, refresh, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = React.useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
