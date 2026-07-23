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

type ExactOptionalUpdate<T> = {
  [K in keyof T]?: T[K] | undefined;
};

export type AvatarKind = "preset" | "vault_file";

export type ProfileLinkType = "resume" | "portfolio" | "website" | "github" | "linkedin" | "other";

export type ProfileVisibility = "private" | "unlisted";

export type FavoriteResourceType = "file" | "learning_resource" | "external_link";

export type DataRequestStatus = "requested" | "processing" | "ready" | "canceled" | "failed";

export type AccountDeletionRequestStatus = "requested" | "canceled" | "completed";

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  isEmailVerified: boolean;
  headline: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  avatarKind: AvatarKind;
  avatarPreset: string | null;
  avatarFileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserProfileUpdate = ExactOptionalUpdate<
  Pick<
    UserProfile,
    "avatarFileId" | "avatarPreset" | "bio" | "displayName" | "headline" | "location" | "websiteUrl"
  >
>;

export interface ProfileLink {
  id: string;
  linkType: ProfileLinkType;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileLinkCreateRequest {
  linkType: ProfileLinkType;
  title: string;
  url: string;
}

export interface ProfileLinkPage {
  items: ProfileLink[];
  total: number;
  limit: number;
  offset: number;
}

export interface FavoriteProject {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteProjectCreateRequest {
  projectId: string;
}

export interface FavoriteProjectPage {
  items: FavoriteProject[];
  total: number;
  limit: number;
  offset: number;
}

export interface FavoriteResource {
  id: string;
  resourceType: FavoriteResourceType;
  fileId: string | null;
  learningResourceId: string | null;
  title: string;
  url: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteResourceCreateRequest {
  resourceType: FavoriteResourceType;
  fileId?: string | null | undefined;
  learningResourceId?: string | null | undefined;
  title?: string | null | undefined;
  url?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface FavoriteResourcePage {
  items: FavoriteResource[];
  total: number;
  limit: number;
  offset: number;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  credentialUrl: string | null;
  fileId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateCreateRequest {
  title: string;
  issuer?: string | null | undefined;
  issuedOn?: string | null | undefined;
  expiresOn?: string | null | undefined;
  credentialUrl?: string | null | undefined;
  fileId?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface CertificatePage {
  items: Certificate[];
  total: number;
  limit: number;
  offset: number;
}

export interface PrivacySettings {
  id: string;
  profileVisibility: ProfileVisibility;
  showEmailOnProfile: boolean;
  allowProfileInAiContext: boolean;
  allowProfileSearchIndexing: boolean;
  includeProfileInExports: boolean;
  aiMemoryEnabled: boolean;
  productAnalyticsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PrivacySettingsUpdate = ExactOptionalUpdate<
  Pick<
    PrivacySettings,
    | "aiMemoryEnabled"
    | "allowProfileInAiContext"
    | "allowProfileSearchIndexing"
    | "includeProfileInExports"
    | "productAnalyticsEnabled"
    | "profileVisibility"
    | "showEmailOnProfile"
  >
>;

export interface DataExportRequest {
  id: string;
  status: DataRequestStatus;
  requestedAt: string;
  completedAt: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  includedCategories: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataExportRequestCreateRequest {
  idempotencyKey: string;
  includedCategories?: string[] | undefined;
  note?: string | null | undefined;
}

export interface DataExportRequestPage {
  items: DataExportRequest[];
  total: number;
  limit: number;
  offset: number;
}

export interface AccountDeletionRequest {
  id: string;
  status: AccountDeletionRequestStatus;
  requestedAt: string;
  scheduledDeletionAt: string | null;
  canceledAt: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDeletionRequestCreateRequest {
  idempotencyKey: string;
  confirmation: string;
  reason?: string | null | undefined;
}

export interface AccountDeletionRequestPage {
  items: AccountDeletionRequest[];
  total: number;
  limit: number;
  offset: number;
}

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

export type WorldLocationId =
  | "central_plaza"
  | "library"
  | "ai_hall"
  | "programming_tower"
  | "research_laboratory"
  | "habit_garden"
  | "command_center"
  | "personal_home"
  | "achievement_hall"
  | "knowledge_observatory"
  | "project_workshop"
  | "media_theater";

export type WorldLocationCategory =
  | "hub"
  | "vault"
  | "ai"
  | "coding"
  | "learning"
  | "habits"
  | "command"
  | "profile"
  | "achievements"
  | "knowledge"
  | "media"
  | "projects";

export type WorldVisualStatus = "data_contract_ready" | "future_visual_implementation";

export interface WorldLocation {
  id: WorldLocationId;
  title: string;
  subtitle: string;
  description: string;
  category: WorldLocationCategory;
  commandRoute: string;
  futureSceneKey: string;
  visualStatus: WorldVisualStatus;
  defaultUnlocked: boolean;
  unlocked: boolean;
  visited: boolean;
  current: boolean;
  spawn: boolean;
  deepLinkEntityTypes: string[];
  unlockDependencyIds: WorldLocationId[];
}

export interface WorldLocationPage {
  items: WorldLocation[];
  total: number;
  unlockedCount: number;
  visitedCount: number;
  currentLocationId: string;
}

export interface WorldDeepLink {
  locationId: WorldLocationId;
  label: string;
  commandRoute: string;
  routePattern: string;
  entityTypes: string[];
  notes: string;
}

export interface WorldDeepLinkPage {
  items: WorldDeepLink[];
  total: number;
}

export interface WorldSceneManifestLocation {
  locationId: WorldLocationId;
  title: string;
  futureSceneKey: string;
  commandRoute: string;
  implementationStatus: WorldVisualStatus;
  assetBundleKey: string | null;
  allowedToRender: boolean;
  disabledReason: string;
}

export interface WorldSceneManifest {
  manifestVersion: number;
  implementationStatus: "data_contract_only";
  visualRuntimeAvailable: boolean;
  locations: WorldSceneManifestLocation[];
}

export interface WorldFeatureFlags {
  dataContractsEnabled: boolean;
  visualWorldEnabled: boolean;
  sceneManifestEnabled: boolean;
  commandModeFallbackRequired: boolean;
  reason: string;
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

export type NotificationWorkflowType =
  | "weekly_review"
  | "monthly_review"
  | "learning_review"
  | "habit_reminder"
  | "processing_failure"
  | "ai_provider_failure"
  | "project_deadline";

export type NotificationWorkflowStatus = "generated" | "skipped";

export interface NotificationPreferences {
  id: string;
  inAppEnabled: boolean;
  weeklyReviewEnabled: boolean;
  monthlyReviewEnabled: boolean;
  learningRemindersEnabled: boolean;
  habitRemindersEnabled: boolean;
  processingFailureEnabled: boolean;
  aiProviderFailureEnabled: boolean;
  projectDeadlineEnabled: boolean;
  reminderHour: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationPreferencesUpdate = ExactOptionalUpdate<
  Pick<
    NotificationPreferences,
    | "aiProviderFailureEnabled"
    | "habitRemindersEnabled"
    | "inAppEnabled"
    | "learningRemindersEnabled"
    | "monthlyReviewEnabled"
    | "processingFailureEnabled"
    | "projectDeadlineEnabled"
    | "reminderHour"
    | "weeklyReviewEnabled"
  >
>;

export interface NotificationWorkflowRunRequest {
  referenceDate?: string | null | undefined;
}

export interface NotificationWorkflowRecord {
  id: string;
  workflowType: NotificationWorkflowType;
  sourceKey: string;
  status: NotificationWorkflowStatus;
  notificationId: string | null;
  scheduledFor: string;
  generatedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationWorkflowRecordPage {
  items: NotificationWorkflowRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationWorkflowListQuery extends PaginationQuery {
  workflowType?: NotificationWorkflowType;
}

export interface NotificationWorkflowRunResponse {
  generatedCount: number;
  existingCount: number;
  records: NotificationWorkflowRecord[];
}

export interface MonthlyReviewUpsert {
  monthStart: string;
  wins?: string | null | undefined;
  challenges?: string | null | undefined;
  nextSteps?: string | null | undefined;
}

export interface MonthlyReview {
  id: string;
  monthStart: string;
  wins: string | null;
  challenges: string | null;
  nextSteps: string | null;
  period: "month";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReviewPage {
  items: MonthlyReview[];
  total: number;
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
  | "file_metadata"
  | "file_content"
  | "collection_metadata"
  | "tag_metadata"
  | "ai_conversation"
  | "habit_metadata"
  | "learning_topic_metadata"
  | "project_metadata"
  | "project_task_metadata"
  | "achievement_metadata";

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

export type HabitStatus = "active" | "archived";

export type HabitValueType = "boolean" | "duration" | "count" | "quantity";

export type HabitScheduleType = "daily" | "selected_weekdays" | "weekly_target";

export type HabitTargetPeriod = "day" | "week";

export type HabitLogStatus = "completed";

export type ReviewPeriod = "week" | "month";

export interface HabitSchedule {
  id: string;
  scheduleType: HabitScheduleType;
  weekdays: number[];
  weeklyTarget: number | null;
  startsOn: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitTarget {
  id: string;
  targetValue: number;
  targetUnit: string | null;
  targetPeriod: HabitTargetPeriod;
  createdAt: string;
  updatedAt: string;
}

export interface HabitStreak {
  id: string;
  currentStreak: number;
  bestStreak: number;
  recoveryStreak: number;
  completionRate30d: number;
  lastLoggedOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  status: HabitStatus;
  valueType: HabitValueType;
  color: string | null;
  archivedAt: string | null;
  schedule: HabitSchedule;
  target: HabitTarget;
  streak: HabitStreak;
  completedToday: boolean;
  logCount30d: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitPage {
  items: Habit[];
  total: number;
  limit: number;
  offset: number;
}

export interface HabitListQuery extends PaginationQuery {
  includeArchived?: boolean;
}

export interface HabitCreateRequest {
  name: string;
  description?: string | null | undefined;
  valueType?: HabitValueType | undefined;
  targetValue?: number | undefined;
  targetUnit?: string | null | undefined;
  scheduleType?: HabitScheduleType | undefined;
  weekdays?: number[] | undefined;
  weeklyTarget?: number | null | undefined;
  startsOn?: string | undefined;
  timeZone?: string | undefined;
  color?: string | null | undefined;
}

export type HabitUpdateRequest = Partial<
  Pick<
    HabitCreateRequest,
    | "color"
    | "description"
    | "name"
    | "scheduleType"
    | "targetUnit"
    | "targetValue"
    | "weekdays"
    | "weeklyTarget"
  >
>;

export interface HabitLogRequest {
  logDate?: string | undefined;
  value?: number | undefined;
  note?: string | null | undefined;
}

export interface HabitLog {
  id: string;
  habitId: string;
  logDate: string;
  value: number;
  unit: string | null;
  note: string | null;
  status: HabitLogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLogPage {
  items: HabitLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface HabitSummary {
  period: ReviewPeriod;
  startDate: string;
  endDate: string;
  activeHabitCount: number;
  completedLogCount: number;
  scheduledCount: number;
  completionRate: number;
  bestStreak: number;
  currentStreakTotal: number;
  recoveryStreakTotal: number;
  gardenGrowthPoints: number;
}

export interface HabitSummaryQuery {
  period?: ReviewPeriod;
  startDate?: string;
}

export interface DailyCheckInUpsert {
  mood?: number | null | undefined;
  energy?: number | null | undefined;
  notes?: string | null | undefined;
}

export interface DailyCheckIn {
  id: string;
  checkInDate: string;
  mood: number | null;
  energy: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReviewUpsert {
  weekStart: string;
  wins?: string | null | undefined;
  challenges?: string | null | undefined;
  nextSteps?: string | null | undefined;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  wins: string | null;
  challenges: string | null;
  nextSteps: string | null;
  period: ReviewPeriod;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReviewPage {
  items: WeeklyReview[];
  total: number;
  limit: number;
  offset: number;
}

export type LearningRecordStatus = "active" | "archived";

export type CourseStatus = "draft" | "active" | "archived";

export type LessonStatus = "draft" | "active" | "completed";

export type LearningResourceType = "document" | "link" | "note" | "video" | "file";

export type StudySessionMode =
  | "guided_course"
  | "free_exploration"
  | "document_based"
  | "project_based"
  | "exam_preparation"
  | "coding_practice"
  | "quick_review";

export type QuizStatus = "draft" | "active" | "archived";

export type QuestionType = "multiple_choice" | "free_text" | "code";

export type FlashcardStatus = "active" | "archived";

export type FlashcardReviewRating = "again" | "hard" | "good" | "easy";

export type LearningGoalStatus = "active" | "completed" | "archived";

export type StudyRoadmapStatus = "active" | "completed" | "archived";

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  status: LearningRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectPage {
  items: Subject[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubjectCreateRequest {
  name: string;
  description?: string | null | undefined;
}

export interface Topic {
  id: string;
  subjectId: string | null;
  name: string;
  description: string | null;
  status: LearningRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicPage {
  items: Topic[];
  total: number;
  limit: number;
  offset: number;
}

export interface TopicListQuery extends PaginationQuery {
  includeArchived?: boolean;
  subjectId?: string;
}

export interface TopicCreateRequest {
  name: string;
  description?: string | null | undefined;
  subjectId?: string | null | undefined;
}

export interface TopicRelation {
  id: string;
  sourceTopicId: string;
  targetTopicId: string;
  relationType: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopicRelationCreateRequest {
  prerequisiteTopicId: string;
}

export interface LearningResource {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  fileId: string | null;
  title: string;
  resourceType: LearningResourceType;
  url: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResourcePage {
  items: LearningResource[];
  total: number;
  limit: number;
  offset: number;
}

export interface LearningResourceListQuery extends PaginationQuery {
  topicId?: string;
}

export interface LearningResourceCreateRequest {
  title: string;
  resourceType: LearningResourceType;
  subjectId?: string | null | undefined;
  topicId?: string | null | undefined;
  fileId?: string | null | undefined;
  url?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface Course {
  id: string;
  subjectId: string | null;
  title: string;
  description: string | null;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePage {
  items: Course[];
  total: number;
  limit: number;
  offset: number;
}

export interface CourseCreateRequest {
  title: string;
  description?: string | null | undefined;
  subjectId?: string | null | undefined;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleCreateRequest {
  title: string;
  description?: string | null | undefined;
  position?: number | undefined;
}

export interface Lesson {
  id: string;
  moduleId: string;
  topicId: string | null;
  title: string;
  content: string | null;
  status: LessonStatus;
  position: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonCreateRequest {
  title: string;
  content?: string | null | undefined;
  topicId?: string | null | undefined;
  position?: number | undefined;
  estimatedMinutes?: number | null | undefined;
}

export interface StudySession {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  courseId: string | null;
  lessonId: string | null;
  mode: StudySessionMode;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudySessionPage {
  items: StudySession[];
  total: number;
  limit: number;
  offset: number;
}

export interface StudySessionCreateRequest {
  mode: StudySessionMode;
  subjectId?: string | null | undefined;
  topicId?: string | null | undefined;
  courseId?: string | null | undefined;
  lessonId?: string | null | undefined;
  startedAt?: string | undefined;
  notes?: string | null | undefined;
}

export interface StudySessionEndRequest {
  endedAt?: string | undefined;
  notes?: string | null | undefined;
}

export interface Quiz {
  id: string;
  topicId: string | null;
  lessonId: string | null;
  title: string;
  status: QuizStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuizPage {
  items: Quiz[];
  total: number;
  limit: number;
  offset: number;
}

export interface QuizCreateRequest {
  title: string;
  topicId?: string | null | undefined;
  lessonId?: string | null | undefined;
}

export interface Question {
  id: string;
  quizId: string;
  questionType: QuestionType;
  prompt: string;
  choices: string[];
  correctAnswer: string | null;
  explanation: string | null;
  position: number;
  difficulty: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionCreateRequest {
  questionType?: QuestionType | undefined;
  prompt: string;
  choices?: string[] | undefined;
  correctAnswer?: string | null | undefined;
  explanation?: string | null | undefined;
  position?: number | undefined;
  difficulty?: number | undefined;
}

export interface Attempt {
  id: string;
  quizId: string;
  questionId: string | null;
  score: number;
  maxScore: number;
  accuracy: number;
  confidence: number | null;
  hintsUsed: number;
  status: string;
  submittedAnswer: string | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptCreateRequest {
  questionId?: string | null | undefined;
  score: number;
  maxScore: number;
  confidence?: number | null | undefined;
  hintsUsed?: number | undefined;
  submittedAnswer?: string | null | undefined;
  feedback?: string | null | undefined;
}

export interface Flashcard {
  id: string;
  topicId: string | null;
  front: string;
  back: string;
  status: FlashcardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardPage {
  items: Flashcard[];
  total: number;
  limit: number;
  offset: number;
}

export interface FlashcardCreateRequest {
  topicId?: string | null | undefined;
  front: string;
  back: string;
}

export interface FlashcardReview {
  id: string;
  flashcardId: string;
  rating: FlashcardReviewRating;
  confidence: number | null;
  reviewedAt: string;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardReviewCreateRequest {
  rating: FlashcardReviewRating;
  confidence?: number | null | undefined;
  reviewedAt?: string | undefined;
}

export interface MasteryRecord {
  id: string;
  topicId: string;
  masteryScore: number;
  quizAccuracy: number;
  successfulRecallScore: number;
  exerciseScore: number;
  confidenceScore: number;
  reviewRecencyScore: number;
  hintsPenalty: number;
  projectEvidenceScore: number;
  calculation: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoal {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: LearningGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoalPage {
  items: LearningGoal[];
  total: number;
  limit: number;
  offset: number;
}

export interface LearningGoalCreateRequest {
  title: string;
  description?: string | null | undefined;
  subjectId?: string | null | undefined;
  topicId?: string | null | undefined;
  targetDate?: string | null | undefined;
}

export interface StudyRoadmap {
  id: string;
  subjectId: string | null;
  title: string;
  description: string | null;
  steps: Record<string, unknown>[];
  status: StudyRoadmapStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudyRoadmapPage {
  items: StudyRoadmap[];
  total: number;
  limit: number;
  offset: number;
}

export interface StudyRoadmapCreateRequest {
  title: string;
  description?: string | null | undefined;
  subjectId?: string | null | undefined;
  steps?: Record<string, unknown>[] | undefined;
}

export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export type ProjectMilestoneStatus = "planned" | "active" | "completed" | "blocked";

export type ProjectTaskStatus = "todo" | "in_progress" | "done" | "blocked";

export type ProjectPriority = "low" | "medium" | "high";

export type ProjectBlockerStatus = "open" | "resolved";

export type ProjectActivityType =
  | "project.created"
  | "project.updated"
  | "project.archived"
  | "project.completed"
  | "project.milestone_created"
  | "project.task_created"
  | "project.task_updated"
  | "project.note_created"
  | "project.link_created"
  | "project.file_attached"
  | "project.topic_linked"
  | "project.technology_added"
  | "project.blocker_created"
  | "project.blocker_updated";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  repositoryUrl: string | null;
  status: ProjectStatus;
  startedOn: string | null;
  targetDate: string | null;
  archivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPage {
  items: Project[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string | null | undefined;
  objective?: string | null | undefined;
  repositoryUrl?: string | null | undefined;
  startedOn?: string | null | undefined;
  targetDate?: string | null | undefined;
}

export interface ProjectUpdateRequest {
  name?: string | undefined;
  description?: string | null | undefined;
  objective?: string | null | undefined;
  repositoryUrl?: string | null | undefined;
  status?: ProjectStatus | undefined;
  startedOn?: string | null | undefined;
  targetDate?: string | null | undefined;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: ProjectMilestoneStatus;
  dueDate: string | null;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestoneCreateRequest {
  title: string;
  description?: string | null | undefined;
  dueDate?: string | null | undefined;
  position?: number | undefined;
}

export interface ProjectMilestoneUpdateRequest {
  title?: string | undefined;
  description?: string | null | undefined;
  status?: ProjectMilestoneStatus | undefined;
  dueDate?: string | null | undefined;
  position?: number | undefined;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskCreateRequest {
  title: string;
  description?: string | null | undefined;
  milestoneId?: string | null | undefined;
  priority?: ProjectPriority | undefined;
  dueDate?: string | null | undefined;
}

export interface ProjectTaskUpdateRequest {
  title?: string | undefined;
  description?: string | null | undefined;
  milestoneId?: string | null | undefined;
  status?: ProjectTaskStatus | undefined;
  priority?: ProjectPriority | undefined;
  dueDate?: string | null | undefined;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNoteCreateRequest {
  title: string;
  body: string;
}

export interface ProjectLink {
  id: string;
  projectId: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLinkCreateRequest {
  title: string;
  url: string;
}

export interface ProjectFileLink {
  id: string;
  projectId: string;
  fileId: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFileCreateRequest {
  fileId: string;
  description?: string | null | undefined;
}

export interface ProjectTopicLink {
  id: string;
  projectId: string;
  topicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTopicCreateRequest {
  topicId: string;
}

export interface ProjectTechnology {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTechnologyCreateRequest {
  name: string;
}

export interface ProjectBlocker {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: ProjectBlockerStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBlockerCreateRequest {
  title: string;
  description?: string | null | undefined;
}

export interface ProjectBlockerUpdateRequest {
  title?: string | undefined;
  description?: string | null | undefined;
  status?: ProjectBlockerStatus | undefined;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  activityType: ProjectActivityType;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectActivityPage {
  items: ProjectActivity[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectDetail extends Project {
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  notes: ProjectNote[];
  links: ProjectLink[];
  files: ProjectFileLink[];
  topics: ProjectTopicLink[];
  technologies: ProjectTechnology[];
  blockers: ProjectBlocker[];
  recentActivity: ProjectActivity[];
}

export type CodingLanguage =
  "python" | "javascript" | "typescript" | "sql" | "cpp" | "systemverilog" | "text";

export type CodeSnippetStatus = "active" | "archived";

export type CodingExerciseDifficulty = "intro" | "practice" | "challenge";

export type CodingExerciseStatus = "active" | "archived";

export type CodingAttemptStatus = "submitted" | "reviewed";

export type CodeAssistantKind = "explain" | "review";

export type CodeAssistantStatus = "complete" | "failed";

export type CodeRunnerAvailability = "unavailable";

export interface CodeSnippet {
  id: string;
  title: string;
  language: CodingLanguage;
  content: string;
  notes: string | null;
  status: CodeSnippetStatus;
  projectId: string | null;
  fileId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodeSnippetPage {
  items: CodeSnippet[];
  total: number;
  limit: number;
  offset: number;
}

export interface CodeSnippetCreateRequest {
  title: string;
  language?: CodingLanguage | undefined;
  content: string;
  notes?: string | null | undefined;
  projectId?: string | null | undefined;
  fileId?: string | null | undefined;
}

export type CodeSnippetUpdateRequest = ExactOptionalUpdate<
  Pick<CodeSnippet, "content" | "fileId" | "language" | "notes" | "projectId" | "title">
>;

export interface CodingExercise {
  id: string;
  title: string;
  language: CodingLanguage;
  prompt: string;
  starterCode: string;
  solutionNotes: string | null;
  difficulty: CodingExerciseDifficulty;
  status: CodingExerciseStatus;
  topicId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodingExercisePage {
  items: CodingExercise[];
  total: number;
  limit: number;
  offset: number;
}

export interface CodingExerciseCreateRequest {
  title: string;
  language?: CodingLanguage | undefined;
  prompt: string;
  starterCode?: string | undefined;
  solutionNotes?: string | null | undefined;
  difficulty?: CodingExerciseDifficulty | undefined;
  topicId?: string | null | undefined;
  projectId?: string | null | undefined;
}

export interface CodingAttemptCreateRequest {
  submittedCode: string;
  snippetId?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface CodingAttempt {
  id: string;
  exerciseId: string;
  snippetId: string | null;
  submittedCode: string;
  notes: string | null;
  feedback: string | null;
  status: CodingAttemptStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CodeAssistantCreateRequest {
  code?: string | null | undefined;
  language?: CodingLanguage | undefined;
  prompt?: string | null | undefined;
  snippetId?: string | null | undefined;
  projectId?: string | null | undefined;
  includeProjectContext?: boolean | undefined;
  providerName?: string | undefined;
  modelName?: string | undefined;
}

export interface CodeAssistantRequest {
  id: string;
  snippetId: string | null;
  projectId: string | null;
  aiUsageRecordId: string | null;
  kind: CodeAssistantKind;
  language: CodingLanguage;
  prompt: string | null;
  codeExcerpt: string;
  response: string;
  status: CodeAssistantStatus;
  providerName: string | null;
  modelName: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodeAssistantRequestPage {
  items: CodeAssistantRequest[];
  total: number;
  limit: number;
  offset: number;
}

export interface CodeRunnerStatus {
  availability: CodeRunnerAvailability;
  executionAvailable: boolean;
  providerName: string;
  reason: string;
  supportedLanguages: CodingLanguage[];
  securityRequirements: string[];
}

export type KnowledgeNodeType =
  "topic" | "file" | "lesson" | "project" | "skill" | "question" | "achievement";

export type KnowledgeRelationType =
  | "requires"
  | "explains"
  | "references"
  | "practices"
  | "used_in"
  | "related_to"
  | "mastered_through"
  | "derived_from";

export type KnowledgeNodeStatus = "active" | "archived";

export type KnowledgeRelationshipSource =
  "user" | "system" | "sync" | "learning" | "project" | "achievement";

export type KnowledgeRelationshipDirection = "incoming" | "outgoing" | "both";

export type KnowledgeRecommendationPriority = "high" | "medium" | "low";

export interface KnowledgeNode {
  id: string;
  nodeType: KnowledgeNodeType;
  sourceId: string | null;
  sourceKey: string;
  title: string;
  description: string | null;
  openUrl: string;
  status: KnowledgeNodeStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeNodePage {
  items: KnowledgeNode[];
  total: number;
  limit: number;
  offset: number;
}

export interface KnowledgeNodeCreateRequest {
  nodeType?: KnowledgeNodeType | undefined;
  title: string;
  description?: string | null | undefined;
  openUrl?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface KnowledgeNodeListQuery extends PaginationQuery {
  nodeType?: KnowledgeNodeType;
  query?: string;
}

export interface KnowledgeRelationship {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: KnowledgeRelationType;
  source: KnowledgeRelationshipSource;
  weight: number;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeRelationshipPage {
  items: KnowledgeRelationship[];
  total: number;
  limit: number;
  offset: number;
}

export interface KnowledgeRelationshipCreateRequest {
  sourceNodeId: string;
  targetNodeId: string;
  relationType: KnowledgeRelationType;
  weight?: number | undefined;
  evidence?: Record<string, unknown> | undefined;
}

export interface KnowledgeRelationshipListQuery extends PaginationQuery {
  nodeId?: string;
  relationType?: KnowledgeRelationType;
  direction?: KnowledgeRelationshipDirection;
}

export interface KnowledgeRelatedNode {
  node: KnowledgeNode;
  relationship: KnowledgeRelationship;
  direction: KnowledgeRelationshipDirection;
  reason: string;
}

export interface KnowledgeRelatedNodePage {
  items: KnowledgeRelatedNode[];
  total: number;
  limit: number;
  offset: number;
}

export interface KnowledgeRecommendation {
  topicId: string;
  title: string;
  reason: string;
  priority: KnowledgeRecommendationPriority;
  openUrl: string;
  masteryScore: number | null;
  staleSince: string | null;
}

export interface KnowledgeRecommendationPage {
  items: KnowledgeRecommendation[];
  total: number;
  limit: number;
  offset: number;
}

export interface KnowledgeSummary {
  nodeCount: number;
  relationshipCount: number;
  weakTopicCount: number;
  staleTopicCount: number;
}

export interface KnowledgeSyncResponse {
  nodesCreated: number;
  nodesUpdated: number;
  relationshipsCreated: number;
  relationshipsReused: number;
}

export type AnalyticsPeriod = "week" | "month" | "quarter" | "year";

export type AnalyticsMetricKey =
  | "study_minutes"
  | "lessons_completed"
  | "quiz_accuracy"
  | "topic_mastery"
  | "habit_completions"
  | "habit_completion_rate"
  | "project_progress"
  | "files_processed"
  | "files_opened"
  | "ai_requests"
  | "ai_tokens"
  | "coding_sessions";

export interface AnalyticsMetric {
  key: AnalyticsMetricKey;
  label: string;
  value: number | null;
  unit: string;
  available: boolean;
  explanation: string;
}

export interface AnalyticsTrendBucket {
  periodStart: string;
  periodEnd: string;
  label: string;
  studyMinutes: number;
  lessonsCompleted: number;
  habitCompletions: number;
  filesProcessed: number;
  aiRequests: number;
  projectsCompleted: number;
}

export interface AnalyticsSummary {
  generatedAt: string;
  period: AnalyticsPeriod;
  periodStart: string;
  periodEnd: string;
  metrics: AnalyticsMetric[];
  trendBuckets: AnalyticsTrendBucket[];
}

export type AchievementCategory = "files" | "habits" | "learning" | "projects" | "coding";

export type AchievementRarity = "common" | "focused" | "milestone";

export type AchievementRewardType = "badge" | "world_unlock";

export interface AchievementRewardDefinition {
  id: string;
  rewardType: AchievementRewardType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface WorldUnlockRecord {
  id: string;
  achievementDefinitionId: string;
  rewardDefinitionId: string;
  locationId: string;
  unlockSource: string;
  unlockedAt: string;
}

export interface AchievementProgress {
  definitionId: string;
  slug: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  progressCount: number;
  targetCount: number;
  unlockedAt: string | null;
  rewards: AchievementRewardDefinition[];
  worldUnlocks: WorldUnlockRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AchievementPage {
  items: AchievementProgress[];
  total: number;
  limit: number;
  offset: number;
}

export interface AchievementSummary {
  totalAchievements: number;
  unlockedCount: number;
  lockedCount: number;
  totalPoints: number;
  unlockedPoints: number;
  recentUnlocks: AchievementProgress[];
  worldUnlocks: WorldUnlockRecord[];
}

export interface AchievementProcessResponse {
  processedEventCount: number;
  newUnlockCount: number;
  unlocked: AchievementProgress[];
}

export type AIFeature =
  | "general_chat"
  | "embeddings"
  | "document_qa"
  | "mentor_chat"
  | "learning_assistant"
  | "coding_assistant";

export type AIProviderKind =
  "aetherium_deterministic" | "openai_compatible" | "anthropic_compatible" | "ollama_compatible";

export type AIProviderCapability =
  "chat" | "streaming_chat" | "embeddings" | "structured_outputs" | "tool_calling";

export type AIMessageRole = "system" | "user" | "assistant" | "tool";

export type AIDataCategory =
  | "file_content"
  | "collections"
  | "conversations"
  | "projects"
  | "learning_records"
  | "habit_data"
  | "profile_data";

export type AIOperation = "chat_completion" | "streaming_chat_completion" | "embedding";

export type AIUsageStatus = "success" | "failed" | "blocked" | "rate_limited";

export type AIResponseFormat = "text" | "json_object";

export interface AIProvider {
  name: string;
  kind: AIProviderKind;
  displayName: string;
  external: boolean;
  configured: boolean;
  capabilities: AIProviderCapability[];
  defaultChatModel: string | null;
  defaultEmbeddingModel: string | null;
}

export interface AIProviderPage {
  items: AIProvider[];
}

export interface AIConsentPolicy {
  id: string;
  feature: AIFeature;
  externalProvidersAllowed: boolean;
  allowFileContent: boolean;
  allowCollections: boolean;
  allowConversations: boolean;
  allowProjects: boolean;
  allowLearningRecords: boolean;
  allowHabitData: boolean;
  allowProfileData: boolean;
  allowedCollectionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIConsentPolicyPage {
  items: AIConsentPolicy[];
}

export type AIConsentPolicyUpdate = Partial<
  Pick<
    AIConsentPolicy,
    | "allowCollections"
    | "allowConversations"
    | "allowFileContent"
    | "allowHabitData"
    | "allowLearningRecords"
    | "allowProfileData"
    | "allowProjects"
    | "allowedCollectionIds"
    | "externalProvidersAllowed"
  >
>;

export interface AIModelConfiguration {
  id: string;
  feature: AIFeature;
  providerName: string;
  providerKind: AIProviderKind;
  modelName: string;
  fallbackProviderName: string | null;
  fallbackModelName: string | null;
  temperature: number;
  maxOutputTokens: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIModelConfigurationPage {
  items: AIModelConfiguration[];
}

export type AIModelConfigurationUpdate = Partial<
  Pick<
    AIModelConfiguration,
    | "enabled"
    | "fallbackModelName"
    | "fallbackProviderName"
    | "maxOutputTokens"
    | "modelName"
    | "providerName"
    | "temperature"
  >
>;

export interface AIChatMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIUsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostMicroUsd: number;
}

export interface AIChatCompletionRequest {
  feature?: AIFeature;
  messages: AIChatMessage[];
  requestedDataCategories?: AIDataCategory[] | undefined;
  providerName?: string | undefined;
  modelName?: string | undefined;
  temperature?: number | undefined;
  maxOutputTokens?: number | undefined;
  responseFormat?: AIResponseFormat | undefined;
  tools?: Record<string, unknown>[] | undefined;
  toolChoice?: Record<string, unknown> | undefined;
}

export interface AIChatCompletionResponse {
  requestId: string;
  feature: AIFeature;
  providerName: string;
  providerKind: AIProviderKind;
  modelName: string;
  message: AIChatMessage;
  usage: AIUsageSummary;
  usedFallback: boolean;
  usageRecordId: string;
}

export interface AIEmbeddingRequest {
  feature?: AIFeature;
  input: string[];
  requestedDataCategories?: AIDataCategory[] | undefined;
  providerName?: string | undefined;
  modelName?: string | undefined;
}

export interface AIEmbeddingItem {
  index: number;
  embedding: number[];
}

export interface AIEmbeddingResponse {
  requestId: string;
  feature: AIFeature;
  providerName: string;
  providerKind: AIProviderKind;
  modelName: string;
  data: AIEmbeddingItem[];
  usage: AIUsageSummary;
  usedFallback: boolean;
  usageRecordId: string;
}

export interface AIUsageRecord {
  id: string;
  requestId: string;
  feature: AIFeature;
  providerName: string;
  providerKind: AIProviderKind;
  modelName: string;
  operation: AIOperation;
  status: AIUsageStatus;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostMicroUsd: number;
  latencyMs: number;
  usedFallback: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AIUsageRecordPage {
  items: AIUsageRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface AIUsageQuery extends PaginationQuery {
  feature?: AIFeature;
}

export type DocumentQAMode =
  | "explain"
  | "summarize"
  | "compare"
  | "quiz_me"
  | "create_flashcards"
  | "extract_tasks"
  | "create_study_notes"
  | "identify_contradictions";

export type DocumentQAEvidenceStatus = "supported" | "insufficient_evidence";

export interface DocumentQARequest {
  question: string;
  mode?: DocumentQAMode | undefined;
  fileIds?: string[] | undefined;
  collectionIds?: string[] | undefined;
  maxSources?: number | undefined;
  providerName?: string | undefined;
  modelName?: string | undefined;
}

export interface DocumentQACitation {
  label: string;
  fileId: string;
  chunkId: string;
  fileName: string;
  pageNumber: number | null;
  sectionLabel: string | null;
  snippet: string;
  score: number;
  openUrl: string;
  sourceType: "user_file_evidence";
  metadata: Record<string, unknown>;
}

export interface DocumentQARetrieval {
  semanticEnabled: boolean;
  candidateCount: number;
  retrievedCount: number;
  usedCollectionFilter: boolean;
  usedFileFilter: boolean;
}

export interface DocumentQAResponse {
  question: string;
  mode: DocumentQAMode;
  answer: string;
  evidenceStatus: DocumentQAEvidenceStatus;
  citations: DocumentQACitation[];
  retrieval: DocumentQARetrieval;
  providerName: string | null;
  modelName: string | null;
  usage: AIUsageSummary | null;
  usageRecordId: string | null;
  usedFallback: boolean;
}

export type MentorTone = "calm" | "direct" | "analytical" | "encouraging";

export type MentorTool =
  "explain" | "quiz" | "flashcards" | "summarize" | "study_plan" | "code_review";

export type ConversationStatus = "active" | "archived" | "deleted";

export type ConversationMemoryPolicy = "disabled" | "session_only" | "persistent";

export type MessageStatus = "complete" | "failed";

export type MessageSourceType =
  "file_chunk" | "general_model_knowledge" | "user_message" | "inference";

export interface MentorPermission {
  id: string;
  mentorId: string;
  allowedTools: MentorTool[];
  allowedCollectionIds: string[];
  allowFileContent: boolean;
  allowConversations: boolean;
  allowProjects: boolean;
  allowLearningRecords: boolean;
  allowHabitData: boolean;
  allowProfileData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Mentor {
  id: string;
  slug: string;
  name: string;
  fictionalIdentity: string;
  avatarReference: string | null;
  description: string;
  systemInstructions: string;
  tone: MentorTone;
  preferredModelName: string | null;
  isDefault: boolean;
  archivedAt: string | null;
  permissions: MentorPermission;
  createdAt: string;
  updatedAt: string;
}

export interface MentorPage {
  items: Mentor[];
}

export interface MentorCreateRequest {
  name: string;
  fictionalIdentity: string;
  avatarReference?: string | null | undefined;
  description: string;
  systemInstructions: string;
  tone?: MentorTone | undefined;
  preferredModelName?: string | null | undefined;
  allowedTools?: MentorTool[] | undefined;
}

export type MentorUpdateRequest = Partial<
  Pick<
    Mentor,
    | "avatarReference"
    | "description"
    | "fictionalIdentity"
    | "name"
    | "preferredModelName"
    | "systemInstructions"
    | "tone"
  >
>;

export type MentorPermissionUpdate = Partial<
  Pick<
    MentorPermission,
    | "allowConversations"
    | "allowFileContent"
    | "allowHabitData"
    | "allowLearningRecords"
    | "allowProfileData"
    | "allowProjects"
    | "allowedCollectionIds"
    | "allowedTools"
  >
>;

export interface ConversationMemorySettings {
  id: string;
  conversationId: string;
  memoryEnabled: boolean;
  memoryPolicy: ConversationMemoryPolicy;
  memorySummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  mentorId: string;
  mentorName: string;
  title: string;
  status: ConversationStatus;
  archivedAt: string | null;
  deletedAt: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  memorySettings: ConversationMemorySettings;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationPage {
  items: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConversationCreateRequest {
  mentorId: string;
  title?: string | undefined;
}

export type ConversationUpdateRequest = Partial<Pick<Conversation, "title">>;

export interface ConversationMemorySettingsUpdate {
  memoryEnabled: boolean;
  memoryPolicy?: ConversationMemoryPolicy | undefined;
}

export interface MessageSource {
  id: string;
  messageId: string;
  sourceType: MessageSourceType;
  sourceId: string | null;
  title: string;
  url: string | null;
  pageNumber: number | null;
  sectionLabel: string | null;
  snippet: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  status: MessageStatus;
  aiUsageRecordId: string | null;
  providerName: string | null;
  modelName: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  editedFromMessageId: string | null;
  regeneratedFromMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessagePage {
  items: Message[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessageSendRequest {
  content: string;
}

export interface MessageSendResponse {
  conversation: Conversation;
  userMessage: Message | null;
  assistantMessage: Message;
}

export interface ConversationExportMessage extends Message {
  sources: MessageSource[];
}

export interface ConversationExport {
  exportedAt: string;
  conversation: Conversation;
  mentor: Mentor;
  messages: ConversationExportMessage[];
}

export interface StopGenerationResponse {
  stopped: boolean;
  reason: string;
}
