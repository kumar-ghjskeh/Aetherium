import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  AIModelConfigurationPage,
  AIProviderPage,
  AIUsageRecordPage,
  AchievementPage,
  AchievementSummary,
  AnalyticsSummary,
  CollectionPage,
  CodeAssistantRequestPage,
  CodeRunnerStatus,
  CodeSnippetPage,
  CertificatePage,
  CourseModulePage,
  CoursePage,
  CodingExercisePage,
  ConversationPage,
  FilePage,
  FavoriteProjectPage,
  FavoriteResourcePage,
  FlashcardPage,
  HabitPage,
  HabitSummary,
  LearningGoalPage,
  LessonPage,
  MasteryRecord,
  MentorPage,
  NotificationPage,
  ProjectDetail,
  ProjectPage,
  ProfileLinkPage,
  PrivacySettings,
  PublicUser,
  QuizPage,
  StudyRoadmapPage,
  StudySessionPage,
  SubjectPage,
  TagPage,
  TopicPage,
  UserPreferences,
  UserProfile,
  WorldDeepLinkPage,
  WorldFeatureFlags,
  WorldLocationPage,
  WorldProfile,
  WorldSceneManifest
} from "@aetherium/shared-types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedAiClient,
  createUnusedAuthClient,
  createUnusedCodingClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedNotificationsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient,
  createUnusedWorldClient
} from "../../test/api-client";
import { WorldPage } from "./world-page";

vi.mock("./components/canvas/world-runtime-canvas", async () => {
  const React = await import("react");
  return {
    WorldRuntimeCanvas: ({
      onVisitLocation
    }: {
      onVisitLocation: (locationId: string) => Promise<unknown>;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "div",
          { "data-testid": "world-runtime-canvas" },
          "Mock runtime canvas"
        ),
        React.createElement(
          "button",
          { onClick: () => void onVisitLocation("library"), type: "button" },
          "Mock visit Library"
        )
      )
  };
});

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: Readonly<{
    children: React.ReactNode;
    href: string;
  }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const profile: WorldProfile = {
  createdAt: "2026-07-22T00:00:00Z",
  currentLocationId: "central_plaza",
  id: "55555555-5555-4555-8555-555555555555",
  lastVisitedLocationId: null,
  preferredNavigationMethod: "command_palette",
  spawnLocationId: "central_plaza",
  tutorialCompleted: false,
  unlockedLocationIds: ["central_plaza", "library", "habit_garden", "command_center"],
  updatedAt: "2026-07-22T00:00:00Z",
  visitedLocationIds: ["central_plaza"],
  worldStateVersion: 1
};

const locations: WorldLocationPage = {
  currentLocationId: "central_plaza",
  items: [
    {
      category: "hub",
      commandRoute: "/app",
      current: true,
      deepLinkEntityTypes: ["dashboard"],
      defaultUnlocked: true,
      description: "Spawn and overview location.",
      futureSceneKey: "central-plaza",
      id: "central_plaza",
      spawn: true,
      subtitle: "Daily command hub",
      title: "Central Plaza",
      unlockDependencyIds: [],
      unlocked: true,
      visited: true,
      visualStatus: "data_contract_ready"
    },
    {
      category: "vault",
      commandRoute: "/app/library",
      current: false,
      deepLinkEntityTypes: ["file", "file_chunk"],
      defaultUnlocked: true,
      description: "Destination for files and citations.",
      futureSceneKey: "knowledge-library",
      id: "library",
      spawn: false,
      subtitle: "Personal Vault and sources",
      title: "Knowledge Library",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    }
  ],
  total: 2,
  unlockedCount: 4,
  visitedCount: 1
};

const deepLinks: WorldDeepLinkPage = {
  items: [
    {
      commandRoute: "/app/library",
      entityTypes: ["file", "file_chunk"],
      label: "Knowledge Library",
      locationId: "library",
      notes: "Command route for future spatial navigation.",
      routePattern: "/app/library{?entityId,sourceId}"
    }
  ],
  total: 1
};

