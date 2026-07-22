import { describe, expect, it, vi } from "vitest";

import { createAetheriumApiClient } from "./index";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    },
    status
  });
}

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

const vaultFile = {
  collectionIds: [],
  contentType: "application/pdf",
  createdAt: "2026-07-20T00:00:00Z",
  deletedAt: null,
  deletionStatus: "active",
  displayName: "Lecture notes",
  fileExtension: ".pdf",
  fileKind: "pdf",
  id: "77777777-7777-4777-8777-777777777777",
  isFavorite: false,
  malwareScanStatus: "not_configured",
  originalFileName: "notes.pdf",
  processingStatus: "not_started",
  sanitizedFileName: "notes.pdf",
  sizeBytes: 1024,
  tags: [],
  updatedAt: "2026-07-20T00:00:00Z"
};

const processingJob = {
  attemptCount: 1,
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  failureCount: 0,
  fileId: vaultFile.id,
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  lastErrorCode: null,
  lastErrorMessage: null,
  lockedAt: null,
  maxAttempts: 3,
  metadata: { queueName: "aetherium:file-ingestion" },
  nextAttemptAt: "2026-07-20T00:00:00Z",
  stage: "queued",
  startedAt: null,
  status: "queued",
  updatedAt: "2026-07-20T00:00:00Z"
};

const fileChunk = {
  chunkText: "Alpha systems notes.",
  createdAt: "2026-07-20T00:00:00Z",
  fileId: vaultFile.id,
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  pageNumber: null,
  processingJobId: processingJob.id,
  sectionLabel: "document",
  sequenceNumber: 0,
  sourceMetadata: { charStart: 0 },
  status: "ready",
  tokenEstimate: 5,
  updatedAt: "2026-07-20T00:00:00Z"
};

const searchResult = {
  createdAt: "2026-07-20T00:00:00Z",
  entityId: fileChunk.id,
  entityType: "file_chunk",
  id: `file_chunk:${fileChunk.id}`,
  matchReason: "file_content",
  openUrl: `/app/library?file=${vaultFile.id}&chunk=${fileChunk.id}`,
  score: 0.9,
  snippet: "Alpha systems notes.",
  source: {
    chunkId: fileChunk.id,
    fileId: vaultFile.id,
    pageNumber: null,
    sectionLabel: "document"
  },
  title: "Lecture notes content",
  worldLocationId: "library"
};

const habit = {
  archivedAt: null,
  color: "#5d8f7d",
  completedToday: false,
  createdAt: "2026-07-20T00:00:00Z",
  description: "Read one technical page without rushing.",
  id: "dddddddd-1111-4111-8111-111111111111",
  logCount30d: 0,
  name: "Deep reading",
  schedule: {
    createdAt: "2026-07-20T00:00:00Z",
    id: "dddddddd-2222-4222-8222-222222222222",
    scheduleType: "daily",
    startsOn: "2026-07-20",
    timeZone: "UTC",
    updatedAt: "2026-07-20T00:00:00Z",
    weekdays: [],
    weeklyTarget: null
  },
  status: "active",
  streak: {
    bestStreak: 0,
    completionRate30d: 0,
    createdAt: "2026-07-20T00:00:00Z",
    currentStreak: 0,
    id: "dddddddd-4444-4444-8444-444444444444",
    lastLoggedOn: null,
    recoveryStreak: 0,
    updatedAt: "2026-07-20T00:00:00Z"
  },
  target: {
    createdAt: "2026-07-20T00:00:00Z",
    id: "dddddddd-3333-4333-8333-333333333333",
    targetPeriod: "day",
    targetUnit: "pages",
    targetValue: 1,
    updatedAt: "2026-07-20T00:00:00Z"
  },
  updatedAt: "2026-07-20T00:00:00Z",
  valueType: "quantity"
};

const habitLog = {
  createdAt: "2026-07-20T00:05:00Z",
  habitId: habit.id,
  id: "dddddddd-5555-4555-8555-555555555555",
  logDate: "2026-07-20",
  note: "Finished a dense section.",
  status: "completed",
  unit: "pages",
  updatedAt: "2026-07-20T00:05:00Z",
  value: 2
};

const habitSummary = {
  activeHabitCount: 1,
  bestStreak: 1,
  completedLogCount: 1,
  completionRate: 1,
  currentStreakTotal: 1,
  endDate: "2026-07-26",
  gardenGrowthPoints: 1,
  period: "week",
  recoveryStreakTotal: 0,
  scheduledCount: 1,
  startDate: "2026-07-20"
};

const dailyCheckIn = {
  checkInDate: "2026-07-20",
  createdAt: "2026-07-20T00:00:00Z",
  energy: 4,
  id: "dddddddd-6666-4666-8666-666666666666",
  mood: 5,
  notes: "Focused start.",
  updatedAt: "2026-07-20T00:00:00Z"
};

const weeklyReview = {
  challenges: "One late night.",
  createdAt: "2026-07-20T00:00:00Z",
  id: "dddddddd-7777-4777-8777-777777777777",
  metadata: {},
  nextSteps: "Keep sessions shorter.",
  period: "week",
  updatedAt: "2026-07-20T00:00:00Z",
  weekStart: "2026-07-20",
  wins: "Logged the first habit."
};

