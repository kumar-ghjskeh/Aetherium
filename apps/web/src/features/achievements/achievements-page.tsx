"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  AchievementPage,
  AchievementProgress,
  AchievementSummary
} from "@aetherium/shared-types";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Achievements could not be loaded.";
}

function progressPercent(achievement: AchievementProgress): number {
  if (achievement.targetCount <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((achievement.progressCount / achievement.targetCount) * 100));
}

export function AchievementsPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [summary, setSummary] = React.useState<AchievementSummary | null>(null);
  const [achievementPage, setAchievementPage] = React.useState<AchievementPage | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = React.useState(false);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const loadAchievements = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [loadedSummary, loadedPage] = await Promise.all([
        apiClient.achievements.summary(),
        apiClient.achievements.list({
          limit: 50,
          offset: 0,
          unlockedOnly: showUnlockedOnly
        })
      ]);
      setSummary(loadedSummary);
      setAchievementPage(loadedPage);
      setStatus("ready");
    } catch (loadError) {
      setError(friendlyError(loadError));
      setStatus("error");
    }
  }, [apiClient, showUnlockedOnly]);

  React.useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  async function handleSync(): Promise<void> {
    setIsSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const result = await apiClient.achievements.process();
      setSyncMessage(
        result.newUnlockCount > 0
          ? `${result.newUnlockCount} achievement unlocked from ${result.processedEventCount} event records.`
          : `${result.processedEventCount} event records processed. No new achievements unlocked.`
      );
      await loadAchievements();
    } catch (syncError) {
      setError(friendlyError(syncError));
    } finally {
      setIsSyncing(false);
    }
  }

  const achievements = achievementPage?.items ?? [];

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Progression</p>
          <h1>Achievements</h1>
        </div>
        <button
          className="primary-action"
          disabled={isSyncing}
          onClick={() => void handleSync()}
          type="button"
        >
          {isSyncing ? "Syncing" : "Sync progress"}
        </button>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}

      {syncMessage ? <section className="inline-success">{syncMessage}</section> : null}

      {status === "loading" ? (
        <section className="work-panel">
          <p className="empty-note">Loading achievements...</p>
        </section>
      ) : null}

      {status === "ready" && summary ? (
        <>
          <section className="metric-grid achievement-summary" aria-label="Achievement summary">
            <article className="metric-panel">
              <span>Unlocked</span>
              <strong>
                {summary.unlockedCount}/{summary.totalAchievements}
              </strong>
              <small>Unique achievements awarded from domain events.</small>
            </article>
            <article className="metric-panel">
              <span>Points</span>
              <strong>
                {summary.unlockedPoints}/{summary.totalPoints}
              </strong>
              <small>Progression points are descriptive, not access gates.</small>
            </article>
            <article className="metric-panel">
              <span>Future world unlocks</span>
              <strong>{summary.worldUnlocks.length}</strong>
              <small>Non-visual identifiers for the later World Mode phase.</small>
            </article>
          </section>

          <section className="work-panel">
            <div className="achievement-toolbar">
              <div>
                <h2>Progression records</h2>
                <p className="empty-note">
                  Achievements are awarded only from stored Aetherium domain events.
                </p>
              </div>
              <label className="toggle-row">
                <input
                  checked={showUnlockedOnly}
                  onChange={(event) => setShowUnlockedOnly(event.target.checked)}
                  type="checkbox"
                />
                Unlocked only
              </label>
            </div>

            {achievements.length === 0 ? (
              <p className="empty-note">No achievements match this filter.</p>
            ) : null}

            {achievements.length > 0 ? (
              <div className="achievement-list" aria-label="Achievement list">
                {achievements.map((achievement) => (
                  <article className="achievement-row" key={achievement.definitionId}>
                    <div>
                      <span className="state-pill">
                        {achievement.unlockedAt ? "Unlocked" : "Locked"}
                      </span>
                      <h3>{achievement.title}</h3>
                      <p>{achievement.description}</p>
                    </div>
                    <div className="achievement-progress">
                      <span>
                        {achievement.progressCount}/{achievement.targetCount}
                      </span>
                      <div
                        aria-label={`${achievement.title} progress ${progressPercent(
                          achievement
                        )}%`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={progressPercent(achievement)}
                        className="achievement-progress-track"
                        role="progressbar"
                      >
                        <span style={{ width: `${progressPercent(achievement)}%` }} />
                      </div>
                      <small>
                        {achievement.points} points - {achievement.category}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="work-panel">
            <h2>Future world unlock records</h2>
            {summary.worldUnlocks.length === 0 ? (
              <p className="empty-note">No non-visual world unlock records yet.</p>
            ) : (
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <caption>Non-visual world unlock identifiers awarded by achievements</caption>
                  <thead>
                    <tr>
                      <th scope="col">Location identifier</th>
                      <th scope="col">Source</th>
                      <th scope="col">Unlocked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.worldUnlocks.map((unlock) => (
                      <tr key={unlock.id}>
                        <th scope="row">{unlock.locationId}</th>
                        <td>{unlock.unlockSource}</td>
                        <td>{new Date(unlock.unlockedAt).toLocaleDateString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
