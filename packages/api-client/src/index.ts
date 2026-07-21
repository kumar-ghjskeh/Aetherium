import type {
  ApiErrorBody,
  AuditLogPage,
  AuthResponse,
  Collection,
  CollectionCreateRequest,
  CollectionItemRequest,
  CollectionPage,
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
  Notification,
  NotificationListQuery,
  NotificationPage,
  PaginationQuery,
  ProcessingJobPage,
  ProcessingJob,
  PublicUser,
  RegisterRequest,
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
  apiErrorBodySchema,
  auditLogPageSchema,
  authResponseSchema,
  collectionPageSchema,
  collectionSchema,
  downloadUrlResponseSchema,
  domainEventPageSchema,
  domainEventSchema,
  fileChunkPageSchema,
  filePageSchema,
  tagPageSchema,
  healthCheckResponseSchema,
  notificationSchema,
  notificationPageSchema,
  processingJobPageSchema,
  processingJobSchema,
  publicUserSchema,
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
  notifications: {
    list: (query?: NotificationListQuery) => Promise<NotificationPage>;
    markRead: (notificationId: string) => Promise<Notification>;
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
