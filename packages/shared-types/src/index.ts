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

export type FileKind =
  "pdf" | "text" | "markdown" | "docx" | "csv" | "json" | "source_code" | "image";

export type FileProcessingStatus = "not_started" | "queued" | "processing" | "ready" | "failed";

export type FileDeletionStatus = "active" | "soft_deleted";

export type UploadStatus = "pending" | "completed" | "aborted" | "expired";

export type MalwareScanStatus = "not_configured" | "pending" | "clean" | "suspicious" | "failed";

export type ProcessingJobStatus = "queued" | "processing" | "completed" | "failed" | "canceled";

export type ProcessingStage =
  | "queued"
  | "validating"
  | "extracting"
  | "chunking"
  | "indexing"
  | "embedding"
  | "ready"
  | "failed"
  | "canceled";

export type ChunkStatus = "ready" | "deleted";

export interface UploadInitiateRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256?: string | undefined;
  idempotencyKey: string;
}

export interface UploadCompleteRequest {
  idempotencyKey: string;
  displayName?: string | undefined;
}

export interface UploadResponse {
  id: string;
  fileName: string;
  sanitizedFileName: string;
  contentType: string;
  sizeBytes: number;
  status: UploadStatus;
  uploadUrl: string;
  uploadMethod: "PUT";
  uploadHeaders: Record<string, string>;
  expiresAt: string;
  createdAt: string;
}

export interface FileTag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface VaultFile {
  id: string;
  displayName: string;
  originalFileName: string;
  sanitizedFileName: string;
  fileExtension: string;
  fileKind: FileKind;
  contentType: string;
  sizeBytes: number;
  processingStatus: FileProcessingStatus;
  deletionStatus: FileDeletionStatus;
  malwareScanStatus: MalwareScanStatus;
  deletedAt: string | null;
  isFavorite: boolean;
  tags: FileTag[];
  collectionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FilePage {
  items: VaultFile[];
  total: number;
  limit: number;
  offset: number;
}

export interface FileListQuery extends PaginationQuery {
  collectionId?: string;
  favoriteOnly?: boolean;
  includeDeleted?: boolean;
  query?: string;
  tagId?: string;
}

export interface FileUpdateRequest {
  displayName: string;
}

export interface DownloadUrlResponse {
  fileId: string;
  downloadUrl: string;
  downloadMethod: "GET";
  downloadHeaders: Record<string, string>;
  expiresAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionPage {
  items: Collection[];
  total: number;
  limit: number;
  offset: number;
}

export interface CollectionCreateRequest {
  name: string;
  description?: string | null | undefined;
}

export interface CollectionItemRequest {
  fileId: string;
}

export interface TagPage {
  items: FileTag[];
  total: number;
  limit: number;
  offset: number;
}

export interface FileTagCreateRequest {
  name: string;
  color?: string | null | undefined;
}

export interface ProcessingJob {
  id: string;
  fileId: string;
  status: ProcessingJobStatus;
  stage: ProcessingStage;
  attemptCount: number;
  maxAttempts: number;
  failureCount: number;
  lockedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  nextAttemptAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingJobPage {
  items: ProcessingJob[];
  total: number;
  limit: number;
  offset: number;
}

export interface FileChunk {
  id: string;
  fileId: string;
  processingJobId: string;
  sequenceNumber: number;
  chunkText: string;
  tokenEstimate: number;
  pageNumber: number | null;
  sectionLabel: string | null;
  status: ChunkStatus;
  sourceMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FileChunkPage {
  items: FileChunk[];
  total: number;
  limit: number;
  offset: number;
}

export type SearchEntityType =
  | "file"
  | "file_chunk"
  | "collection"
  | "tag"
  | "note"
  | "ai_conversation"
  | "learning_topic"
  | "project"
  | "task"
  | "habit"
  | "achievement";

export type SearchMode = "keyword" | "hybrid";

export type SearchSort = "relevance" | "recent";

export type SearchMatchReason =
  "file_metadata" | "file_content" | "collection_metadata" | "tag_metadata";

export interface SearchRequest {
  query: string;
  entityTypes?: SearchEntityType[] | undefined;
  mode?: SearchMode | undefined;
  sort?: SearchSort | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface SearchResultSource {
  fileId: string | null;
  chunkId: string | null;
  pageNumber: number | null;
  sectionLabel: string | null;
}

export interface SearchResult {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  snippet: string;
  matchReason: SearchMatchReason;
  score: number;
  openUrl: string;
  worldLocationId: string | null;
  source: SearchResultSource | null;
  createdAt: string;
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  semanticEnabled: boolean;
  items: SearchResult[];
  total: number;
  limit: number;
  offset: number;
}

export interface RecentSearch {
  id: string;
  query: string;
  entityTypes: SearchEntityType[];
  filters: Record<string, unknown>;
  resultCount: number;
  createdAt: string;
}

export interface RecentSearchPage {
  items: RecentSearch[];
  total: number;
  limit: number;
  offset: number;
}
