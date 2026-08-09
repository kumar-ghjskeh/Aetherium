"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  MasteryRecord,
  TopicPage,
  UserPreferences,
  WorldDeepLinkPage,
  WorldFeatureFlags,
  WorldLocationPage,
  WorldProfile,
  WorldSceneManifest
} from "@aetherium/shared-types";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";
import { WorldRuntimeErrorBoundary } from "./components/canvas/world-runtime-error-boundary";
import { WorldRuntimeFallback, WorldRuntimeLoading } from "./components/ui/world-runtime-fallback";
import type { AchievementHallOverviewData } from "./engine/achievement-hall-system";
import type { AIObservatoryOverviewData } from "./engine/ai-observatory-system";
import type { CentralPlazaOverviewData } from "./engine/central-plaza-system";
import type { CodingArenaOverviewData } from "./engine/coding-arena-system";
import type { WorldCommandIntent } from "./engine/command-bridge-system";
import type { HabitGardenOverviewData } from "./engine/habit-garden-system";
import type { KnowledgeLibraryOverviewData } from "./engine/knowledge-library-system";
import type { LearningAcademyOverviewData } from "./engine/learning-academy-system";
import type { PersonalSanctuaryOverviewData } from "./engine/personal-sanctuary-system";
import type { ProjectDockOverviewData } from "./engine/project-dock-system";
import type { ProgressTowerOverviewData } from "./engine/progress-tower-system";
import { useWorldRuntimeReadiness } from "./hooks/use-world-runtime-readiness";

interface WorldDataState {
  achievementHallOverview: AchievementHallOverviewData;
  aiObservatoryOverview: AIObservatoryOverviewData;
  codingArenaOverview: CodingArenaOverviewData;
  deepLinks: WorldDeepLinkPage;
  featureFlags: WorldFeatureFlags;
  habitGardenOverview: HabitGardenOverviewData;
  learningAcademyOverview: LearningAcademyOverviewData;
  libraryOverview: KnowledgeLibraryOverviewData;
  locations: WorldLocationPage;
  personalSanctuaryOverview: PersonalSanctuaryOverviewData;
  plazaOverview: CentralPlazaOverviewData;
  preferences: UserPreferences;
  profile: WorldProfile;
  projectDockOverview: ProjectDockOverviewData;
  progressTowerOverview: ProgressTowerOverviewData;
  sceneManifest: WorldSceneManifest;
}

const LazyWorldRuntimeCanvas = React.lazy(async () => {
  const runtimeModule = await import("./components/canvas/world-runtime-canvas");
  return { default: runtimeModule.WorldRuntimeCanvas };
});

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "World data contracts are unavailable.";
}

async function loadAcademyMasteryRecords(
  apiClient: AetheriumApiClient,
  topics: TopicPage
): Promise<MasteryRecord[]> {
  return Promise.all(
    topics.items.slice(0, 6).map((topic) => apiClient.learning.getMastery(topic.id))
  );
}

async function loadFeaturedProjectDetail(
  apiClient: AetheriumApiClient,
  projects: ProjectDockOverviewData["projects"]
): Promise<ProjectDockOverviewData["featuredProject"]> {
  const featuredProject =
    projects.items.find((project) => project.status === "active") ?? projects.items[0];
  return featuredProject ? apiClient.projects.get(featuredProject.id) : null;
}

