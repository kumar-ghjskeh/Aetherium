import { z } from "zod";

export const passwordPolicy = {
  maxLength: 128,
  minLength: 12
} as const;

export const healthStatusSchema = z.enum(["ok", "degraded"]);

export const serviceNameSchema = z.enum(["api", "web"]);

export const healthCheckResponseSchema = z.object({
  checks: z.record(z.string()),
  service: serviceNameSchema,
  status: healthStatusSchema,
  version: z.string().min(1)
});

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  isEmailVerified: z.boolean(),
  createdAt: z.string().min(1),
  lastLoginAt: z.string().min(1).nullable()
});

export const authResponseSchema = z.object({
  user: publicUserSchema
});

export const passwordSchema = z
  .string()
  .min(
    passwordPolicy.minLength,
    `Password must be at least ${passwordPolicy.minLength} characters.`
  )
  .max(passwordPolicy.maxLength, `Password must be at most ${passwordPolicy.maxLength} characters.`)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema
});

export const loginRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(passwordPolicy.maxLength)
});

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    fields: z.record(z.string()).optional(),
    message: z.string()
  })
});

export const themeSchema = z.enum(["system", "light", "dark"]);

export const defaultInterfaceModeSchema = z.enum(["command", "world"]);

export const performancePresetSchema = z.enum(["automatic", "low", "balanced", "high"]);

export const navigationMethodSchema = z.enum([
  "command_palette",
  "fast_travel",
  "guided",
  "direct"
]);

export const domainEventTypeSchema = z.enum([
  "user.registered",
  "user.preference_updated",
  "file.uploaded",
  "file.ingested",
  "habit.logged",
  "lesson.completed",
  "quiz.completed",
  "project.completed",
  "achievement.unlocked",
  "world.location_visited"
]);

export const notificationTypeSchema = z.enum([
  "system",
  "security",
  "processing",
  "review",
  "ai",
  "project"
]);

export const notificationSeveritySchema = z.enum(["info", "success", "warning", "error"]);

export const userPreferencesSchema = z.object({
  aiMemoryEnabled: z.boolean(),
  ambientAudioEnabled: z.boolean(),
  backgroundMusicEnabled: z.boolean(),
  cameraEffectsEnabled: z.boolean(),
  createdAt: z.string().min(1),
  defaultInterfaceMode: defaultInterfaceModeSchema,
  id: z.string().uuid(),
  locale: z.string().min(2),
  performancePreset: performancePresetSchema,
  productAnalyticsEnabled: z.boolean(),
  reducedMotion: z.boolean(),
  theme: themeSchema,
  timeZone: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const userPreferencesUpdateSchema = z
  .object({
    aiMemoryEnabled: z.boolean().optional(),
    ambientAudioEnabled: z.boolean().optional(),
    backgroundMusicEnabled: z.boolean().optional(),
    cameraEffectsEnabled: z.boolean().optional(),
    defaultInterfaceMode: defaultInterfaceModeSchema.optional(),
    locale: z.string().min(2).max(35).optional(),
    performancePreset: performancePresetSchema.optional(),
    productAnalyticsEnabled: z.boolean().optional(),
    reducedMotion: z.boolean().optional(),
    theme: themeSchema.optional(),
    timeZone: z.string().min(1).max(64).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference field is required."
  });

export const worldProfileSchema = z.object({
  createdAt: z.string().min(1),
  currentLocationId: z.string().min(1),
  id: z.string().uuid(),
  lastVisitedLocationId: z.string().min(1).nullable(),
  preferredNavigationMethod: navigationMethodSchema,
  spawnLocationId: z.string().min(1),
  tutorialCompleted: z.boolean(),
  unlockedLocationIds: z.array(z.string().min(1)),
  updatedAt: z.string().min(1),
  visitedLocationIds: z.array(z.string().min(1)),
  worldStateVersion: z.number().int().positive()
});

export const worldProfileUpdateSchema = z
  .object({
    preferredNavigationMethod: navigationMethodSchema.optional(),
    spawnLocationId: z.string().min(1).max(64).optional(),
    tutorialCompleted: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one world profile field is required."
  });

export const worldVisitRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(160),
  locationId: z.string().min(1).max(64)
});

export const domainEventCreateRequestSchema = z.object({
  eventType: domainEventTypeSchema,
  idempotencyKey: z.string().min(8).max(160),
  payload: z.record(z.unknown()).optional()
});

export const domainEventSchema = z.object({
  createdAt: z.string().min(1),
  eventType: domainEventTypeSchema,
  id: z.string().uuid(),
  idempotencyKey: z.string().min(1),
  occurredAt: z.string().min(1),
  payload: z.record(z.unknown())
});

export const domainEventPageSchema = z.object({
  items: z.array(domainEventSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const notificationSchema = z.object({
  actionUrl: z.string().nullable(),
  body: z.string(),
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  notificationType: notificationTypeSchema,
  readAt: z.string().min(1).nullable(),
  severity: notificationSeveritySchema,
  title: z.string()
});

export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0),
  unreadCount: z.number().int().min(0)
});

export const auditLogSchema = z.object({
  action: z.string().min(1),
  createdAt: z.string().min(1),
  entityId: z.string().uuid().nullable(),
  entityType: z.string().nullable(),
  id: z.string().uuid(),
  metadata: z.record(z.unknown())
});

export const auditLogPageSchema = z.object({
  items: z.array(auditLogSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const fileKindSchema = z.enum([
  "pdf",
  "text",
  "markdown",
  "docx",
  "csv",
  "json",
  "source_code",
  "image"
]);

export const fileProcessingStatusSchema = z.enum([
  "not_started",
  "queued",
  "processing",
  "ready",
  "failed"
]);

export const fileDeletionStatusSchema = z.enum(["active", "soft_deleted"]);

export const uploadStatusSchema = z.enum(["pending", "completed", "aborted", "expired"]);

export const malwareScanStatusSchema = z.enum([
  "not_configured",
  "pending",
  "clean",
  "suspicious",
  "failed"
]);

export const processingJobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "canceled"
]);

export const processingStageSchema = z.enum([
  "queued",
  "validating",
  "extracting",
  "chunking",
  "indexing",
  "embedding",
  "ready",
  "failed",
  "canceled"
]);

export const chunkStatusSchema = z.enum(["ready", "deleted"]);

export const uploadInitiateRequestSchema = z.object({
  checksumSha256: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .optional(),
  contentType: z.string().min(1).max(160),
  fileName: z.string().min(1).max(255),
  idempotencyKey: z.string().min(8).max(160),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024)
});

