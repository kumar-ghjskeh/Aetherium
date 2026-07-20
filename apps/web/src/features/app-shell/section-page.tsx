"use client";

import type { UserPreferencesUpdate } from "@aetherium/shared-types";
import React from "react";

import { useShellData } from "./app-shell";

interface SectionConfig {
  body: string;
  label: string;
  title: string;
}

const sections = {
  achievements: {
    body: "Achievement data is not available until the progression foundation is implemented.",
    label: "Progression",
    title: "Achievements"
  },
  ai: {
    body: "AI mentors and conversations are not connected in this slice.",
    label: "Mentors",
    title: "AI Hall"
  },
  analytics: {
    body: "Analytics will remain empty until real learning, habit, file, project, and AI usage records exist.",
    label: "Metrics",
    title: "Analytics"
  },
  coding: {
    body: "The coding workspace foundation is planned for a later non-3D phase.",
    label: "Practice",
    title: "Coding"
  },
  habits: {
    body: "Habit creation and logging are not implemented yet.",
    label: "Rhythm",
    title: "Habits"
  },
  learning: {
    body: "Learning subjects, courses, quizzes, flashcards, and mastery records arrive in the learning engine phase.",
    label: "Study",
    title: "Learning"
  },
  library: {
    body: "Personal Vault file storage is the next data slice before ingestion and search.",
    label: "Vault",
    title: "Library"
  },
  projects: {
    body: "Project Dock records and tasks are planned for the project management phase.",
    label: "Build",
    title: "Projects"
  },
  world: {
    body: "Visual World Mode is not implemented. This page uses only the non-visual world profile contract.",
    label: "Future World Mode",
    title: "World"
  }
} satisfies Record<string, SectionConfig>;

type SectionId = keyof typeof sections | "settings";

export function SectionPage({ section }: Readonly<{ section: SectionId }>): React.ReactElement {
  const data = useShellData();

  if (section === "settings") {
    return <SettingsPanel />;
  }

  const config = sections[section];

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{config.label}</p>
          <h1>{config.title}</h1>
        </div>
      </header>
      <section className="work-panel">
        <h2>{section === "world" ? "Current world state" : "Empty state"}</h2>
        <p className="empty-note">{config.body}</p>
        {section === "world" ? (
          <dl className="detail-list">
            <dt>Current location</dt>
            <dd>{data.worldProfile?.currentLocationId ?? "Loading"}</dd>
            <dt>Navigation preference</dt>
            <dd>{data.worldProfile?.preferredNavigationMethod ?? "Loading"}</dd>
            <dt>Unlocked locations</dt>
            <dd>{data.worldProfile?.unlockedLocationIds.join(", ") ?? "Loading"}</dd>
          </dl>
        ) : null}
      </section>
    </section>
  );
}

function SettingsPanel(): React.ReactElement {
  const data = useShellData();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function updatePreference(payload: UserPreferencesUpdate): Promise<void> {
    setIsSaving(true);
    setError(null);
    try {
      await data.updatePreferences(payload);
    } catch {
      setError("Settings could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  const preferences = data.preferences;

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Preferences</h1>
        </div>
        <span className="state-pill">{isSaving ? "Saving" : "Ready"}</span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}

      <section className="work-panel">
        {!preferences ? <p className="empty-note">Loading preferences...</p> : null}
        {preferences ? (
          <div className="settings-grid">
            <label>
              Theme
              <select
                onChange={(event) =>
                  void updatePreference({
                    theme: event.target.value as "system" | "light" | "dark"
                  })
                }
                value={preferences.theme}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Performance
              <select
                onChange={(event) =>
                  void updatePreference({
                    performancePreset: event.target.value as
                      "automatic" | "low" | "balanced" | "high"
                  })
                }
                value={preferences.performancePreset}
              >
                <option value="automatic">Automatic</option>
                <option value="low">Low</option>
                <option value="balanced">Balanced</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="toggle-row">
              <input
                checked={preferences.reducedMotion}
                onChange={(event) => void updatePreference({ reducedMotion: event.target.checked })}
                type="checkbox"
              />
              Reduced motion
            </label>
            <label className="toggle-row">
              <input
                checked={preferences.aiMemoryEnabled}
                onChange={(event) =>
                  void updatePreference({ aiMemoryEnabled: event.target.checked })
                }
                type="checkbox"
              />
              AI memory
            </label>
            <label className="toggle-row">
              <input
                checked={preferences.productAnalyticsEnabled}
                onChange={(event) =>
                  void updatePreference({ productAnalyticsEnabled: event.target.checked })
                }
                type="checkbox"
              />
              Product analytics
            </label>
          </div>
        ) : null}
      </section>
    </section>
  );
}
