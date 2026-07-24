import type {
  AnalyticsSummary,
  FilePage,
  Habit,
  HabitPage,
  HabitSummary,
  LearningGoalPage,
  MentorPage,
  NotificationPage,
  Project,
  ProjectPage,
  PublicUser,
  UserPreferences
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export interface CentralPlazaOverviewData {
  analytics: AnalyticsSummary;
  files: FilePage;
  habitSummary: HabitSummary;
  habits: HabitPage;
  learningGoals: LearningGoalPage;
  mentors: MentorPage;
  notifications: NotificationPage;
  preferences: Pick<UserPreferences, "locale" | "timeZone">;
  projects: ProjectPage;
  user: PublicUser;
}

export interface CentralPlazaTerminalViewModel {
  commandRoute: string;
  detail: string;
  id:
    | "continue-activity"
    | "daily-overview"
    | "fast-travel"
    | "mentor-status"
    | "notifications"
    | "world-map";
  label: string;
  position: Vector3Tuple;
  themeColor: string;
  value: string;
}

export interface CentralPlazaViewModel {
  activeLearningGoalTitle: string;
  activeProjectTitle: string;
  currentStreakLabel: string;
  currentTimeLabel: string;
  greeting: string;
  mentorStatusLabel: string;
  recentFileTitle: string;
  terminals: CentralPlazaTerminalViewModel[];
  todayHabitLabels: string[];
  unreadNotificationLabel: string;
}

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function firstIncompleteHabit(habits: readonly Habit[]): Habit | null {
  return habits.find((habit) => !habit.completedToday) ?? habits[0] ?? null;
}

function firstActiveProject(projects: readonly Project[]): Project | null {
  return (
    projects.find((project) => project.status !== "completed" && project.status !== "archived") ??
    projects[0] ??
    null
  );
}

function resolvePrimaryContinueRoute(data: CentralPlazaOverviewData): string {
  if (data.learningGoals.items.length > 0) {
    return "/app/learning";
  }
  if (data.projects.items.length > 0) {
    return "/app/projects";
  }
  if (data.files.items.length > 0) {
    return "/app/library";
  }
  return "/app";
}

function formatCurrentTime(
  now: Date,
  preferences: Pick<UserPreferences, "locale" | "timeZone">
): string {
  try {
    return new Intl.DateTimeFormat(preferences.locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: preferences.timeZone
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC"
    }).format(now);
  }
}

export function buildCentralPlazaViewModel(
  data: CentralPlazaOverviewData,
  now = new Date()
): CentralPlazaViewModel {
  const activeProject = firstActiveProject(data.projects.items);
  const activeGoal = data.learningGoals.items[0] ?? null;
  const recentFile = data.files.items[0] ?? null;
  const nextHabit = firstIncompleteHabit(data.habits.items);
  const unreadNotifications = data.notifications.unreadCount;
  const todayHabitLabels =
    data.habits.items.length === 0
      ? ["No habits created yet"]
      : data.habits.items
          .slice(0, 3)
          .map((habit) =>
            habit.completedToday ? `${habit.name}: done today` : `${habit.name}: ready`
          );

  const currentStreakLabel = formatCount(data.habitSummary.currentStreakTotal, "day");
  const unreadNotificationLabel =
    unreadNotifications > 0 ? formatCount(unreadNotifications, "unread alert") : "All clear";
  const activeProjectTitle = activeProject?.name ?? "No active project";
  const activeLearningGoalTitle = activeGoal?.title ?? "No active learning goal";
  const recentFileTitle = recentFile?.displayName ?? "No recent file";
  const mentorStatusLabel =
    data.mentors.items.length > 0
      ? formatCount(data.mentors.items.length, "mentor")
      : "No mentors available";

  return {
    activeLearningGoalTitle,
    activeProjectTitle,
    currentStreakLabel,
    currentTimeLabel: formatCurrentTime(now, data.preferences),
    greeting: `Welcome back, ${data.user.displayName}`,
    mentorStatusLabel,
    recentFileTitle,
    terminals: [
      {
        commandRoute: resolvePrimaryContinueRoute(data),
        detail:
          activeGoal?.title ??
          activeProject?.name ??
          recentFile?.displayName ??
          "Open Command Center",
        id: "continue-activity",
        label: "Continue",
        position: [0, 1.25, -18],
        themeColor: "#82e6f0",
        value:
          activeGoal?.title ?? activeProject?.name ?? recentFile?.displayName ?? "Command Center"
      },
      {
        commandRoute: "/app/habits",
        detail:
          nextHabit === null
            ? "Create the first daily rhythm"
            : nextHabit.completedToday
              ? "Habit list is current"
              : `${nextHabit.name} is ready`,
        id: "daily-overview",
        label: "Daily",
        position: [15.6, 1.25, -9],
        themeColor: "#77d98b",
        value: `${Math.round(data.habitSummary.completionRate)}% week`
      },
      {
        commandRoute: "/app",
        detail:
          unreadNotifications > 0
            ? (data.notifications.items[0]?.title ?? "Review unread notifications")
            : "No unread notifications",
        id: "notifications",
        label: "Alerts",
        position: [15.6, 1.25, 9],
        themeColor: "#f0c766",
        value: unreadNotificationLabel
      },
      {
        commandRoute: "/app/world",
        detail: "Fast travel destinations and unlocked routes",
        id: "world-map",
        label: "Map",
        position: [0, 1.25, 18],
        themeColor: "#b9a8ff",
        value: "Central Plaza"
      },
      {
        commandRoute: "/app/world",
        detail: "Instant movement remains available from Command Mode",
        id: "fast-travel",
        label: "Travel",
        position: [-15.6, 1.25, 9],
        themeColor: "#7d68ff",
        value: "Ready"
      },
      {
        commandRoute: "/app/ai",
        detail: data.mentors.items[0]?.name ?? "Open AI Hall",
        id: "mentor-status",
        label: "Mentors",
        position: [-15.6, 1.25, -9],
        themeColor: "#8be8ff",
        value: mentorStatusLabel
      }
    ],
    todayHabitLabels,
    unreadNotificationLabel
  };
}
