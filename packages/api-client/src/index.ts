import type {
  ApiErrorBody,
  AuditLogPage,
  AuthResponse,
  DomainEvent,
  DomainEventCreateRequest,
  DomainEventListQuery,
  DomainEventPage,
  HealthCheckResponse,
  LoginRequest,
  Notification,
  NotificationListQuery,
  NotificationPage,
  PublicUser,
  RegisterRequest,
  UserPreferences,
  UserPreferencesUpdate,
  WorldProfile,
  WorldProfileUpdate,
  WorldVisitRequest
} from "@aetherium/shared-types";
import {
  apiErrorBodySchema,
  auditLogPageSchema,
  authResponseSchema,
  domainEventPageSchema,
  domainEventSchema,
  healthCheckResponseSchema,
  notificationSchema,
  notificationPageSchema,
  publicUserSchema,
  userPreferencesSchema,
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
