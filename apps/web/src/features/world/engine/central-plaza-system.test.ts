import type {
  AnalyticsSummary,
  FilePage,
  Habit,
  HabitPage,
  HabitSummary,
  LearningGoalPage,
  MentorPage,
  NotificationPage,
  ProjectPage,
  PublicUser
} from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildCentralPlazaViewModel, type CentralPlazaOverviewData } from "./central-plaza-system";

const now = new Date("2026-07-24T14:30:00.000Z");

const user: PublicUser = {
  createdAt: "2026-07-22T00:00:00Z",
  displayName: "Sai Kumar",
  email: "sai@example.test",
  id: "77777777-7777-4777-8777-777777777777",
  isEmailVerified: true,
  lastLoginAt: "2026-07-24T14:00:00Z"
};

const habitSummary: HabitSummary = {
  activeHabitCount: 2,
  bestStreak: 11,
  completedLogCount: 5,
  completionRate: 83,
  currentStreakTotal: 6,
  endDate: "2026-07-24",
  gardenGrowthPoints: 32,
  period: "week",
  recoveryStreakTotal: 1,
  scheduledCount: 6,
  startDate: "2026-07-18"
};

function habit(overrides: Partial<Habit>): Habit {
  return {
    archivedAt: null,
    color: "#77d98b",
    completedToday: false,
    createdAt: "2026-07-22T00:00:00Z",
    description: null,
    id: "habit-1",
    logCount30d: 4,
    name: "Study algorithms",
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
      bestStreak: 11,
      completionRate30d: 72,
      createdAt: "2026-07-22T00:00:00Z",
      currentStreak: 6,
      id: "streak-1",
      lastLoggedOn: "2026-07-23",
      recoveryStreak: 1,
      updatedAt: "2026-07-22T00:00:00Z"
    },
    target: {
      createdAt: "2026-07-22T00:00:00Z",
      id: "target-1",
      targetPeriod: "day",
      targetUnit: "minutes",
      targetValue: 45,
      updatedAt: "2026-07-22T00:00:00Z"
    },
    updatedAt: "2026-07-22T00:00:00Z",
    valueType: "duration",
    ...overrides
  };
}

const habits: HabitPage = {
  items: [
    habit({ id: "habit-1" }),
    habit({ completedToday: true, id: "habit-2", name: "Review notes" })
  ],
  limit: 5,
  offset: 0,
  total: 2
};

