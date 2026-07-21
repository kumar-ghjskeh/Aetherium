import type { AetheriumApiClient } from "@aetherium/api-client";
import { AetheriumApiError } from "@aetherium/api-client";
import type { Conversation, Mentor, Message } from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUnusedFilesClient, createUnusedMentorsClient } from "../../test/api-client";
import { AiHallPage } from "./ai-hall-page";

const mentor: Mentor = {
  archivedAt: null,
  avatarReference: null,
  createdAt: "2026-07-20T00:00:00Z",
  description: "General learning mentor.",
  fictionalIdentity: "A fictional AI mentor.",
  id: "11111111-1111-4111-8111-111111111111",
  isDefault: true,
  name: "Lyra",
  permissions: {
    allowConversations: false,
    allowFileContent: false,
    allowHabitData: false,
    allowLearningRecords: false,
    allowProfileData: false,
    allowProjects: false,
    allowedCollectionIds: [],
    allowedTools: ["explain", "quiz"],
    createdAt: "2026-07-20T00:00:00Z",
    id: "22222222-2222-4222-8222-222222222222",
    mentorId: "11111111-1111-4111-8111-111111111111",
    updatedAt: "2026-07-20T00:00:00Z"
  },
  preferredModelName: null,
  slug: "lyra",
  systemInstructions: "Guide the learner without silently changing user data.",
  tone: "calm",
  updatedAt: "2026-07-20T00:00:00Z"
};

const conversation: Conversation = {
  archivedAt: null,
  createdAt: "2026-07-20T00:00:00Z",
  deletedAt: null,
  id: "33333333-3333-4333-8333-333333333333",
  lastMessageAt: null,
  memorySettings: {
    conversationId: "33333333-3333-4333-8333-333333333333",
    createdAt: "2026-07-20T00:00:00Z",
    id: "44444444-4444-4444-8444-444444444444",
    memoryEnabled: false,
    memoryPolicy: "disabled",
    memorySummary: null,
    updatedAt: "2026-07-20T00:00:00Z"
  },
  mentorId: mentor.id,
  mentorName: mentor.name,
  messageCount: 0,
  status: "active",
  title: "Index review",
  updatedAt: "2026-07-20T00:00:00Z"
};

const userMessage: Message = {
  aiUsageRecordId: null,
  content: "Explain indexes.",
  conversationId: conversation.id,
  createdAt: "2026-07-20T00:00:00Z",
  editedFromMessageId: null,
  errorCode: null,
  errorMessage: null,
  id: "55555555-5555-4555-8555-555555555555",
  modelName: null,
  providerName: null,
  regeneratedFromMessageId: null,
  role: "user",
  status: "complete",
  updatedAt: "2026-07-20T00:00:00Z"
};

const assistantMessage: Message = {
  ...userMessage,
  aiUsageRecordId: "66666666-6666-4666-8666-666666666666",
  content: "Indexes improve lookup performance by keeping a searchable structure.",
  id: "77777777-7777-4777-8777-777777777777",
  modelName: "aetherium-deterministic-chat",
  providerName: "aetherium_deterministic",
  role: "assistant"
};