export function WorldPage({
  client,
  initialIntent = null
}: Readonly<{
  client?: AetheriumApiClient;
  initialIntent?: WorldCommandIntent | null;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [data, setData] = React.useState<WorldDataState | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [readinessVersion, setReadinessVersion] = React.useState(0);
  const runtimeReadiness = useWorldRuntimeReadiness({
    checkVersion: readinessVersion,
    featureFlags: data?.featureFlags ?? null,
    sceneManifest: data?.sceneManifest ?? null,
    userReducedMotion: data?.preferences.reducedMotion ?? false
  });

  const visitWorldLocation = React.useCallback(
    async (locationId: string): Promise<WorldProfile> => {
      const updatedProfile = await apiClient.world.visit({
        idempotencyKey: globalThis.crypto.randomUUID(),
        locationId
      });
      setData((current) => {
        if (!current) {
          return current;
        }
        const visited = new Set(updatedProfile.visitedLocationIds);
        const unlocked = new Set(updatedProfile.unlockedLocationIds);
        return {
          ...current,
          locations: {
            ...current.locations,
            currentLocationId: updatedProfile.currentLocationId,
            items: current.locations.items.map((location) => ({
              ...location,
              current: location.id === updatedProfile.currentLocationId,
              unlocked: unlocked.has(location.id),
              visited: visited.has(location.id)
            })),
            unlockedCount: unlocked.size,
            visitedCount: visited.size
          },
          profile: updatedProfile
        };
      });
      return updatedProfile;
    },
    [apiClient]
  );

  const loadWorldData = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [
        profile,
        locations,
        deepLinks,
        sceneManifest,
        featureFlags,
        preferences,
        user,
        habitSummary,
        habits,
        notifications,
        files,
        collections,
        tags,
        projects,
        learningGoals,
        learningSubjects,
        learningTopics,
        learningCourses,
        learningModules,
        learningLessons,
        learningSessions,
        learningQuizzes,
        learningFlashcards,
        learningRoadmaps,
        mentors,
        conversations,
        providers,
        modelConfigs,
        usage,
        achievementSummary,
        achievementPage,
        certificates,
        personalProfile,
        privacy,
        profileLinks,
        favoriteProjects,
        favoriteResources,
        analytics,
        codingSnippets,
        codingExercises,
        codingAssistantRequests,
        codingRunner
      ] = await Promise.all([
        apiClient.world.getProfile(),
        apiClient.world.listLocations(),
        apiClient.world.listDeepLinks(),
        apiClient.world.getSceneManifest(),
        apiClient.world.getFeatureFlags(),
        apiClient.settings.getPreferences(),
        apiClient.auth.me(),
        apiClient.habits.getSummary({ period: "week" }),
        apiClient.habits.list({ limit: 5, offset: 0 }),
        apiClient.notifications.list({ limit: 5, offset: 0 }),
        apiClient.files.list({ includeDeleted: false, limit: 18, offset: 0 }),
        apiClient.files.listCollections({ limit: 12, offset: 0 }),
        apiClient.files.listTags({ limit: 20, offset: 0 }),
        apiClient.projects.list({ includeArchived: false, limit: 25, offset: 0 }),
        apiClient.learning.listGoals({ limit: 5, offset: 0 }),
        apiClient.learning.listSubjects({ limit: 5, offset: 0 }),
        apiClient.learning.listTopics({ limit: 8, offset: 0 }),
        apiClient.learning.listCourses({ limit: 6, offset: 0 }),
        apiClient.learning.listModules({ limit: 12, offset: 0 }),
        apiClient.learning.listLessons({ limit: 12, offset: 0 }),
        apiClient.learning.listSessions({ limit: 5, offset: 0 }),
        apiClient.learning.listQuizzes({ limit: 8, offset: 0 }),
        apiClient.learning.listFlashcards({ limit: 8, offset: 0 }),
        apiClient.learning.listRoadmaps({ limit: 5, offset: 0 }),
        apiClient.mentors.list({ includeArchived: false }),
        apiClient.mentors.listConversations({ includeArchived: false, limit: 8, offset: 0 }),
        apiClient.ai.listProviders(),
        apiClient.ai.listModelConfigs(),
        apiClient.ai.listUsage({ limit: 8, offset: 0 }),
        apiClient.achievements.summary(),
        apiClient.achievements.list({ limit: 25, offset: 0, unlockedOnly: false }),
        apiClient.users.listCertificates({ limit: 12, offset: 0 }),
        apiClient.users.getProfile(),
        apiClient.users.getPrivacy(),
        apiClient.users.listLinks({ limit: 8, offset: 0 }),
        apiClient.users.listFavoriteProjects({ limit: 12, offset: 0 }),
        apiClient.users.listFavoriteResources({ limit: 12, offset: 0 }),
        apiClient.analytics.summary({ period: "week" }),
        apiClient.coding.listSnippets({ includeArchived: false, limit: 6, offset: 0 }),
        apiClient.coding.listExercises({ includeArchived: false, limit: 6, offset: 0 }),
        apiClient.coding.listAssistantRequests({ limit: 5, offset: 0 }),
        apiClient.coding.getRunnerStatus()
      ]);
      const [masteryRecords, featuredProject] = await Promise.all([
        loadAcademyMasteryRecords(apiClient, learningTopics),
        loadFeaturedProjectDetail(apiClient, projects)
      ]);
      setData({
        achievementHallOverview: {
          achievements: achievementPage,
          certificates,
          projects,
          summary: achievementSummary
        },
        aiObservatoryOverview: {
          conversations,
          mentors,
          modelConfigs,
          providers,
          usage
        },
        codingArenaOverview: {
          assistantRequests: codingAssistantRequests,
          exercises: codingExercises,
          projects,
          runner: codingRunner,
          snippets: codingSnippets
        },
        deepLinks,
        featureFlags,
        habitGardenOverview: {
          achievementSummary,
          habits,
          summary: habitSummary
        },
        learningAcademyOverview: {
          courses: learningCourses,
          flashcards: learningFlashcards,
          goals: learningGoals,
          lessons: learningLessons,
          masteryRecords,
          modules: learningModules,
          quizzes: learningQuizzes,
          roadmaps: learningRoadmaps,
          sessions: learningSessions,
          subjects: learningSubjects,
          topics: learningTopics
        },
        libraryOverview: {
          collections,
          files,
          tags
        },
        locations,
        personalSanctuaryOverview: {
          certificates,
          favoriteProjects,
          favoriteResources,
          preferences,
          privacy,
          profile: personalProfile,
          profileLinks,
          projects
        },
        plazaOverview: {
          analytics,
          files,
          habitSummary,
          habits,
          learningGoals,
          mentors,
          notifications,
          preferences,
          projects,
          user
        },
        preferences,
        profile,
        projectDockOverview: {
          featuredProject,
          projects
        },
        progressTowerOverview: {
          summary: analytics
        },
        sceneManifest
      });
      setStatus("ready");
    } catch (loadError) {
      setError(friendlyError(loadError));
      setStatus("error");
    }
  }, [apiClient]);

  React.useEffect(() => {
    void loadWorldData();
  }, [loadWorldData]);

  return (
    <section className="world-product-page">
      <header className="world-product-heading">
        <div>
          <p className="eyebrow">World Mode</p>
          <h1>Aetherium Campus</h1>
        </div>
        <span className="state-pill" role="status">
          {status === "loading"
            ? "Loading"
            : data?.featureFlags.visualWorldEnabled
              ? "Live"
              : "Command fallback"}
        </span>
      </header>

      {status === "error" ? (
        <section className="world-runtime-fallback" role="alert">
          <div>
            <p className="eyebrow">Connection interrupted</p>
            <h2>World data is unavailable</h2>
            <p>{error ?? "World data contracts are unavailable."}</p>
          </div>
          <button className="secondary-action" onClick={() => void loadWorldData()} type="button">
            Try again
          </button>
        </section>
      ) : null}

      {data ? (
        <div className="world-product-runtime">
          {runtimeReadiness.status === "checking" ? <WorldRuntimeLoading /> : null}
          {runtimeReadiness.status === "fallback" ? (
            <WorldRuntimeFallback
              detail={data.featureFlags.reason}
              message={runtimeReadiness.message}
              onRetry={() => setReadinessVersion((value) => value + 1)}
            />
          ) : null}
          {runtimeReadiness.status === "ready" ? (
            <WorldRuntimeErrorBoundary key={readinessVersion}>
              <React.Suspense fallback={<WorldRuntimeLoading />}>
                <LazyWorldRuntimeCanvas
                  achievementHallOverview={data.achievementHallOverview}
                  aiObservatoryOverview={data.aiObservatoryOverview}
                  codingArenaOverview={data.codingArenaOverview}
                  deepLinks={data.deepLinks}
                  habitGardenOverview={data.habitGardenOverview}
                  initialIntent={initialIntent}
                  learningAcademyOverview={data.learningAcademyOverview}
                  libraryOverview={data.libraryOverview}
                  locationPage={data.locations}
                  onVisitLocation={visitWorldLocation}
                  personalSanctuaryOverview={data.personalSanctuaryOverview}
                  plazaOverview={data.plazaOverview}
                  preferences={data.preferences}
                  profile={data.profile}
                  projectDockOverview={data.projectDockOverview}
                  progressTowerOverview={data.progressTowerOverview}
                  sceneManifest={data.sceneManifest}
                />
              </React.Suspense>
            </WorldRuntimeErrorBoundary>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
