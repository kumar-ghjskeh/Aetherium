import type { HealthCheckResponse } from "@aetherium/shared-types";
import { healthCheckResponseSchema } from "@aetherium/validation";

export interface AetheriumApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export interface AetheriumApiClient {
  health: {
    live: () => Promise<HealthCheckResponse>;
    ready: () => Promise<HealthCheckResponse>;
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

async function getJson(fetcher: typeof fetch, baseUrl: string, path: string): Promise<unknown> {
  const response = await fetcher(`${normalizeBaseUrl(baseUrl)}${path}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Aetherium API request failed with status ${response.status}`);
  }

  return response.json();
}

export function createAetheriumApiClient(options: AetheriumApiClientOptions): AetheriumApiClient {
  const fetcher = options.fetcher ?? fetch;

  return {
    health: {
      live: async () => {
        const payload = await getJson(fetcher, options.baseUrl, "/api/v1/health/live");
        return healthCheckResponseSchema.parse(payload);
      },
      ready: async () => {
        const payload = await getJson(fetcher, options.baseUrl, "/api/v1/health/ready");
        return healthCheckResponseSchema.parse(payload);
      }
    }
  };
}