const notifications: NotificationPage = {
  items: [
    {
      actionUrl: "/app/library",
      body: "Your file is ready.",
      createdAt: "2026-07-24T14:00:00Z",
      id: "notification-1",
      notificationType: "processing",
      readAt: null,
      severity: "info",
      title: "Document processed"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1,
  unreadCount: 1
};

const files: FilePage = {
  items: [
    {
      collectionIds: [],
      contentType: "text/markdown",
      createdAt: "2026-07-23T00:00:00Z",
      deletedAt: null,
      deletionStatus: "active",
      displayName: "Operating Systems Notes",
      fileExtension: ".md",
      fileKind: "markdown",
      id: "file-1",
      isFavorite: true,
      malwareScanStatus: "not_configured",
      originalFileName: "os.md",
      processingStatus: "ready",
      sanitizedFileName: "os.md",
      sizeBytes: 2048,
      tags: [],
      updatedAt: "2026-07-23T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1
};

const projects: ProjectPage = {
  items: [
    {
      archivedAt: null,
      completedAt: null,
      createdAt: "2026-07-22T00:00:00Z",
      description: null,
      id: "project-1",
      name: "Compiler Study Plan",
      objective: "Finish parser project",
      repositoryUrl: null,
      startedOn: "2026-07-22",
      status: "active",
      targetDate: null,
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1
};

const learningGoals: LearningGoalPage = {
  items: [
    {
      createdAt: "2026-07-22T00:00:00Z",
      description: null,
      id: "goal-1",
      status: "active",
      subjectId: null,
      targetDate: null,
      title: "Master dynamic programming",
      topicId: null,
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1
};

const mentors: MentorPage = {
  items: [
    {
      archivedAt: null,
      avatarReference: null,
      createdAt: "2026-07-22T00:00:00Z",
      description: "General learning mentor",
      fictionalIdentity: "Fictional AI guide",
      id: "mentor-1",
      isDefault: true,
      name: "Lyra",
      permissions: {
        allowConversations: true,
        allowFileContent: false,
        allowHabitData: false,
        allowLearningRecords: false,
        allowProfileData: false,
        allowProjects: false,
        allowedCollectionIds: [],
        allowedTools: [],
        createdAt: "2026-07-22T00:00:00Z",
        id: "permission-1",
        mentorId: "mentor-1",
        updatedAt: "2026-07-22T00:00:00Z"
      },
      preferredModelName: null,
      slug: "lyra",
      systemInstructions: "Help with learning.",
      tone: "calm",
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ]
};

const analytics: AnalyticsSummary = {
  generatedAt: "2026-07-24T14:00:00Z",
  metrics: [],
  period: "week",
  periodEnd: "2026-07-24",
  periodStart: "2026-07-18",
  trendBuckets: []
};

function overview(overrides: Partial<CentralPlazaOverviewData> = {}): CentralPlazaOverviewData {
  return {
    analytics,
    files,
    habitSummary,
    habits,
    learningGoals,
    mentors,
    notifications,
    preferences: {
      locale: "en-US",
      timeZone: "UTC"
    },
    projects,
    user,
    ...overrides
  };
}

describe("central plaza system", () => {
  it("builds real-data terminal labels for the plaza vertical slice", () => {
    const viewModel = buildCentralPlazaViewModel(overview(), now);

    expect(viewModel.greeting).toBe("Welcome back, Sai Kumar");
    expect(viewModel.currentStreakLabel).toBe("6 days");
    expect(viewModel.unreadNotificationLabel).toBe("1 unread alert");
    expect(viewModel.activeLearningGoalTitle).toBe("Master dynamic programming");
    expect(viewModel.activeProjectTitle).toBe("Compiler Study Plan");
    expect(viewModel.recentFileTitle).toBe("Operating Systems Notes");
    expect(viewModel.mentorStatusLabel).toBe("1 mentor");
    expect(viewModel.todayHabitLabels).toContain("Study algorithms: ready");
    expect(viewModel.todayHabitLabels).toContain("Review notes: done today");
    expect(
      viewModel.terminals.find((terminal) => terminal.id === "continue-activity")
    ).toMatchObject({
      commandRoute: "/app/learning",
      value: "Master dynamic programming"
    });
  });

  it("uses honest empty-state labels when the user has not created data", () => {
    const emptyViewModel = buildCentralPlazaViewModel(
      overview({
        files: { items: [], limit: 5, offset: 0, total: 0 },
        habits: { items: [], limit: 5, offset: 0, total: 0 },
        learningGoals: { items: [], limit: 5, offset: 0, total: 0 },
        mentors: { items: [] },
        notifications: { items: [], limit: 5, offset: 0, total: 0, unreadCount: 0 },
        projects: { items: [], limit: 5, offset: 0, total: 0 }
      }),
      now
    );

    expect(emptyViewModel.todayHabitLabels).toEqual(["No habits created yet"]);
    expect(emptyViewModel.activeLearningGoalTitle).toBe("No active learning goal");
    expect(emptyViewModel.activeProjectTitle).toBe("No active project");
    expect(emptyViewModel.recentFileTitle).toBe("No recent file");
    expect(emptyViewModel.mentorStatusLabel).toBe("No mentors available");
    expect(
      emptyViewModel.terminals.find((terminal) => terminal.id === "continue-activity")
    ).toMatchObject({
      commandRoute: "/app",
      value: "Command Center"
    });
  });
});
