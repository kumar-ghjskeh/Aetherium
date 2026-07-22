import type {
  AchievementPage,
  AchievementProcessResponse,
  AchievementSummary,
  ApiErrorBody,
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIConsentPolicyPage,
  AIConsentPolicyUpdate,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIFeature,
  AIModelConfigurationPage,
  AIModelConfigurationUpdate,
  AIProviderPage,
  AIUsageQuery,
  AIUsageRecordPage,
  AnalyticsPeriod,
  AnalyticsSummary,
  AuditLogPage,
  AuthResponse,
  Collection,
  CollectionCreateRequest,
  CollectionItemRequest,
  CollectionPage,
  Conversation,
  ConversationCreateRequest,
  ConversationExport,
  ConversationMemorySettings,
  ConversationMemorySettingsUpdate,
  ConversationPage,
  ConversationUpdateRequest,
  DocumentQARequest,
  DocumentQAResponse,
  DownloadUrlResponse,
  DomainEvent,
  DomainEventCreateRequest,
  DomainEventListQuery,
  DomainEventPage,
  FileChunkPage,
  FileListQuery,
  FilePage,
  FileTagCreateRequest,
  FileUpdateRequest,
  DailyCheckIn,
  DailyCheckInUpsert,
  Habit,
  HabitCreateRequest,
  HabitListQuery,
  HabitLog,
  HabitLogPage,
  HabitLogRequest,
  HabitPage,
  HabitSummary,
  HabitSummaryQuery,
  HabitUpdateRequest,
  HealthCheckResponse,
  LoginRequest,
  Attempt,
  AttemptCreateRequest,
  Mentor,
  MentorCreateRequest,
  MentorPage,
  MentorPermission,
  MentorPermissionUpdate,
  MentorUpdateRequest,
  MessagePage,
  MessageSendRequest,
  MessageSendResponse,
  Notification,
  NotificationListQuery,
  NotificationPage,
  PaginationQuery,
  Course,
  CourseCreateRequest,
  CourseModule,
  CourseModuleCreateRequest,
  CoursePage,
  Flashcard,
  FlashcardCreateRequest,
  FlashcardPage,
  FlashcardReview,
  FlashcardReviewCreateRequest,
  LearningGoal,
  LearningGoalCreateRequest,
  LearningGoalPage,
  LearningResource,
  LearningResourceCreateRequest,
  LearningResourceListQuery,
  LearningResourcePage,
  Lesson,
  LessonCreateRequest,
  MasteryRecord,
  ProcessingJobPage,
  ProcessingJob,
  Project,
  ProjectActivityPage,
  ProjectBlocker,
  ProjectBlockerCreateRequest,
  ProjectBlockerUpdateRequest,
  ProjectCreateRequest,
  ProjectDetail,
  ProjectFileCreateRequest,
  ProjectFileLink,
  ProjectLink,
  ProjectLinkCreateRequest,
  ProjectMilestone,
  ProjectMilestoneCreateRequest,
  ProjectMilestoneUpdateRequest,
  ProjectNote,
  ProjectNoteCreateRequest,
  ProjectPage,
  ProjectTask,
  ProjectTaskCreateRequest,
  ProjectTaskUpdateRequest,
  ProjectTechnology,
  ProjectTechnologyCreateRequest,
  ProjectTopicCreateRequest,
  ProjectTopicLink,
  ProjectUpdateRequest,
  PublicUser,
  Question,
  QuestionCreateRequest,
  Quiz,
  QuizCreateRequest,
  QuizPage,
  RecentSearchPage,
  RegisterRequest,
  SearchRequest,
  SearchResponse,
  StopGenerationResponse,
  StudyRoadmap,
  StudyRoadmapCreateRequest,
  StudyRoadmapPage,
  StudySession,
  StudySessionCreateRequest,
  StudySessionEndRequest,
  StudySessionPage,
  Subject,
  SubjectCreateRequest,
  SubjectPage,
  TagPage,
  Topic,
  TopicCreateRequest,
  TopicListQuery,
  TopicPage,
  TopicRelation,
  TopicRelationCreateRequest,
  UploadCompleteRequest,
  UploadInitiateRequest,
  UploadResponse,
  UserPreferences,
  UserPreferencesUpdate,
  VaultFile,
  WorldProfile,
  WorldProfileUpdate,
  WorldVisitRequest,
  WeeklyReview,
  WeeklyReviewPage,
  WeeklyReviewUpsert
} from "@aetherium/shared-types";
import {
  achievementPageSchema,
  achievementProcessResponseSchema,
  achievementSummarySchema,
  aiChatCompletionResponseSchema,
  aiConsentPolicyPageSchema,
  aiConsentPolicySchema,
  aiEmbeddingResponseSchema,
  aiModelConfigurationPageSchema,
  aiModelConfigurationSchema,
  aiProviderPageSchema,
  aiUsageRecordPageSchema,
  analyticsSummarySchema,
  apiErrorBodySchema,
  auditLogPageSchema,
  authResponseSchema,
  collectionPageSchema,
  collectionSchema,
  conversationExportSchema,
  conversationMemorySettingsSchema,
  conversationPageSchema,
  conversationSchema,
  documentQAResponseSchema,
  downloadUrlResponseSchema,
  domainEventPageSchema,
  domainEventSchema,
  fileChunkPageSchema,
  filePageSchema,
  tagPageSchema,
  dailyCheckInSchema,
  habitLogPageSchema,
  habitLogSchema,
  habitPageSchema,
  habitSchema,
  habitSummarySchema,
  healthCheckResponseSchema,
  attemptSchema,
  courseModuleSchema,
  coursePageSchema,
  courseSchema,
  flashcardPageSchema,
  flashcardReviewSchema,
  flashcardSchema,
  mentorPageSchema,
  mentorPermissionSchema,
  mentorSchema,
  messagePageSchema,
  messageSendResponseSchema,
  notificationSchema,
  notificationPageSchema,
  learningGoalPageSchema,
  learningGoalSchema,
  learningResourcePageSchema,
  learningResourceSchema,
  lessonSchema,
  masteryRecordSchema,
  processingJobPageSchema,
  processingJobSchema,
  projectActivityPageSchema,
  projectBlockerSchema,
  projectDetailSchema,
  projectFileLinkSchema,
  projectLinkSchema,
  projectMilestoneSchema,
  projectNoteSchema,
  projectPageSchema,
  projectSchema,
  projectTaskSchema,
  projectTechnologySchema,
  projectTopicLinkSchema,
  publicUserSchema,
  questionSchema,
  quizPageSchema,
  quizSchema,
  recentSearchPageSchema,
  searchResponseSchema,
  stopGenerationResponseSchema,
  studyRoadmapPageSchema,
  studyRoadmapSchema,
  studySessionPageSchema,
  studySessionSchema,
  subjectPageSchema,
  subjectSchema,
  uploadResponseSchema,
  topicPageSchema,
  topicRelationSchema,
  topicSchema,
  userPreferencesSchema,
  vaultFileSchema,
  weeklyReviewPageSchema,
  weeklyReviewSchema,
  worldProfileSchema
} from "@aetherium/validation";