const sceneManifest: WorldSceneManifest = {
  implementationStatus: "runtime_foundation",
  locations: [
    {
      allowedToRender: false,
      assetBundleKey: null,
      commandRoute: "/app/library",
      disabledReason: "Visual World Mode is intentionally not implemented.",
      futureSceneKey: "knowledge-library",
      implementationStatus: "data_contract_ready",
      locationId: "library",
      title: "Knowledge Library"
    }
  ],
  manifestVersion: 1,
  visualRuntimeAvailable: true
};

const featureFlags: WorldFeatureFlags = {
  commandModeFallbackRequired: true,
  dataContractsEnabled: true,
  reason: "Diagnostic runtime enabled.",
  sceneManifestEnabled: true,
  visualWorldEnabled: true
};

const preferences: UserPreferences = {
  aiMemoryEnabled: false,
  ambientAudioEnabled: true,
  backgroundMusicEnabled: false,
  cameraEffectsEnabled: true,
  createdAt: "2026-07-22T00:00:00Z",
  defaultInterfaceMode: "command",
  id: "66666666-6666-4666-8666-666666666666",
  locale: "en-US",
  performancePreset: "balanced",
  productAnalyticsEnabled: false,
  reducedMotion: false,
  theme: "system",
  timeZone: "UTC",
  updatedAt: "2026-07-22T00:00:00Z"
};

const user: PublicUser = {
  createdAt: "2026-07-22T00:00:00Z",
  displayName: "Sai Kumar",
  email: "sai@example.test",
  id: "77777777-7777-4777-8777-777777777777",
  isEmailVerified: true,
  lastLoginAt: "2026-07-22T01:00:00Z"
};

const habitSummary: HabitSummary = {
  activeHabitCount: 2,
  bestStreak: 9,
  completedLogCount: 4,
  completionRate: 67,
  currentStreakTotal: 4,
  endDate: "2026-07-28",
  gardenGrowthPoints: 24,
  period: "week",
  recoveryStreakTotal: 1,
  scheduledCount: 6,
  startDate: "2026-07-22"
};

const habitPage: HabitPage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0
};

const notificationPage: NotificationPage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0,
  unreadCount: 0
};

const filePage: FilePage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0
};

const collectionPage: CollectionPage = {
  items: [],
  limit: 12,
  offset: 0,
  total: 0
};

const tagPage: TagPage = {
  items: [],
  limit: 20,
  offset: 0,
  total: 0
};

const projectDetail: ProjectDetail = {
  archivedAt: null,
  blockers: [],
  completedAt: null,
  createdAt: "2026-07-22T00:00:00Z",
  description: "Build a learning-focused CPU model.",
  files: [],
  id: "99999999-1111-4111-8111-111111111111",
  links: [],
  milestones: [],
  name: "CPU Learning Model",
  notes: [],
  objective: "Connect architecture study to a practical model.",
  recentActivity: [],
  repositoryUrl: null,
  startedOn: "2026-07-22",
  status: "active",
  targetDate: null,
  tasks: [],
  technologies: [],
  topics: [],
  updatedAt: "2026-07-22T00:00:00Z"
};

const projectPage: ProjectPage = {
  items: [projectDetail],
  limit: 5,
  offset: 0,
  total: 1
};

const codeSnippetPage: CodeSnippetPage = {
  items: [],
  limit: 6,
  offset: 0,
  total: 0
};

const codingExercisePage: CodingExercisePage = {
  items: [],
  limit: 6,
  offset: 0,
  total: 0
};

const codeAssistantRequestPage: CodeAssistantRequestPage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0
};

const codeRunnerStatus: CodeRunnerStatus = {
  availability: "unavailable",
  executionAvailable: false,
  providerName: "none",
  reason: "No isolated execution provider is configured.",
  securityRequirements: ["cpu_limit", "no_aetherium_secrets"],
  supportedLanguages: ["python", "typescript", "sql"]
};

const learningGoalPage: LearningGoalPage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0
};

