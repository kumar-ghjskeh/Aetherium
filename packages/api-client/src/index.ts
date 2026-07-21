import type {
  ApiErrorBody,
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIConsentPolicyPage,
  AIConsentPolicyUpdate,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIFeature,
  AIModelConfigurationPage,
  AIModelConfigurationUpdate,
  AIProviderPage,
  AIUsageQuery,
  AIUsageRecordPage,
  AuditLogPage,
  AuthResponse,
  Collection,
  CollectionCreateRequest,
  CollectionItemRequest,
  CollectionPage,
  Conversation,
  ConversationCreateRequest,
  ConversationExport,
  ConversationMemorySettings,
  ConversationMemorySettingsUpdate,
  ConversationPage,
  ConversationUpdateRequest,
  DownloadUrlResponse,
  DomainEvent,
  DomainEventCreateRequest,
  DomainEventListQuery,
  DomainEventPage,
  FileChunkPage,
  FileListQuery,
  FilePage,
  FileTagCreateRequest,
  FileUpdateRequest,
  HealthCheckResponse,
  LoginRequest,
  Mentor,
  MentorCreateRequest,
  MentorPage,
  MentorPermission,
  MentorPermissionUpdate,
  MentorUpdateRequest,
  MessagePage,
  MessageSendRequest,
  MessageSendResponse,
  Notification,
  NotificationListQuery,
  NotificationPage,
  PaginationQuery,
  ProcessingJobPage,
  ProcessingJob,
  PublicUser,
  RecentSearchPage,
  RegisterRequest,
  SearchRequest,
  SearchResponse,
  StopGenerationResponse,
  TagPage,
  UploadCompleteRequest,
  UploadInitiateRequest,
  UploadResponse,
  UserPreferences,
  UserPreferencesUpdate,
  VaultFile,
  WorldProfile,
  WorldProfileUpdate,
  WorldVisitRequest
} from "@aetherium/shared-types";
import {
  aiChatCompletionResponseSchema,
  aiConsentPolicyPageSchema,
  aiConsentPolicySchema,
  aiEmbeddingResponseSchema,
  aiModelConfigurationPageSchema,
  aiModelConfigurationSchema,
  aiProviderPageSchema,
  aiUsageRecordPageSchema,
  apiErrorBodySchema,
  auditLogPageSchema,
  authResponseSchema,
  collectionPageSchema,
  collectionSchema,
  conversationExportSchema,
  conversationMemorySettingsSchema,
  conversationPageSchema,
  conversationSchema,
  downloadUrlResponseSchema,
  domainEventPageSchema,
  domainEventSchema,
  fileChunkPageSchema,
  filePageSchema,
  tagPageSchema,
  healthCheckResponseSchema,
  mentorPageSchema,
  mentorPermissionSchema,
  mentorSchema,
  messagePageSchema,
  messageSendResponseSchema,
  notificationSchema,
  notificationPageSchema,
  processingJobPageSchema,
  processingJobSchema,
  publicUserSchema,
  recentSearchPageSchema,
  searchResponseSchema,
  stopGenerationResponseSchema,
  uploadResponseSchema,
  userPreferencesSchema,
  vaultFileSchema,
  worldProfileSchema
} from "@aetherium/validation";

