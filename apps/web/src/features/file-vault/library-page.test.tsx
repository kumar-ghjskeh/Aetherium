import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Collection,
  FilePage,
  FileTag,
  ProcessingJob,
  UploadResponse,
  VaultFile
} from "@aetherium/shared-types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedCodingClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedKnowledgeClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedNotificationsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient,
  createUnusedWorldClient
} from "../../test/api-client";
import { LibraryPage } from "./library-page";

const vaultFile: VaultFile = {
  collectionIds: [],
  contentType: "text/plain",
  createdAt: "2026-07-20T00:00:00Z",
  deletedAt: null,
  deletionStatus: "active",
  displayName: "Field Notes",
  fileExtension: ".txt",
  fileKind: "text",
  id: "11111111-1111-4111-8111-111111111111",
  isFavorite: false,
  malwareScanStatus: "not_configured",
  originalFileName: "field-notes.txt",
  processingStatus: "not_started",
  sanitizedFileName: "field-notes.txt",
  sizeBytes: 2048,
  tags: [],
  updatedAt: "2026-07-20T00:00:00Z"
};

const collection: Collection = {
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Research",
  updatedAt: "2026-07-20T00:00:00Z"
};

const tag: FileTag = {
  color: null,
  createdAt: "2026-07-20T00:00:00Z",
  id: "33333333-3333-4333-8333-333333333333",
  name: "circuits"
};

const uploadResponse: UploadResponse = {
  contentType: "text/plain",
  createdAt: "2026-07-20T00:00:00Z",
  expiresAt: "2026-07-20T00:15:00Z",
  fileName: "notes.txt",
  id: "44444444-4444-4444-8444-444444444444",
  sanitizedFileName: "notes.txt",
  sizeBytes: 11,
  status: "pending",
  uploadHeaders: { "Content-Type": "text/plain" },
  uploadMethod: "PUT",
  uploadUrl: "https://storage.example/upload"
};

const failedProcessingJob: ProcessingJob = {
  attemptCount: 1,
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  failureCount: 1,
  fileId: vaultFile.id,
  id: "55555555-5555-4555-8555-555555555555",
  lastErrorCode: "object_read_failed",
  lastErrorMessage: "Aetherium could not read the object from storage.",
  lockedAt: null,
  maxAttempts: 3,
  metadata: { queueName: "aetherium:file-ingestion" },
  nextAttemptAt: "2026-07-20T00:10:00Z",
  stage: "failed",
  startedAt: "2026-07-20T00:05:00Z",
  status: "failed",
  updatedAt: "2026-07-20T00:06:00Z"
};

function filePage(items: VaultFile[]): FilePage {
  return {
    items,
    limit: 25,
    offset: 0,
    total: items.length
  };
}

function createClient(overrides: Partial<AetheriumApiClient["files"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-file call"));

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
    coding: createUnusedCodingClient(),
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: {
      ...createUnusedFilesClient(),
      createCollection: vi.fn(() => Promise.resolve(collection)),
      createUpload: vi.fn(() => Promise.resolve(uploadResponse)),
      list: vi.fn(() => Promise.resolve(filePage([]))),
      listCollections: vi.fn(() => Promise.resolve({ items: [], limit: 50, offset: 0, total: 0 })),
      listTags: vi.fn(() => Promise.resolve({ items: [], limit: 50, offset: 0, total: 0 })),
      ...overrides
    },
    habits: createUnusedHabitsClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    knowledge: createUnusedKnowledgeClient(),
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: createUnusedNotificationsClient(),
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: createUnusedWorldClient()
  };
}

