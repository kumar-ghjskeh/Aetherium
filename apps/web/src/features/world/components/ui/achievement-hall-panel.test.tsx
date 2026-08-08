import type {
  AchievementPage,
  AchievementSummary,
  CertificatePage,
  ProjectPage
} from "@aetherium/shared-types";
import { render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { usePlayerStore } from "../../state/player-store";
import { AchievementHallPanel } from "./achievement-hall-panel";

const achievements: AchievementPage = {
  items: [
    {
      category: "habits",
      createdAt: "2026-08-01T00:00:00Z",
      definitionId: "achievement-1",
      description: "Completed seven habit days.",
      points: 20,
      progressCount: 7,
      rarity: "focused",
      rewards: [],
      slug: "seven-day-rhythm",
      targetCount: 7,
      title: "Seven-Day Rhythm",
      unlockedAt: "2026-08-08T00:00:00Z",
      updatedAt: "2026-08-08T00:00:00Z",
      worldUnlocks: []
    }
  ],
  limit: 25,
  offset: 0,
  total: 1
};

const summary: AchievementSummary = {
  lockedCount: 0,
  recentUnlocks: achievements.items,
  totalAchievements: 1,
  totalPoints: 20,
  unlockedCount: 1,
  unlockedPoints: 20,
  worldUnlocks: []
};

const certificates: CertificatePage = { items: [], limit: 12, offset: 0, total: 0 };
const projects: ProjectPage = { items: [], limit: 25, offset: 0, total: 0 };

describe("AchievementHallPanel", () => {
  beforeEach(() => {
    usePlayerStore.setState({ position: [78, 1.1, 344] });
  });

  it("exposes earned records and accessible Command Mode destinations", () => {
    render(<AchievementHallPanel overview={{ achievements, certificates, projects, summary }} />);

    const panel = screen.getByRole("complementary", {
      name: "Achievement Hall real milestone overview"
    });
    expect(within(panel).getByText("Seven-Day Rhythm")).toBeInTheDocument();
    expect(within(panel).getByText("1/1 unlocked")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Achievements" })).toHaveAttribute(
      "href",
      "/app/achievements"
    );
    expect(within(panel).getByRole("link", { name: "Certificates" })).toHaveAttribute(
      "href",
      "/app/settings"
    );
    expect(within(panel).getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/app/projects"
    );
  });

  it("stays hidden outside the district boundary", () => {
    usePlayerStore.setState({ position: [0, 1.1, 0] });

    render(<AchievementHallPanel overview={{ achievements, certificates, projects, summary }} />);

    expect(
      screen.queryByRole("complementary", { name: "Achievement Hall real milestone overview" })
    ).not.toBeInTheDocument();
  });
});
