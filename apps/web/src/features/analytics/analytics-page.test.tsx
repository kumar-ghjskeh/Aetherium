import type { AetheriumApiClient } from "@aetherium/api-client";
import type { AnalyticsSummary } from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedCodingClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedKnowledgeClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedNotificationsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient,
  createUnusedWorldClient
} from "../../test/api-client";
import { AnalyticsPage } from "./analytics-page";

const summary: AnalyticsSummary = {
  generatedAt: "2026-07-21T00:00:00Z",
  metrics: [
    {
      available: true,
      explanation: "Sum of completed study-session duration minutes.",
      key: "study_minutes",
      label: "Study time",
      unit: "minutes",
      value: 45
    },
    {
      available: true,
      explanation: "Average completed quiz-attempt accuracy.",
      key: "quiz_accuracy",
      label: "Quiz accuracy",
      unit: "ratio",
      value: 0.8
    },
    {
      available: false,
      explanation: "Coding workspace session records do not exist yet.",
      key: "coding_sessions",
      label: "Coding sessions",
      unit: "sessions",
      value: null
    }
  ],
  period: "month",
  periodEnd: "2026-07-21",
  periodStart: "2026-06-22",
  trendBuckets: [
    {
      aiRequests: 1,
      filesProcessed: 1,
      habitCompletions: 1,
      label: "Jul 15 - Jul 21",
      lessonsCompleted: 1,
      periodEnd: "2026-07-21",
      periodStart: "2026-07-15",
      projectsCompleted: 1,
      studyMinutes: 45
    }
  ]
};

const emptySummary: AnalyticsSummary = {
  ...summary,
  metrics: summary.metrics.map((metric) =>
    metric.available ? { ...metric, value: metric.unit === "ratio" ? null : 0 } : metric
  ),
  trendBuckets: [
    {
      aiRequests: 0,
      filesProcessed: 0,
      habitCompletions: 0,
      label: "Jul 15 - Jul 21",
      lessonsCompleted: 0,
      periodEnd: "2026-07-21",
      periodStart: "2026-07-15",
      projectsCompleted: 0,
      studyMinutes: 0
    }
  ]
};

function createClient(
  overrides: Partial<AetheriumApiClient["analytics"]> = {}
): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-analytics call"));

  return {
    ai: {
      answerDocumentQuestion: vi.fn(reject),
      completeChat: vi.fn(reject),
      createEmbeddings: vi.fn(reject),
      listConsent: vi.fn(reject),
      listModelConfigs: vi.fn(reject),
      listProviders: vi.fn(reject),
      listUsage: vi.fn(reject),
      streamChat: vi.fn(reject),
      updateConsent: vi.fn(reject),
      updateModelConfig: vi.fn(reject)
    },
    achievements: createUnusedAchievementsClient(),
    analytics: {
      ...createUnusedAnalyticsClient(),
      summary: vi.fn(() => Promise.resolve(summary)),
      ...overrides
    },
    auditLogs: { list: vi.fn(reject) },
    auth: {
      login: vi.fn(reject),
      logout: vi.fn(reject),
      me: vi.fn(reject),
      register: vi.fn(reject)
    },
    coding: createUnusedCodingClient(),
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    habits: createUnusedHabitsClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    knowledge: createUnusedKnowledgeClient(),
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: createUnusedNotificationsClient(),
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: createUnusedWorldClient()
  };
}

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading and then rendered analytics from real summary data", async () => {
    let resolveSummary: (value: AnalyticsSummary) => void = () => undefined;
    const pendingSummary = new Promise<AnalyticsSummary>((resolve) => {
      resolveSummary = resolve;
    });
    const client = createClient({
      summary: vi.fn(() => pendingSummary)
    });

    render(<AnalyticsPage client={client} />);

    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
    resolveSummary(summary);

    expect(await screen.findByText("Study time")).toBeInTheDocument();
    expect(screen.getAllByText("45").length).toBeGreaterThan(0);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Stored progress records by analytics bucket" })
    ).toBeInTheDocument();
  });

  it("shows an honest empty state when no activity exists", async () => {
    const client = createClient({
      summary: vi.fn(() => Promise.resolve(emptySummary))
    });

    render(<AnalyticsPage client={client} />);

    expect(await screen.findByText("No activity in this period")).toBeInTheDocument();
    expect(screen.getByText(/No synthetic activity is shown/i)).toBeInTheDocument();
  });

  it("reloads analytics when the period changes", async () => {
    const user = userEvent.setup();
    const summaryMock = vi.fn(() => Promise.resolve(summary));
    const client = createClient({ summary: summaryMock });

    render(<AnalyticsPage client={client} />);

    await screen.findByText("Study time");
    await user.selectOptions(screen.getByLabelText("Period"), "year");

    await waitFor(() => {
      expect(summaryMock).toHaveBeenLastCalledWith({ period: "year" });
    });
  });

  it("shows server errors without rendering false metrics", async () => {
    const client = createClient({
      summary: vi.fn(() => Promise.reject(new Error("Analytics unavailable")))
    });

    render(<AnalyticsPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Analytics unavailable");
    expect(screen.queryByText("Study trend")).not.toBeInTheDocument();
  });

  it("renders trend rows accessibly", async () => {
    const client = createClient();

    render(<AnalyticsPage client={client} />);

    const row = await screen.findByRole("row", { name: /Jul 15 - Jul 21/ });
    expect(within(row).getByText("45")).toBeInTheDocument();
    expect(within(row).getAllByText("1").length).toBeGreaterThan(0);
  });
});