describe("LibraryPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows loading state and then an empty Personal Vault", async () => {
    let resolveList: (page: FilePage) => void = () => undefined;
    const pendingList = new Promise<FilePage>((resolve) => {
      resolveList = resolve;
    });
    const client = createClient({
      list: vi.fn(() => pendingList)
    });

    render(<LibraryPage client={client} />);

    expect(screen.getByText("Loading vault records...")).toBeInTheDocument();
    resolveList(filePage([]));

    expect(await screen.findByText("No files in your Personal Vault yet.")).toBeInTheDocument();
  });

  it("shows a readable error state when the vault API is unavailable", async () => {
    const client = createClient({
      list: vi.fn(() => Promise.reject(new Error("Vault unavailable")))
    });

    render(<LibraryPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Vault unavailable");
  });

  it("uploads a selected file through the presigned storage URL and completes the record", async () => {
    const storageFetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    vi.stubGlobal("fetch", storageFetch);
    const client = createClient({
      completeUpload: vi.fn(() => Promise.resolve(vaultFile))
    });
    const textFile = new File(["hello vault"], "notes.txt", { type: "text/plain" });

    render(<LibraryPage client={client} />);

    await userEvent.upload(screen.getByLabelText("Choose file"), textFile);
    await userEvent.click(screen.getByRole("button", { name: "Upload file" }));

    await waitFor(() =>
      expect(client.files.createUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: "text/plain",
          fileName: "notes.txt",
          sizeBytes: textFile.size
        })
      )
    );
    expect(storageFetch).toHaveBeenCalledWith(
      uploadResponse.uploadUrl,
      expect.objectContaining({
        body: textFile,
        headers: uploadResponse.uploadHeaders,
        method: "PUT"
      })
    );
    expect(client.files.completeUpload).toHaveBeenCalledWith(
      uploadResponse.id,
      expect.objectContaining({ displayName: "notes.txt" })
    );
    expect(await screen.findByText("File added to the Personal Vault.")).toBeInTheDocument();
  });

  it("updates favorites and tag metadata through the file client", async () => {
    const updatedFavorite = { ...vaultFile, isFavorite: true };
    const updatedTagged = { ...updatedFavorite, tags: [tag] };
    const client = createClient({
      addTag: vi.fn(() => Promise.resolve(updatedTagged)),
      favorite: vi.fn(() => Promise.resolve(updatedFavorite)),
      list: vi.fn(() => Promise.resolve(filePage([vaultFile]))),
      listCollections: vi.fn(() =>
        Promise.resolve({ items: [collection], limit: 50, offset: 0, total: 1 })
      )
    });

    render(<LibraryPage client={client} />);

    expect(await screen.findByRole("heading", { name: "Field Notes" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark Field Notes as favorite" }));

    await waitFor(() => expect(client.files.favorite).toHaveBeenCalledWith(vaultFile.id));
    expect(await screen.findByText("Favorite added.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Tag for Field Notes"), "circuits");
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));

    await waitFor(() =>
      expect(client.files.addTag).toHaveBeenCalledWith(vaultFile.id, { name: "circuits" })
    );
  });

  it("soft deletes an active file without showing a false success state", async () => {
    const deleted = {
      ...vaultFile,
      deletedAt: "2026-07-20T00:05:00Z",
      deletionStatus: "soft_deleted" as const
    };
    const client = createClient({
      list: vi.fn(() => Promise.resolve(filePage([vaultFile]))),
      softDelete: vi.fn(() => Promise.resolve(deleted))
    });

    render(<LibraryPage client={client} />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(client.files.softDelete).toHaveBeenCalledWith(vaultFile.id));
    expect(await screen.findByText("File moved to deleted records.")).toBeInTheDocument();
    expect(screen.getByText("No files in your Personal Vault yet.")).toBeInTheDocument();
  });

  it("retries a failed file processing job and refreshes the file state", async () => {
    const failedFile = { ...vaultFile, processingStatus: "failed" as const };
    const queuedFile = { ...vaultFile, processingStatus: "queued" as const };
    const queuedProcessingJob: ProcessingJob = {
      ...failedProcessingJob,
      lastErrorCode: null,
      lastErrorMessage: null,
      stage: "queued",
      status: "queued"
    };
    const client = createClient({
      get: vi.fn(() => Promise.resolve(queuedFile)),
      list: vi.fn(() => Promise.resolve(filePage([failedFile]))),
      listFileProcessingJobs: vi.fn(() =>
        Promise.resolve({
          items: [failedProcessingJob],
          limit: 5,
          offset: 0,
          total: 1
        })
      ),
      retryProcessingJob: vi.fn(() => Promise.resolve(queuedProcessingJob))
    });

    render(<LibraryPage client={client} />);

    expect(await screen.findByText("Processing failed")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry processing" }));

    await waitFor(() =>
      expect(client.files.listFileProcessingJobs).toHaveBeenCalledWith(vaultFile.id, {
        limit: 5,
        offset: 0
      })
    );
    expect(client.files.retryProcessingJob).toHaveBeenCalledWith(failedProcessingJob.id);
    expect(client.files.get).toHaveBeenCalledWith(vaultFile.id);
    expect(await screen.findByText("File processing queued.")).toBeInTheDocument();
    expect(screen.getByText("Queued for extraction")).toBeInTheDocument();
  });
});
