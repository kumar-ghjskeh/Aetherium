"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  UserPreferences,
  WorldDeepLinkPage,
  WorldFeatureFlags,
  WorldLocationPage,
  WorldProfile,
  WorldSceneManifest
} from "@aetherium/shared-types";
import Link from "next/link";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";
import { WorldRuntimeErrorBoundary } from "./components/canvas/world-runtime-error-boundary";
import { WorldRuntimeFallback, WorldRuntimeLoading } from "./components/ui/world-runtime-fallback";
import type { AIObservatoryOverviewData } from "./engine/ai-observatory-system";
import type { CentralPlazaOverviewData } from "./engine/central-plaza-system";
import type { HabitGardenOverviewData } from "./engine/habit-garden-system";
import type { KnowledgeLibraryOverviewData } from "./engine/knowledge-library-system";
import { useWorldRuntimeReadiness } from "./hooks/use-world-runtime-readiness";

interface WorldDataState {
  aiObservatoryOverview: AIObservatoryOverviewData;
  deepLinks: WorldDeepLinkPage;
  featureFlags: WorldFeatureFlags;
  habitGardenOverview: HabitGardenOverviewData;
  libraryOverview: KnowledgeLibraryOverviewData;
  locations: WorldLocationPage;
  plazaOverview: CentralPlazaOverviewData;
  preferences: UserPreferences;
  profile: WorldProfile;
  sceneManifest: WorldSceneManifest;
}

const LazyWorldRuntimeCanvas = React.lazy(async () => {
  const runtimeModule = await import("./components/canvas/world-runtime-canvas");
  return { default: runtimeModule.WorldRuntimeCanvas };
});

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "World data contracts are unavailable.";
}

