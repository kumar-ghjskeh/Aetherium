import type { AnalyticsSummary } from "@aetherium/shared-types";
import { render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { usePlayerStore } from "../../state/player-store";
import { ProgressTowerPanel } from "./progress-tower-panel";

const summary: AnalyticsSummary = {
  generatedAt: "2026-08-08T12:00:00Z",
  metrics: [
    {
      available: true,
      explanation: "Sum of completed study-session duration minutes.",
      key: "study_minutes",
      label: "Study time",
      unit: "minutes",
      value: 90
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
  period: "week",
  periodEnd: "2026-08-08",
  periodStart: "2026-08-02",
  trendBuckets: []
};

describe("ProgressTowerPanel", () => {
  beforeEach(() => {
    usePlayerStore.setState({ position: [340, 1.1, -52] });
  });

  it("renders exact values, unavailable explanations, and accessible chart handoffs", () => {
    render(<ProgressTowerPanel overview={{ summary }} />);

    const panel = screen.getByRole("complementary", {
      name: "Progress Tower real analytics overview"
    });
    expect(within(panel).getByText("90 min")).toBeInTheDocument();
    expect(within(panel).getAllByText("Unavailable")).toHaveLength(2);
    expect(
      within(panel).getByText("Coding workspace session records do not exist yet.")
    ).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Open Analytics" })).toHaveAttribute(
      "href",
      "/app/analytics"
    );
    expect(within(panel).getByRole("link", { name: "Learning" })).toHaveAttribute(
      "href",
      "/app/learning"
    );
  });

  it("stays hidden outside the district boundary", () => {
    usePlayerStore.setState({ position: [0, 1.1, 0] });

    render(<ProgressTowerPanel overview={{ summary }} />);

    expect(
      screen.queryByRole("complementary", { name: "Progress Tower real analytics overview" })
    ).not.toBeInTheDocument();
  });
});
