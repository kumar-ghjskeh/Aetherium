import type {
  ApiErrorBody,
  AuthResponse,
  HealthCheckResponse,
  LoginRequest,
  PublicUser,
  RegisterRequest
} from "@aetherium/shared-types";
import {
  apiErrorBodySchema,
  authResponseSchema,
  healthCheckResponseSchema,
  publicUserSchema
} from "@aetherium/validation";

export interface AetheriumApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export interface AetheriumApiClient {
  auth: {
    login: (payload: LoginRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    me: () => Promise<PublicUser>;
    register: (payload: RegisterRequest) => Promise<AuthResponse>;
  };
  health: {
    live: () => Promise<HealthCheckResponse>;
    ready: () => Promise<HealthCheckResponse>;
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
    health: {
      live: async () => {
        const payload = await requestJson(fetcher, options.baseUrl, "/api/v1/health/live");
        return healthCheckResponseSchema.parse(payload);
      },
      ready: async () => {
        const payload = await requestJson(fetcher, options.baseUrl, "/api/v1/health/ready");
        return healthCheckResponseSchema.parse(payload);
      }
    }
  };
}
