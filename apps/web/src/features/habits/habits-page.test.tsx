import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Habit,
  HabitLog,
  HabitPage,
  HabitSummary,
  WeeklyReview
} from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient
} from "../../test/api-client";
import { HabitsPage } from "./habits-page";

const habit: Habit = {
  archivedAt: null,
  color: null,
  completedToday: false,
  createdAt: "2026-07-21T00:00:00Z",
  description: "Read one technical page without rushing.",
  id: "11111111-1111-4111-8111-111111111111",
  logCount30d: 0,
  name: "Deep reading",
  schedule: {
    createdAt: "2026-07-21T00:00:00Z",
    id: "22222222-2222-4222-8222-222222222222",
    scheduleType: "daily",
    startsOn: "2026-07-21",
    timeZone: "UTC",
    updatedAt: "2026-07-21T00:00:00Z",
    weekdays: [],
    weeklyTarget: null
  },
  status: "active",
  streak: {
    bestStreak: 0,
    completionRate30d: 0,
    createdAt: "2026-07-21T00:00:00Z",
    currentStreak: 0,
    id: "33333333-3333-4333-8333-333333333333",
    lastLoggedOn: null,
    recoveryStreak: 0,
    updatedAt: "2026-07-21T00:00:00Z"
  },
  target: {
    createdAt: "2026-07-21T00:00:00Z",
    id: "44444444-4444-4444-8444-444444444444",
    targetPeriod: "day",
    targetUnit: "pages",
    targetValue: 1,
    updatedAt: "2026-07-21T00:00:00Z"
  },
  updatedAt: "2026-07-21T00:00:00Z",
  valueType: "quantity"
};

const loggedHabit: Habit = {
  ...habit,
  completedToday: true,
  logCount30d: 1,
  streak: {
    ...habit.streak,
    bestStreak: 1,
    completionRate30d: 1,
    currentStreak: 1,
    lastLoggedOn: "2026-07-21"
  }
};

const summary: HabitSummary = {
  activeHabitCount: 1,
  bestStreak: 1,
  completedLogCount: 1,
  completionRate: 1,
  currentStreakTotal: 1,
  endDate: "2026-07-26",
  gardenGrowthPoints: 1,
  period: "week",
  recoveryStreakTotal: 0,
  scheduledCount: 1,
  startDate: "2026-07-20"
};

const emptySummary: HabitSummary = {
  activeHabitCount: 0,
  bestStreak: 0,
  completedLogCount: 0,
  completionRate: 0,
  currentStreakTotal: 0,
  endDate: "2026-07-26",
  gardenGrowthPoints: 0,
  period: "week",
  recoveryStreakTotal: 0,
  scheduledCount: 0,
  startDate: "2026-07-20"
};

const habitLog: HabitLog = {
  createdAt: "2026-07-21T00:10:00Z",
  habitId: habit.id,
  id: "55555555-5555-4555-8555-555555555555",
  logDate: "2026-07-21",
  note: null,
  status: "completed",
  unit: "pages",
  updatedAt: "2026-07-21T00:10:00Z",
  value: 1
};

const weeklyReview: WeeklyReview = {
  challenges: null,
  createdAt: "2026-07-21T00:00:00Z",
  id: "66666666-6666-4666-8666-666666666666",
  metadata: {},
  nextSteps: "Keep sessions small.",
  period: "week",
  updatedAt: "2026-07-21T00:00:00Z",
  weekStart: "2026-07-20",
  wins: "Started reading."
};

function page(items: Habit[]): HabitPage {
  return {
    items,
    limit: 25,
    offset: 0,
    total: items.length
  };
}

function createClient(overrides: Partial<AetheriumApiClient["habits"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-habit call"));

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
    analytics: createUnusedAnalyticsClient(),
    auditLogs: { list: vi.fn(reject) },
    auth: {
      login: vi.fn(reject),
      logout: vi.fn(reject),
      me: vi.fn(reject),
      register: vi.fn(reject)
    },
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    habits: {
      ...createUnusedHabitsClient(),
      create: vi.fn(() => Promise.resolve(habit)),
      getCheckIn: vi.fn(() => Promise.resolve(null)),
      getSummary: vi.fn(() => Promise.resolve(emptySummary)),
      list: vi.fn(() => Promise.resolve(page([]))),
      listWeeklyReviews: vi.fn(() => Promise.resolve({ items: [], limit: 4, offset: 0, total: 0 })),
      log: vi.fn(() => Promise.resolve(habitLog)),
      upsertCheckIn: vi.fn(() =>
        Promise.resolve({
          checkInDate: "2026-07-21",
          createdAt: "2026-07-21T00:00:00Z",
          energy: 4,
          id: "77777777-7777-4777-8777-777777777777",
          mood: 5,
          notes: "Focused start.",
          updatedAt: "2026-07-21T00:00:00Z"
        })
      ),
      upsertWeeklyReview: vi.fn(() => Promise.resolve(weeklyReview)),
      ...overrides
    },
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: { list: vi.fn(reject), markRead: vi.fn(reject) },
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: { getProfile: vi.fn(reject), updateProfile: vi.fn(reject), visit: vi.fn(reject) }
  };
}