const learningSubject = {
  createdAt: "2026-07-20T00:00:00Z",
  description: "Hardware and systems topics.",
  id: "eeeeeeee-1111-4111-8111-111111111111",
  name: "Computer Architecture",
  status: "active",
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningTopic = {
  createdAt: "2026-07-20T00:00:00Z",
  description: "Instruction overlap and hazards.",
  id: "eeeeeeee-2222-4222-8222-222222222222",
  name: "Pipelining",
  status: "active",
  subjectId: learningSubject.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const masteryRecord = {
  calculation: { method: "transparent_heuristic_v1" },
  confidenceScore: 0.75,
  createdAt: "2026-07-20T00:00:00Z",
  exerciseScore: 0.2,
  hintsPenalty: 0.1,
  id: "eeeeeeee-3333-4333-8333-333333333333",
  masteryScore: 0.56,
  projectEvidenceScore: 0,
  quizAccuracy: 0.8,
  reviewRecencyScore: 1,
  successfulRecallScore: 0.2,
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningCourse = {
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  id: "eeeeeeee-4444-4444-8444-444444444444",
  status: "active",
  subjectId: learningSubject.id,
  title: "Systems Path",
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningModule = {
  courseId: learningCourse.id,
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  id: "eeeeeeee-5555-4555-8555-555555555555",
  position: 0,
  title: "CPU Basics",
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningLesson = {
  content: null,
  createdAt: "2026-07-20T00:00:00Z",
  estimatedMinutes: 25,
  id: "eeeeeeee-6666-4666-8666-666666666666",
  moduleId: learningModule.id,
  position: 0,
  status: "active",
  title: "Hazards",
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const studySession = {
  courseId: null,
  createdAt: "2026-07-20T00:00:00Z",
  durationMinutes: null,
  endedAt: null,
  id: "eeeeeeee-7777-4777-8777-777777777777",
  lessonId: null,
  mode: "quick_review",
  notes: "Review hazards.",
  startedAt: "2026-07-20T00:00:00Z",
  subjectId: null,
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningQuiz = {
  createdAt: "2026-07-20T00:00:00Z",
  id: "eeeeeeee-8888-4888-8888-888888888888",
  lessonId: null,
  status: "active",
  title: "Pipeline hazards",
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningQuestion = {
  choices: [],
  correctAnswer: null,
  createdAt: "2026-07-20T00:00:00Z",
  difficulty: 3,
  explanation: null,
  id: "eeeeeeee-9999-4999-8999-999999999999",
  position: 0,
  prompt: "What is a data hazard?",
  questionType: "free_text",
  quizId: learningQuiz.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningAttempt = {
  accuracy: 0.8,
  confidence: 5,
  createdAt: "2026-07-20T00:00:00Z",
  feedback: null,
  hintsUsed: 1,
  id: "aaaaaaaa-1111-4111-8111-111111111111",
  maxScore: 10,
  questionId: learningQuestion.id,
  quizId: learningQuiz.id,
  score: 8,
  status: "completed",
  submittedAnswer: null,
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningFlashcard = {
  back: "A dependency between pipeline stages.",
  createdAt: "2026-07-20T00:00:00Z",
  front: "Data hazard",
  id: "aaaaaaaa-2222-4222-8222-222222222222",
  status: "active",
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const flashcardReview = {
  confidence: 4,
  createdAt: "2026-07-20T00:00:00Z",
  flashcardId: learningFlashcard.id,
  id: "aaaaaaaa-3333-4333-8333-333333333333",
  nextReviewAt: "2026-07-27T00:00:00Z",
  rating: "good",
  reviewedAt: "2026-07-20T00:00:00Z",
  updatedAt: "2026-07-20T00:00:00Z"
};

const learningGoal = {
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  id: "aaaaaaaa-4444-4444-8444-444444444444",
  status: "active",
  subjectId: null,
  targetDate: "2026-08-01",
  title: "Master hazards",
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const studyRoadmap = {
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  id: "aaaaaaaa-5555-4555-8555-555555555555",
  status: "active",
  steps: [{ label: "Review selected topic", topicId: learningTopic.id }],
  subjectId: null,
  title: "CPU path",
  updatedAt: "2026-07-20T00:00:00Z"
};

const project = {
  archivedAt: null,
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  description: "Build a small compiler study tool.",
  id: "bbbbbbbb-1111-4111-8111-111111111111",
  name: "Compiler Lab",
  objective: "Ship a parser prototype.",
  repositoryUrl: "https://github.com/example/compiler-lab",
  startedOn: "2026-07-20",
  status: "active",
  targetDate: "2026-08-15",
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectMilestone = {
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  dueDate: "2026-07-30",
  id: "bbbbbbbb-2222-4222-8222-222222222222",
  position: 0,
  projectId: project.id,
  status: "planned",
  title: "Parser milestone",
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectTask = {
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  description: null,
  dueDate: "2026-07-22",
  id: "bbbbbbbb-3333-4333-8333-333333333333",
  milestoneId: projectMilestone.id,
  priority: "high",
  projectId: project.id,
  status: "todo",
  title: "Tokenize input",
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectNote = {
  body: "Use a recursive descent parser first.",
  createdAt: "2026-07-20T00:00:00Z",
  id: "bbbbbbbb-4444-4444-8444-444444444444",
  projectId: project.id,
  title: "Implementation note",
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectLink = {
  createdAt: "2026-07-20T00:00:00Z",
  id: "bbbbbbbb-5555-4555-8555-555555555555",
  projectId: project.id,
  title: "Repo",
  updatedAt: "2026-07-20T00:00:00Z",
  url: "https://github.com/example/compiler-lab"
};

const projectFileLink = {
  createdAt: "2026-07-20T00:00:00Z",
  description: "Design notes",
  fileId: vaultFile.id,
  id: "bbbbbbbb-6666-4666-8666-666666666666",
  projectId: project.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectTopicLink = {
  createdAt: "2026-07-20T00:00:00Z",
  id: "bbbbbbbb-7777-4777-8777-777777777777",
  projectId: project.id,
  topicId: learningTopic.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectTechnology = {
  createdAt: "2026-07-20T00:00:00Z",
  id: "bbbbbbbb-8888-4888-8888-888888888888",
  name: "TypeScript",
  projectId: project.id,
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectBlocker = {
  createdAt: "2026-07-20T00:00:00Z",
  description: "Need parser error strategy.",
  id: "bbbbbbbb-9999-4999-8999-999999999999",
  projectId: project.id,
  resolvedAt: null,
  status: "open",
  title: "Error handling",
  updatedAt: "2026-07-20T00:00:00Z"
};

const projectActivity = {
  activityType: "project.created",
  createdAt: "2026-07-20T00:00:00Z",
  description: "Project created.",
  id: "cccccccc-1111-4111-8111-111111111111",
  metadata: { projectId: project.id },
  projectId: project.id
};

const projectDetail = {
  ...project,
  blockers: [projectBlocker],
  files: [projectFileLink],
  links: [projectLink],
  milestones: [projectMilestone],
  notes: [projectNote],
  recentActivity: [projectActivity],
  tasks: [projectTask],
  technologies: [projectTechnology],
  topics: [projectTopicLink]
};

const analyticsSummary = {
  generatedAt: "2026-07-20T00:00:00Z",
  metrics: [
    {
      available: true,
      explanation: "Sum of completed study-session duration minutes.",
      key: "study_minutes",
      label: "Study time",
      unit: "minutes",
      value: 45
    },
    {
      available: false,
      explanation: "Coding workspace session records do not exist yet.",
      key: "coding_sessions",
      label: "Coding sessions",
      unit: "sessions",
      value: null
    }
  ],
  period: "month",
  periodEnd: "2026-07-20",
  periodStart: "2026-06-21",
  trendBuckets: [
    {
      aiRequests: 1,
      filesProcessed: 1,
      habitCompletions: 1,
      label: "Jul 14 - Jul 20",
      lessonsCompleted: 1,
      periodEnd: "2026-07-20",
      periodStart: "2026-07-14",
      projectsCompleted: 1,
      studyMinutes: 45
    }
  ]
};

const achievementProgress = {
  category: "files",
  createdAt: "2026-07-20T00:00:00Z",
  definitionId: "dddddddd-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  description: "Upload your first Personal Vault file.",
  points: 10,
  progressCount: 1,
  rarity: "common",
  rewards: [
    {
      description: "Permanent achievement marker in the non-visual progression record.",
      id: "dddddddd-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      metadata: { slug: "first-file" },
      rewardType: "badge",
      title: "First File badge"
    }
  ],
  slug: "first-file",
  targetCount: 1,
  title: "First File",
  unlockedAt: "2026-07-20T00:05:00Z",
  updatedAt: "2026-07-20T00:00:00Z",
  worldUnlocks: [
    {
      achievementDefinitionId: "dddddddd-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      id: "dddddddd-cccc-4ccc-8ccc-cccccccccccc",
      locationId: "achievement_hall:first_file_display",
      rewardDefinitionId: "dddddddd-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      unlockedAt: "2026-07-20T00:05:00Z",
      unlockSource: "achievement"
    }
  ]
};

const achievementPage = {
  items: [achievementProgress],
  limit: 5,
  offset: 0,
  total: 1
};

const achievementSummary = {
  lockedCount: 6,
  recentUnlocks: [achievementProgress],
  totalAchievements: 7,
  totalPoints: 225,
  unlockedCount: 1,
  unlockedPoints: 10,
  worldUnlocks: achievementProgress.worldUnlocks
};

const achievementProcess = {
  newUnlockCount: 1,
  processedEventCount: 1,
  unlocked: [achievementProgress]
};

const userProfile = {
  avatarFileId: null,
  avatarKind: "preset",
  avatarPreset: "lumen",
  bio: "Learning systems and software.",
  createdAt: "2026-07-20T00:00:00Z",
  displayName: "Sai Kumar",
  email: "sai@example.com",
  headline: "Systems learner",
  id: "abababab-1111-4111-8111-111111111111",
  isEmailVerified: false,
  location: "United States",
  updatedAt: "2026-07-20T00:00:00Z",
  userId: "11111111-1111-4111-8111-111111111111",
  websiteUrl: "https://example.com"
};

const profileLink = {
  createdAt: "2026-07-20T00:00:00Z",
  id: "abababab-2222-4222-8222-222222222222",
  linkType: "portfolio",
  title: "Portfolio",
  updatedAt: "2026-07-20T00:00:00Z",
  url: "https://example.com"
};

const favoriteProject = {
  createdAt: "2026-07-20T00:00:00Z",
  id: "abababab-3333-4333-8333-333333333333",
  projectId: "aaaaaaaa-1111-4111-8111-111111111111",
  updatedAt: "2026-07-20T00:00:00Z"
};

const favoriteResource = {
  createdAt: "2026-07-20T00:00:00Z",
  fileId: null,
  id: "abababab-4444-4444-8444-444444444444",
  learningResourceId: null,
  notes: "Reference link.",
  resourceType: "external_link",
  title: "Resume",
  updatedAt: "2026-07-20T00:00:00Z",
  url: "https://example.com/resume"
};

const certificate = {
  createdAt: "2026-07-20T00:00:00Z",
  credentialUrl: "https://example.com/cert",
  expiresOn: null,
  fileId: null,
  id: "abababab-5555-4555-8555-555555555555",
  issuedOn: "2026-07-20",
  issuer: "Aetherium Institute",
  notes: null,
  title: "Systems Foundations",
  updatedAt: "2026-07-20T00:00:00Z"
};

const privacySettings = {
  aiMemoryEnabled: false,
  allowProfileInAiContext: false,
  allowProfileSearchIndexing: false,
  createdAt: "2026-07-20T00:00:00Z",
  id: "abababab-6666-4666-8666-666666666666",
  includeProfileInExports: true,
  productAnalyticsEnabled: false,
  profileVisibility: "private",
  showEmailOnProfile: false,
  updatedAt: "2026-07-20T00:00:00Z"
};

const dataExportRequest = {
  completedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  downloadUrl: null,
  expiresAt: null,
  id: "abababab-7777-4777-8777-777777777777",
  includedCategories: ["profile", "settings"],
  note: "Need a copy.",
  requestedAt: "2026-07-20T00:00:00Z",
  status: "requested",
  updatedAt: "2026-07-20T00:00:00Z"
};

const accountDeletionRequest = {
  canceledAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  id: "abababab-8888-4888-8888-888888888888",
  metadata: { execution: "manual_future_workflow" },
  reason: "Testing",
  requestedAt: "2026-07-20T00:00:00Z",
  scheduledDeletionAt: null,
  status: "requested",
  updatedAt: "2026-07-20T00:00:00Z"
};

const aiProvider = {
  capabilities: ["chat", "streaming_chat", "embeddings"],
  configured: true,
  defaultChatModel: "aetherium-deterministic-chat",
  defaultEmbeddingModel: "aetherium-deterministic-embedding",
  displayName: "Aetherium deterministic adapter",
  external: false,
  kind: "aetherium_deterministic",
  name: "aetherium_deterministic"
};

const aiConsentPolicy = {
  allowCollections: false,
  allowConversations: false,
  allowFileContent: false,
  allowHabitData: false,
  allowLearningRecords: false,
  allowProfileData: false,
  allowProjects: false,
  allowedCollectionIds: [],
  createdAt: "2026-07-20T00:00:00Z",
  externalProvidersAllowed: false,
  feature: "general_chat",
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  updatedAt: "2026-07-20T00:00:00Z"
};

const aiModelConfiguration = {
  createdAt: "2026-07-20T00:00:00Z",
  enabled: true,
  fallbackModelName: null,
  fallbackProviderName: null,
  feature: "general_chat",
  id: "f1111111-1111-4111-8111-111111111111",
  maxOutputTokens: 512,
  modelName: "aetherium-deterministic-chat",
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  temperature: 0.2,
  updatedAt: "2026-07-20T00:00:00Z"
};

const aiUsageRecord = {
  createdAt: "2026-07-20T00:00:00Z",
  errorCode: null,
  errorMessage: null,
  estimatedCostMicroUsd: 0,
  feature: "general_chat",
  id: "f2222222-2222-4222-8222-222222222222",
  inputTokens: 3,
  latencyMs: 5,
  modelName: "aetherium-deterministic-chat",
  operation: "chat_completion",
  outputTokens: 4,
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  requestId: "ai_test",
  status: "success",
  totalTokens: 7,
  usedFallback: false
};

const aiChatCompletion = {
  feature: "general_chat",
  message: {
    content: "Aetherium deterministic response: Explain indexes.",
    role: "assistant"
  },
  modelName: "aetherium-deterministic-chat",
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  requestId: "ai_test",
  usage: {
    estimatedCostMicroUsd: 0,
    inputTokens: 3,
    outputTokens: 4,
    totalTokens: 7
  },
  usageRecordId: aiUsageRecord.id,
  usedFallback: false
};

const aiEmbeddingResponse = {
  data: [{ embedding: [0.1, -0.2], index: 0 }],
  feature: "embeddings",
  modelName: "aetherium-deterministic-embedding",
  providerKind: "aetherium_deterministic",
  providerName: "aetherium_deterministic",
  requestId: "ai_embedding_test",
  usage: {
    estimatedCostMicroUsd: 0,
    inputTokens: 2,
    outputTokens: 0,
    totalTokens: 2
  },
  usageRecordId: "f3333333-3333-4333-8333-333333333333",
  usedFallback: false
};

const documentQAResponse = {
  answer: "Alpha systems use retrieval notes. [S1]",
  citations: [
    {
      chunkId: fileChunk.id,
      fileId: vaultFile.id,
      fileName: vaultFile.displayName,
      label: "S1",
      metadata: { sequenceNumber: 0 },
      openUrl: `/app/library?file=${vaultFile.id}&chunk=${fileChunk.id}`,
      pageNumber: null,
      score: 1.2,
      sectionLabel: "document",
      snippet: "Alpha systems notes.",
      sourceType: "user_file_evidence"
    }
  ],
  evidenceStatus: "supported",
  mode: "explain",
  modelName: "aetherium-deterministic-chat",
  providerName: "aetherium_deterministic",
  question: "What do the alpha notes say?",
  retrieval: {
    candidateCount: 1,
    retrievedCount: 1,
    semanticEnabled: false,
    usedCollectionFilter: false,
    usedFileFilter: true
  },
  usage: {
    estimatedCostMicroUsd: 0,
    inputTokens: 10,
    outputTokens: 5,
    totalTokens: 15
  },
  usageRecordId: aiUsageRecord.id,
  usedFallback: false
};

const mentorPermission = {
  allowConversations: false,
  allowFileContent: false,
  allowHabitData: false,
  allowLearningRecords: false,
  allowProfileData: false,
  allowProjects: false,
  allowedCollectionIds: [],
  allowedTools: ["explain", "quiz"],
  createdAt: "2026-07-20T00:00:00Z",
  id: "f4444444-4444-4444-8444-444444444444",
  mentorId: "f5555555-5555-4555-8555-555555555555",
  updatedAt: "2026-07-20T00:00:00Z"
};

const mentor = {
  archivedAt: null,
  avatarReference: null,
  createdAt: "2026-07-20T00:00:00Z",
  description: "General learning mentor.",
  fictionalIdentity: "A fictional AI mentor.",
  id: mentorPermission.mentorId,
  isDefault: true,
  name: "Lyra",
  permissions: mentorPermission,
  preferredModelName: null,
  slug: "lyra",
  systemInstructions: "Support practical learning without silently changing user data.",
  tone: "calm",
  updatedAt: "2026-07-20T00:00:00Z"
};

const conversationMemorySettings = {
  conversationId: "f6666666-6666-4666-8666-666666666666",
  createdAt: "2026-07-20T00:00:00Z",
  id: "f7777777-7777-4777-8777-777777777777",
  memoryEnabled: false,
  memoryPolicy: "disabled",
  memorySummary: null,
  updatedAt: "2026-07-20T00:00:00Z"
};

const conversation = {
  archivedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  deletedAt: null,
  id: conversationMemorySettings.conversationId,
  lastMessageAt: null,
  memorySettings: conversationMemorySettings,
  mentorId: mentor.id,
  mentorName: mentor.name,
  messageCount: 0,
  status: "active",
  title: "Index review",
  updatedAt: "2026-07-20T00:00:00Z"
};

const userMessage = {
  aiUsageRecordId: null,
  content: "Explain indexes.",
  conversationId: conversation.id,
  createdAt: "2026-07-20T00:00:00Z",
  editedFromMessageId: null,
  errorCode: null,
  errorMessage: null,
  id: "f8888888-8888-4888-8888-888888888888",
  modelName: null,
  providerName: null,
  regeneratedFromMessageId: null,
  role: "user",
  status: "complete",
  updatedAt: "2026-07-20T00:00:00Z"
};

const assistantMessage = {
  ...userMessage,
  aiUsageRecordId: aiUsageRecord.id,
  content: "Aetherium deterministic response: Explain indexes.",
  id: "f9999999-9999-4999-8999-999999999999",
  modelName: "aetherium-deterministic-chat",
  providerName: "aetherium_deterministic",
  role: "assistant"
};

const messageSendResponse = {
  assistantMessage,
  conversation: { ...conversation, lastMessageAt: "2026-07-20T00:01:00Z", messageCount: 2 },
  userMessage
};

describe("createAetheriumApiClient", () => {
  it("fetches and validates API liveness", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            checks: {},
            service: "api",
            status: "ok",
            version: "0.1.0"
          }),
          {
            headers: {
              "Content-Type": "application/json"
            },
            status: 200
          }
        )
      )
    );

    const client = createAetheriumApiClient({
      baseUrl: "http://localhost:8000/",
      fetcher
    });

    await expect(client.health.live()).resolves.toEqual({
      checks: {},
      service: "api",
      status: "ok",
      version: "0.1.0"
    });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/health/live", {
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });
  });

  it("updates user preferences through the settings API", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          aiMemoryEnabled: false,
          ambientAudioEnabled: false,
          backgroundMusicEnabled: false,
          cameraEffectsEnabled: false,
          createdAt: "2026-07-20T00:00:00Z",
          defaultInterfaceMode: "command",
          id: "22222222-2222-4222-8222-222222222222",
          locale: "en-US",
          performancePreset: "automatic",
          productAnalyticsEnabled: true,
          reducedMotion: true,
          theme: "dark",
          timeZone: "UTC",
          updatedAt: "2026-07-20T00:00:00Z"
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.settings.updatePreferences({
        productAnalyticsEnabled: true,
        reducedMotion: true,
        theme: "dark",
        timeZone: "UTC"
      })
    ).resolves.toMatchObject({
      productAnalyticsEnabled: true,
      reducedMotion: true,
      theme: "dark"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/settings/preferences", {
      body: JSON.stringify({
        productAnalyticsEnabled: true,
        reducedMotion: true,
        theme: "dark",
        timeZone: "UTC"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });
  });

  it("visits a non-visual world location through the world API", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          createdAt: "2026-07-20T00:00:00Z",
          currentLocationId: "library",
          id: "33333333-3333-4333-8333-333333333333",
          lastVisitedLocationId: "central_plaza",
          preferredNavigationMethod: "command_palette",
          spawnLocationId: "central_plaza",
          tutorialCompleted: false,
          unlockedLocationIds: ["central_plaza", "library"],
          updatedAt: "2026-07-20T00:00:00Z",
          visitedLocationIds: ["central_plaza", "library"],
          worldStateVersion: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.world.visit({ idempotencyKey: "visit-library-1", locationId: "library" })
    ).resolves.toMatchObject({
      currentLocationId: "library",
      lastVisitedLocationId: "central_plaza"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/world/visit", {
      body: JSON.stringify({ idempotencyKey: "visit-library-1", locationId: "library" }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("lists domain events with query parameters", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            {
              createdAt: "2026-07-20T00:00:00Z",
              eventType: "habit.logged",
              id: "44444444-4444-4444-8444-444444444444",
              idempotencyKey: "habit-log-1",
              occurredAt: "2026-07-20T00:00:00Z",
              payload: { habitId: "demo" }
            }
          ],
          limit: 1,
          offset: 0,
          total: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.domainEvents.list({ eventType: "habit.logged", limit: 1, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/domain-events?eventType=habit.logged&limit=1&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("marks notifications as read", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          actionUrl: null,
          body: "Your standalone Aetherium account is ready.",
          createdAt: "2026-07-20T00:00:00Z",
          id: "55555555-5555-4555-8555-555555555555",
          notificationType: "system",
          readAt: "2026-07-20T00:01:00Z",
          severity: "success",
          title: "Welcome to Aetherium"
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.notifications.markRead("55555555-5555-4555-8555-555555555555")
    ).resolves.toMatchObject({
      readAt: "2026-07-20T00:01:00Z"
    });
  });

  it("lists audit logs with pagination", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            {
              action: "user.registered",
              createdAt: "2026-07-20T00:00:00Z",
              entityId: "11111111-1111-4111-8111-111111111111",
              entityType: "user",
              id: "66666666-6666-4666-8666-666666666666",
              metadata: { source: "auth" }
            }
          ],
          limit: 20,
          offset: 0,
          total: 1
        })
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.auditLogs.list({ limit: 20, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/audit-logs?limit=20&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("initiates and completes file uploads through the file vault API", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      if (requestUrl(input).endsWith("/api/v1/files/uploads")) {
        return Promise.resolve(
          jsonResponse(
            {
              contentType: "application/pdf",
              createdAt: "2026-07-20T00:00:00Z",
              expiresAt: "2026-07-20T00:15:00Z",
              fileName: "notes.pdf",
              id: "88888888-8888-4888-8888-888888888888",
              sanitizedFileName: "notes.pdf",
              sizeBytes: 1024,
              status: "pending",
              uploadHeaders: { "Content-Type": "application/pdf" },
              uploadMethod: "PUT",
              uploadUrl: "https://storage.test/aetherium-private-files/notes.pdf"
            },
            201
          )
        );
      }

      return Promise.resolve(jsonResponse(vaultFile, 201));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.files.createUpload({
        contentType: "application/pdf",
        fileName: "notes.pdf",
        idempotencyKey: "upload-notes",
        sizeBytes: 1024
      })
    ).resolves.toMatchObject({ status: "pending" });
    await expect(
      client.files.completeUpload("88888888-8888-4888-8888-888888888888", {
        displayName: "Lecture notes",
        idempotencyKey: "complete-notes"
      })
    ).resolves.toMatchObject({ displayName: "Lecture notes" });

    expect(fetcher).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/files/uploads", {
      body: JSON.stringify({
        contentType: "application/pdf",
        fileName: "notes.pdf",
        idempotencyKey: "upload-notes",
        sizeBytes: 1024
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/files/uploads/88888888-8888-4888-8888-888888888888/complete",
      {
        body: JSON.stringify({
          displayName: "Lecture notes",
          idempotencyKey: "complete-notes"
        }),
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
  });

  it("lists files and requests download URLs", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      if (requestUrl(input).includes("/download")) {
        return Promise.resolve(
          jsonResponse({
            downloadHeaders: {},
            downloadMethod: "GET",
            downloadUrl: "https://storage.test/download",
            expiresAt: "2026-07-20T00:05:00Z",
            fileId: vaultFile.id
          })
        );
      }

      return Promise.resolve(
        jsonResponse({
          items: [vaultFile],
          limit: 10,
          offset: 0,
          total: 1
        })
      );
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.files.list({
        favoriteOnly: true,
        includeDeleted: false,
        limit: 10,
        offset: 0,
        query: "notes"
      })
    ).resolves.toMatchObject({ total: 1 });
    await expect(client.files.download(vaultFile.id)).resolves.toMatchObject({
      downloadMethod: "GET"
    });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/files?favoriteOnly=true&includeDeleted=false&limit=10&offset=0&query=notes",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("organizes vault files with collections, tags, and favorites", async () => {
    const collection = {
      createdAt: "2026-07-20T00:00:00Z",
      description: null,
      id: "99999999-9999-4999-8999-999999999999",
      name: "Class Notes",
      updatedAt: "2026-07-20T00:00:00Z"
    };
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/files/collections")) {
        return Promise.resolve(jsonResponse(collection, 201));
      }
      if (url.endsWith("/api/v1/files/tags")) {
        return Promise.resolve(
          jsonResponse({
            items: [
              {
                color: "#8fd1c7",
                createdAt: "2026-07-20T00:00:00Z",
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                name: "Research"
              }
            ],
            limit: 20,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(
        jsonResponse({
          ...vaultFile,
          collectionIds: [collection.id],
          isFavorite: true,
          tags: [
            {
              color: "#8fd1c7",
              createdAt: "2026-07-20T00:00:00Z",
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              name: "Research"
            }
          ]
        })
      );
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.files.createCollection({ name: "Class Notes" })).resolves.toMatchObject({
      name: "Class Notes"
    });
    await expect(client.files.favorite(vaultFile.id)).resolves.toMatchObject({ isFavorite: true });
    await expect(
      client.files.addTag(vaultFile.id, { color: "#8fd1c7", name: "Research" })
    ).resolves.toMatchObject({ tags: [{ name: "Research" }] });
    await expect(client.files.listTags()).resolves.toMatchObject({ total: 1 });
    await expect(
      client.files.addFileToCollection(collection.id, { fileId: vaultFile.id })
    ).resolves.toMatchObject({ collectionIds: [collection.id] });
  });

  it("tracks file processing jobs and chunks", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url.includes("/chunks")) {
        return Promise.resolve(
          jsonResponse({
            items: [fileChunk],
            limit: 20,
            offset: 0,
            total: 1
          })
        );
      }
      if (url.includes("/processing-jobs")) {
        if (init?.method === "POST") {
          return Promise.resolve(jsonResponse(processingJob, 200));
        }
        return Promise.resolve(
          jsonResponse({
            items: [processingJob],
            limit: 20,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(jsonResponse(vaultFile));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.files.listProcessingJobs()).resolves.toMatchObject({ total: 1 });
    await expect(client.files.listFileProcessingJobs(vaultFile.id)).resolves.toMatchObject({
      total: 1
    });
    await expect(client.files.queueProcessing(vaultFile.id)).resolves.toMatchObject({
      status: "queued"
    });
    await expect(client.files.retryProcessingJob(processingJob.id)).resolves.toMatchObject({
      status: "queued"
    });
    await expect(client.files.listChunks(vaultFile.id)).resolves.toMatchObject({ total: 1 });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/files/processing-jobs",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("runs global search and lists recent searches", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/search/recent?limit=5&offset=0")) {
        return Promise.resolve(
          jsonResponse({
            items: [
              {
                createdAt: "2026-07-20T00:00:00Z",
                entityTypes: ["file", "file_chunk"],
                filters: { mode: "hybrid", sort: "relevance" },
                id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                query: "alpha",
                resultCount: 1
              }
            ],
            limit: 5,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(
        jsonResponse({
          items: [searchResult],
          limit: 10,
          mode: "hybrid",
          offset: 0,
          query: "alpha",
          semanticEnabled: false,
          total: 1
        })
      );
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.search.run({
        entityTypes: ["file", "file_chunk"],
        limit: 10,
        query: "alpha"
      })
    ).resolves.toMatchObject({ total: 1 });
    await expect(client.search.recent({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });

    expect(fetcher).toHaveBeenNthCalledWith(1, "http://localhost:8000/api/v1/search", {
      body: JSON.stringify({
        entityTypes: ["file", "file_chunk"],
        limit: 10,
        query: "alpha"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("uses habit tracking endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url === "http://localhost:8000/api/v1/habits?includeArchived=true&limit=5&offset=0") {
        return Promise.resolve(jsonResponse({ items: [habit], limit: 5, offset: 0, total: 1 }));
      }
      if (url === "http://localhost:8000/api/v1/habits") {
        return Promise.resolve(jsonResponse(habit, 201));
      }
      if (url === `http://localhost:8000/api/v1/habits/${habit.id}`) {
        return Promise.resolve(jsonResponse({ ...habit, name: "Deep reading focus" }));
      }
      if (url === `http://localhost:8000/api/v1/habits/${habit.id}/archive`) {
        return Promise.resolve(jsonResponse({ ...habit, archivedAt: "2026-07-20T00:10:00Z" }));
      }
      if (url === `http://localhost:8000/api/v1/habits/${habit.id}/logs`) {
        return Promise.resolve(jsonResponse(habitLog, 201));
      }
      if (url === `http://localhost:8000/api/v1/habits/${habit.id}/logs?limit=10&offset=0`) {
        return Promise.resolve(jsonResponse({ items: [habitLog], limit: 10, offset: 0, total: 1 }));
      }
      if (url === "http://localhost:8000/api/v1/habits/summary?period=week") {
        return Promise.resolve(jsonResponse(habitSummary));
      }
      if (url === "http://localhost:8000/api/v1/habits/check-ins/2026-07-20") {
        if (init?.method === "PUT") {
          return Promise.resolve(jsonResponse(dailyCheckIn));
        }
        return Promise.resolve(jsonResponse(dailyCheckIn));
      }
      if (url === "http://localhost:8000/api/v1/habits/weekly-reviews") {
        return Promise.resolve(jsonResponse(weeklyReview, 201));
      }
      if (url === "http://localhost:8000/api/v1/habits/weekly-reviews?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [weeklyReview], limit: 5, offset: 0, total: 1 })
        );
      }
      return Promise.resolve(jsonResponse(habit));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.habits.list({ includeArchived: true, limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.habits.create({
        name: "Deep reading",
        scheduleType: "daily",
        targetUnit: "pages",
        targetValue: 1,
        valueType: "quantity"
      })
    ).resolves.toMatchObject({ name: "Deep reading" });
    await expect(client.habits.get(habit.id)).resolves.toMatchObject({
      name: "Deep reading focus"
    });
    await expect(
      client.habits.update(habit.id, { name: "Deep reading focus" })
    ).resolves.toMatchObject({
      name: "Deep reading focus"
    });
    await expect(
      client.habits.log(habit.id, {
        logDate: "2026-07-20",
        note: "Finished a dense section.",
        value: 2
      })
    ).resolves.toMatchObject({ status: "completed" });
    await expect(client.habits.listLogs(habit.id, { limit: 10, offset: 0 })).resolves.toMatchObject(
      { total: 1 }
    );
    await expect(client.habits.getSummary({ period: "week" })).resolves.toMatchObject({
      completionRate: 1
    });
    await expect(client.habits.getCheckIn("2026-07-20")).resolves.toMatchObject({
      mood: 5
    });
    await expect(
      client.habits.upsertCheckIn("2026-07-20", { energy: 4, mood: 5 })
    ).resolves.toMatchObject({
      energy: 4
    });
    await expect(
      client.habits.upsertWeeklyReview({
        nextSteps: "Keep sessions shorter.",
        weekStart: "2026-07-20",
        wins: "Logged the first habit."
      })
    ).resolves.toMatchObject({ wins: "Logged the first habit." });
    await expect(client.habits.listWeeklyReviews({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(client.habits.archive(habit.id)).resolves.toMatchObject({
      archivedAt: "2026-07-20T00:10:00Z"
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/habits?includeArchived=true&limit=5&offset=0",
      {
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      }
    );
  });

  it("uses learning and mastery endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (
        url ===
        "http://localhost:8000/api/v1/learning/subjects?includeArchived=true&limit=5&offset=0"
      ) {
        return Promise.resolve(
          jsonResponse({ items: [learningSubject], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/subjects") {
        return Promise.resolve(jsonResponse(learningSubject, 201));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/learning/topics?includeArchived=true&limit=5&offset=0&subjectId=${learningSubject.id}`
      ) {
        return Promise.resolve(
          jsonResponse({ items: [learningTopic], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/topics") {
        return Promise.resolve(jsonResponse(learningTopic, 201));
      }
      if (
        url === `http://localhost:8000/api/v1/learning/topics/${learningTopic.id}/prerequisites`
      ) {
        return Promise.resolve(
          jsonResponse({
            createdAt: "2026-07-20T00:00:00Z",
            id: "aaaaaaaa-6666-4666-8666-666666666666",
            relationType: "requires",
            sourceTopicId: learningTopic.id,
            targetTopicId: learningTopic.id,
            updatedAt: "2026-07-20T00:00:00Z"
          })
        );
      }
      if (url === `http://localhost:8000/api/v1/learning/topics/${learningTopic.id}/mastery`) {
        return Promise.resolve(jsonResponse(masteryRecord));
      }
      if (url === "http://localhost:8000/api/v1/learning/resources?limit=5&offset=0") {
        return Promise.resolve(jsonResponse({ items: [], limit: 5, offset: 0, total: 0 }));
      }
      if (url === "http://localhost:8000/api/v1/learning/resources") {
        return Promise.resolve(
          jsonResponse(
            {
              createdAt: "2026-07-20T00:00:00Z",
              fileId: null,
              id: "aaaaaaaa-7777-4777-8777-777777777777",
              notes: null,
              resourceType: "note",
              subjectId: learningSubject.id,
              title: "Hazard notes",
              topicId: learningTopic.id,
              updatedAt: "2026-07-20T00:00:00Z",
              url: null
            },
            201
          )
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/courses?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [learningCourse], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/courses") {
        return Promise.resolve(jsonResponse(learningCourse, 201));
      }
      if (url === `http://localhost:8000/api/v1/learning/courses/${learningCourse.id}/modules`) {
        return Promise.resolve(jsonResponse(learningModule, 201));
      }
      if (url === `http://localhost:8000/api/v1/learning/modules/${learningModule.id}/lessons`) {
        return Promise.resolve(jsonResponse(learningLesson, 201));
      }
      if (url === `http://localhost:8000/api/v1/learning/lessons/${learningLesson.id}/complete`) {
        return Promise.resolve(jsonResponse({ ...learningLesson, status: "completed" }));
      }
      if (url === "http://localhost:8000/api/v1/learning/study-sessions?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [studySession], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/study-sessions") {
        return Promise.resolve(jsonResponse(studySession, 201));
      }
      if (url === `http://localhost:8000/api/v1/learning/study-sessions/${studySession.id}/end`) {
        return Promise.resolve(
          jsonResponse({ ...studySession, durationMinutes: 25, endedAt: "2026-07-20T00:25:00Z" })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/quizzes?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [learningQuiz], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/quizzes") {
        return Promise.resolve(jsonResponse(learningQuiz, 201));
      }
      if (url === `http://localhost:8000/api/v1/learning/quizzes/${learningQuiz.id}/questions`) {
        return Promise.resolve(jsonResponse(learningQuestion, 201));
      }
      if (url === `http://localhost:8000/api/v1/learning/quizzes/${learningQuiz.id}/attempts`) {
        return Promise.resolve(jsonResponse(learningAttempt, 201));
      }
      if (url === "http://localhost:8000/api/v1/learning/flashcards?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [learningFlashcard], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/flashcards") {
        return Promise.resolve(jsonResponse(learningFlashcard, 201));
      }
      if (
        url === `http://localhost:8000/api/v1/learning/flashcards/${learningFlashcard.id}/reviews`
      ) {
        return Promise.resolve(jsonResponse(flashcardReview, 201));
      }
      if (url === "http://localhost:8000/api/v1/learning/goals?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [learningGoal], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/goals") {
        return Promise.resolve(jsonResponse(learningGoal, 201));
      }
      if (url === "http://localhost:8000/api/v1/learning/roadmaps?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [studyRoadmap], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/learning/roadmaps") {
        return Promise.resolve(jsonResponse(studyRoadmap, 201));
      }
      return Promise.resolve(jsonResponse({ items: [] }));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.learning.listSubjects({ includeArchived: true, limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.learning.createSubject({ name: "Computer Architecture" })
    ).resolves.toMatchObject({ name: "Computer Architecture" });
    await expect(
      client.learning.listTopics({
        includeArchived: true,
        limit: 5,
        offset: 0,
        subjectId: learningSubject.id
      })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.learning.createTopic({ name: "Pipelining", subjectId: learningSubject.id })
    ).resolves.toMatchObject({ subjectId: learningSubject.id });
    await expect(
      client.learning.addPrerequisite(learningTopic.id, { prerequisiteTopicId: learningTopic.id })
    ).resolves.toMatchObject({ relationType: "requires" });
    await expect(client.learning.getMastery(learningTopic.id)).resolves.toMatchObject({
      masteryScore: 0.56
    });
    await expect(client.learning.listResources({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 0
    });
    await expect(
      client.learning.createResource({
        resourceType: "note",
        subjectId: learningSubject.id,
        title: "Hazard notes",
        topicId: learningTopic.id
      })
    ).resolves.toMatchObject({ resourceType: "note" });
    await expect(client.learning.listCourses({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.learning.createCourse({ subjectId: learningSubject.id, title: "Systems Path" })
    ).resolves.toMatchObject({ title: "Systems Path" });
    await expect(
      client.learning.createModule(learningCourse.id, { position: 0, title: "CPU Basics" })
    ).resolves.toMatchObject({ courseId: learningCourse.id });
    await expect(
      client.learning.createLesson(learningModule.id, {
        position: 0,
        title: "Hazards",
        topicId: learningTopic.id
      })
    ).resolves.toMatchObject({ moduleId: learningModule.id });
    await expect(client.learning.completeLesson(learningLesson.id)).resolves.toMatchObject({
      status: "completed"
    });
    await expect(client.learning.listSessions({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.learning.createSession({ mode: "quick_review", topicId: learningTopic.id })
    ).resolves.toMatchObject({ mode: "quick_review" });
    await expect(client.learning.endSession(studySession.id, {})).resolves.toMatchObject({
      durationMinutes: 25
    });
    await expect(client.learning.listQuizzes({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.learning.createQuiz({ title: "Pipeline hazards", topicId: learningTopic.id })
    ).resolves.toMatchObject({ title: "Pipeline hazards" });
    await expect(
      client.learning.addQuestion(learningQuiz.id, {
        prompt: "What is a data hazard?",
        questionType: "free_text"
      })
    ).resolves.toMatchObject({ prompt: "What is a data hazard?" });
    await expect(
      client.learning.submitAttempt(learningQuiz.id, {
        confidence: 5,
        hintsUsed: 1,
        maxScore: 10,
        questionId: learningQuestion.id,
        score: 8
      })
    ).resolves.toMatchObject({ accuracy: 0.8 });
    await expect(client.learning.listFlashcards({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.learning.createFlashcard({
        back: "A dependency between pipeline stages.",
        front: "Data hazard",
        topicId: learningTopic.id
      })
    ).resolves.toMatchObject({ front: "Data hazard" });
    await expect(
      client.learning.reviewFlashcard(learningFlashcard.id, { confidence: 4, rating: "good" })
    ).resolves.toMatchObject({ rating: "good" });
    await expect(client.learning.listGoals({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.learning.createGoal({
        targetDate: "2026-08-01",
        title: "Master hazards",
        topicId: learningTopic.id
      })
    ).resolves.toMatchObject({ title: "Master hazards" });
    await expect(client.learning.listRoadmaps({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.learning.createRoadmap({
        steps: [{ label: "Review selected topic", topicId: learningTopic.id }],
        title: "CPU path"
      })
    ).resolves.toMatchObject({ title: "CPU path" });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/learning/subjects?includeArchived=true&limit=5&offset=0",
      {
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );
  });

  it("uses Project Dock endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url === "http://localhost:8000/api/v1/projects?includeArchived=true&limit=5&offset=0") {
        return Promise.resolve(jsonResponse({ items: [project], limit: 5, offset: 0, total: 1 }));
      }
      if (url === "http://localhost:8000/api/v1/projects") {
        return Promise.resolve(jsonResponse(project, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}`) {
        if (init?.method === "PATCH") {
          return Promise.resolve(jsonResponse({ ...project, status: "completed" }));
        }
        return Promise.resolve(jsonResponse(projectDetail));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/archive`) {
        return Promise.resolve(jsonResponse({ ...project, archivedAt: "2026-07-20T00:30:00Z" }));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/milestones`) {
        return Promise.resolve(jsonResponse(projectMilestone, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/milestones/${projectMilestone.id}`) {
        return Promise.resolve(jsonResponse({ ...projectMilestone, status: "active" }));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/tasks`) {
        return Promise.resolve(jsonResponse(projectTask, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/tasks/${projectTask.id}`) {
        return Promise.resolve(jsonResponse({ ...projectTask, status: "done" }));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/notes`) {
        return Promise.resolve(jsonResponse(projectNote, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/links`) {
        return Promise.resolve(jsonResponse(projectLink, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/files`) {
        return Promise.resolve(jsonResponse(projectFileLink, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/topics`) {
        return Promise.resolve(jsonResponse(projectTopicLink, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/technologies`) {
        return Promise.resolve(jsonResponse(projectTechnology, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/blockers`) {
        return Promise.resolve(jsonResponse(projectBlocker, 201));
      }
      if (url === `http://localhost:8000/api/v1/projects/blockers/${projectBlocker.id}`) {
        return Promise.resolve(
          jsonResponse({
            ...projectBlocker,
            resolvedAt: "2026-07-20T00:35:00Z",
            status: "resolved"
          })
        );
      }
      if (url === `http://localhost:8000/api/v1/projects/${project.id}/activity?limit=5&offset=0`) {
        return Promise.resolve(
          jsonResponse({ items: [projectActivity], limit: 5, offset: 0, total: 1 })
        );
      }
      return Promise.resolve(jsonResponse({ items: [] }));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.projects.list({ includeArchived: true, limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.projects.create({
        name: "Compiler Lab",
        objective: "Ship a parser prototype.",
        repositoryUrl: "https://github.com/example/compiler-lab"
      })
    ).resolves.toMatchObject({ name: "Compiler Lab" });
    await expect(client.projects.get(project.id)).resolves.toMatchObject({
      tasks: [{ title: "Tokenize input" }]
    });
    await expect(
      client.projects.update(project.id, { status: "completed" })
    ).resolves.toMatchObject({ status: "completed" });
    await expect(
      client.projects.createMilestone(project.id, {
        dueDate: "2026-07-30",
        title: "Parser milestone"
      })
    ).resolves.toMatchObject({ projectId: project.id });
    await expect(
      client.projects.updateMilestone(projectMilestone.id, { status: "active" })
    ).resolves.toMatchObject({ status: "active" });
    await expect(
      client.projects.createTask(project.id, {
        milestoneId: projectMilestone.id,
        priority: "high",
        title: "Tokenize input"
      })
    ).resolves.toMatchObject({ priority: "high" });
    await expect(
      client.projects.updateTask(projectTask.id, { status: "done" })
    ).resolves.toMatchObject({ status: "done" });
    await expect(
      client.projects.createNote(project.id, {
        body: "Use a recursive descent parser first.",
        title: "Implementation note"
      })
    ).resolves.toMatchObject({ title: "Implementation note" });
    await expect(
      client.projects.createLink(project.id, {
        title: "Repo",
        url: "https://github.com/example/compiler-lab"
      })
    ).resolves.toMatchObject({ title: "Repo" });
    await expect(
      client.projects.attachFile(project.id, { description: "Design notes", fileId: vaultFile.id })
    ).resolves.toMatchObject({ fileId: vaultFile.id });
    await expect(
      client.projects.linkTopic(project.id, { topicId: learningTopic.id })
    ).resolves.toMatchObject({ topicId: learningTopic.id });
    await expect(
      client.projects.addTechnology(project.id, { name: "TypeScript" })
    ).resolves.toMatchObject({ name: "TypeScript" });
    await expect(
      client.projects.createBlocker(project.id, {
        description: "Need parser error strategy.",
        title: "Error handling"
      })
    ).resolves.toMatchObject({ status: "open" });
    await expect(
      client.projects.updateBlocker(projectBlocker.id, { status: "resolved" })
    ).resolves.toMatchObject({ status: "resolved" });
    await expect(
      client.projects.listActivity(project.id, { limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(client.projects.archive(project.id)).resolves.toMatchObject({
      archivedAt: "2026-07-20T00:30:00Z"
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/projects?includeArchived=true&limit=5&offset=0",
      {
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );
  });

  it("fetches progress analytics summaries", async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(analyticsSummary)));
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    const result = await client.analytics.summary({ period: "month" });

    expect(result.period).toBe("month");
    expect(result.metrics[0]).toMatchObject({ key: "study_minutes", value: 45 });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/analytics/summary?period=month",
      {
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );
  });

  it("uses achievement progression endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/achievements?limit=5&offset=0&unlockedOnly=true")) {
        return Promise.resolve(jsonResponse(achievementPage));
      }
      if (url.endsWith("/api/v1/achievements/summary")) {
        return Promise.resolve(jsonResponse(achievementSummary));
      }
      if (url.endsWith("/api/v1/achievements/process")) {
        return Promise.resolve(jsonResponse(achievementProcess));
      }
      return Promise.resolve(jsonResponse({ error: { code: "not_found", message: url } }, 404));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.achievements.list({ limit: 5, offset: 0, unlockedOnly: true })
    ).resolves.toMatchObject({ total: 1 });
    await expect(client.achievements.summary()).resolves.toMatchObject({
      unlockedCount: 1,
      unlockedPoints: 10
    });
    await expect(client.achievements.process()).resolves.toMatchObject({
      newUnlockCount: 1,
      processedEventCount: 1
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/achievements/process", {
      credentials: "include",
      headers: { Accept: "application/json" },
      method: "POST"
    });
  });

  it("uses personal profile and settings endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url === "http://localhost:8000/api/v1/users/profile") {
        if (init?.method === "PATCH") {
          return Promise.resolve(jsonResponse({ ...userProfile, displayName: "Sai Updated" }));
        }
        return Promise.resolve(jsonResponse(userProfile));
      }
      if (url === "http://localhost:8000/api/v1/users/profile/links?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [profileLink], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/users/profile/links") {
        return Promise.resolve(jsonResponse(profileLink, 201));
      }
      if (url === `http://localhost:8000/api/v1/users/profile/links/${profileLink.id}`) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url === "http://localhost:8000/api/v1/users/profile/favorite-projects?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [favoriteProject], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/users/profile/favorite-projects") {
        return Promise.resolve(jsonResponse(favoriteProject, 201));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/users/profile/favorite-projects/${favoriteProject.projectId}`
      ) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (
        url === "http://localhost:8000/api/v1/users/profile/favorite-resources?limit=5&offset=0"
      ) {
        return Promise.resolve(
          jsonResponse({ items: [favoriteResource], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/users/profile/favorite-resources") {
        return Promise.resolve(jsonResponse(favoriteResource, 201));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/users/profile/favorite-resources/${favoriteResource.id}`
      ) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url === "http://localhost:8000/api/v1/users/profile/certificates?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [certificate], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/users/profile/certificates") {
        return Promise.resolve(jsonResponse(certificate, 201));
      }
      if (url === `http://localhost:8000/api/v1/users/profile/certificates/${certificate.id}`) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url === "http://localhost:8000/api/v1/users/privacy") {
        if (init?.method === "PATCH") {
          return Promise.resolve(
            jsonResponse({ ...privacySettings, allowProfileInAiContext: true })
          );
        }
        return Promise.resolve(jsonResponse(privacySettings));
      }
      if (url === "http://localhost:8000/api/v1/users/data-export-requests?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [dataExportRequest], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/users/data-export-requests") {
        return Promise.resolve(jsonResponse(dataExportRequest, 201));
      }
      if (url === "http://localhost:8000/api/v1/users/account-deletion-requests?limit=5&offset=0") {
        return Promise.resolve(
          jsonResponse({ items: [accountDeletionRequest], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/users/account-deletion-requests") {
        return Promise.resolve(jsonResponse(accountDeletionRequest, 201));
      }
      return Promise.resolve(jsonResponse({ error: { code: "not_found", message: url } }, 404));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.users.getProfile()).resolves.toMatchObject({ displayName: "Sai Kumar" });
    await expect(client.users.updateProfile({ displayName: "Sai Updated" })).resolves.toMatchObject(
      {
        displayName: "Sai Updated"
      }
    );
    await expect(client.users.listLinks({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.users.createLink({
        linkType: "portfolio",
        title: "Portfolio",
        url: "https://example.com"
      })
    ).resolves.toMatchObject({ linkType: "portfolio" });
    await expect(client.users.deleteLink(profileLink.id)).resolves.toBeUndefined();
    await expect(client.users.listFavoriteProjects({ limit: 5, offset: 0 })).resolves.toMatchObject(
      {
        total: 1
      }
    );
    await expect(
      client.users.setFavoriteProject({ projectId: favoriteProject.projectId })
    ).resolves.toMatchObject({ projectId: favoriteProject.projectId });
    await expect(
      client.users.removeFavoriteProject(favoriteProject.projectId)
    ).resolves.toBeUndefined();
    await expect(
      client.users.listFavoriteResources({ limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.users.createFavoriteResource({
        resourceType: "external_link",
        title: "Resume",
        url: "https://example.com/resume"
      })
    ).resolves.toMatchObject({ resourceType: "external_link" });
    await expect(client.users.removeFavoriteResource(favoriteResource.id)).resolves.toBeUndefined();
    await expect(client.users.listCertificates({ limit: 5, offset: 0 })).resolves.toMatchObject({
      total: 1
    });
    await expect(
      client.users.createCertificate({ title: "Systems Foundations" })
    ).resolves.toMatchObject({ title: "Systems Foundations" });
    await expect(client.users.deleteCertificate(certificate.id)).resolves.toBeUndefined();
    await expect(client.users.getPrivacy()).resolves.toMatchObject({
      profileVisibility: "private"
    });
    await expect(
      client.users.updatePrivacy({ allowProfileInAiContext: true })
    ).resolves.toMatchObject({ allowProfileInAiContext: true });
    await expect(
      client.users.listDataExportRequests({ limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.users.createDataExportRequest({
        idempotencyKey: "export-profile-1",
        includedCategories: ["profile"]
      })
    ).resolves.toMatchObject({ status: "requested" });
    await expect(
      client.users.listAccountDeletionRequests({ limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.users.createAccountDeletionRequest({
        confirmation: "DELETE MY AETHERIUM ACCOUNT",
        idempotencyKey: "delete-account-1"
      })
    ).resolves.toMatchObject({ status: "requested" });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/users/privacy", {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
  });

  it("uses provider-neutral AI gateway endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/ai/providers")) {
        return Promise.resolve(jsonResponse({ items: [aiProvider] }));
      }
      if (url.endsWith("/api/v1/ai/consent")) {
        return Promise.resolve(jsonResponse({ items: [aiConsentPolicy] }));
      }
      if (url.endsWith("/api/v1/ai/consent/general_chat")) {
        return Promise.resolve(
          jsonResponse({ ...aiConsentPolicy, externalProvidersAllowed: true })
        );
      }
      if (url.endsWith("/api/v1/ai/model-configs")) {
        return Promise.resolve(jsonResponse({ items: [aiModelConfiguration] }));
      }
      if (url.endsWith("/api/v1/ai/model-configs/general_chat")) {
        return Promise.resolve(jsonResponse({ ...aiModelConfiguration, maxOutputTokens: 256 }));
      }
      if (url.endsWith("/api/v1/ai/chat/completions")) {
        return Promise.resolve(jsonResponse(aiChatCompletion));
      }
      if (url.endsWith("/api/v1/ai/chat/completions/stream")) {
        return Promise.resolve(new Response("event: done\ndata: [DONE]\n\n", { status: 200 }));
      }
      if (url.endsWith("/api/v1/ai/embeddings")) {
        return Promise.resolve(jsonResponse(aiEmbeddingResponse));
      }
      if (url.endsWith("/api/v1/ai/document-qa")) {
        return Promise.resolve(jsonResponse(documentQAResponse));
      }
      if (url.endsWith("/api/v1/ai/usage?feature=general_chat&limit=5&offset=0")) {
        return Promise.resolve(
          jsonResponse({
            items: [aiUsageRecord],
            limit: 5,
            offset: 0,
            total: 1
          })
        );
      }
      return Promise.resolve(jsonResponse({ items: [] }));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.ai.listProviders()).resolves.toMatchObject({ items: [aiProvider] });
    await expect(client.ai.listConsent()).resolves.toMatchObject({ items: [aiConsentPolicy] });
    await expect(
      client.ai.updateConsent("general_chat", { externalProvidersAllowed: true })
    ).resolves.toMatchObject({ externalProvidersAllowed: true });
    await expect(client.ai.listModelConfigs()).resolves.toMatchObject({
      items: [aiModelConfiguration]
    });
    await expect(
      client.ai.updateModelConfig("general_chat", { maxOutputTokens: 256 })
    ).resolves.toMatchObject({ maxOutputTokens: 256 });
    await expect(
      client.ai.completeChat({
        messages: [{ content: "Explain indexes.", role: "user" }]
      })
    ).resolves.toMatchObject({ requestId: "ai_test" });
    await expect(
      client.ai.streamChat({ messages: [{ content: "Stream.", role: "user" }] })
    ).resolves.toBeInstanceOf(Response);
    await expect(client.ai.createEmbeddings({ input: ["indexes"] })).resolves.toMatchObject({
      data: [{ index: 0 }]
    });
    await expect(
      client.ai.answerDocumentQuestion({
        fileIds: [vaultFile.id],
        mode: "explain",
        question: "What do the alpha notes say?"
      })
    ).resolves.toMatchObject({
      citations: [{ label: "S1" }],
      evidenceStatus: "supported"
    });
    await expect(
      client.ai.listUsage({ feature: "general_chat", limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/ai/chat/completions", {
      body: JSON.stringify({
        messages: [{ content: "Explain indexes.", role: "user" }]
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("uses AI mentor and conversation endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>((input, init) => {
      const url = requestUrl(input);
      if (url === "http://localhost:8000/api/v1/mentors?includeArchived=true") {
        return Promise.resolve(jsonResponse({ items: [mentor] }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/${mentor.id}`) {
        return Promise.resolve(jsonResponse({ ...mentor, name: "Lyra Prime" }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/${mentor.id}/permissions`) {
        return Promise.resolve(jsonResponse({ ...mentorPermission, allowConversations: true }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/${mentor.id}/archive`) {
        return Promise.resolve(jsonResponse({ ...mentor, archivedAt: "2026-07-20T00:10:00Z" }));
      }
      if (url === "http://localhost:8000/api/v1/mentors") {
        return Promise.resolve(jsonResponse({ ...mentor, isDefault: false, slug: "custom-lyra" }));
      }
      if (
        url ===
        "http://localhost:8000/api/v1/mentors/conversations?includeArchived=true&limit=5&offset=0"
      ) {
        return Promise.resolve(
          jsonResponse({ items: [conversation], limit: 5, offset: 0, total: 1 })
        );
      }
      if (url === "http://localhost:8000/api/v1/mentors/conversations") {
        return Promise.resolve(jsonResponse(conversation, 201));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}`) {
        if (init?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 204 }));
        }
        return Promise.resolve(jsonResponse({ ...conversation, title: "Renamed review" }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/archive`) {
        return Promise.resolve(jsonResponse({ ...conversation, status: "archived" }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/memory`) {
        return Promise.resolve(
          jsonResponse({
            ...conversationMemorySettings,
            memoryEnabled: true,
            memoryPolicy: "persistent"
          })
        );
      }
      if (
        url ===
        `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages?limit=10&offset=0`
      ) {
        return Promise.resolve(
          jsonResponse({ items: [userMessage, assistantMessage], limit: 10, offset: 0, total: 2 })
        );
      }
      if (
        url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages`
      ) {
        return Promise.resolve(jsonResponse(messageSendResponse));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages/${userMessage.id}`
      ) {
        return Promise.resolve(jsonResponse(messageSendResponse));
      }
      if (
        url ===
        `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/messages/${assistantMessage.id}/regenerate`
      ) {
        return Promise.resolve(jsonResponse({ ...messageSendResponse, userMessage: null }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/stop`) {
        return Promise.resolve(jsonResponse({ reason: "stopped", stopped: true }));
      }
      if (url === `http://localhost:8000/api/v1/mentors/conversations/${conversation.id}/export`) {
        return Promise.resolve(
          jsonResponse({
            conversation,
            exportedAt: "2026-07-20T00:05:00Z",
            mentor,
            messages: [{ ...userMessage, sources: [] }]
          })
        );
      }
      return Promise.resolve(jsonResponse({ items: [] }));
    });
    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(client.mentors.list({ includeArchived: true })).resolves.toMatchObject({
      items: [mentor]
    });
    await expect(
      client.mentors.create({
        description: "General learning mentor.",
        fictionalIdentity: "A fictional AI mentor.",
        name: "Lyra",
        systemInstructions: "Support practical learning without changing user data.",
        tone: "calm"
      })
    ).resolves.toMatchObject({ isDefault: false });
    await expect(client.mentors.get(mentor.id)).resolves.toMatchObject({ name: "Lyra Prime" });
    await expect(client.mentors.update(mentor.id, { name: "Lyra Prime" })).resolves.toMatchObject({
      name: "Lyra Prime"
    });
    await expect(client.mentors.getPermissions(mentor.id)).resolves.toMatchObject({
      allowConversations: true
    });
    await expect(
      client.mentors.updatePermissions(mentor.id, { allowConversations: true })
    ).resolves.toMatchObject({ allowConversations: true });
    await expect(client.mentors.archive(mentor.id)).resolves.toMatchObject({
      archivedAt: "2026-07-20T00:10:00Z"
    });
    await expect(
      client.mentors.listConversations({ includeArchived: true, limit: 5, offset: 0 })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      client.mentors.createConversation({ mentorId: mentor.id, title: "Index review" })
    ).resolves.toMatchObject({ title: "Index review" });
    await expect(client.mentors.getConversation(conversation.id)).resolves.toMatchObject({
      title: "Renamed review"
    });
    await expect(
      client.mentors.updateConversation(conversation.id, { title: "Renamed review" })
    ).resolves.toMatchObject({ title: "Renamed review" });
    await expect(client.mentors.archiveConversation(conversation.id)).resolves.toMatchObject({
      status: "archived"
    });
    await expect(
      client.mentors.updateMemory(conversation.id, {
        memoryEnabled: true,
        memoryPolicy: "persistent"
      })
    ).resolves.toMatchObject({ memoryEnabled: true });
    await expect(
      client.mentors.listMessages(conversation.id, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ total: 2 });
    await expect(
      client.mentors.sendMessage(conversation.id, { content: "Explain indexes." })
    ).resolves.toMatchObject({ assistantMessage });
    await expect(
      client.mentors.editAndResendMessage(conversation.id, userMessage.id, {
        content: "Explain indexes again."
      })
    ).resolves.toMatchObject({ userMessage });
    await expect(
      client.mentors.regenerateMessage(conversation.id, assistantMessage.id)
    ).resolves.toMatchObject({ userMessage: null });
    await expect(client.mentors.stopGeneration(conversation.id)).resolves.toMatchObject({
      stopped: true
    });
    await expect(client.mentors.exportConversation(conversation.id)).resolves.toMatchObject({
      messages: [{ sources: [] }]
    });
    await expect(client.mentors.deleteConversation(conversation.id)).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/mentors/conversations?includeArchived=true&limit=5&offset=0",
      {
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );
  });

  it("posts registration payloads with credentials", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            user: {
              createdAt: "2026-07-17T00:00:00Z",
              displayName: "Sai",
              email: "sai@example.com",
              id: "11111111-1111-4111-8111-111111111111",
              isEmailVerified: false,
              lastLoginAt: null
            }
          }),
          { status: 201 }
        )
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await client.auth.register({
      displayName: "Sai",
      email: "sai@example.com",
      password: "StrongPass123!"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:8000/api/v1/auth/register", {
      body: JSON.stringify({
        displayName: "Sai",
        email: "sai@example.com",
        password: "StrongPass123!"
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("throws typed API errors", async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              code: "invalid_credentials",
              message: "Email or password is incorrect."
            }
          }),
          { status: 401 }
        )
      )
    );

    const client = createAetheriumApiClient({ baseUrl: "http://localhost:8000", fetcher });

    await expect(
      client.auth.login({ email: "sai@example.com", password: "WrongPass123!" })
    ).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401
    });
  });
});