export interface AetheriumApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export interface AetheriumApiClient {
  achievements: {
    list: (query?: PaginationQuery & { unlockedOnly?: boolean }) => Promise<AchievementPage>;
    process: () => Promise<AchievementProcessResponse>;
    summary: () => Promise<AchievementSummary>;
  };
  ai: {
    answerDocumentQuestion: (payload: DocumentQARequest) => Promise<DocumentQAResponse>;
    completeChat: (payload: AIChatCompletionRequest) => Promise<AIChatCompletionResponse>;
    createEmbeddings: (payload: AIEmbeddingRequest) => Promise<AIEmbeddingResponse>;
    listConsent: () => Promise<AIConsentPolicyPage>;
    listModelConfigs: () => Promise<AIModelConfigurationPage>;
    listProviders: () => Promise<AIProviderPage>;
    listUsage: (query?: AIUsageQuery) => Promise<AIUsageRecordPage>;
    streamChat: (payload: AIChatCompletionRequest) => Promise<Response>;
    updateConsent: (
      feature: AIFeature,
      payload: AIConsentPolicyUpdate
    ) => Promise<AIConsentPolicyPage["items"][number]>;
    updateModelConfig: (
      feature: AIFeature,
      payload: AIModelConfigurationUpdate
    ) => Promise<AIModelConfigurationPage["items"][number]>;
  };
  analytics: {
    summary: (query?: { period?: AnalyticsPeriod }) => Promise<AnalyticsSummary>;
  };
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
  files: {
    addFileToCollection: (
      collectionId: string,
      payload: CollectionItemRequest
    ) => Promise<VaultFile>;
    addTag: (fileId: string, payload: FileTagCreateRequest) => Promise<VaultFile>;
    completeUpload: (uploadId: string, payload: UploadCompleteRequest) => Promise<VaultFile>;
    createCollection: (payload: CollectionCreateRequest) => Promise<Collection>;
    createUpload: (payload: UploadInitiateRequest) => Promise<UploadResponse>;
    download: (fileId: string) => Promise<DownloadUrlResponse>;
    favorite: (fileId: string) => Promise<VaultFile>;
    get: (fileId: string) => Promise<VaultFile>;
    list: (query?: FileListQuery) => Promise<FilePage>;
    listChunks: (fileId: string, query?: PaginationQuery) => Promise<FileChunkPage>;
    listCollections: (query?: PaginationQuery) => Promise<CollectionPage>;
    listFileProcessingJobs: (fileId: string, query?: PaginationQuery) => Promise<ProcessingJobPage>;
    listProcessingJobs: (query?: PaginationQuery) => Promise<ProcessingJobPage>;
    listTags: (query?: PaginationQuery) => Promise<TagPage>;
    permanentDelete: (fileId: string) => Promise<void>;
    queueProcessing: (fileId: string) => Promise<ProcessingJob>;
    removeFileFromCollection: (collectionId: string, fileId: string) => Promise<VaultFile>;
    removeTag: (fileId: string, tagId: string) => Promise<VaultFile>;
    restore: (fileId: string) => Promise<VaultFile>;
    retryProcessingJob: (jobId: string) => Promise<ProcessingJob>;
    softDelete: (fileId: string) => Promise<VaultFile>;
    unfavorite: (fileId: string) => Promise<VaultFile>;
    update: (fileId: string, payload: FileUpdateRequest) => Promise<VaultFile>;
  };
  habits: {
    archive: (habitId: string) => Promise<Habit>;
    create: (payload: HabitCreateRequest) => Promise<Habit>;
    get: (habitId: string) => Promise<Habit>;
    getCheckIn: (checkInDate: string) => Promise<DailyCheckIn | null>;
    getSummary: (query?: HabitSummaryQuery) => Promise<HabitSummary>;
    list: (query?: HabitListQuery) => Promise<HabitPage>;
    listLogs: (habitId: string, query?: PaginationQuery) => Promise<HabitLogPage>;
    listWeeklyReviews: (query?: PaginationQuery) => Promise<WeeklyReviewPage>;
    log: (habitId: string, payload: HabitLogRequest) => Promise<HabitLog>;
    update: (habitId: string, payload: HabitUpdateRequest) => Promise<Habit>;
    upsertCheckIn: (checkInDate: string, payload: DailyCheckInUpsert) => Promise<DailyCheckIn>;
    upsertWeeklyReview: (payload: WeeklyReviewUpsert) => Promise<WeeklyReview>;
  };
  learning: {
    addPrerequisite: (
      topicId: string,
      payload: TopicRelationCreateRequest
    ) => Promise<TopicRelation>;
    addQuestion: (quizId: string, payload: QuestionCreateRequest) => Promise<Question>;
    completeLesson: (lessonId: string) => Promise<Lesson>;
    createCourse: (payload: CourseCreateRequest) => Promise<Course>;
    createFlashcard: (payload: FlashcardCreateRequest) => Promise<Flashcard>;
    createGoal: (payload: LearningGoalCreateRequest) => Promise<LearningGoal>;
    createModule: (courseId: string, payload: CourseModuleCreateRequest) => Promise<CourseModule>;
    createQuiz: (payload: QuizCreateRequest) => Promise<Quiz>;
    createResource: (payload: LearningResourceCreateRequest) => Promise<LearningResource>;
    createRoadmap: (payload: StudyRoadmapCreateRequest) => Promise<StudyRoadmap>;
    createSession: (payload: StudySessionCreateRequest) => Promise<StudySession>;
    createSubject: (payload: SubjectCreateRequest) => Promise<Subject>;
    createTopic: (payload: TopicCreateRequest) => Promise<Topic>;
    createLesson: (moduleId: string, payload: LessonCreateRequest) => Promise<Lesson>;
    endSession: (sessionId: string, payload: StudySessionEndRequest) => Promise<StudySession>;
    getMastery: (topicId: string) => Promise<MasteryRecord>;
    listCourses: (query?: PaginationQuery) => Promise<CoursePage>;
    listFlashcards: (query?: PaginationQuery) => Promise<FlashcardPage>;
    listGoals: (query?: PaginationQuery) => Promise<LearningGoalPage>;
    listQuizzes: (query?: PaginationQuery) => Promise<QuizPage>;
    listResources: (query?: LearningResourceListQuery) => Promise<LearningResourcePage>;
    listRoadmaps: (query?: PaginationQuery) => Promise<StudyRoadmapPage>;
    listSessions: (query?: PaginationQuery) => Promise<StudySessionPage>;
    listSubjects: (query?: PaginationQuery & { includeArchived?: boolean }) => Promise<SubjectPage>;
    listTopics: (query?: TopicListQuery) => Promise<TopicPage>;
    reviewFlashcard: (
      flashcardId: string,
      payload: FlashcardReviewCreateRequest
    ) => Promise<FlashcardReview>;
    submitAttempt: (quizId: string, payload: AttemptCreateRequest) => Promise<Attempt>;
  };
  projects: {
    addTechnology: (
      projectId: string,
      payload: ProjectTechnologyCreateRequest
    ) => Promise<ProjectTechnology>;
    archive: (projectId: string) => Promise<Project>;
    attachFile: (projectId: string, payload: ProjectFileCreateRequest) => Promise<ProjectFileLink>;
    create: (payload: ProjectCreateRequest) => Promise<Project>;
    createBlocker: (
      projectId: string,
      payload: ProjectBlockerCreateRequest
    ) => Promise<ProjectBlocker>;
    createLink: (projectId: string, payload: ProjectLinkCreateRequest) => Promise<ProjectLink>;
    createMilestone: (
      projectId: string,
      payload: ProjectMilestoneCreateRequest
    ) => Promise<ProjectMilestone>;
    createTask: (projectId: string, payload: ProjectTaskCreateRequest) => Promise<ProjectTask>;
    get: (projectId: string) => Promise<ProjectDetail>;
    linkTopic: (projectId: string, payload: ProjectTopicCreateRequest) => Promise<ProjectTopicLink>;
    list: (query?: PaginationQuery & { includeArchived?: boolean }) => Promise<ProjectPage>;
    listActivity: (projectId: string, query?: PaginationQuery) => Promise<ProjectActivityPage>;
    createNote: (projectId: string, payload: ProjectNoteCreateRequest) => Promise<ProjectNote>;
    update: (projectId: string, payload: ProjectUpdateRequest) => Promise<Project>;
    updateBlocker: (
      blockerId: string,
      payload: ProjectBlockerUpdateRequest
    ) => Promise<ProjectBlocker>;
    updateMilestone: (
      milestoneId: string,
      payload: ProjectMilestoneUpdateRequest
    ) => Promise<ProjectMilestone>;
    updateTask: (taskId: string, payload: ProjectTaskUpdateRequest) => Promise<ProjectTask>;
  };
  health: {
    live: () => Promise<HealthCheckResponse>;
    ready: () => Promise<HealthCheckResponse>;
  };
  mentors: {
    archive: (mentorId: string) => Promise<Mentor>;
    archiveConversation: (conversationId: string) => Promise<Conversation>;
    create: (payload: MentorCreateRequest) => Promise<Mentor>;
    createConversation: (payload: ConversationCreateRequest) => Promise<Conversation>;
    deleteConversation: (conversationId: string) => Promise<void>;
    editAndResendMessage: (
      conversationId: string,
      messageId: string,
      payload: MessageSendRequest
    ) => Promise<MessageSendResponse>;
    exportConversation: (conversationId: string) => Promise<ConversationExport>;
    get: (mentorId: string) => Promise<Mentor>;
    getConversation: (conversationId: string) => Promise<Conversation>;
    getPermissions: (mentorId: string) => Promise<MentorPermission>;
    list: (query?: { includeArchived?: boolean }) => Promise<MentorPage>;
    listConversations: (
      query?: PaginationQuery & { includeArchived?: boolean }
    ) => Promise<ConversationPage>;
    listMessages: (conversationId: string, query?: PaginationQuery) => Promise<MessagePage>;
    regenerateMessage: (conversationId: string, messageId: string) => Promise<MessageSendResponse>;
    sendMessage: (
      conversationId: string,
      payload: MessageSendRequest
    ) => Promise<MessageSendResponse>;
    stopGeneration: (conversationId: string) => Promise<StopGenerationResponse>;
    update: (mentorId: string, payload: MentorUpdateRequest) => Promise<Mentor>;
    updateConversation: (
      conversationId: string,
      payload: ConversationUpdateRequest
    ) => Promise<Conversation>;
    updateMemory: (
      conversationId: string,
      payload: ConversationMemorySettingsUpdate
    ) => Promise<ConversationMemorySettings>;
    updatePermissions: (
      mentorId: string,
      payload: MentorPermissionUpdate
    ) => Promise<MentorPermission>;
  };
  notifications: {
    list: (query?: NotificationListQuery) => Promise<NotificationPage>;
    markRead: (notificationId: string) => Promise<Notification>;
  };
  search: {
    recent: (query?: PaginationQuery) => Promise<RecentSearchPage>;
    run: (payload: SearchRequest) => Promise<SearchResponse>;
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

function aiUsageQuery(query?: AIUsageQuery): string {
  return queryString([
    ["feature", query?.feature],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function analyticsQuery(query?: { period?: AnalyticsPeriod }): string {
  return queryString([["period", query?.period]]);
}

function achievementListQuery(query?: PaginationQuery & { unlockedOnly?: boolean }): string {
  return queryString([
    ["limit", query?.limit],
    ["offset", query?.offset],
    ["unlockedOnly", query?.unlockedOnly]
  ]);
}

function mentorListQuery(query?: { includeArchived?: boolean }): string {
  return queryString([["includeArchived", query?.includeArchived]]);
}

function conversationListQuery(query?: PaginationQuery & { includeArchived?: boolean }): string {
  return queryString([
    ["includeArchived", query?.includeArchived],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function fileListQuery(query?: FileListQuery): string {
  return queryString([
    ["collectionId", query?.collectionId],
    ["favoriteOnly", query?.favoriteOnly],
    ["includeDeleted", query?.includeDeleted],
    ["limit", query?.limit],
    ["offset", query?.offset],
    ["query", query?.query],
    ["tagId", query?.tagId]
  ]);
}

function habitListQuery(query?: HabitListQuery): string {
  return queryString([
    ["includeArchived", query?.includeArchived],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function habitSummaryQuery(query?: HabitSummaryQuery): string {
  return queryString([
    ["period", query?.period],
    ["startDate", query?.startDate]
  ]);
}

function subjectListQuery(query?: PaginationQuery & { includeArchived?: boolean }): string {
  return queryString([
    ["includeArchived", query?.includeArchived],
    ["limit", query?.limit],
    ["offset", query?.offset]
  ]);
}

function topicListQuery(query?: TopicListQuery): string {
  return queryString([
    ["includeArchived", query?.includeArchived],
    ["limit", query?.limit],
    ["offset", query?.offset],
    ["subjectId", query?.subjectId]
  ]);
}

function learningResourceListQuery(query?: LearningResourceListQuery): string {
  return queryString([
    ["limit", query?.limit],
    ["offset", query?.offset],
    ["topicId", query?.topicId]
  ]);
}

function projectListQuery(query?: PaginationQuery & { includeArchived?: boolean }): string {
  return queryString([
    ["includeArchived", query?.includeArchived],
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
    achievements: {
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/achievements${achievementListQuery(query)}`
        );
        return achievementPageSchema.parse(response);
      },
      process: async () => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/achievements/process",
          {
            method: "POST"
          }
        );
        return achievementProcessResponseSchema.parse(response);
      },
      summary: async () => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/achievements/summary"
        );
        return achievementSummarySchema.parse(response);
      }
    },
    ai: {
      answerDocumentQuestion: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/document-qa", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return documentQAResponseSchema.parse(response);
      },
      completeChat: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/ai/chat/completions",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return aiChatCompletionResponseSchema.parse(response);
      },
      createEmbeddings: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/embeddings", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return aiEmbeddingResponseSchema.parse(response);
      },
      listConsent: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/consent");
        return aiConsentPolicyPageSchema.parse(response);
      },
      listModelConfigs: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/model-configs");
        return aiModelConfigurationPageSchema.parse(response);
      },
      listProviders: async () => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/ai/providers");
        return aiProviderPageSchema.parse(response);
      },
      listUsage: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/ai/usage${aiUsageQuery(query)}`
        );
        return aiUsageRecordPageSchema.parse(response);
      },
      streamChat: async (payload) => {
        const response = await fetcher(
          `${normalizeBaseUrl(options.baseUrl)}/api/v1/ai/chat/completions/stream`,
          {
            body: JSON.stringify(payload),
            credentials: "include",
            headers: {
              Accept: "text/event-stream",
              "Content-Type": "application/json"
            },
            method: "POST"
          }
        );
        if (!response.ok) {
          throw new AetheriumApiError(response.status, await parseErrorResponse(response));
        }
        return response;
      },
      updateConsent: async (feature, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/ai/consent/${feature}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return aiConsentPolicySchema.parse(response);
      },
      updateModelConfig: async (feature, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/ai/model-configs/${feature}`,
          {
            body: JSON.stringify(payload),
            method: "PUT"
          }
        );
        return aiModelConfigurationSchema.parse(response);
      }
    },
    analytics: {
      summary: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/analytics/summary${analyticsQuery(query)}`
        );
        return analyticsSummarySchema.parse(response);
      }
    },
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
    files: {
      addFileToCollection: async (collectionId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/collections/${collectionId}/items`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return vaultFileSchema.parse(response);
      },
      addTag: async (fileId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/tags`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return vaultFileSchema.parse(response);
      },
      completeUpload: async (uploadId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/uploads/${uploadId}/complete`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return vaultFileSchema.parse(response);
      },
      createCollection: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/files/collections", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return collectionSchema.parse(response);
      },
      createUpload: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/files/uploads", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return uploadResponseSchema.parse(response);
      },
      download: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/download`
        );
        return downloadUrlResponseSchema.parse(response);
      },
      favorite: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/favorite`,
          { method: "POST" }
        );
        return vaultFileSchema.parse(response);
      },
      get: async (fileId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}`);
        return vaultFileSchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files${fileListQuery(query)}`
        );
        return filePageSchema.parse(response);
      },
      listChunks: async (fileId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/chunks${paginationQuery(query)}`
        );
        return fileChunkPageSchema.parse(response);
      },
      listCollections: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/collections${paginationQuery(query)}`
        );
        return collectionPageSchema.parse(response);
      },
      listFileProcessingJobs: async (fileId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/processing-jobs${paginationQuery(query)}`
        );
        return processingJobPageSchema.parse(response);
      },
      listProcessingJobs: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/processing-jobs${paginationQuery(query)}`
        );
        return processingJobPageSchema.parse(response);
      },
      listTags: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/tags${paginationQuery(query)}`
        );
        return tagPageSchema.parse(response);
      },
      permanentDelete: async (fileId) => {
        await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}/permanent`, {
          method: "DELETE"
        });
      },
      queueProcessing: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/processing-jobs`,
          { method: "POST" }
        );
        return processingJobSchema.parse(response);
      },
      removeFileFromCollection: async (collectionId, fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/collections/${collectionId}/items/${fileId}`,
          { method: "DELETE" }
        );
        return vaultFileSchema.parse(response);
      },
      removeTag: async (fileId, tagId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/tags/${tagId}`,
          { method: "DELETE" }
        );
        return vaultFileSchema.parse(response);
      },
      retryProcessingJob: async (jobId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/processing-jobs/${jobId}/retry`,
          { method: "POST" }
        );
        return processingJobSchema.parse(response);
      },
      restore: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/restore`,
          { method: "POST" }
        );
        return vaultFileSchema.parse(response);
      },
      softDelete: async (fileId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}`, {
          method: "DELETE"
        });
        return vaultFileSchema.parse(response);
      },
      unfavorite: async (fileId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/files/${fileId}/favorite`,
          { method: "DELETE" }
        );
        return vaultFileSchema.parse(response);
      },
      update: async (fileId, payload) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/files/${fileId}`, {
          body: JSON.stringify(payload),
          method: "PATCH"
        });
        return vaultFileSchema.parse(response);
      }
    },
    habits: {
      archive: async (habitId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/${habitId}/archive`,
          { method: "POST" }
        );
        return habitSchema.parse(response);
      },
      create: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/habits", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return habitSchema.parse(response);
      },
      get: async (habitId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/habits/${habitId}`);
        return habitSchema.parse(response);
      },
      getCheckIn: async (checkInDate) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/check-ins/${checkInDate}`
        );
        return response === null ? null : dailyCheckInSchema.parse(response);
      },
      getSummary: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/summary${habitSummaryQuery(query)}`
        );
        return habitSummarySchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits${habitListQuery(query)}`
        );
        return habitPageSchema.parse(response);
      },
      listLogs: async (habitId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/${habitId}/logs${paginationQuery(query)}`
        );
        return habitLogPageSchema.parse(response);
      },
      listWeeklyReviews: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/weekly-reviews${paginationQuery(query)}`
        );
        return weeklyReviewPageSchema.parse(response);
      },
      log: async (habitId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/${habitId}/logs`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return habitLogSchema.parse(response);
      },
      update: async (habitId, payload) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/habits/${habitId}`, {
          body: JSON.stringify(payload),
          method: "PATCH"
        });
        return habitSchema.parse(response);
      },
      upsertCheckIn: async (checkInDate, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/habits/check-ins/${checkInDate}`,
          {
            body: JSON.stringify(payload),
            method: "PUT"
          }
        );
        return dailyCheckInSchema.parse(response);
      },
      upsertWeeklyReview: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/habits/weekly-reviews",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return weeklyReviewSchema.parse(response);
      }
    },
    learning: {
      addPrerequisite: async (topicId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/topics/${topicId}/prerequisites`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return topicRelationSchema.parse(response);
      },
      addQuestion: async (quizId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/quizzes/${quizId}/questions`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return questionSchema.parse(response);
      },
      completeLesson: async (lessonId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/lessons/${lessonId}/complete`,
          { method: "POST" }
        );
        return lessonSchema.parse(response);
      },
      createCourse: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/courses", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return courseSchema.parse(response);
      },
      createFlashcard: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/learning/flashcards",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return flashcardSchema.parse(response);
      },
      createGoal: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/goals", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return learningGoalSchema.parse(response);
      },
      createLesson: async (moduleId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/modules/${moduleId}/lessons`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return lessonSchema.parse(response);
      },
      createModule: async (courseId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/courses/${courseId}/modules`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return courseModuleSchema.parse(response);
      },
      createQuiz: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/quizzes", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return quizSchema.parse(response);
      },
      createResource: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/resources", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return learningResourceSchema.parse(response);
      },
      createRoadmap: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/roadmaps", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return studyRoadmapSchema.parse(response);
      },
      createSession: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/learning/study-sessions",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return studySessionSchema.parse(response);
      },
      createSubject: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/subjects", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return subjectSchema.parse(response);
      },
      createTopic: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/learning/topics", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return topicSchema.parse(response);
      },
      endSession: async (sessionId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/study-sessions/${sessionId}/end`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return studySessionSchema.parse(response);
      },
      getMastery: async (topicId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/topics/${topicId}/mastery`
        );
        return masteryRecordSchema.parse(response);
      },
      listCourses: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/courses${paginationQuery(query)}`
        );
        return coursePageSchema.parse(response);
      },
      listFlashcards: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/flashcards${paginationQuery(query)}`
        );
        return flashcardPageSchema.parse(response);
      },
      listGoals: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/goals${paginationQuery(query)}`
        );
        return learningGoalPageSchema.parse(response);
      },
      listQuizzes: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/quizzes${paginationQuery(query)}`
        );
        return quizPageSchema.parse(response);
      },
      listResources: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/resources${learningResourceListQuery(query)}`
        );
        return learningResourcePageSchema.parse(response);
      },
      listRoadmaps: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/roadmaps${paginationQuery(query)}`
        );
        return studyRoadmapPageSchema.parse(response);
      },
      listSessions: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/study-sessions${paginationQuery(query)}`
        );
        return studySessionPageSchema.parse(response);
      },
      listSubjects: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/subjects${subjectListQuery(query)}`
        );
        return subjectPageSchema.parse(response);
      },
      listTopics: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/topics${topicListQuery(query)}`
        );
        return topicPageSchema.parse(response);
      },
      reviewFlashcard: async (flashcardId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/flashcards/${flashcardId}/reviews`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return flashcardReviewSchema.parse(response);
      },
      submitAttempt: async (quizId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/learning/quizzes/${quizId}/attempts`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return attemptSchema.parse(response);
      }
    },
    projects: {
      addTechnology: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/technologies`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectTechnologySchema.parse(response);
      },
      archive: async (projectId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/archive`,
          { method: "POST" }
        );
        return projectSchema.parse(response);
      },
      attachFile: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/files`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectFileLinkSchema.parse(response);
      },
      create: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/projects", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return projectSchema.parse(response);
      },
      createBlocker: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/blockers`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectBlockerSchema.parse(response);
      },
      createLink: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/links`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectLinkSchema.parse(response);
      },
      createMilestone: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/milestones`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectMilestoneSchema.parse(response);
      },
      createNote: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/notes`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectNoteSchema.parse(response);
      },
      createTask: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/tasks`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectTaskSchema.parse(response);
      },
      get: async (projectId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}`
        );
        return projectDetailSchema.parse(response);
      },
      linkTopic: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/topics`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return projectTopicLinkSchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects${projectListQuery(query)}`
        );
        return projectPageSchema.parse(response);
      },
      listActivity: async (projectId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}/activity${paginationQuery(query)}`
        );
        return projectActivityPageSchema.parse(response);
      },
      update: async (projectId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/${projectId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return projectSchema.parse(response);
      },
      updateBlocker: async (blockerId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/blockers/${blockerId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return projectBlockerSchema.parse(response);
      },
      updateMilestone: async (milestoneId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/milestones/${milestoneId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return projectMilestoneSchema.parse(response);
      },
      updateTask: async (taskId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/projects/tasks/${taskId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return projectTaskSchema.parse(response);
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
    mentors: {
      archive: async (mentorId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}/archive`,
          { method: "POST" }
        );
        return mentorSchema.parse(response);
      },
      archiveConversation: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/archive`,
          { method: "POST" }
        );
        return conversationSchema.parse(response);
      },
      create: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/mentors", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return mentorSchema.parse(response);
      },
      createConversation: async (payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          "/api/v1/mentors/conversations",
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return conversationSchema.parse(response);
      },
      deleteConversation: async (conversationId) => {
        await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}`,
          { method: "DELETE" }
        );
      },
      editAndResendMessage: async (conversationId, messageId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages/${messageId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return messageSendResponseSchema.parse(response);
      },
      exportConversation: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/export`
        );
        return conversationExportSchema.parse(response);
      },
      get: async (mentorId) => {
        const response = await requestJson(fetcher, options.baseUrl, `/api/v1/mentors/${mentorId}`);
        return mentorSchema.parse(response);
      },
      getConversation: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}`
        );
        return conversationSchema.parse(response);
      },
      getPermissions: async (mentorId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}/permissions`
        );
        return mentorPermissionSchema.parse(response);
      },
      list: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors${mentorListQuery(query)}`
        );
        return mentorPageSchema.parse(response);
      },
      listConversations: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations${conversationListQuery(query)}`
        );
        return conversationPageSchema.parse(response);
      },
      listMessages: async (conversationId, query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages${paginationQuery(query)}`
        );
        return messagePageSchema.parse(response);
      },
      regenerateMessage: async (conversationId, messageId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages/${messageId}/regenerate`,
          { method: "POST" }
        );
        return messageSendResponseSchema.parse(response);
      },
      sendMessage: async (conversationId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/messages`,
          {
            body: JSON.stringify(payload),
            method: "POST"
          }
        );
        return messageSendResponseSchema.parse(response);
      },
      stopGeneration: async (conversationId) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/stop`,
          { method: "POST" }
        );
        return stopGenerationResponseSchema.parse(response);
      },
      update: async (mentorId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return mentorSchema.parse(response);
      },
      updateConversation: async (conversationId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return conversationSchema.parse(response);
      },
      updateMemory: async (conversationId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/conversations/${conversationId}/memory`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return conversationMemorySettingsSchema.parse(response);
      },
      updatePermissions: async (mentorId, payload) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/mentors/${mentorId}/permissions`,
          {
            body: JSON.stringify(payload),
            method: "PATCH"
          }
        );
        return mentorPermissionSchema.parse(response);
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
    search: {
      recent: async (query) => {
        const response = await requestJson(
          fetcher,
          options.baseUrl,
          `/api/v1/search/recent${paginationQuery(query)}`
        );
        return recentSearchPageSchema.parse(response);
      },
      run: async (payload) => {
        const response = await requestJson(fetcher, options.baseUrl, "/api/v1/search", {
          body: JSON.stringify(payload),
          method: "POST"
        });
        return searchResponseSchema.parse(response);
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
