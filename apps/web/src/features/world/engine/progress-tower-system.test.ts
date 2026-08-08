import type { AnalyticsSummary } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildProgressTowerViewModel } from "./progress-tower-system";

const summary: AnalyticsSummary = {
  generatedAt: "2026-08-08T12:00:00Z",
  metrics: [
    {
      available: true,
      explanation: "Sum of completed study-session duration minutes.",
      key: "study_minutes",
      label: "Study time",
      unit: "minutes",
      value: 125
    },
    {
      available: true,
      explanation: "Average completed quiz-attempt accuracy.",
      key: "quiz_accuracy",
      label: "Quiz accuracy",
      unit: "ratio",
      value: 0.82
    },
    {
      available: false,
      explanation: "File-open events are not tracked yet.",
      key: "files_opened",
      label: "Files opened",
      unit: "files",
      value: null
    }
  ],
  period: "week",
  periodEnd: "2026-08-08",
  periodStart: "2026-08-02",
  trendBuckets: [
    {
      aiRequests: 2,
      filesProcessed: 1,
      habitCompletions: 4,
      label: "Aug 2",
      lessonsCompleted: 1,
      periodEnd: "2026-08-02",
      periodStart: "2026-08-02",
      projectsCompleted: 0,
      studyMinutes: 25
    },
    {
      aiRequests: 1,
      filesProcessed: 0,
      habitCompletions: 2,
      label: "Aug 3",
      lessonsCompleted: 0,
      periodEnd: "2026-08-03",
      periodStart: "2026-08-03",
      projectsCompleted: 0,
      studyMinutes: 100
    }
  ]
};

describe("Progress Tower view model", () => {
  it("maps real metrics and same-unit study trends without fabricating values", () => {
    const viewModel = buildProgressTowerViewModel({ summary });

    expect(viewModel.availableMetricLabel).toBe("2 available metrics");
    expect(viewModel.unavailableMetricLabel).toBe("1 unavailable metric");
    expect(viewModel.activityLabel).toBe("Stored activity recorded");
    expect(viewModel.metricSignals).toEqual([
      expect.objectContaining({ id: "study_minutes", valueLabel: "125 min" }),
      expect.objectContaining({ id: "quiz_accuracy", valueLabel: "82%" }),
      expect.objectContaining({
        available: false,
        id: "files_opened",
        valueLabel: "Unavailable"
      })
    ]);
    expect(viewModel.trendSignals[0]?.heightScale).toBeCloseTo(0.385);
    expect(viewModel.trendSignals[1]?.heightScale).toBe(1);
    expect(viewModel.studyTrendLabel).toBe("125 study minutes across 2 periods");
  });

  it("preserves explanations and reports an honest no-activity state", () => {
    const emptySummary: AnalyticsSummary = {
      ...summary,
      metrics: summary.metrics.map((metric) =>
        metric.available ? { ...metric, value: 0 } : metric
      ),
      trendBuckets: summary.trendBuckets.map((bucket) => ({ ...bucket, studyMinutes: 0 }))
    };
    const viewModel = buildProgressTowerViewModel({ summary: emptySummary });
    const serialized = JSON.stringify(viewModel);

    expect(viewModel.activityLabel).toBe("No activity in this period");
    expect(viewModel.trendSignals.every((signal) => signal.heightScale === 0.12)).toBe(true);
    expect(serialized).toContain("File-open events are not tracked yet.");
    expect(serialized).not.toContain("synthetic");
  });
});
