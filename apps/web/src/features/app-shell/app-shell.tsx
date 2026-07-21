"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Notification,
  NotificationPage,
  RecentSearch,
  SearchResult,
  UserPreferences,
  UserPreferencesUpdate,
  WorldProfile
} from "@aetherium/shared-types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import { createBrowserApiClient, useAuth } from "../auth/auth-provider";
import { commandActions, shellNavigation } from "./navigation";

type ShellDataStatus = "idle" | "loading" | "ready" | "error";

interface ShellDataState {
  error: string | null;
  notifications: NotificationPage | null;
  preferences: UserPreferences | null;
  status: ShellDataStatus;
  updatePreferences: (payload: UserPreferencesUpdate) => Promise<void>;
  worldProfile: WorldProfile | null;
}

const ShellDataContext = React.createContext<ShellDataState | null>(null);

function friendlyDataError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Aetherium data is unavailable.";
}

export function useShellData(): ShellDataState {
  const value = React.useContext(ShellDataContext);
  if (value === null) {
    throw new Error("useShellData must be used inside AppShell");
  }
  return value;
}

export function AppShell({
  children,
  client,
  onRedirect
}: Readonly<{
  children: React.ReactNode;
  client?: AetheriumApiClient;
  onRedirect?: (target: string) => void;
}>): React.ReactElement {
  const auth = useAuth();
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const pathname = usePathname();
  const router = useRouter();
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [dataStatus, setDataStatus] = React.useState<ShellDataStatus>("idle");
  const [dataError, setDataError] = React.useState<string | null>(null);
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null);
  const [worldProfile, setWorldProfile] = React.useState<WorldProfile | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationPage | null>(null);

  React.useEffect(() => {
    if (auth.status === "anonymous") {
      const target = "/login?next=/app";
      if (onRedirect) {
        onRedirect(target);
      } else {
        router.replace(target);
      }
    }
  }, [auth.status, onRedirect, router]);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setIsPaletteOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (auth.status !== "authenticated") {
      return;
    }

    let isActive = true;
    setDataStatus("loading");
    setDataError(null);

    async function loadShellData(): Promise<void> {
      try {
        const [loadedPreferences, loadedWorldProfile, loadedNotifications] = await Promise.all([
          apiClient.settings.getPreferences(),
          apiClient.world.getProfile(),
          apiClient.notifications.list({ limit: 5, offset: 0 })
        ]);
        if (!isActive) {
          return;
        }
        setPreferences(loadedPreferences);
        setWorldProfile(loadedWorldProfile);
        setNotifications(loadedNotifications);
        setDataStatus("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }
        setDataError(friendlyDataError(error));
        setDataStatus("error");
      }
    }

    void loadShellData();
    return () => {
      isActive = false;
    };
  }, [apiClient, auth.status]);

  const updatePreferences = React.useCallback(
    async (payload: UserPreferencesUpdate) => {
      const updated = await apiClient.settings.updatePreferences(payload);
      setPreferences(updated);
    },
    [apiClient]
  );

  async function handleLogout(): Promise<void> {
    await auth.logout();
    router.push("/login");
  }

  async function handleNotificationRead(notification: Notification): Promise<void> {
    if (notification.readAt !== null) {
      return;
    }
    const updated = await apiClient.notifications.markRead(notification.id);
    setNotifications((current) => {
      if (current === null) {
        return current;
      }
      return {
        ...current,
        items: current.items.map((item) => (item.id === updated.id ? updated : item)),
        unreadCount: Math.max(0, current.unreadCount - 1)
      };
    });
  }

  function runCommand(actionId: string): void {
    const action = commandActions.find((candidate) => candidate.id === actionId);
    if (!action || !action.available) {
      return;
    }
    setIsPaletteOpen(false);
    if (action.id === "logout") {
      void handleLogout();
      return;
    }
    if (action.href) {
      router.push(action.href);
    }
  }

  if (auth.status === "loading") {
    return (
      <main className="app-shell app-shell-centered" aria-busy="true">
        <section className="status-panel">Loading your Aetherium session...</section>
      </main>
    );
  }

  if (auth.status === "unavailable") {
    return (
      <main className="app-shell app-shell-centered">
        <section className="status-panel" role="alert">
          {auth.error ?? "Aetherium is unavailable."}
        </section>
      </main>
    );
  }

  if (auth.status !== "authenticated" || auth.user === null) {
    return (
      <main className="app-shell app-shell-centered">
        <section className="status-panel">Redirecting to sign in...</section>
      </main>
    );
  }

  const activeItem =
    shellNavigation.find((item) => pathname === item.href) ??
    shellNavigation.find((item) => pathname.startsWith(`${item.href}/`)) ??
    shellNavigation[0];

  const shellData: ShellDataState = {
    error: dataError,
    notifications,
    preferences,
    status: dataStatus,
    updatePreferences,
    worldProfile
  };

  return (
    <ShellDataContext.Provider value={shellData}>
      <div className="command-shell">
        <aside className="command-sidebar" aria-label="Primary">
          <Link className="brand-mark" href="/app">
            <span aria-hidden="true">A</span>
            <strong>Aetherium</strong>
          </Link>
          <nav className="sidebar-nav">
            {shellNavigation.map((item) => (
              <Link
                aria-current={activeItem?.href === item.href ? "page" : undefined}
                className="sidebar-link"
                href={item.href}
                key={item.id}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="command-workspace">
          <header className="topbar">
            <div className="mobile-nav-wrap">
              <label className="sr-only" htmlFor="mobile-section-nav">
                Section navigation
              </label>
              <select
                id="mobile-section-nav"
                onChange={(event) => router.push(event.target.value)}
                value={activeItem?.href ?? "/app"}
              >
                {shellNavigation.map((item) => (
                  <option key={item.id} value={item.href}>
                    {item.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <button className="command-search" onClick={() => setIsPaletteOpen(true)} type="button">
              <span>Search or run command</span>
              <kbd>Ctrl K</kbd>
            </button>

            <div className="topbar-actions">
              <button
                aria-expanded={isNotificationsOpen}
                aria-label={
                  notifications && notifications.unreadCount > 0
                    ? `Notifications, ${notifications.unreadCount} unread`
                    : "Notifications"
                }
                className="icon-action"
                onClick={() => setIsNotificationsOpen((current) => !current)}
                type="button"
              >
                <span className="sr-only">Notifications</span>
                <span aria-hidden="true">N</span>
                {notifications && notifications.unreadCount > 0 ? (
                  <span className="badge">{notifications.unreadCount}</span>
                ) : null}
              </button>
              <button
                aria-expanded={isProfileOpen}
                className="profile-button"
                onClick={() => setIsProfileOpen((current) => !current)}
                type="button"
              >
                <span aria-hidden="true">{auth.user.displayName.slice(0, 1).toUpperCase()}</span>
                <span>{auth.user.displayName}</span>
              </button>
            </div>
          </header>

          {dataStatus === "error" ? (
            <section className="inline-alert" role="alert">
              {dataError ?? "Aetherium data is unavailable."}
            </section>
          ) : null}

          {isNotificationsOpen ? (
            <NotificationsPanel
              isLoading={dataStatus === "loading"}
              notifications={notifications}
              onMarkRead={(notification) => void handleNotificationRead(notification)}
            />
          ) : null}

          {isProfileOpen ? (
            <section className="profile-menu" aria-label="User profile menu">
              <strong>{auth.user.displayName}</strong>
              <span>{auth.user.email}</span>
              <Link href="/app/settings" onClick={() => setIsProfileOpen(false)}>
                Settings
              </Link>
              <button onClick={() => void handleLogout()} type="button">
                Sign out
              </button>
            </section>
          ) : null}

          <main className="app-content" aria-busy={dataStatus === "loading"}>
            {children}
          </main>
        </div>

        {isPaletteOpen ? (
          <CommandPalette
            client={apiClient}
            onClose={() => setIsPaletteOpen(false)}
            onOpenResult={(target) => {
              setIsPaletteOpen(false);
              router.push(target);
            }}
            onRunCommand={runCommand}
          />
        ) : null}
      </div>
    </ShellDataContext.Provider>
  );
}

function NotificationsPanel({
  isLoading,
  notifications,
  onMarkRead
}: Readonly<{
  isLoading: boolean;
  notifications: NotificationPage | null;
  onMarkRead: (notification: Notification) => void;
}>): React.ReactElement {
  return (
    <section className="notifications-panel" aria-label="Notifications">
      <header>
        <h2>Notifications</h2>
        {notifications ? <span>{notifications.unreadCount} unread</span> : null}
      </header>
      {isLoading ? <p className="empty-note">Loading notifications...</p> : null}
      {!isLoading && notifications && notifications.items.length === 0 ? (
        <p className="empty-note">No notifications.</p>
      ) : null}
      {!isLoading && notifications
        ? notifications.items.map((notification) => (
            <button
              className="notification-row"
              key={notification.id}
              onClick={() => onMarkRead(notification)}
              type="button"
            >
              <span>
                <strong>{notification.title}</strong>
                <small>{notification.body}</small>
              </span>
              <em>{notification.readAt ? "Read" : "Unread"}</em>
            </button>
          ))
        : null}
    </section>
  );
}

function CommandPalette({
  client,
  onClose,
  onOpenResult,
  onRunCommand
}: Readonly<{
  client: AetheriumApiClient;
  onClose: () => void;
  onOpenResult: (target: string) => void;
  onRunCommand: (actionId: string) => void;
}>): React.ReactElement {
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>([]);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = React.useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [searchError, setSearchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    searchInputRef.current?.focus();
    let isActive = true;
    async function loadRecentSearches(): Promise<void> {
      try {
        const recent = await client.search.recent({ limit: 5, offset: 0 });
        if (isActive) {
          setRecentSearches(recent.items);
        }
      } catch {
        if (isActive) {
          setRecentSearches([]);
        }
      }
    }

    void loadRecentSearches();
    return () => {
      isActive = false;
    };
  }, [client]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setSearchStatus("idle");
      setSearchError(null);
      return;
    }

    setSearchStatus("loading");
    setSearchError(null);
    try {
      const response = await client.search.run({
        limit: 8,
        mode: "hybrid",
        query: trimmedQuery
      });
      setResults(response.items);
      setSearchStatus("ready");
    } catch (error) {
      setSearchError(friendlyDataError(error));
      setSearchStatus("error");
    }
  }

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="Command palette"
        aria-modal="true"
        className="command-palette"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <p className="eyebrow">Command Palette</p>
          <button aria-label="Close command palette" onClick={onClose} type="button">
            X
          </button>
        </header>
        <form className="palette-search-form" onSubmit={(event) => void handleSearch(event)}>
          <label className="sr-only" htmlFor="command-palette-search">
            Search Aetherium
          </label>
          <input
            id="command-palette-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files, chunks, collections, and tags"
            ref={searchInputRef}
            type="search"
            value={query}
          />
          <button className="secondary-action" disabled={searchStatus === "loading"} type="submit">
            Search
          </button>
        </form>
        {searchStatus === "loading" ? <p className="empty-note">Searching...</p> : null}
        {searchStatus === "error" ? (
          <section className="inline-alert" role="alert">
            {searchError ?? "Search is unavailable."}
          </section>
        ) : null}
        {searchStatus === "ready" && results.length === 0 ? (
          <p className="empty-note">No matching Aetherium records.</p>
        ) : null}
        {results.length > 0 ? (
          <div className="palette-list" aria-label="Search results">
            {results.map((result) => (
              <button
                className="palette-action"
                key={result.id}
                onClick={() => onOpenResult(result.openUrl)}
                type="button"
              >
                <span>{result.title}</span>
                <small>{result.snippet}</small>
              </button>
            ))}
          </div>
        ) : null}
        {query.trim() === "" && recentSearches.length > 0 ? (
          <div className="palette-list" aria-label="Recent searches">
            {recentSearches.map((recent) => (
              <button
                className="palette-action"
                key={recent.id}
                onClick={() => setQuery(recent.query)}
                type="button"
              >
                <span>{recent.query}</span>
                <small>{recent.resultCount} previous results</small>
              </button>
            ))}
          </div>
        ) : null}
        <div className="palette-list">
          {commandActions.map((action) => (
            <button
              aria-disabled={!action.available}
              className="palette-action"
              disabled={!action.available}
              key={action.id}
              onClick={() => onRunCommand(action.id)}
              type="button"
            >
              <span>{action.label}</span>
              <small>{action.available ? "Available" : action.reason}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
