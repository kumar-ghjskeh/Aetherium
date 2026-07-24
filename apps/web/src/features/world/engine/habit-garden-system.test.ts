import type { AchievementSummary, Habit, HabitPage, HabitSummary } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildHabitGardenViewModel } from "./habit-garden-system";

function habit(overrides: Partial<Habit>): Habit {
  return {
    archivedAt: null,
    color: null,
    completedToday: false,
    createdAt: "2026-07-22T00:00:00Z",
    description: null,
    id: "habit-1",
    logCount30d: 0,
    name: "Read",
    schedule: {
      createdAt: "2026-07-22T00:00:00Z",
      id: "schedule-1",
      scheduleType: "daily",
      startsOn: "2026-07-22",
      timeZone: "UTC",
      updatedAt: "2026-07-22T00:00:00Z",
      weekdays: [],
      weeklyTarget: null
    },
    status: "active",
    streak: {
      bestStreak: 0,
      completionRate30d: 0,
      createdAt: "2026-07-22T00:00:00Z",
      currentStreak: 0,
      id: "streak-1",
      lastLoggedOn: null,
      recoveryStreak: 0,
      updatedAt: "2026-07-22T00:00:00Z"
    },
    target: {
      createdAt: "2026-07-22T00:00:00Z",
      id: "target-1",
      targetPeriod: "day",
      targetUnit: null,
      targetValue: 1,
      updatedAt: "2026-07-22T00:00:00Z"
    },
    updatedAt: "2026-07-22T00:00:00Z",
    valueType: "boolean",
    ...overrides
  };
}

const summary: HabitSummary = {
  activeHabitCount: 3,
  bestStreak: 12,
  completedLogCount: 5,
  completionRate: 72,
  currentStreakTotal: 8,
  endDate: "2026-07-28",
  gardenGrowthPoints: 31,
  period: "week",
  recoveryStreakTotal: 2,
  scheduledCount: 7,
  startDate: "2026-07-22"
};

const achievements: AchievementSummary = {
  lockedCount: 4,
  recentUnlocks: [
    {
      category: "habits",
      createdAt: "2026-07-22T00:00:00Z",
      definitionId: "achievement-1",
      description: "Log a habit.",
      points: 10,
      progressCount: 1,
      rarity: "common",
      rewards: [],
      slug: "first-rhythm",
      targetCount: 1,
      title: "First Rhythm",
      unlockedAt: "2026-07-22T00:00:00Z",
      updatedAt: "2026-07-22T00:00:00Z",
      worldUnlocks: []
    }
  ],
  totalAchievements: 5,
  totalPoints: 100,
  unlockedCount: 1,
  unlockedPoints: 10,
  worldUnlocks: []
};

describe("habit garden system", () => {
  it("maps real habit state to plant stages and garden labels", () => {
    const habits: HabitPage = {
      items: [
        habit({
          color: "#77d98b",
          completedToday: true,
          id: "habit-1",
          logCount30d: 8,
          name: "Study",
          streak: {
            ...habit({}).streak,
            bestStreak: 12,
            completionRate30d: 0.82,
            currentStreak: 9,
            id: "streak-1"
          }
        }),
        habit({
          id: "habit-2",
          logCount30d: 1,
          name: "Review",
          streak: {
            ...habit({}).streak,
            completionRate30d: 0.2,
            currentStreak: 1,
            id: "streak-2",
            recoveryStreak: 1
          }
        }),
        habit({ id: "habit-3", name: "Stretch" })
      ],
      limit: 8,
      offset: 0,
      total: 3
    };

    const viewModel = buildHabitGardenViewModel({
      achievementSummary: achievements,
      habits,
      summary
    });

    expect(viewModel.habitCountLabel).toBe("3 active habits");
    expect(viewModel.completionLabel).toBe("72%");
    expect(viewModel.bestStreakLabel).toBe("12 days");
    expect(viewModel.gardenGrowthLabel).toBe("31 growth points");
    expect(viewModel.permanentFeatureLabel).toBe("1 permanent feature");
    expect(viewModel.plants.map((plant) => plant.stage)).toEqual(["grove", "sprout", "dormant"]);
    expect(viewModel.plants[1]).toMatchObject({
      detail: "1 recovery day active",
      health: "steady"
    });
  });

  it("keeps empty gardens honest without fake plants", () => {
    const viewModel = buildHabitGardenViewModel({
      achievementSummary: {
        ...achievements,
        recentUnlocks: [],
        unlockedCount: 0,
        worldUnlocks: []
      },
      habits: { items: [], limit: 8, offset: 0, total: 0 },
      summary: { ...summary, activeHabitCount: 0, completedLogCount: 0, gardenGrowthPoints: 0 }
    });

    expect(viewModel.habitCountLabel).toBe("0 active habits");
    expect(viewModel.permanentFeatureLabel).toBe("No permanent features yet");
    expect(viewModel.plants).toEqual([]);
  });
});
