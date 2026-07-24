import type {
  AIModelConfigurationPage,
  AIProviderPage,
  AIUsageRecordPage,
  Conversation,
  ConversationPage,
  Mentor,
  MentorPage
} from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildAIObservatoryViewModel } from "./ai-observatory-system";

function mentor(overrides: Partial<Mentor>): Mentor {
  return {
    archivedAt: null,
    avatarReference: null,
    createdAt: "2026-07-22T00:00:00Z",
    description: "General learning mentor",
    fictionalIdentity: "Fictional AI guide",
    id: "mentor-1",
    isDefault: true,
    name: "Lyra",
    permissions: {
      allowConversations: true,
      allowFileContent: false,
      allowHabitData: false,
      allowLearningRecords: false,
      allowProfileData: false,
      allowProjects: false,
      allowedCollectionIds: [],
      allowedTools: ["explain"],
      createdAt: "2026-07-22T00:00:00Z",
      id: "permission-1",
      mentorId: "mentor-1",
      updatedAt: "2026-07-22T00:00:00Z"
    },
    preferredModelName: null,
    slug: "lyra",
    systemInstructions: "Guide the learner without mutating data.",
    tone: "calm",
    updatedAt: "2026-07-22T00:00:00Z",
    ...overrides
  };
}

function conversation(overrides: Partial<Conversation>): Conversation {
  return {
    archivedAt: null,
    createdAt: "2026-07-22T00:00:00Z",
    deletedAt: null,
    id: "conversation-1",
    lastMessageAt: "2026-07-22T00:30:00Z",
    memorySettings: {
      conversationId: "conversation-1",
      createdAt: "2026-07-22T00:00:00Z",
      id: "memory-1",
      memoryEnabled: false,
      memoryPolicy: "disabled",
      memorySummary: null,
      updatedAt: "2026-07-22T00:00:00Z"
    },
    mentorId: "mentor-1",
    mentorName: "Lyra",
    messageCount: 2,
    status: "active",
    title: "Study plan",
    updatedAt: "2026-07-22T00:00:00Z",
    ...overrides
  };
}

const mentors: MentorPage = {
  items: [
    mentor({ id: "mentor-1", name: "Lyra", slug: "lyra" }),
    mentor({
      id: "mentor-2",
      name: "Orion",
      permissions: {
        ...mentor({}).permissions,
        allowConversations: false,
        id: "permission-2",
        mentorId: "mentor-2"
      },
      slug: "orion"
    }),
    mentor({ archivedAt: "2026-07-22T00:00:00Z", id: "mentor-3", name: "Sage", slug: "sage" })
  ]
};

const conversations: ConversationPage = {
  items: [conversation({ id: "conversation-1", mentorId: "mentor-1" })],
  limit: 8,
  offset: 0,
  total: 1
};

const providers: AIProviderPage = {
  items: [
    {
      capabilities: ["chat", "streaming_chat"],
      configured: true,
      defaultChatModel: "aetherium-deterministic-chat",
      defaultEmbeddingModel: null,
      displayName: "Aetherium deterministic",
      external: false,
      kind: "aetherium_deterministic",
      name: "aetherium_deterministic"
    }
  ]
};

const modelConfigs: AIModelConfigurationPage = {
  items: [
    {
      createdAt: "2026-07-22T00:00:00Z",
      enabled: true,
      fallbackModelName: null,
      fallbackProviderName: null,
      feature: "mentor_chat",
      id: "model-config-1",
      maxOutputTokens: 900,
      modelName: "aetherium-deterministic-chat",
      providerKind: "aetherium_deterministic",
      providerName: "aetherium_deterministic",
      temperature: 0.3,
      updatedAt: "2026-07-22T00:00:00Z"
    }
  ]
};

const usage: AIUsageRecordPage = {
  items: [
    {
      createdAt: "2026-07-22T00:00:00Z",
      errorCode: null,
      errorMessage: null,
      estimatedCostMicroUsd: 0,
      feature: "mentor_chat",
      id: "usage-1",
      inputTokens: 12,
      latencyMs: 12,
      modelName: "aetherium-deterministic-chat",
      operation: "chat_completion",
      outputTokens: 20,
      providerKind: "aetherium_deterministic",
      providerName: "aetherium_deterministic",
      requestId: "request-1",
      status: "success",
      totalTokens: 32,
      usedFallback: false
    }
  ],
  limit: 8,
  offset: 0,
  total: 1
};

describe("ai observatory system", () => {
  it("maps mentors, conversations, providers, and usage into probe states", () => {
    const viewModel = buildAIObservatoryViewModel({
      conversations,
      mentors,
      modelConfigs,
      providers,
      usage
    });

    expect(viewModel.totalMentorLabel).toBe("3 mentors");
    expect(viewModel.activeConversationLabel).toBe("1 conversation");
    expect(viewModel.configuredProviderLabel).toBe("1 configured provider");
    expect(viewModel.enabledModelLabel).toBe("1 enabled model");
    expect(viewModel.recentUsageLabel).toBe("1 recent AI request");
    expect(viewModel.probes.find((probe) => probe.label === "Lyra")).toMatchObject({
      state: "greeting"
    });
    expect(viewModel.probes.find((probe) => probe.label === "Orion")).toMatchObject({
      state: "waiting"
    });
    expect(viewModel.probes.find((probe) => probe.label === "Sage")).toMatchObject({
      state: "offline"
    });
  });

  it("shows an error probe state when recent AI usage failed", () => {
    const viewModel = buildAIObservatoryViewModel({
      conversations,
      mentors: { items: [mentor({ id: "mentor-1", name: "Lyra" })] },
      modelConfigs,
      providers,
      usage: {
        ...usage,
        items: [{ ...usage.items[0]!, errorCode: "provider_timeout", status: "failed" }]
      }
    });

    expect(viewModel.probes[0]).toMatchObject({ state: "error" });
  });
});
