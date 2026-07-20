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

export type HealthCheckResponseInput = z.input<typeof healthCheckResponseSchema>;
export type HealthCheckResponseOutput = z.output<typeof healthCheckResponseSchema>;
export type RegisterRequestInput = z.input<typeof registerRequestSchema>;
export type LoginRequestInput = z.input<typeof loginRequestSchema>;
