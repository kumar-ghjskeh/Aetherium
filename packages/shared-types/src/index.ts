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
  "file_metadata" | "file_content" | "collection_metadata" | "tag_metadata" | "ai_conversation";

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
