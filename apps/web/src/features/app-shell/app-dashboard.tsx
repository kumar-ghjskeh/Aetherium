"use client";

import React from "react";

import { useAuth } from "../auth/auth-provider";
import { useShellData } from "./app-shell";

export function AppDashboard(): React.ReactElement {
  const auth = useAuth();
  const data = useShellData();

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Command Mode</p>
          <h1>Overview</h1>
        </div>
        <span className="state-pill">{data.status === "ready" ? "Synced" : "Checking"}</span>
      </header>

      <div className="metric-grid">
        <section className="metric-panel">
          <span>Signed in</span>
          <strong>{auth.user?.displayName ?? "Unknown"}</strong>
          <small>{auth.user?.email}</small>
        </section>
        <section className="metric-panel">
          <span>Default mode</span>
          <strong>{data.preferences?.defaultInterfaceMode ?? "Loading"}</strong>
          <small>Theme: {data.preferences?.theme ?? "loading"}</small>
        </section>
        <section className="metric-panel">
          <span>World profile</span>
          <strong>{data.worldProfile?.currentLocationId ?? "Loading"}</strong>
          <small>{data.worldProfile?.unlockedLocationIds.length ?? 0} locations unlocked</small>
        </section>
        <section className="metric-panel">
          <span>Notifications</span>
          <strong>{data.notifications?.unreadCount ?? 0}</strong>
          <small>Unread</small>
        </section>
      </div>

      <section className="work-panel">
        <h2>Today</h2>
        {data.status === "loading" ? <p className="empty-note">Loading account state...</p> : null}
        {data.status === "error" ? (
          <p className="empty-note">{data.error ?? "Aetherium data is unavailable."}</p>
        ) : null}
        {data.status === "ready" && data.notifications?.items.length === 0 ? (
          <p className="empty-note">No active notifications.</p>
        ) : null}
        {data.status === "ready" && data.notifications?.items.length ? (
          <ul className="plain-list">
            {data.notifications.items.slice(0, 3).map((notification) => (
              <li key={notification.id}>
                <strong>{notification.title}</strong>
                <span>{notification.readAt ? "Read" : "Unread"}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}