describe("HabitsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state and then an empty habit state", async () => {
    let resolveList: (value: HabitPage) => void = () => undefined;
    const pendingList = new Promise<HabitPage>((resolve) => {
      resolveList = resolve;
    });
    const client = createClient({
      list: vi.fn(() => pendingList)
    });

    render(<HabitsPage client={client} />);

    expect(screen.getByText("Loading habits...")).toBeInTheDocument();
    resolveList(page([]));

    expect(
      await screen.findByText("No habits yet. Create one to begin tracking.")
    ).toBeInTheDocument();
  });

  it("creates a daily habit with shared validation", async () => {
    const client = createClient({
      getSummary: vi.fn(() => Promise.resolve(emptySummary)),
      list: vi
        .fn()
        .mockResolvedValueOnce(page([]))
        .mockResolvedValueOnce(page([habit]))
    });

    render(<HabitsPage client={client} />);

    await screen.findByText("No habits yet. Create one to begin tracking.");
    await userEvent.type(screen.getByLabelText("Name"), "Deep reading");
    await userEvent.selectOptions(screen.getByLabelText("Type"), "quantity");
    await userEvent.type(screen.getByLabelText("Unit"), "pages");
    await userEvent.click(screen.getByRole("button", { name: "Create habit" }));

    await waitFor(() =>
      expect(client.habits.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Deep reading",
          scheduleType: "daily",
          targetUnit: "pages",
          targetValue: 1,
          valueType: "quantity"
        })
      )
    );
    expect(await screen.findByText("Habit created.")).toBeInTheDocument();
  });

  it("validates selected weekdays before submitting", async () => {
    const client = createClient();

    render(<HabitsPage client={client} />);

    await screen.findByText("No habits yet. Create one to begin tracking.");
    await userEvent.type(screen.getByLabelText("Name"), "Weekday review");
    await userEvent.selectOptions(screen.getByLabelText("Schedule"), "selected_weekdays");
    await userEvent.click(screen.getByRole("button", { name: "Create habit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Selected weekday habits require at least one weekday."
    );
    expect(client.habits.create).not.toHaveBeenCalled();
  });

  it("logs today's habit and refreshes the summary", async () => {
    const client = createClient({
      getSummary: vi.fn().mockResolvedValueOnce(emptySummary).mockResolvedValueOnce(summary),
      list: vi
        .fn()
        .mockResolvedValueOnce(page([habit]))
        .mockResolvedValueOnce(page([loggedHabit]))
    });

    render(<HabitsPage client={client} />);

    expect(await screen.findByRole("heading", { name: "Deep reading" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log today" }));

    await waitFor(() =>
      expect(client.habits.log).toHaveBeenCalledWith(
        habit.id,
        expect.objectContaining({ value: 1 })
      )
    );
    expect(await screen.findByText("Habit logged for today.")).toBeInTheDocument();
    expect(screen.getByText("Logged")).toBeInTheDocument();
  });

  it("saves daily check-ins and weekly reviews", async () => {
    const client = createClient({
      list: vi.fn(() => Promise.resolve(page([habit]))),
      listWeeklyReviews: vi
        .fn()
        .mockResolvedValueOnce({ items: [], limit: 4, offset: 0, total: 0 })
        .mockResolvedValue({ items: [weeklyReview], limit: 4, offset: 0, total: 1 })
    });

    render(<HabitsPage client={client} />);

    await screen.findByRole("heading", { name: "Deep reading" });
    const checkInPanel = screen.getByRole("heading", { name: "Daily Check-In" }).closest("section");
    expect(checkInPanel).not.toBeNull();
    await userEvent.selectOptions(within(checkInPanel as HTMLElement).getByLabelText("Mood"), "5");
    await userEvent.selectOptions(
      within(checkInPanel as HTMLElement).getByLabelText("Energy"),
      "4"
    );
    await userEvent.type(
      within(checkInPanel as HTMLElement).getByLabelText("Notes"),
      "Focused start."
    );
    await userEvent.click(
      within(checkInPanel as HTMLElement).getByRole("button", { name: "Save check-in" })
    );

    await waitFor(() =>
      expect(client.habits.upsertCheckIn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ energy: 4, mood: 5, notes: "Focused start." })
      )
    );
    expect(await screen.findByText("Daily check-in saved.")).toBeInTheDocument();

    const reviewPanel = screen.getByRole("heading", { name: "Weekly Review" }).closest("section");
    expect(reviewPanel).not.toBeNull();
    await userEvent.type(
      within(reviewPanel as HTMLElement).getByLabelText("Wins"),
      "Started reading."
    );
    await userEvent.type(
      within(reviewPanel as HTMLElement).getByLabelText("Next steps"),
      "Keep sessions small."
    );
    await userEvent.click(
      within(reviewPanel as HTMLElement).getByRole("button", { name: "Save review" })
    );

    await waitFor(() =>
      expect(client.habits.upsertWeeklyReview).toHaveBeenCalledWith(
        expect.objectContaining({
          nextSteps: "Keep sessions small.",
          wins: "Started reading."
        })
      )
    );
    expect(await screen.findByText("Weekly review saved.")).toBeInTheDocument();
  });

  it("shows a readable error state when habit data is unavailable", async () => {
    const client = createClient({
      list: vi.fn(() => Promise.reject(new Error("Habit service unavailable")))
    });

    render(<HabitsPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Habit service unavailable");
  });
});