export interface AetheriumApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export interface AetheriumApiClient {
  ai: {
    completeChat: (payload: AIChatCompletionRequest) => Promise<AIChatCompletionResponse>;
    createEmbeddings: (payload: AIEmbeddingRequest) => Promise<AIEmbeddingResponse>;
    listConsent: () => Promise<AIConsentPolicyPage>;
    listModelConfigs: () => Promise<AIModelConfigurationPage>;
    listProviders: () => Promise<AIProviderPage>;
    listUsage: (query?: AIUsageQuery) => Promise<AIUsageRecordPage>;
    streamChat: (payload: AIChatCompletionRequest) => Promise<Response>;
    updateConsent: (
      feature: AIFeature,
      payload: AIConsentPolicyUpdate
    ) => Promise<AIConsentPolicyPage["items"][number]>;
    updateModelConfig: (
      feature: AIFeature,
      payload: AIModelConfigurationUpdate
    ) => Promise<AIModelConfigurationPage["items"][number]>;
  };
  auditLogs: {
    list: (query?: { limit?: number; offset?: number }) => Promise<AuditLogPage>;
  };
  auth: {
    login: (payload: LoginRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    me: () => Promise<PublicUser>;
    register: (payload: RegisterRequest) => Promise<AuthResponse>;
  };
  domainEvents: {
    create: (payload: DomainEventCreateRequest) => Promise<DomainEvent>;
    list: (query?: DomainEventListQuery) => Promise<DomainEventPage>;
  };
  files: {
    addFileToCollection: (
      collectionId: string,
      payload: CollectionItemRequest
    ) => Promise<VaultFile>;
    addTag: (fileId: string, payload: FileTagCreateRequest) => Promise<VaultFile>;
    completeUpload: (uploadId: string, payload: UploadCompleteRequest) => Promise<VaultFile>;
    createCollection: (payload: CollectionCreateRequest) => Promise<Collection>;
    createUpload: (payload: UploadInitiateRequest) => Promise<UploadResponse>;
    download: (fileId: string) => Promise<DownloadUrlResponse>;
    favorite: (fileId: string) => Promise<VaultFile>;
    get: (fileId: string) => Promise<VaultFile>;
    list: (query?: FileListQuery) => Promise<FilePage>;
    listChunks: (fileId: string, query?: PaginationQuery) => Promise<FileChunkPage>;
    listCollections: (query?: PaginationQuery) => Promise<CollectionPage>;
    listFileProcessingJobs: (fileId: string, query?: PaginationQuery) => Promise<ProcessingJobPage>;
    listProcessingJobs: (query?: PaginationQuery) => Promise<ProcessingJobPage>;
    listTags: (query?: PaginationQuery) => Promise<TagPage>;
    permanentDelete: (fileId: string) => Promise<void>;
    queueProcessing: (fileId: string) => Promise<ProcessingJob>;
    removeFileFromCollection: (collectionId: string, fileId: string) => Promise<VaultFile>;
    removeTag: (fileId: string, tagId: string) => Promise<VaultFile>;
    restore: (fileId: string) => Promise<VaultFile>;
    retryProcessingJob: (jobId: string) => Promise<ProcessingJob>;
    softDelete: (fileId: string) => Promise<VaultFile>;
    unfavorite: (fileId: string) => Promise<VaultFile>;
    update: (fileId: string, payload: FileUpdateRequest) => Promise<VaultFile>;
  };
  health: {
    live: () => Promise<HealthCheckResponse>;
    ready: () => Promise<HealthCheckResponse>;
  };
  mentors: {
    archive: (mentorId: string) => Promise<Mentor>;
    archiveConversation: (conversationId: string) => Promise<Conversation>;
    create: (payload: MentorCreateRequest) => Promise<Mentor>;
    createConversation: (payload: ConversationCreateRequest) => Promise<Conversation>;
    deleteConversation: (conversationId: string) => Promise<void>;
    editAndResendMessage: (
      conversationId: string,
      messageId: string,
      payload: MessageSendRequest
    ) => Promise<MessageSendResponse>;
    exportConversation: (conversationId: string) => Promise<ConversationExport>;
    get: (mentorId: string) => Promise<Mentor>;
    getConversation: (conversationId: string) => Promise<Conversation>;
    getPermissions: (mentorId: string) => Promise<MentorPermission>;
    list: (query?: { includeArchived?: boolean }) => Promise<MentorPage>;
    listConversations: (
      query?: PaginationQuery & { includeArchived?: boolean }
    ) => Promise<ConversationPage>;
    listMessages: (conversationId: string, query?: PaginationQuery) => Promise<MessagePage>;
    regenerateMessage: (conversationId: string, messageId: string) => Promise<MessageSendResponse>;
    sendMessage: (
      conversationId: string,
      payload: MessageSendRequest
    ) => Promise<MessageSendResponse>;
    stopGeneration: (conversationId: string) => Promise<StopGenerationResponse>;
    update: (mentorId: string, payload: MentorUpdateRequest) => Promise<Mentor>;
    updateConversation: (
      conversationId: string,
      payload: ConversationUpdateRequest
    ) => Promise<Conversation>;
    updateMemory: (
      conversationId: string,
      payload: ConversationMemorySettingsUpdate
    ) => Promise<ConversationMemorySettings>;
    updatePermissions: (
      mentorId: string,
      payload: MentorPermissionUpdate
    ) => Promise<MentorPermission>;
  };
  notifications: {
    list: (query?: NotificationListQuery) => Promise<NotificationPage>;
    markRead: (notificationId: string) => Promise<Notification>;
  };
  search: {
    recent: (query?: PaginationQuery) => Promise<RecentSearchPage>;
    run: (payload: SearchRequest) => Promise<SearchResponse>;
  };
  settings: {
    getPreferences: () => Promise<UserPreferences>;
    updatePreferences: (payload: UserPreferencesUpdate) => Promise<UserPreferences>;
  };
  world: {
    getProfile: () => Promise<WorldProfile>;
    updateProfile: (payload: WorldProfileUpdate) => Promise<WorldProfile>;
    visit: (payload: WorldVisitRequest) => Promise<WorldProfile>;
  };
}

export class AetheriumApiError extends Error {
  readonly body: ApiErrorBody;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "AetheriumApiError";
    this.status = status;
    this.body = body;
    this.code = body.error.code;
    if (body.error.fields) {
      this.fields = body.error.fields;
    }
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

type QueryValue = boolean | number | string | undefined;

function queryString(entries: ReadonlyArray<readonly [string, QueryValue]>): string {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function paginationQuery(query?: { limit?: number; offset?: number }): string {
  return queryString([
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function domainEventQuery(query?: DomainEventListQuery): string {
  return queryString([
    ["eventType", query?.eventType],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function notificationQuery(query?: NotificationListQuery): string {
  return queryString([
    ["unreadOnly", query?.unreadOnly],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function aiUsageQuery(query?: AIUsageQuery): string {
  return queryString([
    ["feature", query?.feature],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function mentorListQuery(query?: { includeArchived?: boolean }): string {
  return queryString([["includeArchived", query?.includeArchived]]);
}

function conversationListQuery(query?: PaginationQuery & { includeArchived?: boolean }): string {
  return queryString([
    ["includeArchived", query?.includeArchived],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function fileListQuery(query?: FileListQuery): string {
  return queryString([
    ["collectionId", query?.collectionId],
    ["favoriteOnly", query?.favoriteOnly],
    ["includeDeleted", query?.includeDeleted],
    ["limit", query?.limit],
    ["offset", query?.offset],
    ["query", query?.query],
    ["tagId", query?.tagId]
  ]);
}

async function parseErrorResponse(response: Response): Promise<ApiErrorBody> {
  try {
    const payload: unknown = await response.json();
    return apiErrorBodySchema.parse(payload);
  } catch {
    return {
      error: {
        code: "request_failed",
        message: `Aetherium API request failed with status ${response.status}`
      }
    };
  }
}

async function requestJson(
  fetcher: typeof fetch,
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const response = await fetcher(`${normalizeBaseUrl(baseUrl)}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new AetheriumApiError(response.status, await parseErrorResponse(response));
  }

  if (response.status === 204) {
    return undefined;
  }

  return (await response.json()) as unknown;
}

export function createAetheriumApiClient(options: AetheriumApiClientOptions): AetheriumApiClient {
  const fetcher = options.fetcher ?? fetch;

  return {
    ai: {
      completeChat: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/ai/chat/completions",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return aiChatCompletionResponseSchema.parse(response);
      },
      createEmbeddings: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/embeddings", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return aiEmbeddingResponseSchema.parse(response);
      },
      listConsent: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/consent");
        return aiConsentPolicyPageSchema.parse(response);
      },
      listModelConfigs: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/model-configs");
        return aiModelConfigurationPageSchema.parse(response);
      },
      listProviders: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/providers");
        return aiProviderPageSchema.parse(response);
      },
      listUsage: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/ai/usage${aiUsageQuery(query)}`
        );
        return aiUsageRecordPageSchema.parse(response);
      },
      streamChat: async (payload) => {
        const response = await fetcher(
          `${normalizeBaseUrl(options.baseUrl)}/api/v1/ai/chat/completions/stream`,
          {
            body: JSON.stringify(payload),
            credentials: "include",
            headers: {
              Accept: "text/event-stream",
              "Content-Type": "application/json"
            },
            method: "POST"
          }
        );
        if (!response.ok) {
          throw new AetheriumApiError(response.status, await parseErrorResponse(response));
        }
        return response;
      },
      updateConsent: async (feature, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/ai/consent/${feature}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return aiConsentPolicySchema.parse(response);
      },
      updateModelConfig: async (feature, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/ai/model-configs/${feature}`,
          {
            body: JSON.stringify(payload),
            method: "PUT"
          }
        );
        return aiModelConfigurationSchema.parse(response);
      }
    },
    auditLogs: {
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/audit-logs${paginationQuery(query)}`
        );
        return auditLogPageSchema.parse(response);
      }
    },
    auth: {
      login: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/auth/login", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return authResponseSchema.parse(response);
      },
      logout: async () => {
        await requestJson(fetcher, options.baseUrl, "/api/v1/auth/logout", {
          method: "POST"
        });
      },
      me: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/auth/me");
        return publicUserSchema.parse(response);
      },
      register: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/auth/register", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return authResponseSchema.parse(response);
      }
    },
    domainEvents: {
      create: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/domain-events", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return domainEventSchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/domain-events${domainEventQuery(query)}`
        );
        return domainEventPageSchema.parse(response);
      }
    },
    files: {
      addFileToCollection: async (collectionId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/collections/${collectionId}/items`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return vaultFileSchema.parse(response);
      },
      addTag: async (fileId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/tags`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return vaultFileSchema.parse(response);
      },
      completeUpload: async (uploadId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/uploads/${uploadId}/complete`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return vaultFileSchema.parse(response);
      },
      createCollection: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/files/collections", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return collectionSchema.parse(response);
      },
      createUpload: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/files/uploads", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return uploadResponseSchema.parse(response);
      },
      download: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/download`
        );
        return downloadUrlResponseSchema.parse(response);
      },
      favorite: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/favorite`,
          { method: "POST" }
        );
        return vaultFileSchema.parse(response);
      },
      get: async (fileId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}`);
        return vaultFileSchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files${fileListQuery(query)}`
        );
        return filePageSchema.parse(response);
      },
      listChunks: async (fileId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/chunks${paginationQuery(query)}`
        );
        return fileChunkPageSchema.parse(response);
      },
      listCollections: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/collections${paginationQuery(query)}`
        );
        return collectionPageSchema.parse(response);
      },
      listFileProcessingJobs: async (fileId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/processing-jobs${paginationQuery(query)}`
        );
        return processingJobPageSchema.parse(response);
      },
      listProcessingJobs: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/processing-jobs${paginationQuery(query)}`
        );
        return processingJobPageSchema.parse(response);
      },
      listTags: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/tags${paginationQuery(query)}`
        );
        return tagPageSchema.parse(response);
      },
      permanentDelete: async (fileId) => {
        await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}/permanent`, {
          method: "DELETE"
        });
      },
      queueProcessing: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/processing-jobs`,
          { method: "POST" }
        );
        return processingJobSchema.parse(response);
      },
      removeFileFromCollection: async (collectionId, fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/collections/${collectionId}/items/${fileId}`,
          { method: "DELETE" }
        );
        return vaultFileSchema.parse(response);
      },
      removeTag: async (fileId, tagId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/tags/${tagId}`,
          { method: "DELETE" }
        );
        return vaultFileSchema.parse(response);
      },
      retryProcessingJob: async (jobId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/processing-jobs/${jobId}/retry`,
          { method: "POST" }
        );
        return processingJobSchema.parse(response);
      },
      restore: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/restore`,
          { method: "POST" }
        );
        return vaultFileSchema.parse(response);
      },
      softDelete: async (fileId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}`, {
          method: "DELETE"
        });
        return vaultFileSchema.parse(response);
      },
      unfavorite: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/favorite`,
          { method: "DELETE" }
        );
        return vaultFileSchema.parse(response);
      },
      update: async (fileId, payload) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}`, {
          body: JSON.stringify(payload),
          method: "PATCH"
        });
        return vaultFileSchema.parse(response);
      }
    },
    health: {
      live: async () => {
        const payload = await requestJson(fetcher, options.baseUrl, "/api/v1/health/live");
        return healthCheckResponseSchema.parse(payload);
      },
      ready: async () => {
        const payload = await requestJson(fetcher, options.baseUrl, "/api/v1/health/ready");
        return healthCheckResponseSchema.parse(payload);
      }
    },
    mentors: {
      archive: async (mentorId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}/archive`,
          { method: "POST" }
        );
        return mentorSchema.parse(response);
      },
      archiveConversation: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/archive`,
          { method: "POST" }
        );
        return conversationSchema.parse(response);
      },
      create: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/mentors", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return mentorSchema.parse(response);
      },
      createConversation: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/mentors/conversations",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return conversationSchema.parse(response);
      },
      deleteConversation: async (conversationId) => {
        await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}`,
          { method: "DELETE" }
        );
      },
      editAndResendMessage: async (conversationId, messageId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages/${messageId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return messageSendResponseSchema.parse(response);
      },
      exportConversation: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/export`
        );
        return conversationExportSchema.parse(response);
      },
      get: async (mentorId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/mentors/${mentorId}`);
        return mentorSchema.parse(response);
      },
      getConversation: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}`
        );
        return conversationSchema.parse(response);
      },
      getPermissions: async (mentorId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}/permissions`
        );
        return mentorPermissionSchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors${mentorListQuery(query)}`
        );
        return mentorPageSchema.parse(response);
      },
      listConversations: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations${conversationListQuery(query)}`
        );
        return conversationPageSchema.parse(response);
      },
      listMessages: async (conversationId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages${paginationQuery(query)}`
        );
        return messagePageSchema.parse(response);
      },
      regenerateMessage: async (conversationId, messageId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages/${messageId}/regenerate`,
          { method: "POST" }
        );
        return messageSendResponseSchema.parse(response);
      },
      sendMessage: async (conversationId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return messageSendResponseSchema.parse(response);
      },
      stopGeneration: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/stop`,
          { method: "POST" }
        );
        return stopGenerationResponseSchema.parse(response);
      },
      update: async (mentorId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return mentorSchema.parse(response);
      },
      updateConversation: async (conversationId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return conversationSchema.parse(response);
      },
      updateMemory: async (conversationId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/memory`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return conversationMemorySettingsSchema.parse(response);
      },
      updatePermissions: async (mentorId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}/permissions`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return mentorPermissionSchema.parse(response);
      }
    },
    notifications: {
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/notifications${notificationQuery(query)}`
        );
        return notificationPageSchema.parse(response);
      },
      markRead: async (notificationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/notifications/${notificationId}/read`,
          { method: "POST" }
        );
        return notificationSchema.parse(response);
      }
    },
    search: {
      recent: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/search/recent${paginationQuery(query)}`
        );
        return recentSearchPageSchema.parse(response);
      },
      run: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/search", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return searchResponseSchema.parse(response);
      }
    },
    settings: {
      getPreferences: async () => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/settings/preferences"
        );
        return userPreferencesSchema.parse(response);
      },
      updatePreferences: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/settings/preferences",
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return userPreferencesSchema.parse(response);
      }
    },
    world: {
      getProfile: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/world/profile");
        return worldProfileSchema.parse(response);
      },
      updateProfile: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/world/profile", {
          body: JSON.stringify(payload),
          method: "PATCH"
        });
        return worldProfileSchema.parse(response);
      },
      visit: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/world/visit", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return worldProfileSchema.parse(response);
      }
    }
  };
}