const learningSubjectPage: SubjectPage = {
  items: [
    {
      createdAt: "2026-07-22T00:00:00Z",
      description: "Systems learning",
      id: "88888888-1111-4111-8111-111111111111",
      name: "Computer Architecture",
      status: "active",
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1
};

const learningTopicPage: TopicPage = {
  items: [
    {
      createdAt: "2026-07-22T00:00:00Z",
      description: "Instruction overlap and hazards.",
      id: "88888888-2222-4222-8222-222222222222",
      name: "Pipelining",
      status: "active",
      subjectId: "88888888-1111-4111-8111-111111111111",
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ],
  limit: 8,
  offset: 0,
  total: 1
};

const learningCoursePage: CoursePage = {
  items: [],
  limit: 6,
  offset: 0,
  total: 0
};

const learningModulePage: CourseModulePage = {
  items: [],
  limit: 12,
  offset: 0,
  total: 0
};

const learningLessonPage: LessonPage = {
  items: [],
  limit: 12,
  offset: 0,
  total: 0
};

const studySessionPage: StudySessionPage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0
};

const learningQuizPage: QuizPage = {
  items: [],
  limit: 8,
  offset: 0,
  total: 0
};

const learningFlashcardPage: FlashcardPage = {
  items: [],
  limit: 8,
  offset: 0,
  total: 0
};

const studyRoadmapPage: StudyRoadmapPage = {
  items: [],
  limit: 5,
  offset: 0,
  total: 0
};

const masteryRecord: MasteryRecord = {
  calculation: { method: "transparent_heuristic_v1" },
  confidenceScore: 0,
  createdAt: "2026-07-22T00:00:00Z",
  exerciseScore: 0,
  hintsPenalty: 0,
  id: "88888888-3333-4333-8333-333333333333",
  masteryScore: 0.2,
  projectEvidenceScore: 0,
  quizAccuracy: 0,
  reviewRecencyScore: 0,
  successfulRecallScore: 0,
  topicId: "88888888-2222-4222-8222-222222222222",
  updatedAt: "2026-07-22T00:00:00Z"
};

const mentorPage: MentorPage = {
  items: []
};

const conversationPage: ConversationPage = {
  items: [],
  limit: 8,
  offset: 0,
  total: 0
};

const aiProviderPage: AIProviderPage = {
  items: []
};

const aiModelConfigPage: AIModelConfigurationPage = {
  items: []
};

const aiUsageRecordPage: AIUsageRecordPage = {
  items: [],
  limit: 8,
  offset: 0,
  total: 0
};

const achievementSummary: AchievementSummary = {
  lockedCount: 0,
  recentUnlocks: [],
  totalAchievements: 0,
  totalPoints: 0,
  unlockedCount: 0,
  unlockedPoints: 0,
  worldUnlocks: []
};

const achievementPage: AchievementPage = {
  items: [],
  limit: 25,
  offset: 0,
  total: 0
};

const certificatePage: CertificatePage = {
  items: [],
  limit: 12,
  offset: 0,
  total: 0
};

const personalProfile: UserProfile = {
  avatarFileId: null,
  avatarKind: "preset",
  avatarPreset: "scholar",
  bio: null,
  createdAt: "2026-07-22T00:00:00Z",
  displayName: "Sai Kumar",
  email: "sai@example.test",
  headline: "Systems learner",
  id: "profile-1",
  isEmailVerified: true,
  location: null,
  updatedAt: "2026-07-22T00:00:00Z",
  userId: user.id,
  websiteUrl: null
};

const privacy: PrivacySettings = {
  aiMemoryEnabled: false,
  allowProfileInAiContext: false,
  allowProfileSearchIndexing: false,
  createdAt: "2026-07-22T00:00:00Z",
  id: "privacy-1",
  includeProfileInExports: true,
  productAnalyticsEnabled: false,
  profileVisibility: "private",
  showEmailOnProfile: false,
  updatedAt: "2026-07-22T00:00:00Z"
};

const profileLinkPage: ProfileLinkPage = { items: [], limit: 8, offset: 0, total: 0 };
const favoriteProjectPage: FavoriteProjectPage = { items: [], limit: 12, offset: 0, total: 0 };
const favoriteResourcePage: FavoriteResourcePage = { items: [], limit: 12, offset: 0, total: 0 };

const analyticsSummary: AnalyticsSummary = {
  generatedAt: "2026-07-22T00:00:00Z",
  metrics: [],
  period: "week",
  periodEnd: "2026-07-28",
  periodStart: "2026-07-22",
  trendBuckets: []
};

function mockMatchMedia(matches = false): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  );
}

