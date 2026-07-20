export type ServiceName = "api" | "web";

export type HealthStatus = "ok" | "degraded";

export interface HealthCheckResponse {
  checks: Record<string, string>;
  service: ServiceName;
  status: HealthStatus;
  version: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string> | undefined;
  };
}