export const uploadCompleteRequestSchema = z.object({
  displayName: z.string().min(1).max(160).optional(),
  idempotencyKey: z.string().min(8).max(160)
});

export const uploadResponseSchema = z.object({
  contentType: z.string().min(1),
  createdAt: z.string().min(1),
  expiresAt: z.string().min(1),
  fileName: z.string().min(1),
  id: z.string().uuid(),
  sanitizedFileName: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  status: uploadStatusSchema,
  uploadHeaders: z.record(z.string()),
  uploadMethod: z.literal("PUT"),
  uploadUrl: z.string().url()
});

export const fileTagSchema = z.object({
  color: z.string().nullable(),
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  name: z.string().min(1)
});

export const vaultFileSchema = z.object({
  collectionIds: z.array(z.string().uuid()),
  contentType: z.string().min(1),
  createdAt: z.string().min(1),
  deletedAt: z.string().min(1).nullable(),
  deletionStatus: fileDeletionStatusSchema,
  displayName: z.string().min(1),
  fileExtension: z.string().min(1),
  fileKind: fileKindSchema,
  id: z.string().uuid(),
  isFavorite: z.boolean(),
  malwareScanStatus: malwareScanStatusSchema,
  originalFileName: z.string().min(1),
  processingStatus: fileProcessingStatusSchema,
  sanitizedFileName: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  tags: z.array(fileTagSchema),
  updatedAt: z.string().min(1)
});

