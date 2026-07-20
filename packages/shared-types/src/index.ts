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

export type Theme = "system" | "light" | "dark";

export type DefaultInterfaceMode = "command" | "world";

export type PerformancePreset = "automatic" | "low" | "balanced" | "high";

export type NavigationMethod = "command_palette" | "fast_travel" | "guided" | "direct";

export type DomainEventType =
  | "user.registered"
  | "user.preference_updated"
  | "file.uploaded"
  | "file.ingested"
  | "habit.logged"
  | "lesson.completed"
  | "quiz.completed"
  | "project.completed"
  | "achievement.unlocked"
  | "world.location_visited";

export type NotificationType = "system" | "security" | "processing" | "review" | "ai" | "project";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface UserPreferences {
  id: string;
  theme: Theme;
  defaultInterfaceMode: DefaultInterfaceMode;
  reducedMotion: boolean;
  backgroundMusicEnabled: boolean;
  ambientAudioEnabled: boolean;
  cameraEffectsEnabled: boolean;
  performancePreset: PerformancePreset;
  timeZone: string;
  locale: string;
  aiMemoryEnabled: boolean;
  productAnalyticsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserPreferencesUpdate = Partial<
  Pick<
    UserPreferences,
    | "aiMemoryEnabled"
    | "ambientAudioEnabled"
    | "backgroundMusicEnabled"
    | "cameraEffectsEnabled"
    | "defaultInterfaceMode"
    | "locale"
    | "performancePreset"
    | "productAnalyticsEnabled"
    | "reducedMotion"
    | "theme"
    | "timeZone"
  >
>;

export interface WorldProfile {
  id: string;
  currentLocationId: string;
  lastVisitedLocationId: string | null;
  preferredNavigationMethod: NavigationMethod;
  tutorialCompleted: boolean;
  worldStateVersion: number;
  spawnLocationId: string;
  visitedLocationIds: string[];
  unlockedLocationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type WorldProfileUpdate = Partial<
  Pick<WorldProfile, "preferredNavigationMethod" | "spawnLocationId" | "tutorialCompleted">
>;

export interface WorldVisitRequest {
  locationId: string;
  idempotencyKey: string;
}

export interface DomainEventCreateRequest {
  eventType: DomainEventType;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
}

export interface DomainEvent {
  id: string;
  eventType: DomainEventType;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface DomainEventPage {
  items: DomainEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface Notification {
  id: string;
  notificationType: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: Notification[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface DomainEventListQuery extends PaginationQuery {
  eventType?: DomainEventType;
}

export interface NotificationListQuery extends PaginationQuery {
  unreadOnly?: boolean;
}
