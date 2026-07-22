"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type { AnalyticsMetric, AnalyticsPeriod, AnalyticsSummary } from "@aetherium/shared-types";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

const periodOptions: Array<{ label: string; value: AnalyticsPeriod }> = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "Year", value: "year" }
];

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Analytics could not be loaded.";
}

function formatMetricValue(metric: AnalyticsMetric): string {
  if (!metric.available || metric.value === null) {
    return "Unavailable";
  }
  if (metric.unit === "ratio") {
    return `${Math.round(metric.value * 100)}%`;
  }
  return new Intl.NumberFormat("en-US").format(metric.value);
}

function hasActivity(summary: AnalyticsSummary): boolean {
  return summary.metrics.some(
    (metric) => metric.available && metric.value !== null && metric.value > 0
  );
}

export function AnalyticsPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("month");
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadSummary = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSummary(await apiClient.analytics.summary({ period }));
    } catch (loadError) {
      setError(friendlyError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, period]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const maxStudyMinutes = Math.max(
    1,
    ...(summary?.trendBuckets.map((bucket) => bucket.studyMinutes) ?? [0])
  );
  const activityRecorded = summary ? hasActivity(summary) : false;

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Progress Analytics</p>
          <h1>Analytics</h1>
        </div>
        <label className="analytics-period-select">
          Period
          <select
            onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
            value={period}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <section className="work-panel">
          <p className="empty-note">Loading analytics...</p>
        </section>
      ) : null}

      {!isLoading && summary ? (
        <>
          {!activityRecorded ? (
            <section className="work-panel">
              <h2>No activity in this period</h2>
              <p className="empty-note">
                Analytics are calculated only from stored files, habits, learning records, projects,
                and AI usage. No synthetic activity is shown.
              </p>
            </section>
          ) : null}

          <section className="metric-grid analytics-metrics" aria-label="Analytics metrics">
            {summary.metrics.map((metric) => (
              <article
                className={metric.available ? "metric-panel" : "metric-panel metric-panel-muted"}
                key={metric.key}
              >
                <span>{metric.label}</span>
                <strong>{formatMetricValue(metric)}</strong>
                <small>{metric.explanation}</small>
              </article>
            ))}
          </section>

          <section className="analytics-grid">
            <section className="work-panel">
              <header className="analytics-panel-header">
                <div>
                  <h2>Study trend</h2>
                  <p className="empty-note">
                    Bars show completed study minutes from real study-session records.
                  </p>
                </div>
              </header>
              <div className="analytics-bars" aria-label="Study minutes by period">
                {summary.trendBuckets.map((bucket) => (
                  <div
                    className="analytics-bar-row"
                    key={`${bucket.periodStart}-${bucket.periodEnd}`}
                  >
                    <span>{bucket.label}</span>
                    <div className="analytics-bar-track">
                      <span
                        style={{ width: `${(bucket.studyMinutes / maxStudyMinutes) * 100}%` }}
                      />
                    </div>
                    <strong>{bucket.studyMinutes}m</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="work-panel">
              <h2>Trend table</h2>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <caption>Stored progress records by analytics bucket</caption>
                  <thead>
                    <tr>
                      <th scope="col">Period</th>
                      <th scope="col">Study</th>
                      <th scope="col">Lessons</th>
                      <th scope="col">Habits</th>
                      <th scope="col">Files</th>
                      <th scope="col">AI</th>
                      <th scope="col">Projects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.trendBuckets.map((bucket) => (
                      <tr key={`${bucket.periodStart}-${bucket.periodEnd}-row`}>
                        <th scope="row">{bucket.label}</th>
                        <td>{bucket.studyMinutes}</td>
                        <td>{bucket.lessonsCompleted}</td>
                        <td>{bucket.habitCompletions}</td>
                        <td>{bucket.filesProcessed}</td>
                        <td>{bucket.aiRequests}</td>
                        <td>{bucket.projectsCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </>
      ) : null}
    </section>
  );
}
