import type { AetheriumApiClient } from "@aetherium/api-client";
import { vi } from "vitest";

export function createUnusedAnalyticsClient(): AetheriumApiClient["analytics"] {
  const reject = () => Promise.reject(new Error("Unexpected analytics call"));

  return {
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