export const filePageSchema = z.object({
  items: z.array(vaultFileSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const fileUpdateRequestSchema = z.object({
  displayName: z.string().min(1).max(160)
});

export const downloadUrlResponseSchema = z.object({
  downloadHeaders: z.record(z.string()),
  downloadMethod: z.literal("GET"),
  downloadUrl: z.string().url(),
  expiresAt: z.string().min(1),
  fileId: z.string().uuid()
});

export const collectionSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const collectionPageSchema = z.object({
  items: z.array(collectionSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const collectionCreateRequestSchema = z.object({
  description: z.string().max(2000).nullable().optional(),
  name: z.string().trim().min(1).max(120)
});

export const collectionItemRequestSchema = z.object({
  fileId: z.string().uuid()
});

export const tagPageSchema = z.object({
  items: z.array(fileTagSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const fileTagCreateRequestSchema = z.object({
  color: z.string().max(32).nullable().optional(),
  name: z.string().trim().min(1).max(80)
});

export const processingJobSchema = z.object({
  attemptCount: z.number().int().min(0),
  completedAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  failureCount: z.number().int().min(0),
  fileId: z.string().uuid(),
  id: z.string().uuid(),
  lastErrorCode: z.string().nullable(),
  lastErrorMessage: z.string().nullable(),
  lockedAt: z.string().min(1).nullable(),
  maxAttempts: z.number().int().positive(),
  metadata: z.record(z.unknown()),
  nextAttemptAt: z.string().min(1).nullable(),
  stage: processingStageSchema,
  startedAt: z.string().min(1).nullable(),
  status: processingJobStatusSchema,
  updatedAt: z.string().min(1)
});

export const processingJobPageSchema = z.object({
  items: z.array(processingJobSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const fileChunkSchema = z.object({
  chunkText: z.string(),
  createdAt: z.string().min(1),
  fileId: z.string().uuid(),
  id: z.string().uuid(),
  pageNumber: z.number().int().nullable(),
  processingJobId: z.string().uuid(),
  sectionLabel: z.string().nullable(),
  sequenceNumber: z.number().int().min(0),
  sourceMetadata: z.record(z.unknown()),
  status: chunkStatusSchema,
  tokenEstimate: z.number().int().min(0),
  updatedAt: z.string().min(1)
});

export const fileChunkPageSchema = z.object({
  items: z.array(fileChunkSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const searchEntityTypeSchema = z.enum([
  "file",
  "file_chunk",
  "collection",
  "tag",
  "note",
  "ai_conversation",
  "learning_topic",
  "project",
  "task",
  "habit",
  "achievement"
]);

export const searchModeSchema = z.enum(["keyword", "hybrid"]);

export const searchSortSchema = z.enum(["relevance", "recent"]);

export const searchMatchReasonSchema = z.enum([
  "file_metadata",
  "file_content",
  "collection_metadata",
  "tag_metadata",
  "ai_conversation",
  "habit_metadata",
  "learning_topic_metadata",
  "project_metadata",
  "project_task_metadata"
]);

export const searchRequestSchema = z.object({
  entityTypes: z.array(searchEntityTypeSchema).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  mode: searchModeSchema.optional(),
  offset: z.number().int().min(0).max(1000).optional(),
  query: z.string().trim().min(1).max(240),
  sort: searchSortSchema.optional()
});

export const searchResultSourceSchema = z.object({
  chunkId: z.string().uuid().nullable(),
  fileId: z.string().uuid().nullable(),
  pageNumber: z.number().int().nullable(),
  sectionLabel: z.string().nullable()
});

export const searchResultSchema = z.object({
  createdAt: z.string().min(1),
  entityId: z.string().uuid(),
  entityType: searchEntityTypeSchema,
  id: z.string().min(1),
  matchReason: searchMatchReasonSchema,
  openUrl: z.string().min(1),
  score: z.number(),
  snippet: z.string(),
  source: searchResultSourceSchema.nullable(),
  title: z.string().min(1),
  worldLocationId: z.string().min(1).nullable()
});

export const searchResponseSchema = z.object({
  items: z.array(searchResultSchema),
  limit: z.number().int().min(1),
  mode: searchModeSchema,
  offset: z.number().int().min(0),
  query: z.string(),
  semanticEnabled: z.boolean(),
  total: z.number().int().min(0)
});

export const recentSearchSchema = z.object({
  createdAt: z.string().min(1),
  entityTypes: z.array(searchEntityTypeSchema),
  filters: z.record(z.unknown()),
  id: z.string().uuid(),
  query: z.string().min(1),
  resultCount: z.number().int().min(0)
});

export const recentSearchPageSchema = z.object({
  items: z.array(recentSearchSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const habitStatusSchema = z.enum(["active", "archived"]);

export const habitValueTypeSchema = z.enum(["boolean", "duration", "count", "quantity"]);

export const habitScheduleTypeSchema = z.enum(["daily", "selected_weekdays", "weekly_target"]);

export const habitTargetPeriodSchema = z.enum(["day", "week"]);

export const habitLogStatusSchema = z.enum(["completed"]);

export const reviewPeriodSchema = z.enum(["week", "month"]);

const habitWeekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .transform((value) => Array.from(new Set(value)).sort((left, right) => left - right));

export const habitScheduleSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  scheduleType: habitScheduleTypeSchema,
  startsOn: z.string().min(1),
  timeZone: z.string().min(1),
  updatedAt: z.string().min(1),
  weekdays: habitWeekdaysSchema,
  weeklyTarget: z.number().int().min(1).max(7).nullable()
});

export const habitTargetSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  targetPeriod: habitTargetPeriodSchema,
  targetUnit: z.string().nullable(),
  targetValue: z.number().positive(),
  updatedAt: z.string().min(1)
});

export const habitStreakSchema = z.object({
  bestStreak: z.number().int().min(0),
  completionRate30d: z.number().min(0).max(1),
  createdAt: z.string().min(1),
  currentStreak: z.number().int().min(0),
  id: z.string().uuid(),
  lastLoggedOn: z.string().min(1).nullable(),
  recoveryStreak: z.number().int().min(0),
  updatedAt: z.string().min(1)
});

export const habitSchema = z.object({
  archivedAt: z.string().min(1).nullable(),
  color: z.string().nullable(),
  completedToday: z.boolean(),
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  logCount30d: z.number().int().min(0),
  name: z.string().min(1),
  schedule: habitScheduleSchema,
  status: habitStatusSchema,
  streak: habitStreakSchema,
  target: habitTargetSchema,
  updatedAt: z.string().min(1),
  valueType: habitValueTypeSchema
});

export const habitPageSchema = z.object({
  items: z.array(habitSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const habitCreateRequestSchema = z
  .object({
    color: z.string().max(32).nullable().optional(),
    description: z.string().max(4000).nullable().optional(),
    name: z.string().trim().min(1).max(120),
    scheduleType: habitScheduleTypeSchema.optional(),
    startsOn: z.string().min(1).optional(),
    targetUnit: z.string().max(40).nullable().optional(),
    targetValue: z.number().positive().max(1_000_000).optional(),
    timeZone: z.string().min(1).max(64).optional(),
    valueType: habitValueTypeSchema.optional(),
    weekdays: habitWeekdaysSchema.optional(),
    weeklyTarget: z.number().int().min(1).max(7).nullable().optional()
  })
  .refine(
    (value) =>
      value.scheduleType !== "selected_weekdays" ||
      (value.weekdays !== undefined && value.weekdays.length > 0),
    { message: "Selected weekday habits require at least one weekday." }
  )
  .refine((value) => value.scheduleType !== "weekly_target" || value.weeklyTarget !== undefined, {
    message: "Weekly target habits require a weekly target."
  });

export const habitUpdateRequestSchema = z
  .object({
    color: z.string().max(32).nullable().optional(),
    description: z.string().max(4000).nullable().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    scheduleType: habitScheduleTypeSchema.optional(),
    targetUnit: z.string().max(40).nullable().optional(),
    targetValue: z.number().positive().max(1_000_000).optional(),
    weekdays: habitWeekdaysSchema.optional(),
    weeklyTarget: z.number().int().min(1).max(7).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one habit field is required."
  });

export const habitLogRequestSchema = z.object({
  logDate: z.string().min(1).optional(),
  note: z.string().max(2000).nullable().optional(),
  value: z.number().positive().max(1_000_000).optional()
});

export const habitLogSchema = z.object({
  createdAt: z.string().min(1),
  habitId: z.string().uuid(),
  id: z.string().uuid(),
  logDate: z.string().min(1),
  note: z.string().nullable(),
  status: habitLogStatusSchema,
  unit: z.string().nullable(),
  updatedAt: z.string().min(1),
  value: z.number().min(0)
});

export const habitLogPageSchema = z.object({
  items: z.array(habitLogSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const habitSummarySchema = z.object({
  activeHabitCount: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  completedLogCount: z.number().int().min(0),
  completionRate: z.number().min(0).max(1),
  currentStreakTotal: z.number().int().min(0),
  endDate: z.string().min(1),
  gardenGrowthPoints: z.number().int().min(0),
  period: reviewPeriodSchema,
  recoveryStreakTotal: z.number().int().min(0),
  scheduledCount: z.number().int().min(0),
  startDate: z.string().min(1)
});

export const dailyCheckInUpsertSchema = z.object({
  energy: z.number().int().min(1).max(5).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(2000).nullable().optional()
});

export const dailyCheckInSchema = z.object({
  checkInDate: z.string().min(1),
  createdAt: z.string().min(1),
  energy: z.number().int().min(1).max(5).nullable(),
  id: z.string().uuid(),
  mood: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
  updatedAt: z.string().min(1)
});

export const weeklyReviewUpsertSchema = z.object({
  challenges: z.string().max(4000).nullable().optional(),
  nextSteps: z.string().max(4000).nullable().optional(),
  weekStart: z.string().min(1),
  wins: z.string().max(4000).nullable().optional()
});

export const weeklyReviewSchema = z.object({
  challenges: z.string().nullable(),
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  metadata: z.record(z.unknown()),
  nextSteps: z.string().nullable(),
  period: reviewPeriodSchema,
  updatedAt: z.string().min(1),
  weekStart: z.string().min(1),
  wins: z.string().nullable()
});

export const weeklyReviewPageSchema = z.object({
  items: z.array(weeklyReviewSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const learningRecordStatusSchema = z.enum(["active", "archived"]);

export const courseStatusSchema = z.enum(["draft", "active", "archived"]);

export const lessonStatusSchema = z.enum(["draft", "active", "completed"]);

export const learningResourceTypeSchema = z.enum(["document", "link", "note", "video", "file"]);

export const studySessionModeSchema = z.enum([
  "guided_course",
  "free_exploration",
  "document_based",
  "project_based",
  "exam_preparation",
  "coding_practice",
  "quick_review"
]);

export const quizStatusSchema = z.enum(["draft", "active", "archived"]);

export const questionTypeSchema = z.enum(["multiple_choice", "free_text", "code"]);

export const flashcardStatusSchema = z.enum(["active", "archived"]);

export const flashcardReviewRatingSchema = z.enum(["again", "hard", "good", "easy"]);

export const learningGoalStatusSchema = z.enum(["active", "completed", "archived"]);

export const studyRoadmapStatusSchema = z.enum(["active", "completed", "archived"]);

export const subjectCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  name: z.string().trim().min(1).max(160)
});

export const subjectSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string().min(1),
  status: learningRecordStatusSchema,
  updatedAt: z.string().min(1)
});

export const subjectPageSchema = z.object({
  items: z.array(subjectSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const topicCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  name: z.string().trim().min(1).max(160),
  subjectId: z.string().uuid().nullable().optional()
});

export const topicSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string().min(1),
  status: learningRecordStatusSchema,
  subjectId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1)
});

export const topicPageSchema = z.object({
  items: z.array(topicSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const topicRelationCreateRequestSchema = z.object({
  prerequisiteTopicId: z.string().uuid()
});

export const topicRelationSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  relationType: z.string().min(1),
  sourceTopicId: z.string().uuid(),
  targetTopicId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const learningResourceCreateRequestSchema = z.object({
  fileId: z.string().uuid().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  resourceType: learningResourceTypeSchema,
  subjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  topicId: z.string().uuid().nullable().optional(),
  url: z.string().max(1000).nullable().optional()
});

export const learningResourceSchema = z.object({
  createdAt: z.string().min(1),
  fileId: z.string().uuid().nullable(),
  id: z.string().uuid(),
  notes: z.string().nullable(),
  resourceType: learningResourceTypeSchema,
  subjectId: z.string().uuid().nullable(),
  title: z.string().min(1),
  topicId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1),
  url: z.string().nullable()
});

export const learningResourcePageSchema = z.object({
  items: z.array(learningResourceSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const courseCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200)
});

export const courseSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  status: courseStatusSchema,
  subjectId: z.string().uuid().nullable(),
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const coursePageSchema = z.object({
  items: z.array(courseSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const courseModuleCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  position: z.number().int().min(0).optional(),
  title: z.string().trim().min(1).max(200)
});

export const courseModuleSchema = z.object({
  courseId: z.string().uuid(),
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  position: z.number().int().min(0),
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const lessonCreateRequestSchema = z.object({
  content: z.string().max(20000).nullable().optional(),
  estimatedMinutes: z.number().int().positive().max(5000).nullable().optional(),
  position: z.number().int().min(0).optional(),
  title: z.string().trim().min(1).max(200),
  topicId: z.string().uuid().nullable().optional()
});

export const lessonSchema = z.object({
  content: z.string().nullable(),
  createdAt: z.string().min(1),
  estimatedMinutes: z.number().int().positive().nullable(),
  id: z.string().uuid(),
  moduleId: z.string().uuid(),
  position: z.number().int().min(0),
  status: lessonStatusSchema,
  title: z.string().min(1),
  topicId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1)
});

export const studySessionCreateRequestSchema = z.object({
  courseId: z.string().uuid().nullable().optional(),
  lessonId: z.string().uuid().nullable().optional(),
  mode: studySessionModeSchema,
  notes: z.string().max(4000).nullable().optional(),
  startedAt: z.string().min(1).optional(),
  subjectId: z.string().uuid().nullable().optional(),
  topicId: z.string().uuid().nullable().optional()
});

export const studySessionEndRequestSchema = z.object({
  endedAt: z.string().min(1).optional(),
  notes: z.string().max(4000).nullable().optional()
});

export const studySessionSchema = z.object({
  courseId: z.string().uuid().nullable(),
  createdAt: z.string().min(1),
  durationMinutes: z.number().int().min(0).nullable(),
  endedAt: z.string().min(1).nullable(),
  id: z.string().uuid(),
  lessonId: z.string().uuid().nullable(),
  mode: studySessionModeSchema,
  notes: z.string().nullable(),
  startedAt: z.string().min(1),
  subjectId: z.string().uuid().nullable(),
  topicId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1)
});

export const studySessionPageSchema = z.object({
  items: z.array(studySessionSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const quizCreateRequestSchema = z.object({
  lessonId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  topicId: z.string().uuid().nullable().optional()
});

export const quizSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  lessonId: z.string().uuid().nullable(),
  status: quizStatusSchema,
  title: z.string().min(1),
  topicId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1)
});

export const quizPageSchema = z.object({
  items: z.array(quizSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const questionCreateRequestSchema = z
  .object({
    choices: z.array(z.string().min(1)).max(12).optional(),
    correctAnswer: z.string().max(4000).nullable().optional(),
    difficulty: z.number().int().min(1).max(5).optional(),
    explanation: z.string().max(4000).nullable().optional(),
    position: z.number().int().min(0).optional(),
    prompt: z.string().trim().min(1).max(12000),
    questionType: questionTypeSchema.optional()
  })
  .refine(
    (value) =>
      value.questionType !== "multiple_choice" ||
      (value.choices !== undefined && value.choices.length >= 2),
    { message: "Multiple-choice questions require at least two choices." }
  );

export const questionSchema = z.object({
  choices: z.array(z.string()),
  correctAnswer: z.string().nullable(),
  createdAt: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  explanation: z.string().nullable(),
  id: z.string().uuid(),
  position: z.number().int().min(0),
  prompt: z.string().min(1),
  questionType: questionTypeSchema,
  quizId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const attemptCreateRequestSchema = z
  .object({
    confidence: z.number().int().min(1).max(5).nullable().optional(),
    feedback: z.string().max(4000).nullable().optional(),
    hintsUsed: z.number().int().min(0).max(100).optional(),
    maxScore: z.number().positive(),
    questionId: z.string().uuid().nullable().optional(),
    score: z.number().min(0),
    submittedAnswer: z.string().max(12000).nullable().optional()
  })
  .refine((value) => value.score <= value.maxScore, {
    message: "Score cannot exceed max score."
  });

export const attemptSchema = z.object({
  accuracy: z.number().min(0).max(1),
  confidence: z.number().int().min(1).max(5).nullable(),
  createdAt: z.string().min(1),
  feedback: z.string().nullable(),
  hintsUsed: z.number().int().min(0),
  id: z.string().uuid(),
  maxScore: z.number().positive(),
  questionId: z.string().uuid().nullable(),
  quizId: z.string().uuid(),
  score: z.number().min(0),
  status: z.string().min(1),
  submittedAnswer: z.string().nullable(),
  updatedAt: z.string().min(1)
});

export const flashcardCreateRequestSchema = z.object({
  back: z.string().trim().min(1).max(12000),
  front: z.string().trim().min(1).max(12000),
  topicId: z.string().uuid().nullable().optional()
});

export const flashcardSchema = z.object({
  back: z.string().min(1),
  createdAt: z.string().min(1),
  front: z.string().min(1),
  id: z.string().uuid(),
  status: flashcardStatusSchema,
  topicId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1)
});

export const flashcardPageSchema = z.object({
  items: z.array(flashcardSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const flashcardReviewCreateRequestSchema = z.object({
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  rating: flashcardReviewRatingSchema,
  reviewedAt: z.string().min(1).optional()
});

export const flashcardReviewSchema = z.object({
  confidence: z.number().int().min(1).max(5).nullable(),
  createdAt: z.string().min(1),
  flashcardId: z.string().uuid(),
  id: z.string().uuid(),
  nextReviewAt: z.string().min(1).nullable(),
  rating: flashcardReviewRatingSchema,
  reviewedAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const masteryRecordSchema = z.object({
  calculation: z.record(z.unknown()),
  confidenceScore: z.number().min(0).max(1),
  createdAt: z.string().min(1),
  exerciseScore: z.number().min(0).max(1),
  hintsPenalty: z.number().min(0).max(1),
  id: z.string().uuid(),
  masteryScore: z.number().min(0).max(1),
  projectEvidenceScore: z.number().min(0).max(1),
  quizAccuracy: z.number().min(0).max(1),
  reviewRecencyScore: z.number().min(0).max(1),
  successfulRecallScore: z.number().min(0).max(1),
  topicId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const learningGoalCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  targetDate: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1).max(200),
  topicId: z.string().uuid().nullable().optional()
});

export const learningGoalSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  status: learningGoalStatusSchema,
  subjectId: z.string().uuid().nullable(),
  targetDate: z.string().min(1).nullable(),
  title: z.string().min(1),
  topicId: z.string().uuid().nullable(),
  updatedAt: z.string().min(1)
});

export const learningGoalPageSchema = z.object({
  items: z.array(learningGoalSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const studyRoadmapCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  steps: z.array(z.record(z.unknown())).max(100).optional(),
  subjectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200)
});

export const studyRoadmapSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  status: studyRoadmapStatusSchema,
  steps: z.array(z.record(z.unknown())),
  subjectId: z.string().uuid().nullable(),
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const studyRoadmapPageSchema = z.object({
  items: z.array(studyRoadmapSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const projectStatusSchema = z.enum(["active", "paused", "completed", "archived"]);

export const projectMilestoneStatusSchema = z.enum(["planned", "active", "completed", "blocked"]);

export const projectTaskStatusSchema = z.enum(["todo", "in_progress", "done", "blocked"]);

export const projectPrioritySchema = z.enum(["low", "medium", "high"]);

export const projectBlockerStatusSchema = z.enum(["open", "resolved"]);

export const projectActivityTypeSchema = z.enum([
  "project.created",
  "project.updated",
  "project.archived",
  "project.completed",
  "project.milestone_created",
  "project.task_created",
  "project.task_updated",
  "project.note_created",
  "project.link_created",
  "project.file_attached",
  "project.topic_linked",
  "project.technology_added",
  "project.blocker_created",
  "project.blocker_updated"
]);

export const projectCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  name: z.string().trim().min(1).max(200),
  objective: z.string().max(4000).nullable().optional(),
  repositoryUrl: z.string().url().nullable().optional(),
  startedOn: z.string().min(1).nullable().optional(),
  targetDate: z.string().min(1).nullable().optional()
});

export const projectUpdateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  objective: z.string().max(4000).nullable().optional(),
  repositoryUrl: z.string().url().nullable().optional(),
  startedOn: z.string().min(1).nullable().optional(),
  status: projectStatusSchema.optional(),
  targetDate: z.string().min(1).nullable().optional()
});

export const projectSchema = z.object({
  archivedAt: z.string().min(1).nullable(),
  completedAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  name: z.string().min(1),
  objective: z.string().nullable(),
  repositoryUrl: z.string().nullable(),
  startedOn: z.string().min(1).nullable(),
  status: projectStatusSchema,
  targetDate: z.string().min(1).nullable(),
  updatedAt: z.string().min(1)
});

export const projectPageSchema = z.object({
  items: z.array(projectSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const projectMilestoneCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  dueDate: z.string().min(1).nullable().optional(),
  position: z.number().int().min(0).optional(),
  title: z.string().trim().min(1).max(200)
});

export const projectMilestoneUpdateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  dueDate: z.string().min(1).nullable().optional(),
  position: z.number().int().min(0).optional(),
  status: projectMilestoneStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional()
});

export const projectMilestoneSchema = z.object({
  completedAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  dueDate: z.string().min(1).nullable(),
  id: z.string().uuid(),
  position: z.number().int().min(0),
  projectId: z.string().uuid(),
  status: projectMilestoneStatusSchema,
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const projectTaskCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  dueDate: z.string().min(1).nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  priority: projectPrioritySchema.optional(),
  title: z.string().trim().min(1).max(200)
});

export const projectTaskUpdateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  dueDate: z.string().min(1).nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  priority: projectPrioritySchema.optional(),
  status: projectTaskStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional()
});

export const projectTaskSchema = z.object({
  completedAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  dueDate: z.string().min(1).nullable(),
  id: z.string().uuid(),
  milestoneId: z.string().uuid().nullable(),
  priority: projectPrioritySchema,
  projectId: z.string().uuid(),
  status: projectTaskStatusSchema,
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const projectNoteCreateRequestSchema = z.object({
  body: z.string().trim().min(1).max(20000),
  title: z.string().trim().min(1).max(200)
});

export const projectNoteSchema = z.object({
  body: z.string().min(1),
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const projectLinkCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().url()
});

export const projectLinkSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  updatedAt: z.string().min(1),
  url: z.string().min(1)
});

export const projectFileCreateRequestSchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  fileId: z.string().uuid()
});

export const projectFileLinkSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  fileId: z.string().uuid(),
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const projectTopicCreateRequestSchema = z.object({
  topicId: z.string().uuid()
});

export const projectTopicLinkSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  topicId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const projectTechnologyCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

export const projectTechnologySchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  name: z.string().min(1),
  projectId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const projectBlockerCreateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  title: z.string().trim().min(1).max(200)
});

export const projectBlockerUpdateRequestSchema = z.object({
  description: z.string().max(4000).nullable().optional(),
  status: projectBlockerStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional()
});

export const projectBlockerSchema = z.object({
  createdAt: z.string().min(1),
  description: z.string().nullable(),
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  resolvedAt: z.string().min(1).nullable(),
  status: projectBlockerStatusSchema,
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const projectActivitySchema = z.object({
  activityType: projectActivityTypeSchema,
  createdAt: z.string().min(1),
  description: z.string().min(1),
  id: z.string().uuid(),
  metadata: z.record(z.unknown()),
  projectId: z.string().uuid()
});

export const projectActivityPageSchema = z.object({
  items: z.array(projectActivitySchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const projectDetailSchema = projectSchema.extend({
  blockers: z.array(projectBlockerSchema),
  files: z.array(projectFileLinkSchema),
  links: z.array(projectLinkSchema),
  milestones: z.array(projectMilestoneSchema),
  notes: z.array(projectNoteSchema),
  recentActivity: z.array(projectActivitySchema),
  tasks: z.array(projectTaskSchema),
  technologies: z.array(projectTechnologySchema),
  topics: z.array(projectTopicLinkSchema)
});

export const analyticsPeriodSchema = z.enum(["week", "month", "quarter", "year"]);

export const analyticsMetricKeySchema = z.enum([
  "study_minutes",
  "lessons_completed",
  "quiz_accuracy",
  "topic_mastery",
  "habit_completions",
  "habit_completion_rate",
  "project_progress",
  "files_processed",
  "files_opened",
  "ai_requests",
  "ai_tokens",
  "coding_sessions"
]);

export const analyticsMetricSchema = z.object({
  available: z.boolean(),
  explanation: z.string().min(1),
  key: analyticsMetricKeySchema,
  label: z.string().min(1),
  unit: z.string().min(1),
  value: z.number().nullable()
});

export const analyticsTrendBucketSchema = z.object({
  aiRequests: z.number().int().min(0),
  filesProcessed: z.number().int().min(0),
  habitCompletions: z.number().int().min(0),
  label: z.string().min(1),
  lessonsCompleted: z.number().int().min(0),
  periodEnd: z.string().min(1),
  periodStart: z.string().min(1),
  projectsCompleted: z.number().int().min(0),
  studyMinutes: z.number().int().min(0)
});

export const analyticsSummarySchema = z.object({
  generatedAt: z.string().min(1),
  metrics: z.array(analyticsMetricSchema),
  period: analyticsPeriodSchema,
  periodEnd: z.string().min(1),
  periodStart: z.string().min(1),
  trendBuckets: z.array(analyticsTrendBucketSchema)
});

export const aiFeatureSchema = z.enum([
  "general_chat",
  "embeddings",
  "document_qa",
  "mentor_chat",
  "learning_assistant",
  "coding_assistant"
]);

export const aiProviderKindSchema = z.enum([
  "aetherium_deterministic",
  "openai_compatible",
  "anthropic_compatible",
  "ollama_compatible"
]);

export const aiProviderCapabilitySchema = z.enum([
  "chat",
  "streaming_chat",
  "embeddings",
  "structured_outputs",
  "tool_calling"
]);

export const aiMessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

export const aiDataCategorySchema = z.enum([
  "file_content",
  "collections",
  "conversations",
  "projects",
  "learning_records",
  "habit_data",
  "profile_data"
]);

export const aiOperationSchema = z.enum([
  "chat_completion",
  "streaming_chat_completion",
  "embedding"
]);

export const aiUsageStatusSchema = z.enum(["success", "failed", "blocked", "rate_limited"]);

export const aiResponseFormatSchema = z.enum(["text", "json_object"]);

export const aiProviderSchema = z.object({
  capabilities: z.array(aiProviderCapabilitySchema),
  configured: z.boolean(),
  defaultChatModel: z.string().nullable(),
  defaultEmbeddingModel: z.string().nullable(),
  displayName: z.string().min(1),
  external: z.boolean(),
  kind: aiProviderKindSchema,
  name: z.string().min(1)
});

export const aiProviderPageSchema = z.object({
  items: z.array(aiProviderSchema)
});

export const aiConsentPolicySchema = z.object({
  allowCollections: z.boolean(),
  allowConversations: z.boolean(),
  allowFileContent: z.boolean(),
  allowHabitData: z.boolean(),
  allowLearningRecords: z.boolean(),
  allowProfileData: z.boolean(),
  allowProjects: z.boolean(),
  allowedCollectionIds: z.array(z.string()),
  createdAt: z.string().min(1),
  externalProvidersAllowed: z.boolean(),
  feature: aiFeatureSchema,
  id: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const aiConsentPolicyPageSchema = z.object({
  items: z.array(aiConsentPolicySchema)
});

export const aiConsentPolicyUpdateSchema = z
  .object({
    allowCollections: z.boolean().optional(),
    allowConversations: z.boolean().optional(),
    allowFileContent: z.boolean().optional(),
    allowHabitData: z.boolean().optional(),
    allowLearningRecords: z.boolean().optional(),
    allowProfileData: z.boolean().optional(),
    allowProjects: z.boolean().optional(),
    allowedCollectionIds: z.array(z.string()).optional(),
    externalProvidersAllowed: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one AI consent field is required."
  });

export const aiModelConfigurationSchema = z.object({
  createdAt: z.string().min(1),
  enabled: z.boolean(),
  fallbackModelName: z.string().nullable(),
  fallbackProviderName: z.string().nullable(),
  feature: aiFeatureSchema,
  id: z.string().uuid(),
  maxOutputTokens: z.number().int().positive(),
  modelName: z.string().min(1),
  providerKind: aiProviderKindSchema,
  providerName: z.string().min(1),
  temperature: z.number().min(0).max(2),
  updatedAt: z.string().min(1)
});

export const aiModelConfigurationPageSchema = z.object({
  items: z.array(aiModelConfigurationSchema)
});

export const aiModelConfigurationUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    fallbackModelName: z.string().nullable().optional(),
    fallbackProviderName: z.string().nullable().optional(),
    maxOutputTokens: z.number().int().min(1).max(8192).optional(),
    modelName: z.string().min(1).max(120).optional(),
    providerName: z.string().min(1).max(80).optional(),
    temperature: z.number().min(0).max(2).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one AI model configuration field is required."
  });

export const aiChatMessageSchema = z.object({
  content: z.string().min(1).max(12000),
  role: aiMessageRoleSchema
});

export const aiUsageSummarySchema = z.object({
  estimatedCostMicroUsd: z.number().int().min(0),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0)
});

export const aiChatCompletionRequestSchema = z.object({
  feature: aiFeatureSchema.optional(),
  maxOutputTokens: z.number().int().min(1).max(8192).optional(),
  messages: z.array(aiChatMessageSchema).min(1).max(30),
  modelName: z.string().max(120).optional(),
  providerName: z.string().max(80).optional(),
  requestedDataCategories: z.array(aiDataCategorySchema).max(10).optional(),
  responseFormat: aiResponseFormatSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  toolChoice: z.record(z.unknown()).optional(),
  tools: z.array(z.record(z.unknown())).max(20).optional()
});

export const aiChatCompletionResponseSchema = z.object({
  feature: aiFeatureSchema,
  message: aiChatMessageSchema,
  modelName: z.string().min(1),
  providerKind: aiProviderKindSchema,
  providerName: z.string().min(1),
  requestId: z.string().min(1),
  usage: aiUsageSummarySchema,
  usageRecordId: z.string().uuid(),
  usedFallback: z.boolean()
});

export const aiEmbeddingRequestSchema = z.object({
  feature: aiFeatureSchema.optional(),
  input: z.array(z.string().min(1).max(12000)).min(1).max(64),
  modelName: z.string().max(120).optional(),
  providerName: z.string().max(80).optional(),
  requestedDataCategories: z.array(aiDataCategorySchema).max(10).optional()
});

export const aiEmbeddingItemSchema = z.object({
  embedding: z.array(z.number()),
  index: z.number().int().min(0)
});

export const aiEmbeddingResponseSchema = z.object({
  data: z.array(aiEmbeddingItemSchema),
  feature: aiFeatureSchema,
  modelName: z.string().min(1),
  providerKind: aiProviderKindSchema,
  providerName: z.string().min(1),
  requestId: z.string().min(1),
  usage: aiUsageSummarySchema,
  usageRecordId: z.string().uuid(),
  usedFallback: z.boolean()
});

export const aiUsageRecordSchema = z.object({
  createdAt: z.string().min(1),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  estimatedCostMicroUsd: z.number().int().min(0),
  feature: aiFeatureSchema,
  id: z.string().uuid(),
  inputTokens: z.number().int().min(0),
  latencyMs: z.number().int().min(0),
  modelName: z.string().min(1),
  operation: aiOperationSchema,
  outputTokens: z.number().int().min(0),
  providerKind: aiProviderKindSchema,
  providerName: z.string().min(1),
  requestId: z.string().min(1),
  status: aiUsageStatusSchema,
  totalTokens: z.number().int().min(0),
  usedFallback: z.boolean()
});

export const aiUsageRecordPageSchema = z.object({
  items: z.array(aiUsageRecordSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const documentQAModeSchema = z.enum([
  "explain",
  "summarize",
  "compare",
  "quiz_me",
  "create_flashcards",
  "extract_tasks",
  "create_study_notes",
  "identify_contradictions"
]);

export const documentQAEvidenceStatusSchema = z.enum(["supported", "insufficient_evidence"]);

export const documentQARequestSchema = z.object({
  collectionIds: z.array(z.string().uuid()).max(20).optional(),
  fileIds: z.array(z.string().uuid()).max(20).optional(),
  maxSources: z.number().int().min(1).max(8).optional(),
  mode: documentQAModeSchema.optional(),
  modelName: z.string().max(120).optional(),
  providerName: z.string().max(80).optional(),
  question: z.string().trim().min(3).max(2000)
});

export const documentQACitationSchema = z.object({
  chunkId: z.string().uuid(),
  fileId: z.string().uuid(),
  fileName: z.string().min(1),
  label: z.string().min(1),
  metadata: z.record(z.unknown()),
  openUrl: z.string().min(1),
  pageNumber: z.number().int().nullable(),
  score: z.number(),
  sectionLabel: z.string().nullable(),
  snippet: z.string(),
  sourceType: z.literal("user_file_evidence")
});

export const documentQARetrievalSchema = z.object({
  candidateCount: z.number().int().min(0),
  retrievedCount: z.number().int().min(0),
  semanticEnabled: z.boolean(),
  usedCollectionFilter: z.boolean(),
  usedFileFilter: z.boolean()
});

export const documentQAResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(documentQACitationSchema),
  evidenceStatus: documentQAEvidenceStatusSchema,
  mode: documentQAModeSchema,
  modelName: z.string().nullable(),
  providerName: z.string().nullable(),
  question: z.string().min(1),
  retrieval: documentQARetrievalSchema,
  usage: aiUsageSummarySchema.nullable(),
  usageRecordId: z.string().uuid().nullable(),
  usedFallback: z.boolean()
});

export const mentorToneSchema = z.enum(["calm", "direct", "analytical", "encouraging"]);

export const mentorToolSchema = z.enum([
  "explain",
  "quiz",
  "flashcards",
  "summarize",
  "study_plan",
  "code_review"
]);

export const conversationStatusSchema = z.enum(["active", "archived", "deleted"]);

export const conversationMemoryPolicySchema = z.enum(["disabled", "session_only", "persistent"]);

export const messageStatusSchema = z.enum(["complete", "failed"]);

export const messageSourceTypeSchema = z.enum([
  "file_chunk",
  "general_model_knowledge",
  "user_message",
  "inference"
]);

export const mentorPermissionSchema = z.object({
  allowConversations: z.boolean(),
  allowFileContent: z.boolean(),
  allowHabitData: z.boolean(),
  allowLearningRecords: z.boolean(),
  allowProfileData: z.boolean(),
  allowProjects: z.boolean(),
  allowedCollectionIds: z.array(z.string()),
  allowedTools: z.array(mentorToolSchema),
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  mentorId: z.string().uuid(),
  updatedAt: z.string().min(1)
});

export const mentorSchema = z.object({
  archivedAt: z.string().min(1).nullable(),
  avatarReference: z.string().nullable(),
  createdAt: z.string().min(1),
  description: z.string().min(1),
  fictionalIdentity: z.string().min(1),
  id: z.string().uuid(),
  isDefault: z.boolean(),
  name: z.string().min(1),
  permissions: mentorPermissionSchema,
  preferredModelName: z.string().nullable(),
  slug: z.string().min(1),
  systemInstructions: z.string().min(1),
  tone: mentorToneSchema,
  updatedAt: z.string().min(1)
});

export const mentorPageSchema = z.object({
  items: z.array(mentorSchema)
});

export const mentorCreateRequestSchema = z.object({
  allowedTools: z.array(mentorToolSchema).max(20).optional(),
  avatarReference: z.string().max(160).nullable().optional(),
  description: z.string().min(1).max(2000),
  fictionalIdentity: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(80),
  preferredModelName: z.string().max(120).nullable().optional(),
  systemInstructions: z.string().min(20).max(12000),
  tone: mentorToneSchema.optional()
});

export const mentorUpdateRequestSchema = z
  .object({
    avatarReference: z.string().max(160).nullable().optional(),
    description: z.string().min(1).max(2000).optional(),
    fictionalIdentity: z.string().min(1).max(160).optional(),
    name: z.string().trim().min(1).max(80).optional(),
    preferredModelName: z.string().max(120).nullable().optional(),
    systemInstructions: z.string().min(20).max(12000).optional(),
    tone: mentorToneSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one mentor field is required."
  });

export const mentorPermissionUpdateSchema = z
  .object({
    allowConversations: z.boolean().optional(),
    allowFileContent: z.boolean().optional(),
    allowHabitData: z.boolean().optional(),
    allowLearningRecords: z.boolean().optional(),
    allowProfileData: z.boolean().optional(),
    allowProjects: z.boolean().optional(),
    allowedCollectionIds: z.array(z.string()).max(100).optional(),
    allowedTools: z.array(mentorToolSchema).max(20).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one mentor permission field is required."
  });

export const conversationMemorySettingsSchema = z.object({
  conversationId: z.string().uuid(),
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  memoryEnabled: z.boolean(),
  memoryPolicy: conversationMemoryPolicySchema,
  memorySummary: z.string().nullable(),
  updatedAt: z.string().min(1)
});

export const conversationSchema = z.object({
  archivedAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  deletedAt: z.string().min(1).nullable(),
  id: z.string().uuid(),
  lastMessageAt: z.string().min(1).nullable(),
  memorySettings: conversationMemorySettingsSchema,
  mentorId: z.string().uuid(),
  mentorName: z.string().min(1),
  messageCount: z.number().int().min(0),
  status: conversationStatusSchema,
  title: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const conversationPageSchema = z.object({
  items: z.array(conversationSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const conversationCreateRequestSchema = z.object({
  mentorId: z.string().uuid(),
  title: z.string().min(1).max(160).optional()
});

export const conversationUpdateRequestSchema = z
  .object({
    title: z.string().min(1).max(160).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one conversation field is required."
  });

export const conversationMemorySettingsUpdateSchema = z.object({
  memoryEnabled: z.boolean(),
  memoryPolicy: conversationMemoryPolicySchema.optional()
});

export const messageSourceSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().uuid(),
  messageId: z.string().uuid(),
  metadata: z.record(z.unknown()),
  pageNumber: z.number().int().nullable(),
  sectionLabel: z.string().nullable(),
  snippet: z.string().nullable(),
  sourceId: z.string().nullable(),
  sourceType: messageSourceTypeSchema,
  title: z.string().min(1),
  url: z.string().nullable()
});

export const messageSchema = z.object({
  aiUsageRecordId: z.string().uuid().nullable(),
  content: z.string(),
  conversationId: z.string().uuid(),
  createdAt: z.string().min(1),
  editedFromMessageId: z.string().uuid().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  id: z.string().uuid(),
  modelName: z.string().nullable(),
  providerName: z.string().nullable(),
  regeneratedFromMessageId: z.string().uuid().nullable(),
  role: aiMessageRoleSchema,
  status: messageStatusSchema,
  updatedAt: z.string().min(1)
});

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  total: z.number().int().min(0)
});

export const messageSendRequestSchema = z.object({
  content: z.string().trim().min(1).max(12000)
});

export const messageSendResponseSchema = z.object({
  assistantMessage: messageSchema,
  conversation: conversationSchema,
  userMessage: messageSchema.nullable()
});

export const conversationExportMessageSchema = messageSchema.extend({
  sources: z.array(messageSourceSchema)
});

export const conversationExportSchema = z.object({
  conversation: conversationSchema,
  exportedAt: z.string().min(1),
  mentor: mentorSchema,
  messages: z.array(conversationExportMessageSchema)
});

export const stopGenerationResponseSchema = z.object({
  reason: z.string().min(1),
  stopped: z.boolean()
});

export type HealthCheckResponseInput = z.input<typeof healthCheckResponseSchema>;
export type HealthCheckResponseOutput = z.output<typeof healthCheckResponseSchema>;
export type RegisterRequestInput = z.input<typeof registerRequestSchema>;
export type LoginRequestInput = z.input<typeof loginRequestSchema>;
