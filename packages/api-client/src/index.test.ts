import { describe, expect, it, vi } from "vitest";

import { createAetheriumApiClient } from "./index";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    },
    status
  });
}

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

const vaultFile = {
  collectionIds: [],
  contentType: "application/pdf",
  createdAt: "2026-07-20T00:00:00Z",
  deletedAt: null,
  deletionStatus: "active",
  displayName: "Lecture notes",
  fileExtension: ".pdf",
  fileKind: "pdf",
  id: "77777777-7777-4777-8777-777777777777",
  isFavorite: false,
  malwareScanStatus: "not_configured",
  originalFileName: "notes.pdf",
  processingStatus: "not_started",
  sanitizedFileName: "notes.pdf",
  sizeBytes: 1024,
  tags: [],
  updatedAt: "2026-07-20T00:00:00Z"
};

const processingJob = {
  attemptCount: 1,
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  failureCount: 0,
  fileId: vaultFile.id,
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  lastErrorCode: null,
  lastErrorMessage: null,
  lockedAt: null,
  maxAttempts: 3,
  metadata: { queueName: "aetherium:file-ingestion" },
  nextAttemptAt: "2026-07-20T00:00:00Z",
  stage: "queued",
  startedAt: null,
  status: "queued",
  updatedAt: "2026-07-20T00:00:00Z"
};

const fileChunk = {
  chunkText: "Alpha systems notes.",
  createdAt: "2026-07-20T00:00:00Z",
  fileId: vaultFile.id,
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  pageNumber: null,
  processingJobId: processingJob.id,
  sectionLabel: "document",
  sequenceNumber: 0,
  sourceMetadata: { charStart: 0 },
  status: "ready",
  tokenEstimate: 5,
  updatedAt: "2026-07-20T00:00:00Z"
};

const searchResult = {
  createdAt: "2026-07-20T00:00:00Z",
  entityId: fileChunk.id,
  entityType: "file_chunk",
  id: `file_chunk:${fileChunk.id}`,
  matchReason: "file_content",
  openUrl: `/app/library?file=${vaultFile.id}&chunk=${fileChunk.id}`,
  score: 0.9,
  snippet: "Alpha systems notes.",
  source: {
    chunkId: fileChunk.id,
    fileId: vaultFile.id,
    pageNumber: null,
    sectionLabel: "document"
  },
  title: "Lecture notes content",
  worldLocationId: "library"
};

const aiProvider = {
  capabilities: ["chat", "streaming_chat", "embeddings"],
  configured: true,
  defaultChatModel: "aetherium-deterministic-chat",
  defaultEmbeddingModel: "aetherium-deterministic-embedding",
  displayName: "Aetherium deterministic adapter",
  external: false,
  kind: "aetherium_deterministic",
  name: "aetherium_deterministic"
};

const aiConsentPolicy = {
  allowCollections: false,
  allowConversations: false,
  allowFileContent: false,
  allowHabitData: false,
  allowLearningRecords: false,
  allowProfileData: false,
  allowProjects: false,
  allowedCollectionIds: [],
  createdAt: "2026-07-20T00:00:00Z",
  externalProvidersAllowed: false,
  feature: "general_chat",
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  updatedAt: "2026-07-20T00:00:00Z"
};

const aiModelConfiguration = {
  createdAt: "2026-07-20T00:00:00Z",
  enabled: true,
  fallbackModelName: null,
  fallbackProviderName: null,
  feature: "general_chat",
  id: "f1111111-1111-4111-8111-111111111111",
  maxOutputTokens: 512,
  modelName: "aetherium-deterministic-chat",
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  temperature: 0.2,
  updatedAt: "2026-07-20T00:00:00Z"
};

const aiUsageRecord = {
  createdAt: "2026-07-20T00:00:00Z",
  errorCode: null,
  errorMessage: null,
  estimatedCostMicroUsd: 0,
  feature: "general_chat",
  id: "f2222222-2222-4222-8222-222222222222",
  inputTokens: 3,
  latencyMs: 5,
  modelName: "aetherium-deterministic-chat",
  operation: "chat_completion",
  outputTokens: 4,
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  requestId: "ai_test",
  status: "success",
  totalTokens: 7,
  usedFallback: false
};

