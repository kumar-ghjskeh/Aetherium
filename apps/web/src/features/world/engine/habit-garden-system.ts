import type { AchievementSummary, Habit, HabitPage, HabitSummary } from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export type HabitPlantStage = "bloom" | "dormant" | "grove" | "seedling" | "sprout";
export type HabitPlantHealth = "steady" | "thriving" | "warming";

export interface HabitGardenOverviewData {
  achievementSummary: AchievementSummary;
  habits: HabitPage;
  summary: HabitSummary;
}

export interface HabitPlantViewModel {
  color: string;
  detail: string;
  health: HabitPlantHealth;
  id: string;
  label: string;
  position: Vector3Tuple;
  scale: number;
  stage: HabitPlantStage;
  streakLabel: string;
}

export interface HabitGardenViewModel {
  bestStreakLabel: string;
  completionLabel: string;
  gardenGrowthLabel: string;
  habitCountLabel: string;
  permanentFeatureCount: number;
  permanentFeatureLabel: string;
  plants: HabitPlantViewModel[];
  recoveryLabel: string;
  weeklySignalLabel: string;
}

const PLANT_POSITIONS: Vector3Tuple[] = [
  [-16, 0.9, -10],
  [-7, 0.9, -15],
  [6, 0.9, -14],
  [16, 0.9, -8],
  [-17, 0.9, 7],
  [-7, 0.9, 13],
  [6, 0.9, 13],
  [17, 0.9, 7]
];

const FALLBACK_PLANT_COLORS = ["#77d98b", "#8fd1c7", "#bfc66a", "#f0c766", "#8be8ff"];

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function normalizePercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value > 1 ? Math.min(value, 100) : Math.min(value * 100, 100);
}

function percentLabel(value: number): string {
  return `${Math.round(normalizePercent(value))}%`;
}

function resolvePlantStage(habit: Habit): HabitPlantStage {
  if (habit.completedToday) {
    return habit.streak.currentStreak >= 7 ? "grove" : "bloom";
  }
  if (habit.streak.currentStreak >= 7) {
    return "grove";
  }
  if (habit.streak.currentStreak >= 3) {
    return "bloom";
  }
  if (habit.streak.currentStreak > 0 || habit.logCount30d > 0) {
    return "sprout";
  }
  return "dormant";
}

function resolvePlantHealth(habit: Habit): HabitPlantHealth {
  const rate = normalizePercent(habit.streak.completionRate30d);
  if (rate >= 70 || habit.completedToday) {
    return "thriving";
  }
  if (rate >= 30 || habit.streak.recoveryStreak > 0) {
    return "steady";
  }
  return "warming";
}

function resolvePlantScale(habit: Habit): number {
  const logSignal = Math.min(habit.logCount30d, 18) / 18;
  const streakSignal = Math.min(habit.streak.currentStreak, 14) / 14;
  return 0.86 + (logSignal + streakSignal) * 0.34;
}

function habitDetail(habit: Habit): string {
  if (habit.completedToday) {
    return "Logged today";
  }
  if (habit.streak.recoveryStreak > 0) {
    return `${formatCount(habit.streak.recoveryStreak, "recovery day")} active`;
  }
  if (habit.streak.lastLoggedOn) {
    return `Last logged ${habit.streak.lastLoggedOn}`;
  }
  return "Ready when you are";
}

export function buildHabitGardenViewModel(data: HabitGardenOverviewData): HabitGardenViewModel {
  const habitAchievements = data.achievementSummary.recentUnlocks.filter(
    (achievement) => achievement.category === "habits" && achievement.unlockedAt
  );
  const worldUnlockCount = data.achievementSummary.worldUnlocks.length;
  const permanentFeatureCount = habitAchievements.length + worldUnlockCount;

  return {
    bestStreakLabel: formatCount(data.summary.bestStreak, "day"),
    completionLabel: percentLabel(data.summary.completionRate),
    gardenGrowthLabel: formatCount(data.summary.gardenGrowthPoints, "growth point"),
    habitCountLabel: formatCount(data.habits.total, "active habit"),
    permanentFeatureCount,
    permanentFeatureLabel:
      permanentFeatureCount > 0
        ? formatCount(permanentFeatureCount, "permanent feature")
        : "No permanent features yet",
    plants: data.habits.items.slice(0, PLANT_POSITIONS.length).map((habit, index) => ({
      color:
        habit.color ?? FALLBACK_PLANT_COLORS[index % FALLBACK_PLANT_COLORS.length] ?? "#77d98b",
      detail: habitDetail(habit),
      health: resolvePlantHealth(habit),
      id: habit.id,
      label: habit.name,
      position: PLANT_POSITIONS[index % PLANT_POSITIONS.length] ?? [0, 0.9, 0],
      scale: resolvePlantScale(habit),
      stage: resolvePlantStage(habit),
      streakLabel: `${formatCount(habit.streak.currentStreak, "day")} current`
    })),
    recoveryLabel: formatCount(data.summary.recoveryStreakTotal, "recovery day"),
    weeklySignalLabel: `${data.summary.completedLogCount}/${data.summary.scheduledCount} scheduled logs`
  };
}
