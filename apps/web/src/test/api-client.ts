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
    listCollections: vi.fn(reject),
    listTags: vi.fn(reject),
    permanentDelete: vi.fn(reject),
    removeFileFromCollection: vi.fn(reject),
    removeTag: vi.fn(reject),
    restore: vi.fn(reject),
    softDelete: vi.fn(reject),
    unfavorite: vi.fn(reject),
    update: vi.fn(reject)
  };
}