export function WorldPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [data, setData] = React.useState<WorldDataState | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [readinessVersion, setReadinessVersion] = React.useState(0);
  const runtimeReadiness = useWorldRuntimeReadiness({
    checkVersion: readinessVersion,
    featureFlags: data?.featureFlags ?? null,
    sceneManifest: data?.sceneManifest ?? null,
    userReducedMotion: data?.preferences.reducedMotion ?? false
  });

  const loadWorldData = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [
        profile,
        locations,
        deepLinks,
        sceneManifest,
        featureFlags,
        preferences,
        user,
        habitSummary,
        habits,
        notifications,
        files,
        collections,
        tags,
        projects,
        learningGoals,
        mentors,
        conversations,
        providers,
        modelConfigs,
        usage,
        achievementSummary,
        analytics
      ] = await Promise.all([
        apiClient.world.getProfile(),
        apiClient.world.listLocations(),
        apiClient.world.listDeepLinks(),
        apiClient.world.getSceneManifest(),
        apiClient.world.getFeatureFlags(),
        apiClient.settings.getPreferences(),
        apiClient.auth.me(),
        apiClient.habits.getSummary({ period: "week" }),
        apiClient.habits.list({ limit: 5, offset: 0 }),
        apiClient.notifications.list({ limit: 5, offset: 0 }),
        apiClient.files.list({ includeDeleted: false, limit: 18, offset: 0 }),
        apiClient.files.listCollections({ limit: 12, offset: 0 }),
        apiClient.files.listTags({ limit: 20, offset: 0 }),
        apiClient.projects.list({ includeArchived: false, limit: 5, offset: 0 }),
        apiClient.learning.listGoals({ limit: 5, offset: 0 }),
        apiClient.mentors.list({ includeArchived: false }),
        apiClient.mentors.listConversations({ includeArchived: false, limit: 8, offset: 0 }),
        apiClient.ai.listProviders(),
        apiClient.ai.listModelConfigs(),
        apiClient.ai.listUsage({ limit: 8, offset: 0 }),
        apiClient.achievements.summary(),
        apiClient.analytics.summary({ period: "week" })
      ]);
      setData({
        aiObservatoryOverview: {
          conversations,
          mentors,
          modelConfigs,
          providers,
          usage
        },
        deepLinks,
        featureFlags,
        habitGardenOverview: {
          achievementSummary,
          habits,
          summary: habitSummary
        },
        libraryOverview: {
          collections,
          files,
          tags
        },
        locations,
        plazaOverview: {
          analytics,
          files,
          habitSummary,
          habits,
          learningGoals,
          mentors,
          notifications,
          preferences,
          projects,
          user
        },
        preferences,
        profile,
        sceneManifest
      });
      setStatus("ready");
    } catch (loadError) {
      setError(friendlyError(loadError));
      setStatus("error");
    }
  }, [apiClient]);

  React.useEffect(() => {
    void loadWorldData();
  }, [loadWorldData]);

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Future World Mode</p>
          <h1>World Data Foundation</h1>
        </div>
        <span className="state-pill">
          {status === "loading"
            ? "Loading"
            : data?.featureFlags.visualWorldEnabled
              ? "Enabled"
              : "Data only"}
        </span>
      </header>

      {status === "error" ? (
        <section className="inline-alert" role="alert">
          {error ?? "World data contracts are unavailable."}
        </section>
      ) : null}

      <section className="work-panel">
        <header className="world-panel-header">
          <div>
            <h2>Central Plaza runtime</h2>
            <p className="empty-note">
              This route lazy-loads the first polished World Mode vertical slice when the backend
              flag, scene manifest, browser capability, and motion settings allow it.
            </p>
          </div>
          <button className="secondary-action" onClick={() => void loadWorldData()} type="button">
            Refresh
          </button>
        </header>
        {status === "loading" ? <p className="empty-note">Loading world contracts...</p> : null}
        {data ? (
          <div className="world-status-grid">
            <section>
              <span>Current location</span>
              <strong>{data.profile.currentLocationId}</strong>
              <small>{data.profile.preferredNavigationMethod.replace("_", " ")}</small>
            </section>
            <section>
              <span>Unlocked</span>
              <strong>{data.locations.unlockedCount}</strong>
              <small>Profile identifiers</small>
            </section>
            <section>
              <span>Visited</span>
              <strong>{data.locations.visitedCount}</strong>
              <small>Profile identifiers</small>
            </section>
            <section>
              <span>Scene runtime</span>
              <strong>{data.sceneManifest.visualRuntimeAvailable ? "Available" : "Off"}</strong>
              <small>
                {data.featureFlags.commandModeFallbackRequired ? "Command fallback" : "Optional"}
              </small>
            </section>
          </div>
        ) : null}
      </section>

      {data ? (
        <>
          {runtimeReadiness.status === "checking" ? <WorldRuntimeLoading /> : null}
          {runtimeReadiness.status === "fallback" ? (
            <WorldRuntimeFallback
              detail={data.featureFlags.reason}
              message={runtimeReadiness.message}
              onRetry={() => setReadinessVersion((value) => value + 1)}
            />
          ) : null}
          {runtimeReadiness.status === "ready" ? (
            <WorldRuntimeErrorBoundary key={readinessVersion}>
              <React.Suspense fallback={<WorldRuntimeLoading />}>
                <LazyWorldRuntimeCanvas
                  aiObservatoryOverview={data.aiObservatoryOverview}
                  deepLinks={data.deepLinks}
                  habitGardenOverview={data.habitGardenOverview}
                  libraryOverview={data.libraryOverview}
                  locationPage={data.locations}
                  plazaOverview={data.plazaOverview}
                  preferences={data.preferences}
                  profile={data.profile}
                  sceneManifest={data.sceneManifest}
                />
              </React.Suspense>
            </WorldRuntimeErrorBoundary>
          ) : null}

          <section className="work-panel">
            <header className="world-panel-header">
              <div>
                <h2>Location registry</h2>
                <p className="empty-note">
                  Each location links to a real Command Mode route and a future scene key.
                </p>
              </div>
            </header>
            {data.locations.items.length === 0 ? (
              <p className="empty-note">No world locations are registered.</p>
            ) : (
              <div className="world-location-list">
                {data.locations.items.map((location) => (
                  <article className="world-location-row" key={location.id}>
                    <div>
                      <h3>{location.title}</h3>
                      <p>{location.description}</p>
                    </div>
                    <dl className="detail-list compact-detail-list">
                      <dt>Status</dt>
                      <dd>{location.unlocked ? "Unlocked" : "Locked"}</dd>
                      <dt>Visited</dt>
                      <dd>{location.visited ? "Yes" : "No"}</dd>
                      <dt>Route</dt>
                      <dd>
                        <Link href={location.commandRoute}>{location.commandRoute}</Link>
                      </dd>
                      <dt>Future scene key</dt>
                      <dd>{location.futureSceneKey}</dd>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="work-panel">
            <header className="world-panel-header">
              <div>
                <h2>Deep-link contracts</h2>
                <p className="empty-note">
                  Future World Mode can route selected world entities back into Command Mode.
                </p>
              </div>
            </header>
            <div className="world-table-wrap">
              <table className="world-table">
                <caption>Command destinations for future spatial navigation</caption>
                <thead>
                  <tr>
                    <th scope="col">Location</th>
                    <th scope="col">Route</th>
                    <th scope="col">Entities</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deepLinks.items.map((deepLink) => (
                    <tr key={deepLink.locationId}>
                      <th scope="row">{deepLink.label}</th>
                      <td>{deepLink.commandRoute}</td>
                      <td>{deepLink.entityTypes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
