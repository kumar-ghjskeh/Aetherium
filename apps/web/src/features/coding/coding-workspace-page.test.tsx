import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  CodeAssistantRequest,
  CodeRunnerStatus,
  CodeSnippet,
  CodeSnippetPage,
  CodingExercise,
  CodingExercisePage
} from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedCodingClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedKnowledgeClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient
} from "../../test/api-client";
import { CodingWorkspacePage } from "./coding-workspace-page";

vi.mock("@monaco-editor/react", () => ({
  default: ({
    language,
    onChange,
    value
  }: {
    language: string;
    onChange?: (value: string) => void;
    value?: string;
  }) => (
    <textarea
      aria-label="Code editor"
      data-language={language}
      onChange={(event) => onChange?.(event.target.value)}
      value={value ?? ""}
    />
  )
}));

const now = "2026-07-22T00:00:00Z";
const snippetId = "11111111-1111-4111-8111-111111111111";
const exerciseId = "22222222-2222-4222-8222-222222222222";
const assistantId = "33333333-3333-4333-8333-333333333333";
const usageId = "44444444-4444-4444-8444-444444444444";

const snippet: CodeSnippet = {
  archivedAt: null,
  content: "const symbolTable = new Map<string, number>();",
  createdAt: now,
  fileId: null,
  id: snippetId,
  language: "typescript",
  notes: "Assembler parser notes",
  projectId: null,
  status: "active",
  title: "Symbol table",
  updatedAt: now
};

const exercise: CodingExercise = {
  createdAt: now,
  difficulty: "practice",
  id: exerciseId,
  language: "typescript",
  projectId: null,
  prompt: "Write a label parser.",
  solutionNotes: null,
  starterCode: "function parseLabel(line: string) {\n  return line;\n}",
  status: "active",
  title: "Parse labels",
  topicId: null,
  updatedAt: now
};

const assistantResponse: CodeAssistantRequest = {
  aiUsageRecordId: usageId,
  codeExcerpt: snippet.content,
  createdAt: now,
  errorCode: null,
  errorMessage: null,
  id: assistantId,
  kind: "explain",
  language: "typescript",
  modelName: "aetherium-deterministic-chat",
  projectId: null,
  prompt: "Explain this",
  providerName: "aetherium_deterministic",
  response: "Deterministic explanation for symbol tables.",
  snippetId,
  status: "complete",
  updatedAt: now
};

const runnerStatus: CodeRunnerStatus = {
  availability: "unavailable",
  executionAvailable: false,
  providerName: "none",
  reason: "Code execution is unavailable in this foundation slice.",
  securityRequirements: ["cpu_limit", "no_aetherium_secrets"],
  supportedLanguages: ["typescript", "python", "sql"]
};

function snippetPage(items: CodeSnippet[]): CodeSnippetPage {
  return {
    items,
    limit: 25,
    offset: 0,
    total: items.length
  };
}

function exercisePage(items: CodingExercise[]): CodingExercisePage {
  return {
    items,
    limit: 25,
    offset: 0,
    total: items.length
  };
}

function requireElement<T extends Element>(element: T | undefined): T {
  expect(element).toBeDefined();
  if (element === undefined) {
    throw new Error("Expected element to exist.");
  }
  return element;
}