function mockWebGL2Support(supported: boolean): void {
  Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn((contextId: string) => (contextId === "webgl2" && supported ? {} : null))
  });
}

function createClient(
  overrides: Partial<AetheriumApiClient["world"]> = {},
  settingsOverrides: Partial<AetheriumApiClient["settings"]> = {}
): AetheriumApiClient {
  return {
    achievements: {
      ...createUnusedAchievementsClient(),
      list: vi.fn(() => Promise.resolve(achievementPage)),
      summary: vi.fn(() => Promise.resolve(achievementSummary))
    },
    analytics: {
      ...createUnusedAnalyticsClient(),
      summary: vi.fn(() => Promise.resolve(analyticsSummary))
    },
    ai: {
      ...createUnusedAiClient(),
      listModelConfigs: vi.fn(() => Promise.resolve(aiModelConfigPage)),
      listProviders: vi.fn(() => Promise.resolve(aiProviderPage)),
      listUsage: vi.fn(() => Promise.resolve(aiUsageRecordPage))
    },
    auth: {
      ...createUnusedAuthClient(),
      me: vi.fn(() => Promise.resolve(user))
    },
    coding: {
      ...createUnusedCodingClient(),
      getRunnerStatus: vi.fn(() => Promise.resolve(codeRunnerStatus)),
      listAssistantRequests: vi.fn(() => Promise.resolve(codeAssistantRequestPage)),
      listExercises: vi.fn(() => Promise.resolve(codingExercisePage)),
      listSnippets: vi.fn(() => Promise.resolve(codeSnippetPage))
    },
    files: {
      ...createUnusedFilesClient(),
      list: vi.fn(() => Promise.resolve(filePage)),
      listCollections: vi.fn(() => Promise.resolve(collectionPage)),
      listTags: vi.fn(() => Promise.resolve(tagPage))
    },
    habits: {
      ...createUnusedHabitsClient(),
      getSummary: vi.fn(() => Promise.resolve(habitSummary)),
      list: vi.fn(() => Promise.resolve(habitPage))
    },
    learning: {
      ...createUnusedLearningClient(),
      getMastery: vi.fn(() => Promise.resolve(masteryRecord)),
      listCourses: vi.fn(() => Promise.resolve(learningCoursePage)),
      listFlashcards: vi.fn(() => Promise.resolve(learningFlashcardPage)),
      listGoals: vi.fn(() => Promise.resolve(learningGoalPage)),
      listLessons: vi.fn(() => Promise.resolve(learningLessonPage)),
      listModules: vi.fn(() => Promise.resolve(learningModulePage)),
      listQuizzes: vi.fn(() => Promise.resolve(learningQuizPage)),
      listRoadmaps: vi.fn(() => Promise.resolve(studyRoadmapPage)),
      listSessions: vi.fn(() => Promise.resolve(studySessionPage)),
      listSubjects: vi.fn(() => Promise.resolve(learningSubjectPage)),
      listTopics: vi.fn(() => Promise.resolve(learningTopicPage))
    },
    mentors: {
      ...createUnusedMentorsClient(),
      list: vi.fn(() => Promise.resolve(mentorPage)),
      listConversations: vi.fn(() => Promise.resolve(conversationPage))
    },
    notifications: {
      ...createUnusedNotificationsClient(),
      list: vi.fn(() => Promise.resolve(notificationPage))
    },
    projects: {
      ...createUnusedProjectsClient(),
      get: vi.fn(() => Promise.resolve(projectDetail)),
      list: vi.fn(() => Promise.resolve(projectPage))
    },
    settings: {
      getPreferences: vi.fn(() => Promise.resolve(preferences)),
      updatePreferences: vi.fn(() => Promise.resolve(preferences)),
      ...settingsOverrides
    },
    users: {
      ...createUnusedUsersClient(),
      getPrivacy: vi.fn(() => Promise.resolve(privacy)),
      getProfile: vi.fn(() => Promise.resolve(personalProfile)),
      listCertificates: vi.fn(() => Promise.resolve(certificatePage)),
      listFavoriteProjects: vi.fn(() => Promise.resolve(favoriteProjectPage)),
      listFavoriteResources: vi.fn(() => Promise.resolve(favoriteResourcePage)),
      listLinks: vi.fn(() => Promise.resolve(profileLinkPage))
    },
    world: {
      ...createUnusedWorldClient(),
      getFeatureFlags: vi.fn(() => Promise.resolve(featureFlags)),
      getProfile: vi.fn(() => Promise.resolve(profile)),
      getSceneManifest: vi.fn(() => Promise.resolve(sceneManifest)),
      listDeepLinks: vi.fn(() => Promise.resolve(deepLinks)),
      listLocations: vi.fn(() => Promise.resolve(locations)),
      ...overrides
    }
  } as unknown as AetheriumApiClient;
}