const aiChatCompletion = {
  feature: "general_chat",
  message: {
    content: "Aetherium deterministic response: Explain indexes.",
    role: "assistant"
  },
  modelName: "aetherium-deterministic-chat",
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  requestId: "ai_test",
  usage: {
    estimatedCostMicroUsd: 0,
    inputTokens: 3,
    outputTokens: 4,
    totalTokens: 7
  },
  usageRecordId: aiUsageRecord.id,
  usedFallback: false
};

const aiEmbeddingResponse = {
  data: [{ embedding: [0.1, -0.2], index: 0 }],
  feature: "embeddings",
  modelName: "aetherium-deterministic-embedding",
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  requestId: "ai_embedding_test",
  usage: {
    estimatedCostMicroUsd: 0,
    inputTokens: 2,
    outputTokens: 0,
    totalTokens: 2
  },
  usageRecordId: "f3333333-3333-4333-8333-333333333333",
  usedFallback: false
};

const mentorPermission = {
  allowConversations: false,
  allowFileContent: false,
  allowHabitData: false,
  allowLearningRecords: false,
  allowProfileData: false,
  allowProjects: false,
  allowedCollectionIds: [],
  allowedTools: ["explain", "quiz"],
  createdAt: "2026-07-20T00:00:00Z",
  id: "f4444444-4444-4444-8444-444444444444",
  mentorId: "f5555555-5555-4555-8555-555555555555",
  updatedAt: "2026-07-20T00:00:00Z"
};

const mentor = {
  archivedAt: null,
  avatarReference: null,
  createdAt: "2026-07-20T00:00:00Z",
  description: "General learning mentor.",
  fictionalIdentity: "A fictional AI mentor.",
  id: mentorPermission.mentorId,
  isDefault: true,
  name: "Lyra",
  permissions: mentorPermission,
  preferredModelName: null,
  slug: "lyra",
  systemInstructions: "Support practical learning without silently changing user data.",
  tone: "calm",
  updatedAt: "2026-07-20T00:00:00Z"
};

const conversationMemorySettings = {
  conversationId: "f6666666-6666-4666-8666-666666666666",
  createdAt: "2026-07-20T00:00:00Z",
  id: "f7777777-7777-4777-8777-777777777777",
  memoryEnabled: false,
  memoryPolicy: "disabled",
  memorySummary: null,
  updatedAt: "2026-07-20T00:00:00Z"
};

const conversation = {
  archivedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  deletedAt: null,
  id: conversationMemorySettings.conversationId,
  lastMessageAt: null,
  memorySettings: conversationMemorySettings,
  mentorId: mentor.id,
  mentorName: mentor.name,
  messageCount: 0,
  status: "active",
  title: "Index review",
  updatedAt: "2026-07-20T00:00:00Z"
};

const userMessage = {
  aiUsageRecordId: null,
  content: "Explain indexes.",
  conversationId: conversation.id,
  createdAt: "2026-07-20T00:00:00Z",
  editedFromMessageId: null,
  errorCode: null,
  errorMessage: null,
  id: "f8888888-8888-4888-8888-888888888888",
  modelName: null,
  providerName: null,
  regeneratedFromMessageId: null,
  role: "user",
  status: "complete",
  updatedAt: "2026-07-20T00:00:00Z"
};

const assistantMessage = {
  ...userMessage,
  aiUsageRecordId: aiUsageRecord.id,
  content: "Aetherium deterministic response: Explain indexes.",
  id: "f9999999-9999-4999-8999-999999999999",
  modelName: "aetherium-deterministic-chat",
  providerName: "aetherium_deterministic",
  role: "assistant"
};

