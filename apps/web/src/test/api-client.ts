import type { AetheriumApiClient } from "@aetherium/api-client";
import { vi } from "vitest";

export function createUnusedAnalyticsClient(): AetheriumApiClient["analytics"] {
  const reject = () => Promise.reject(new Error("Unexpected analytics call"));

  return {
    summary: vi.fn(reject)
  };
}

export function createUnusedAiClient(): AetheriumApiClient["ai"] {
  const reject = () => Promise.reject(new Error("Unexpected AI gateway call"));

  return {
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
  };
}

export function createUnusedAuthClient(): AetheriumApiClient["auth"] {
  const reject = () => Promise.reject(new Error("Unexpected auth call"));

  return {
    login: vi.fn(reject),
    logout: vi.fn(reject),
    me: vi.fn(reject),
    register: vi.fn(reject)
  };
}

export function createUnusedCodingClient(): AetheriumApiClient["coding"] {
  const reject = () => Promise.reject(new Error("Unexpected coding call"));

  return {
    archiveSnippet: vi.fn(reject),
    createAttempt: vi.fn(reject),
    createExercise: vi.fn(reject),
    createSnippet: vi.fn(reject),
    explain: vi.fn(reject),
    getRunnerStatus: vi.fn(reject),
    getSnippet: vi.fn(reject),
    listAssistantRequests: vi.fn(reject),
    listExercises: vi.fn(reject),
    listSnippets: vi.fn(reject),
    review: vi.fn(reject),
    updateSnippet: vi.fn(reject)
  };
}

export function createUnusedKnowledgeClient(): AetheriumApiClient["knowledge"] {
  const reject = () => Promise.reject(new Error("Unexpected knowledge graph call"));

  return {
    createNode: vi.fn(reject),
    createRelationship: vi.fn(reject),
    listNodes: vi.fn(reject),
    listRelationships: vi.fn(reject),
    prerequisites: vi.fn(reject),
    recommendations: vi.fn(reject),
    relatedTopic: vi.fn(reject),
    summary: vi.fn(reject),
    sync: vi.fn(reject)
  };
}

export function createUnusedNotificationsClient(): AetheriumApiClient["notifications"] {
  const reject = () => Promise.reject(new Error("Unexpected notification workflow call"));

  return {
    getPreferences: vi.fn(reject),
    list: vi.fn(reject),
    listMonthlyReviews: vi.fn(reject),
    listWorkflows: vi.fn(reject),
    markAllRead: vi.fn(reject),
    markRead: vi.fn(reject),
    runWorkflows: vi.fn(reject),
    updatePreferences: vi.fn(reject),
    upsertMonthlyReview: vi.fn(reject)
  };
}

export function createUnusedAchievementsClient(): AetheriumApiClient["achievements"] {
  const reject = () => Promise.reject(new Error("Unexpected achievement call"));

  return {
    list: vi.fn(reject),
    process: vi.fn(reject),
    summary: vi.fn(reject)
  };
}

export function createUnusedFilesClient(): AetheriumApiClient["files"] {
  const reject = () => Promise.reject(new Error("Unexpected file vault call"));

  return {
    addFileToCollection: vi.fn(reject),
    addTag: vi.fn(reject),
    completeUpload: vi.fn(reject),
    createCollection: vi.fn(reject),
    createUpload: vi.fn(reject),
    download: vi.fn(reject),
    favorite: vi.fn(reject),
    get: vi.fn(reject),
    list: vi.fn(reject),
    listChunks: vi.fn(reject),
    listCollections: vi.fn(reject),
    listFileProcessingJobs: vi.fn(reject),
    listProcessingJobs: vi.fn(reject),
    listTags: vi.fn(reject),
    permanentDelete: vi.fn(reject),
    queueProcessing: vi.fn(reject),
    removeFileFromCollection: vi.fn(reject),
    removeTag: vi.fn(reject),
    restore: vi.fn(reject),
    retryProcessingJob: vi.fn(reject),
    softDelete: vi.fn(reject),
    unfavorite: vi.fn(reject),
    update: vi.fn(reject)
  };
}

export function createUnusedMentorsClient(): AetheriumApiClient["mentors"] {
  const reject = () => Promise.reject(new Error("Unexpected mentor call"));

  return {
    archive: vi.fn(reject),
    archiveConversation: vi.fn(reject),
    create: vi.fn(reject),
    createConversation: vi.fn(reject),
    deleteConversation: vi.fn(reject),
    editAndResendMessage: vi.fn(reject),
    exportConversation: vi.fn(reject),
    get: vi.fn(reject),
    getConversation: vi.fn(reject),
    getPermissions: vi.fn(reject),
    list: vi.fn(reject),
    listConversations: vi.fn(reject),
    listMessages: vi.fn(reject),
    regenerateMessage: vi.fn(reject),
    sendMessage: vi.fn(reject),
    stopGeneration: vi.fn(reject),
    update: vi.fn(reject),
    updateConversation: vi.fn(reject),
    updateMemory: vi.fn(reject),
    updatePermissions: vi.fn(reject)
  };
}