describe("WorldPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockMatchMedia(false);
    mockWebGL2Support(true);
  });

  it("renders the lazy diagnostic runtime when visual prerequisites pass", async () => {
    const client = createClient();
    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "World Data Foundation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Central Plaza runtime" })).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: /25 of 26 World Mode phases complete/u })
    ).toBeInTheDocument();
    expect(await screen.findByTestId("world-runtime-canvas")).toBeInTheDocument();
    expect(screen.getByText("central_plaza")).toBeInTheDocument();
    expect(screen.getAllByText("Knowledge Library").length).toBeGreaterThan(0);
    expect(screen.getAllByText("/app/library").length).toBeGreaterThan(0);

    await waitFor(() => expect(client.world.listLocations).toHaveBeenCalledTimes(1));
    expect(client.world.getSceneManifest).toHaveBeenCalledTimes(1);
    expect(client.world.getFeatureFlags).toHaveBeenCalledTimes(1);
    expect(client.settings.getPreferences).toHaveBeenCalledTimes(1);
    expect(client.auth.me).toHaveBeenCalledTimes(1);
    expect(client.habits.getSummary).toHaveBeenCalledWith({ period: "week" });
    expect(client.habits.list).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.notifications.list).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.files.list).toHaveBeenCalledWith({ includeDeleted: false, limit: 18, offset: 0 });
    expect(client.files.listCollections).toHaveBeenCalledWith({ limit: 12, offset: 0 });
    expect(client.files.listTags).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    expect(client.projects.list).toHaveBeenCalledWith({
      includeArchived: false,
      limit: 25,
      offset: 0
    });
    expect(client.projects.get).toHaveBeenCalledWith(projectDetail.id);
    expect(client.learning.listGoals).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.learning.listSubjects).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.learning.listTopics).toHaveBeenCalledWith({ limit: 8, offset: 0 });
    expect(client.learning.listCourses).toHaveBeenCalledWith({ limit: 6, offset: 0 });
    expect(client.learning.listModules).toHaveBeenCalledWith({ limit: 12, offset: 0 });
    expect(client.learning.listLessons).toHaveBeenCalledWith({ limit: 12, offset: 0 });
    expect(client.learning.listSessions).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.learning.listQuizzes).toHaveBeenCalledWith({ limit: 8, offset: 0 });
    expect(client.learning.listFlashcards).toHaveBeenCalledWith({ limit: 8, offset: 0 });
    expect(client.learning.listRoadmaps).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.learning.getMastery).toHaveBeenCalledWith(learningTopicPage.items[0]?.id);
    expect(client.mentors.list).toHaveBeenCalledWith({ includeArchived: false });
    expect(client.mentors.listConversations).toHaveBeenCalledWith({
      includeArchived: false,
      limit: 8,
      offset: 0
    });
    expect(client.ai.listProviders).toHaveBeenCalledTimes(1);
    expect(client.ai.listModelConfigs).toHaveBeenCalledTimes(1);
    expect(client.ai.listUsage).toHaveBeenCalledWith({ limit: 8, offset: 0 });
    expect(client.achievements.summary).toHaveBeenCalledTimes(1);
    expect(client.achievements.list).toHaveBeenCalledWith({
      limit: 25,
      offset: 0,
      unlockedOnly: false
    });
    expect(client.users.listCertificates).toHaveBeenCalledWith({ limit: 12, offset: 0 });
    expect(client.users.getProfile).toHaveBeenCalledTimes(1);
    expect(client.users.getPrivacy).toHaveBeenCalledTimes(1);
    expect(client.users.listLinks).toHaveBeenCalledWith({ limit: 8, offset: 0 });
    expect(client.users.listFavoriteProjects).toHaveBeenCalledWith({ limit: 12, offset: 0 });
    expect(client.users.listFavoriteResources).toHaveBeenCalledWith({ limit: 12, offset: 0 });
    expect(client.analytics.summary).toHaveBeenCalledWith({ period: "week" });
    expect(client.coding.listSnippets).toHaveBeenCalledWith({
      includeArchived: false,
      limit: 6,
      offset: 0
    });
    expect(client.coding.listExercises).toHaveBeenCalledWith({
      includeArchived: false,
      limit: 6,
      offset: 0
    });
    expect(client.coding.listAssistantRequests).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(client.coding.getRunnerStatus).toHaveBeenCalledTimes(1);
  });

  it("uses the command fallback when WebGL2 is unavailable", async () => {
    mockWebGL2Support(false);
    const client = createClient();

    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "3D runtime unavailable" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("This browser did not provide a stable WebGL2 context.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("world-runtime-canvas")).not.toBeInTheDocument();
  });

  it("persists a World Mode arrival and updates current location state", async () => {
    const updatedProfile: WorldProfile = {
      ...profile,
      currentLocationId: "library",
      lastVisitedLocationId: "central_plaza",
      unlockedLocationIds: [...profile.unlockedLocationIds, "library"],
      visitedLocationIds: [...profile.visitedLocationIds, "library"]
    };
    const client = createClient({
      visit: vi.fn(() => Promise.resolve(updatedProfile))
    });

    render(<WorldPage client={client} />);
    fireEvent.click(await screen.findByRole("button", { name: "Mock visit Library" }));

    await waitFor(() => expect(client.world.visit).toHaveBeenCalledTimes(1));
    const visitPayload = vi.mocked(client.world.visit).mock.calls[0]?.[0];
    expect(visitPayload?.locationId).toBe("library");
    expect(typeof visitPayload?.idempotencyKey).toBe("string");
    expect(visitPayload?.idempotencyKey.length).toBeGreaterThan(0);
    expect(await screen.findByText("library")).toBeInTheDocument();
  });

  it("uses the command fallback when reduced motion is enabled", async () => {
    const client = createClient(
      {},
      {
        getPreferences: vi.fn(() => Promise.resolve({ ...preferences, reducedMotion: true }))
      }
    );

    render(<WorldPage client={client} />);

    expect(
      await screen.findByRole("heading", { name: "3D runtime unavailable" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reduced motion is enabled, so Command Mode remains the active interface.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("world-runtime-canvas")).not.toBeInTheDocument();
  });

  it("shows an accessible error state when contracts are unavailable", async () => {
    const client = createClient({
      listLocations: vi.fn(() => Promise.reject(new Error("World service unavailable.")))
    });

    render(<WorldPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("World service unavailable.");
  });
});