const messageSendResponse = {
  assistantMessage,
  conversation: { ...conversation, lastMessageAt: "2026-07-20T00:01:00Z", messageCount: 2 },
  userMessage
};

describe("createAetheriumApiClient", () => {
  it("fetches and validates API liveness", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            checks: {},
            service: "api",
            status: "ok",
            version: "0.1.0"
          }),
          {
            headers: {
              "Content-Type": "application/json"
            },
            status: 200
          }
        )
      )
    );

    const client = createAetheriumApiClient({
      baseUrl: "http://localhost:8000/",
      fetcher
    });

    await expect(client.health.live()).resolves.toEqual({
      checks: {},
      service: "api",
      status: "ok",
      version: "0.1.0"
    });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/health/live", {
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });
  });

  it("updates user preferences through the settings API", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          aiMemoryEnabled: false,
          ambientAudioEnabled: false,
          backgroundMusicEnabled: false,
          cameraEffectsEnabled: false,
          createdAt: "2026-07-20T00:00:00Z",
          defaultInterfaceMode: "command",
          id: "22222222-2222-4222-8222-222222222222",
          locale: "en-US",
          performancePreset: "automatic",
          productAnalyticsEnabled: true,
          reducedMotion: true,
          theme: "dark",
          timeZone: "UTC",
          updatedAt: "2026-07-20T00:00:00Z"
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.settings.updatePreferences({
        productAnalyticsEnabled: true,
        reducedMotion: true,
        theme: "dark",
        timeZone: "UTC"
      })
    ).resolves.toMatchObject({
      productAnalyticsEnabled: true,
      reducedMotion: true,
      theme: "dark"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/settings/preferences", {
      body: JSON.stringify({
        productAnalyticsEnabled: true,
        reducedMotion: true,
        theme: "dark",
        timeZone: "UTC"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });
  });

  it("visits a non-visual world location through the world API", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          createdAt: "2026-07-20T00:00:00Z",
          currentLocationId: "library",
          id: "33333333-3333-4333-8333-333333333333",
          lastVisitedLocationId: "central_plaza",
          preferredNavigationMethod: "command_palette",
          spawnLocationId: "central_plaza",
          tutorialCompleted: false,
          unlockedLocationIds: ["central_plaza", "library"],
          updatedAt: "2026-07-20T00:00:00Z",
          visitedLocationIds: ["central_plaza", "library"],
          worldStateVersion: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.world.visit({ idempotencyKey: "visit-library-1", locationId: "library" })
    ).resolves.toMatchObject({
      currentLocationId: "library",
      lastVisitedLocationId: "central_plaza"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/world/visit", {
      body: JSON.stringify({ idempotencyKey: "visit-library-1", locationId: "library" }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("lists domain events with query parameters", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            {
              createdAt: "2026-07-20T00:00:00Z",
              eventType: "habit.logged",
              id: "44444444-4444-4444-8444-444444444444",
              idempotencyKey: "habit-log-1",
              occurredAt: "2026-07-20T00:00:00Z",
              payload: { habitId: "demo" }
            }
          ],
          limit: 1,
          offset: 0,
          total: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.domainEvents.list({ eventType: "habit.logged", limit: 1, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/domain-events?eventType=habit.logged&limit=1&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("marks notifications as read", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          actionUrl: null,
          body: "Your standalone Aetherium account is ready.",
          createdAt: "2026-07-20T00:00:00Z",
          id: "55555555-5555-4555-8555-555555555555",
          notificationType: "system",
          readAt: "2026-07-20T00:01:00Z",
          severity: "success",
          title: "Welcome to Aetherium"
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.notifications.markRead("55555555-5555-4555-8555-555555555555")
    ).resolves.toMatchObject({
      readAt: "2026-07-20T00:01:00Z"
    });
  });

  it("lists audit logs with pagination", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            {
              action: "user.registered",
              createdAt: "2026-07-20T00:00:00Z",
              entityId: "11111111-1111-4111-8111-111111111111",
              entityType: "user",
              id: "66666666-6666-4666-8666-666666666666",
              metadata: { source: "auth" }
            }
          ],
          limit: 20,
          offset: 0,
          total: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.auditLogs.list({ limit: 20, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/audit-logs?limit=20&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("initiates and completes file uploads through the file vault API", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      if (requestUrl(input).endsWith("/api/v1/files/uploads")) {
        return Promise.resolve(
          jsonResponse(
            {
              contentType: "application/pdf",
              createdAt: "2026-07-20T00:00:00Z",
              expiresAt: "2026-07-20T00:15:00Z",
              fileName: "notes.pdf",
              id: "88888888-8888-4888-8888-888888888888",
              sanitizedFileName: "notes.pdf",
              sizeBytes: 1024,
              status: "pending",
              uploadHeaders: { "Content-Type": "application/pdf" },
              uploadMethod: "PUT",
              uploadUrl: "https://storage.test/aetherium-private-files/notes.pdf"
            },
            201
          )
        );
      }

      return Promise.resolve(jsonResponse(vaultFile, 201));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.files.createUpload({
        contentType: "application/pdf",
        fileName: "notes.pdf",
        idempotencyKey: "upload-notes",
        sizeBytes: 1024
      })
    ).resolves.toMatchObject({ status: "pending" });
    await expect(
      client.files.completeUpload("88888888-8888-4888-8888-888888888888", {
        displayName: "Lecture notes",
        idempotencyKey: "complete-notes"
      })
    ).resolves.toMatchObject({ displayName: "Lecture notes" });

    expect(fetcher).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/files/uploads", {
      body: JSON.stringify({
        contentType: "application/pdf",
        fileName: "notes.pdf",
        idempotencyKey: "upload-notes",
        sizeBytes: 1024
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/files/uploads/88888888-8888-4888-8888-888888888888/complete",
      {
        body: JSON.stringify({
          displayName: "Lecture notes",
          idempotencyKey: "complete-notes"
        }),
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
  });

  it("lists files and requests download URLs", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      if (requestUrl(input).includes("/download")) {
        return Promise.resolve(
          jsonResponse({
            downloadHeaders: {},
            downloadMethod: "GET",
            downloadUrl: "https://storage.test/download",
            expiresAt: "2026-07-20T00:05:00Z",
            fileId: vaultFile.id
          })
        );
      }

      return Promise.resolve(
        jsonResponse({
          items: [vaultFile],
          limit: 10,
          offset: 0,
          total: 1
        })
      );
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.files.list({
        favoriteOnly: true,
        includeDeleted: false,
        limit: 10,
        offset: 0,
        query: "notes"
      })
    ).resolves.toMatchObject({ total: 1 });
    await expect(client.files.download(vaultFile.id)).resolves.toMatchObject({
      downloadMethod: "GET"
    });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/files?favoriteOnly=true&includeDeleted=false&limit=10&offset=0&query=notes",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("organizes vault files with collections, tags, and favorites", async () => {
    const collection = {
      createdAt: "2026-07-20T00:00:00Z",
      description: null,
      id: "99999999-9999-4999-8999-999999999999",
      name: "Class Notes",
      updatedAt: "2026-07-20T00:00:00Z"
    };
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/files/collections")) {
        return Promise.resolve(jsonResponse(collection, 201));
      }
      if (url.endsWith("/api/v1/files/tags")) {
        return Promise.resolve(
          jsonResponse({
            items: [
              {
                color: "#8fd1c7",
                createdAt: "2026-07-20T00:00:00Z",
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                name: "Research"
              }
            ],
            limit: 20,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(
        jsonResponse({
          ...vaultFile,
          collectionIds: [collection.id],
          isFavorite: true,
          tags: [
            {
              color: "#8fd1c7",
              createdAt: "2026-07-20T00:00:00Z",
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              name: "Research"
            }
          ]
        })
      );
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.files.createCollection({ name: "Class Notes" })).resolves.toMatchObject({
      name: "Class Notes"
    });
    await expect(client.files.favorite(vaultFile.id)).resolves.toMatchObject({ isFavorite: true });
    await expect(
      client.files.addTag(vaultFile.id, { color: "#8fd1c7", name: "Research" })
    ).resolves.toMatchObject({ tags: [{ name: "Research" }] });
    await expect(client.files.listTags()).resolves.toMatchObject({ total: 1 });
    await expect(
      client.files.addFileToCollection(collection.id, { fileId: vaultFile.id })
    ).resolves.toMatchObject({ collectionIds: [collection.id] });
  });

  it("tracks file processing jobs and chunks", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url.includes("/chunks")) {
        return Promise.resolve(
          jsonResponse({
            items: [fileChunk],
            limit: 20,
            offset: 0,
            total: 1
          })
        );
      }
      if (url.includes("/processing-jobs")) {
        if (init?.method === "POST") {
          return Promise.resolve(jsonResponse(processingJob, 200));
        }
        return Promise.resolve(
          jsonResponse({
            items: [processingJob],
            limit: 20,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(jsonResponse(vaultFile));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.files.listProcessingJobs()).resolves.toMatchObject({ total: 1 });
    await expect(client.files.listFileProcessingJobs(vaultFile.id)).resolves.toMatchObject({
      total: 1
    });
    await expect(client.files.queueProcessing(vaultFile.id)).resolves.toMatchObject({
      status: "queued"
    });
    await expect(client.files.retryProcessingJob(processingJob.id)).resolves.toMatchObject({
      status: "queued"
    });
    await expect(client.files.listChunks(vaultFile.id)).resolves.toMatchObject({ total: 1 });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/files/processing-jobs",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("runs global search and lists recent searches", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/search/recent?limit=5&offset=0")) {
        return Promise.resolve(
          jsonResponse({
            items: [
              {
                createdAt: "2026-07-20T00:00:00Z",
                entityTypes: ["file", "file_chunk"],
                filters: { mode: "hybrid", sort: "relevance" },
                id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                query: "alpha",
                resultCount: 1
              }
            ],
            limit: 5,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(
        jsonResponse({
          items: [searchResult],
          limit: 10,
          mode: "hybrid",
          offset: 0,
          query: "alpha",
          semanticEnabled: false,
          total: 1
        })
      );
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.search.run({
        entityTypes: ["file", "file_chunk"],
        limit: 10,
        query: "alpha"
      })
    ).resolves.toMatchObject({ total: 1 });
    await expect(client.search.recent({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/search", {
      body: JSON.stringify({
        entityTypes: ["file", "file_chunk"],
        limit: 10,
        query: "alpha"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("uses provider-neutral AI gateway endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/ai/providers")) {
        return Promise.resolve(jsonResponse({ items: [aiProvider] }));
      }
      if (url.endsWith("/api/v1/ai/consent")) {
        return Promise.resolve(jsonResponse({ items: [aiConsentPolicy] }));
      }
      if (url.endsWith("/api/v1/ai/consent/general_chat")) {
        return Promise.resolve(
          jsonResponse({ ...aiConsentPolicy, externalProvidersAllowed: true })
        );
      }
      if (url.endsWith("/api/v1/ai/model-configs")) {
        return Promise.resolve(jsonResponse({ items: [aiModelConfiguration] }));
      }
      if (url.endsWith("/api/v1/ai/model-configs/general_chat")) {
        return Promise.resolve(jsonResponse({ ...aiModelConfiguration, maxOutputTokens: 256 }));
      }
      if (url.endsWith("/api/v1/ai/chat/completions")) {
        return Promise.resolve(jsonResponse(aiChatCompletion));
      }
      if (url.endsWith("/api/v1/ai/chat/completions/stream")) {
        return Promise.resolve(new Response("event: done\ndata: [DONE]\n\n", { status: 200 }));
      }
      if (url.endsWith("/api/v1/ai/embeddings")) {
        return Promise.resolve(jsonResponse(aiEmbeddingResponse));
      }
      if (url.endsWith("/api/v1/ai/usage?feature=general_chat&limit=5&offset=0")) {
        return Promise.resolve(
          jsonResponse({
            items: [aiUsageRecord],
            limit: 5,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(jsonResponse({ items: [] }));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.ai.listProviders()).resolves.toMatchObject({ items: [aiProvider] });
    await expect(client.ai.listConsent()).resolves.toMatchObject({ items: [aiConsentPolicy] });
    await expect(
      client.ai.updateConsent("general_chat", { externalProvidersAllowed: true })
    ).resolves.toMatchObject({ externalProvidersAllowed: true });
    await expect(client.ai.listModelConfigs()).resolves.toMatchObject({
      items: [aiModelConfiguration]
    });
    await expect(
      client.ai.updateModelConfig("general_chat", { maxOutputTokens: 256 })
    ).resolves.toMatchObject({ maxOutputTokens: 256 });
    await expect(
      client.ai.completeChat({
        messages: [{ content: "Explain indexes.", role: "user" }]
      })
    ).resolves.toMatchObject({ requestId: "ai_test" });
    await expect(
      client.ai.streamChat({ messages: [{ content: "Stream.", role: "user" }] })
    ).resolves.toBeInstanceOf(Response);
    await expect(client.ai.createEmbeddings({ input: ["indexes"] })).resolves.toMatchObject({
      data: [{ index: 0 }]
    });
    await expect(
      client.ai.listUsage({ feature: "general_chat", limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/ai/chat/completions", {
      body: JSON.stringify({
        messages: [{ content: "Explain indexes.", role: "user" }]
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("uses AI mentor and conversation endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url === "http://localhost:8000/api/v1/mentors?includeArchived=true") {
        return Promise.resolve(jsonResponse({ items: [mentor] }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/${mentor.id}`) {
        return Promise.resolve(jsonResponse({ ...mentor, name: "Lyra Prime" }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/${mentor.id}/permissions`) {
        return Promise.resolve(jsonResponse({ ...mentorPermission, allowConversations: true }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/${mentor.id}/archive`) {
        return Promise.resolve(jsonResponse({ ...mentor, archivedAt: "2026-07-20T00:10:00Z" }));
      }
      if (url === "http://localhost:8000/api/v1/mentors") {
        return Promise.resolve(jsonResponse({ ...mentor, isDefault: false, slug: "custom-lyra" }));
      }
      if (
        url ===
        "http://localhost:8000/api/v1/mentors/conversations?includeArchived=true&limit=5&offset=0"
      ) {
        return Promise.resolve(
          jsonResponse({ items: [conversation], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/mentors/conversations") {
        return Promise.resolve(jsonResponse(conversation, 201));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}`) {
        if (init?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 204 }));
        }
        return Promise.resolve(jsonResponse({ ...conversation, title: "Renamed review" }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/archive`) {
        return Promise.resolve(jsonResponse({ ...conversation, status: "archived" }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/memory`) {
        return Promise.resolve(
          jsonResponse({
            ...conversationMemorySettings,
            memoryEnabled: true,
            memoryPolicy: "persistent"
          })
        );
      }
      if (
        url ===
        `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages?limit=10&offset=0`
      ) {
        return Promise.resolve(
          jsonResponse({ items: [userMessage, assistantMessage], limit: 10, offset: 0, total: 2 })
        );
      }
      if (
        url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages`
      ) {
        return Promise.resolve(jsonResponse(messageSendResponse));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages/${userMessage.id}`
      ) {
        return Promise.resolve(jsonResponse(messageSendResponse));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages/${assistantMessage.id}/regenerate`
      ) {
        return Promise.resolve(jsonResponse({ ...messageSendResponse, userMessage: null }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/stop`) {
        return Promise.resolve(jsonResponse({ reason: "stopped", stopped: true }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/export`) {
        return Promise.resolve(
          jsonResponse({
            conversation,
            exportedAt: "2026-07-20T00:05:00Z",
            mentor,
            messages: [{ ...userMessage, sources: [] }]
          })
        );
      }
      return Promise.resolve(jsonResponse({ items: [] }));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.mentors.list({ includeArchived: true })).resolves.toMatchObject({
      items: [mentor]
    });
    await expect(
      client.mentors.create({
        description: "General learning mentor.",
        fictionalIdentity: "A fictional AI mentor.",
        name: "Lyra",
        systemInstructions: "Support practical learning without changing user data.",
        tone: "calm"
      })
    ).resolves.toMatchObject({ isDefault: false });
    await expect(client.mentors.get(mentor.id)).resolves.toMatchObject({ name: "Lyra Prime" });
    await expect(client.mentors.update(mentor.id, { name: "Lyra Prime" })).resolves.toMatchObject({
      name: "Lyra Prime"
    });
    await expect(client.mentors.getPermissions(mentor.id)).resolves.toMatchObject({
      allowConversations: true
    });
    await expect(
      client.mentors.updatePermissions(mentor.id, { allowConversations: true })
    ).resolves.toMatchObject({ allowConversations: true });
    await expect(client.mentors.archive(mentor.id)).resolves.toMatchObject({
      archivedAt: "2026-07-20T00:10:00Z"
    });
    await expect(
      client.mentors.listConversations({ includeArchived: true, limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.mentors.createConversation({ mentorId: mentor.id, title: "Index review" })
    ).resolves.toMatchObject({ title: "Index review" });
    await expect(client.mentors.getConversation(conversation.id)).resolves.toMatchObject({
      title: "Renamed review"
    });
    await expect(
      client.mentors.updateConversation(conversation.id, { title: "Renamed review" })
    ).resolves.toMatchObject({ title: "Renamed review" });
    await expect(client.mentors.archiveConversation(conversation.id)).resolves.toMatchObject({
      status: "archived"
    });
    await expect(
      client.mentors.updateMemory(conversation.id, {
        memoryEnabled: true,
        memoryPolicy: "persistent"
      })
    ).resolves.toMatchObject({ memoryEnabled: true });
    await expect(
      client.mentors.listMessages(conversation.id, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ total: 2 });
    await expect(
      client.mentors.sendMessage(conversation.id, { content: "Explain indexes." })
    ).resolves.toMatchObject({ assistantMessage });
    await expect(
      client.mentors.editAndResendMessage(conversation.id, userMessage.id, {
        content: "Explain indexes again."
      })
    ).resolves.toMatchObject({ userMessage });
    await expect(
      client.mentors.regenerateMessage(conversation.id, assistantMessage.id)
    ).resolves.toMatchObject({ userMessage: null });
    await expect(client.mentors.stopGeneration(conversation.id)).resolves.toMatchObject({
      stopped: true
    });
    await expect(client.mentors.exportConversation(conversation.id)).resolves.toMatchObject({
      messages: [{ sources: [] }]
    });
    await expect(client.mentors.deleteConversation(conversation.id)).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/mentors/conversations?includeArchived=true&limit=5&offset=0",
      {
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );
  });

  it("posts registration payloads with credentials", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            user: {
              createdAt: "2026-07-17T00:00:00Z",
              displayName: "Sai",
              email: "sai@example.com",
              id: "11111111-1111-4111-8111-111111111111",
              isEmailVerified: false,
              lastLoginAt: null
            }
          }),
          { status: 201 }
        )
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await client.auth.register({
      displayName: "Sai",
      email: "sai@example.com",
      password: "StrongPass123!"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/register", {
      body: JSON.stringify({
        displayName: "Sai",
        email: "sai@example.com",
        password: "StrongPass123!"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("throws typed API errors", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              code: "invalid_credentials",
              message: "Email or password is incorrect."
            }
          }),
          { status: 401 }
        )
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.auth.login({ email: "sai@example.com", password: "WrongPass123!" })
    ).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401
    });
  });
});
