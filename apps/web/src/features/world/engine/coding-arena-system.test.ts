import type {
  CodeAssistantRequestPage,
  CodeRunnerStatus,
  CodeSnippetPage,
  CodingExercisePage,
  ProjectPage
} from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildCodingArenaViewModel } from "./coding-arena-system";

const snippets: CodeSnippetPage = {
  items: [
    {
      archivedAt: null,
      content: "const privateStudyCode = true;",
      createdAt: "2026-08-01T00:00:00Z",
      fileId: null,
      id: "snippet-1",
      language: "typescript",
      notes: "Private implementation notes",
      projectId: "project-1",
      status: "active",
      title: "Pipeline visualizer",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 6,
  offset: 0,
  total: 1
};

const exercises: CodingExercisePage = {
  items: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      difficulty: "challenge",
      id: "exercise-1",
      language: "systemverilog",
      projectId: "project-1",
      prompt: "Private exercise prompt",
      solutionNotes: "Private solution",
      starterCode: "module private_code;",
      status: "active",
      title: "Resolve a data hazard",
      topicId: null,
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 6,
  offset: 0,
  total: 1
};

const assistantRequests: CodeAssistantRequestPage = {
  items: [
    {
      aiUsageRecordId: null,
      codeExcerpt: "private assistant code",
      createdAt: "2026-08-01T00:00:00Z",
      errorCode: null,
      errorMessage: null,
      id: "request-1",
      kind: "review",
      language: "typescript",
      modelName: "local-test",
      projectId: "project-1",
      prompt: "Private prompt",
      providerName: "test",
      response: "Private assistant response",
      snippetId: "snippet-1",
      status: "complete",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1
};

const projects: ProjectPage = {
  items: [
    {
      archivedAt: null,
      completedAt: null,
      createdAt: "2026-08-01T00:00:00Z",
      description: null,
      id: "project-1",
      name: "CPU Lab",
      objective: null,
      repositoryUrl: null,
      startedOn: null,
      status: "active",
      targetDate: null,
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 1
};

const runner: CodeRunnerStatus = {
  availability: "unavailable",
  executionAvailable: false,
  providerName: "none",
  reason: "No isolated execution provider is configured.",
  securityRequirements: ["cpu_limit", "no_aetherium_secrets"],
  supportedLanguages: ["typescript", "python", "sql"]
};

describe("Coding Arena view model", () => {
  it("maps bounded real coding records into arena consoles and pylons", () => {
    const viewModel = buildCodingArenaViewModel({
      assistantRequests,
      exercises,
      projects,
      runner,
      snippets
    });

    expect(viewModel.snippetCountLabel).toBe("1 saved snippet");
    expect(viewModel.exerciseCountLabel).toBe("1 exercise");
    expect(viewModel.linkedProjectCountLabel).toBe("1 linked project");
    expect(viewModel.snippetConsoles[0]).toMatchObject({
      languageLabel: "Typescript",
      linkedProjectLabel: "CPU Lab",
      title: "Pipeline visualizer"
    });
    expect(viewModel.exercisePylons[0]).toMatchObject({
      difficulty: "challenge",
      languageLabel: "SystemVerilog",
      title: "Resolve a data hazard"
    });
    expect(viewModel.assistantActivityLabel).toBe("Review complete");
  });

  it("does not expose raw code, private prompts, notes, solutions, or AI responses", () => {
    const viewModel = buildCodingArenaViewModel({
      assistantRequests,
      exercises,
      projects,
      runner,
      snippets
    });
    const serialized = JSON.stringify(viewModel);

    expect(serialized).not.toContain("privateStudyCode");
    expect(serialized).not.toContain("Private implementation notes");
    expect(serialized).not.toContain("Private exercise prompt");
    expect(serialized).not.toContain("Private solution");
    expect(serialized).not.toContain("private assistant code");
    expect(serialized).not.toContain("Private prompt");
    expect(serialized).not.toContain("Private assistant response");
  });

  it("represents the unavailable runner as a visible security boundary", () => {
    const viewModel = buildCodingArenaViewModel({
      assistantRequests: { ...assistantRequests, items: [], total: 0 },
      exercises: { ...exercises, items: [], total: 0 },
      projects: { ...projects, items: [], total: 0 },
      runner,
      snippets: { ...snippets, items: [], total: 0 }
    });

    expect(viewModel.runnerAvailable).toBe(false);
    expect(viewModel.runnerStatusLabel).toBe("Safe run sealed");
    expect(viewModel.runnerDetail).toBe("No isolated execution provider is configured.");
    expect(viewModel.runnerLanguageLabel).toBe("Typescript, Python, SQL");
    expect(viewModel.runnerRequirements).toEqual(["cpu limit", "no aetherium secrets"]);
    expect(viewModel.snippetConsoles).toEqual([]);
    expect(viewModel.exercisePylons).toEqual([]);
    expect(viewModel.assistantActivityLabel).toBe("No AI coding requests yet");
  });
});