function createClient(overrides: Partial<AetheriumApiClient["mentors"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-mentor call"));

  return {
    ai: {
      completeChat: vi.fn(reject),
      createEmbeddings: vi.fn(reject),
      listConsent: vi.fn(reject),
      listModelConfigs: vi.fn(reject),
      listProviders: vi.fn(reject),
      listUsage: vi.fn(reject),
      streamChat: vi.fn(reject),
      updateConsent: vi.fn(reject),
      updateModelConfig: vi.fn(reject)
    },
    auditLogs: { list: vi.fn(reject) },
    auth: {
      login: vi.fn(reject),
      logout: vi.fn(reject),
      me: vi.fn(reject),
      register: vi.fn(reject)
    },
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    mentors: {
      ...createUnusedMentorsClient(),
      create: vi.fn(() =>
        Promise.resolve({
          ...mentor,
          id: "88888888-8888-4888-8888-888888888888",
          isDefault: false,
          name: "Ariadne"
        })
      ),
      createConversation: vi.fn(() => Promise.resolve(conversation)),
      list: vi.fn(() => Promise.resolve({ items: [mentor] })),
      listConversations: vi.fn(() =>
        Promise.resolve({ items: [], limit: 25, offset: 0, total: 0 })
      ),
      listMessages: vi.fn(() => Promise.resolve({ items: [], limit: 50, offset: 0, total: 0 })),
      sendMessage: vi.fn(() =>
        Promise.resolve({
          assistantMessage,
          conversation: { ...conversation, messageCount: 2 },
          userMessage
        })
      ),
      updatePermissions: vi.fn(() =>
        Promise.resolve({ ...mentor.permissions, allowFileContent: true })
      ),
      ...overrides
    },
    notifications: { list: vi.fn(reject), markRead: vi.fn(reject) },
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    world: { getProfile: vi.fn(reject), updateProfile: vi.fn(reject), visit: vi.fn(reject) }
  };
}

describe("AiHallPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state and then API-backed empty conversation state", async () => {
    let resolveMentors: (value: { items: Mentor[] }) => void = () => undefined;
    const pendingMentors = new Promise<{ items: Mentor[] }>((resolve) => {
      resolveMentors = resolve;
    });
    const client = createClient({
      list: vi.fn(() => pendingMentors)
    });

    render(<AiHallPage client={client} />);

    expect(screen.getByText("Loading AI mentors...")).toBeInTheDocument();
    resolveMentors({ items: [mentor] });

    expect(await screen.findByRole("button", { name: /Lyra/i })).toBeInTheDocument();
    expect(screen.getByText("No AI conversations yet.")).toBeInTheDocument();
    expect(screen.getByText("Ask a mentor to begin a real conversation.")).toBeInTheDocument();
  });

  it("starts a conversation and sends a mentor message", async () => {
    const client = createClient();

    render(<AiHallPage client={client} />);

    await screen.findByRole("button", { name: /Lyra/i });
    await userEvent.type(screen.getByLabelText("Message"), "Explain indexes.");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(client.mentors.createConversation).toHaveBeenCalledWith({
        mentorId: mentor.id,
        title: "Conversation with Lyra"
      })
    );
    expect(client.mentors.sendMessage).toHaveBeenCalledWith(conversation.id, {
      content: "Explain indexes."
    });
    expect(await screen.findByText(/Indexes improve lookup performance/i)).toBeInTheDocument();
    expect(screen.getByText("Mentor response received.")).toBeInTheDocument();
  });

  it("shows non-destructive error state when the mentor API rejects a message", async () => {
    const client = createClient({
      listConversations: vi.fn(() =>
        Promise.resolve({ items: [conversation], limit: 25, offset: 0, total: 1 })
      ),
      sendMessage: vi.fn(() =>
        Promise.reject(
          new AetheriumApiError(403, {
            error: {
              code: "external_ai_disabled",
              message: "External AI providers are disabled."
            }
          })
        )
      )
    });

    render(<AiHallPage client={client} />);

    await screen.findByRole("button", { name: /Index review/i });
    await userEvent.type(screen.getByLabelText("Message"), "Use external AI.");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "External AI providers are disabled."
    );
  });

  it("creates a custom fictional mentor", async () => {
    const client = createClient();

    render(<AiHallPage client={client} />);

    await screen.findByRole("button", { name: /Lyra/i });
    await userEvent.click(screen.getByRole("button", { name: "Create mentor" }));
    await userEvent.type(screen.getByLabelText("Name"), "Ariadne");
    await userEvent.type(
      screen.getByLabelText("Fictional identity"),
      "A fictional synthesis mentor."
    );
    await userEvent.type(screen.getByLabelText("Description"), "Focuses on conceptual review.");
    await userEvent.type(
      screen.getByLabelText("System instructions"),
      "Guide the learner through careful conceptual synthesis."
    );
    await userEvent.selectOptions(screen.getByLabelText("Tone"), "analytical");
    await userEvent.click(screen.getByRole("button", { name: "Save mentor" }));

    await waitFor(() =>
      expect(client.mentors.create).toHaveBeenCalledWith({
        allowedTools: ["explain"],
        description: "Focuses on conceptual review.",
        fictionalIdentity: "A fictional synthesis mentor.",
        name: "Ariadne",
        systemInstructions: "Guide the learner through careful conceptual synthesis.",
        tone: "analytical"
      })
    );
    expect(await screen.findByText("Custom AI mentor created.")).toBeInTheDocument();
  });

  it("updates mentor data-access permissions from the side panel", async () => {
    const client = createClient();

    render(<AiHallPage client={client} />);

    await screen.findByRole("button", { name: /Lyra/i });
    const permissions = screen.getByRole("heading", { name: "Data access" }).closest("section");
    expect(permissions).not.toBeNull();
    await userEvent.click(within(permissions as HTMLElement).getByLabelText("File content"));

    await waitFor(() =>
      expect(client.mentors.updatePermissions).toHaveBeenCalledWith(mentor.id, {
        allowFileContent: true
      })
    );
    expect(await screen.findByText("Mentor permissions updated.")).toBeInTheDocument();
  });
});
