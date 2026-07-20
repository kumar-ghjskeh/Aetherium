"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { useAuth } from "../auth/auth-provider";

export function LogoutButton(): React.ReactElement {
  const { logout } = useAuth();
  const router = useRouter();
  const [isWorking, setIsWorking] = React.useState(false);

  async function handleLogout(): Promise<void> {
    setIsWorking(true);
    await logout();
    router.push("/login");
  }

  return (
    <button
      className="secondary-action"
      disabled={isWorking}
      onClick={() => void handleLogout()}
      type="button"
    >
      {isWorking ? "Signing out..." : "Sign out"}
    </button>
  );
}

export function ProtectedCommandMode({
  onRedirect
}: Readonly<{
  onRedirect?: (target: string) => void;
}>): React.ReactElement {
  const auth = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (auth.status === "anonymous") {
      const target = "/login?next=/command";
      if (onRedirect) {
        onRedirect(target);
      } else {
        router.replace(target);
      }
    }
  }, [auth.status, onRedirect, router]);

  if (auth.status === "loading") {
    return (
      <main className="app-shell" aria-busy="true">
        <section className="status-panel">Loading your Aetherium session...</section>
      </main>
    );
  }

  if (auth.status === "unavailable") {
    return (
      <main className="app-shell">
        <section className="status-panel" role="alert">
          {auth.error ?? "Aetherium is unavailable."}
        </section>
      </main>
    );
  }

  if (auth.status !== "authenticated" || auth.user === null) {
    return (
      <main className="app-shell">
        <section className="status-panel">Redirecting to sign in...</section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="command-frame" aria-label="Command Mode">
        <header className="command-header">
          <div>
            <p className="eyebrow">Command Mode</p>
            <h1>Welcome, {auth.user.displayName}</h1>
          </div>
          <LogoutButton />
        </header>
        <div className="command-grid">
          <section>
            <h2>Identity</h2>
            <dl>
              <dt>Email</dt>
              <dd>{auth.user.email}</dd>
              <dt>Email verification</dt>
              <dd>{auth.user.isEmailVerified ? "Verified" : "Pending"}</dd>
            </dl>
          </section>
          <section>
            <h2>Current slice</h2>
            <p>
              Authentication is active. Files, habits, AI mentors, world navigation, and learning
              systems are intentionally outside this slice.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