function createClient(overrides: Partial<AetheriumApiClient["coding"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-coding call"));

  return {
    achievements: createUnusedAchievementsClient(),
    ai: {
      answerDocumentQuestion: vi.fn(reject),
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
    analytics: createUnusedAnalyticsClient(),
    auditLogs: { list: vi.fn(reject) },
    auth: {
      login: vi.fn(reject),
      logout: vi.fn(reject),
      me: vi.fn(reject),
      register: vi.fn(reject)
    },
    coding: {
      ...createUnusedCodingClient(),
      archiveSnippet: vi.fn(() =>
        Promise.resolve({ ...snippet, archivedAt: now, status: "archived" as const })
      ),
      createAttempt: vi.fn(() =>
        Promise.resolve({
          createdAt: now,
          exerciseId,
          feedback: null,
          id: "55555555-5555-4555-8555-555555555555",
          notes: null,
          snippetId,
          status: "submitted" as const,
          submittedCode: snippet.content,
          updatedAt: now
        })
      ),
      createExercise: vi.fn(() => Promise.resolve(exercise)),
      createSnippet: vi.fn(() => Promise.resolve(snippet)),
      explain: vi.fn(() => Promise.resolve(assistantResponse)),
      getRunnerStatus: vi.fn(() => Promise.resolve(runnerStatus)),
      listAssistantRequests: vi.fn(() =>
        Promise.resolve({ items: [], limit: 10, offset: 0, total: 0 })
      ),
      listExercises: vi.fn(() => Promise.resolve(exercisePage([]))),
      listSnippets: vi.fn(() => Promise.resolve(snippetPage([]))),
      review: vi.fn(() => Promise.resolve({ ...assistantResponse, kind: "review" as const })),
      updateSnippet: vi.fn(() => Promise.resolve({ ...snippet, content: "const updated = true;" })),
      ...overrides
    },
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    habits: createUnusedHabitsClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    knowledge: createUnusedKnowledgeClient(),
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: { list: vi.fn(reject), markRead: vi.fn(reject) },
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: { getProfile: vi.fn(reject), updateProfile: vi.fn(reject), visit: vi.fn(reject) }
  };
}

describe("CodingWorkspacePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading, empty states, and unavailable runner details", async () => {
    let resolveSnippets: (value: CodeSnippetPage) => void = () => undefined;
    const pendingSnippets = new Promise<CodeSnippetPage>((resolve) => {
      resolveSnippets = resolve;
    });
    const client = createClient({
      listSnippets: vi.fn(() => pendingSnippets)
    });

    render(<CodingWorkspacePage client={client} />);

    expect(screen.getByText("Loading coding workspace...")).toBeInTheDocument();
    resolveSnippets(snippetPage([]));

    await waitFor(() => {
      expect(
        screen.getByText("No saved snippets yet. Save the draft to create one.")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Code execution is unavailable in this foundation slice.")
    ).toBeInTheDocument();
    expect(screen.getByText("no aetherium secrets")).toBeInTheDocument();
  });

  it("validates snippet creation before calling the API", async () => {
    const user = userEvent.setup();
    const client = createClient();
    render(<CodingWorkspacePage client={client} />);

    await screen.findByRole("button", { name: "Save new snippet" });
    await user.clear(requireElement(screen.getAllByLabelText("Title")[0]));
    await user.click(screen.getByRole("button", { name: "Save new snippet" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Snippet title is required");
    expect(client.coding.createSnippet).not.toHaveBeenCalled();
  });

  it("saves, updates, archives, and asks the coding assistant about snippets", async () => {
    const user = userEvent.setup();
    const client = createClient({
      listAssistantRequests: vi.fn(() =>
        Promise.resolve({ items: [assistantResponse], limit: 10, offset: 0, total: 1 })
      ),
      listSnippets: vi.fn(() => Promise.resolve(snippetPage([snippet])))
    });

    render(<CodingWorkspacePage client={client} />);

    await screen.findByRole("button", { name: /Symbol table/ });
    await user.clear(screen.getByLabelText("Code editor"));
    await user.type(screen.getByLabelText("Code editor"), "const updated = true;");
    await user.click(screen.getByRole("button", { name: "Update selected" }));

    expect(client.coding.updateSnippet).toHaveBeenCalledWith(snippetId, {
      content: "const updated = true;",
      fileId: null,
      language: "typescript",
      notes: "Assembler parser notes",
      projectId: null,
      title: "Symbol table"
    });

    await user.type(screen.getByLabelText("Request"), "Explain this");
    await user.click(screen.getByRole("button", { name: "Explain" }));
    expect(client.coding.explain).toHaveBeenCalledWith({
      includeProjectContext: false,
      language: "typescript",
      projectId: null,
      prompt: "Explain this",
      snippetId
    });

    await user.type(screen.getByLabelText("Request"), "Review this");
    await user.click(screen.getByRole("button", { name: "Review" }));
    expect(client.coding.review).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Archive selected" }));
    expect(client.coding.archiveSnippet).toHaveBeenCalledWith(snippetId);
  });

  it("creates exercises, applies starter code, and records attempts without execution", async () => {
    const user = userEvent.setup();
    const client = createClient({
      listExercises: vi.fn(() => Promise.resolve(exercisePage([exercise]))),
      listSnippets: vi.fn(() => Promise.resolve(snippetPage([snippet])))
    });
    render(<CodingWorkspacePage client={client} />);

    await screen.findByText("Write a label parser.");

    const exercisePanel = within(screen.getByText("Exercises").closest("section") as HTMLElement);
    await user.type(exercisePanel.getByLabelText("Title"), "Parse labels");
    await user.type(exercisePanel.getByLabelText("Prompt"), "Write a label parser.");
    await user.type(exercisePanel.getByLabelText("Starter code"), "return line;");
    await user.click(exercisePanel.getByRole("button", { name: "Create exercise" }));

    expect(client.coding.createExercise).toHaveBeenCalledWith({
      difficulty: "practice",
      language: "typescript",
      projectId: null,
      prompt: "Write a label parser.",
      starterCode: "return line;",
      title: "Parse labels"
    });

    await user.click(exercisePanel.getByRole("button", { name: "Use starter" }));
    expect(screen.getByLabelText("Code editor")).toHaveValue(exercise.starterCode);

    await user.click(exercisePanel.getByRole("button", { name: "Submit attempt" }));
    expect(client.coding.createAttempt).toHaveBeenCalledWith(exerciseId, {
      snippetId,
      submittedCode: exercise.starterCode
    });
    expect(
      await screen.findByText("Exercise attempt recorded. Code was not executed.")
    ).toBeInTheDocument();
  });

  it("shows load errors without false success", async () => {
    const client = createClient({
      listSnippets: vi.fn(() => Promise.reject(new Error("Coding API unavailable")))
    });

    render(<CodingWorkspacePage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Coding API unavailable");
    expect(screen.queryByText("Snippet saved.")).not.toBeInTheDocument();
  });
});
