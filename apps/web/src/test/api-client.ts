import type { AetheriumApiClient } from "@aetherium/api-client";
import { vi } from "vitest";

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