export function createUnusedHabitsClient(): AetheriumApiClient["habits"] {
  const reject = () => Promise.reject(new Error("Unexpected habit call"));

  return {
    archive: vi.fn(reject),
    create: vi.fn(reject),
    get: vi.fn(reject),
    getCheckIn: vi.fn(reject),
    getSummary: vi.fn(reject),
    list: vi.fn(reject),
    listLogs: vi.fn(reject),
    listWeeklyReviews: vi.fn(reject),
    log: vi.fn(reject),
    update: vi.fn(reject),
    upsertCheckIn: vi.fn(reject),
    upsertWeeklyReview: vi.fn(reject)
  };
}

export function createUnusedLearningClient(): AetheriumApiClient["learning"] {
  const reject = () => Promise.reject(new Error("Unexpected learning call"));

  return {
    addPrerequisite: vi.fn(reject),
    addQuestion: vi.fn(reject),
    completeLesson: vi.fn(reject),
    createCourse: vi.fn(reject),
    createFlashcard: vi.fn(reject),
    createGoal: vi.fn(reject),
    createLesson: vi.fn(reject),
    createModule: vi.fn(reject),
    createQuiz: vi.fn(reject),
    createResource: vi.fn(reject),
    createRoadmap: vi.fn(reject),
    createSession: vi.fn(reject),
    createSubject: vi.fn(reject),
    createTopic: vi.fn(reject),
    endSession: vi.fn(reject),
    getMastery: vi.fn(reject),
    listCourses: vi.fn(reject),
    listFlashcards: vi.fn(reject),
    listGoals: vi.fn(reject),
    listLessons: vi.fn(reject),
    listModules: vi.fn(reject),
    listQuizzes: vi.fn(reject),
    listResources: vi.fn(reject),
    listRoadmaps: vi.fn(reject),
    listSessions: vi.fn(reject),
    listSubjects: vi.fn(reject),
    listTopics: vi.fn(reject),
    reviewFlashcard: vi.fn(reject),
    submitAttempt: vi.fn(reject)
  };
}

export function createUnusedProjectsClient(): AetheriumApiClient["projects"] {
  const reject = () => Promise.reject(new Error("Unexpected project call"));

  return {
    addTechnology: vi.fn(reject),
    archive: vi.fn(reject),
    attachFile: vi.fn(reject),
    create: vi.fn(reject),
    createBlocker: vi.fn(reject),
    createLink: vi.fn(reject),
    createMilestone: vi.fn(reject),
    createNote: vi.fn(reject),
    createTask: vi.fn(reject),
    get: vi.fn(reject),
    linkTopic: vi.fn(reject),
    list: vi.fn(reject),
    listActivity: vi.fn(reject),
    update: vi.fn(reject),
    updateBlocker: vi.fn(reject),
    updateMilestone: vi.fn(reject),
    updateTask: vi.fn(reject)
  };
}

export function createUnusedUsersClient(): AetheriumApiClient["users"] {
  const reject = () => Promise.reject(new Error("Unexpected user profile call"));

  return {
    createAccountDeletionRequest: vi.fn(reject),
    createCertificate: vi.fn(reject),
    createDataExportRequest: vi.fn(reject),
    createFavoriteResource: vi.fn(reject),
    createLink: vi.fn(reject),
    deleteCertificate: vi.fn(reject),
    deleteLink: vi.fn(reject),
    getPrivacy: vi.fn(reject),
    getProfile: vi.fn(reject),
    listAccountDeletionRequests: vi.fn(reject),
    listCertificates: vi.fn(reject),
    listDataExportRequests: vi.fn(reject),
    listFavoriteProjects: vi.fn(reject),
    listFavoriteResources: vi.fn(reject),
    listLinks: vi.fn(reject),
    removeFavoriteProject: vi.fn(reject),
    removeFavoriteResource: vi.fn(reject),
    setFavoriteProject: vi.fn(reject),
    updatePrivacy: vi.fn(reject),
    updateProfile: vi.fn(reject)
  };
}

export function createUnusedWorldClient(): AetheriumApiClient["world"] {
  const reject = () => Promise.reject(new Error("Unexpected world data call"));

  return {
    getFeatureFlags: vi.fn(reject),
    getLocation: vi.fn(reject),
    getProfile: vi.fn(reject),
    getSceneManifest: vi.fn(reject),
    listDeepLinks: vi.fn(reject),
    listLocations: vi.fn(reject),
    listUnlockedLocations: vi.fn(reject),
    listVisitedLocations: vi.fn(reject),
    updateProfile: vi.fn(reject),
    visit: vi.fn(reject)
  };
}
