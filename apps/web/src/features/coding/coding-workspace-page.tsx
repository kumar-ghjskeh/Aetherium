"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  CodeAssistantRequest,
  CodeRunnerStatus,
  CodeSnippet,
  CodingExercise,
  CodingExerciseDifficulty,
  CodingLanguage
} from "@aetherium/shared-types";
import {
  codeAssistantCreateRequestSchema,
  codeSnippetCreateRequestSchema,
  codeSnippetUpdateRequestSchema,
  codingExerciseCreateRequestSchema
} from "@aetherium/validation";
import Editor from "@monaco-editor/react";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

const PAGE_LIMIT = 25;
const languages: CodingLanguage[] = [
  "python",
  "javascript",
  "typescript",
  "sql",
  "cpp",
  "systemverilog",
  "text"
];

interface SnippetDraft {
  content: string;
  fileId: string;
  language: CodingLanguage;
  notes: string;
  projectId: string;
  title: string;
}

interface ExerciseDraft {
  difficulty: CodingExerciseDifficulty;
  prompt: string;
  starterCode: string;
  title: string;
}

const emptySnippetDraft: SnippetDraft = {
  content: "function studyStep(input: string) {\n  return input.trim();\n}",
  fileId: "",
  language: "typescript",
  notes: "",
  projectId: "",
  title: "New snippet"
};

const emptyExerciseDraft: ExerciseDraft = {
  difficulty: "practice",
  prompt: "",
  starterCode: "",
  title: ""
};

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The coding workspace request failed.";
}

function firstIssueMessage(result: {
  error: { issues: Array<{ message: string }> };
  success: false;
}): string {
  return result.error.issues[0]?.message ?? "Coding workspace form is invalid.";
}

function formId(value: string): string | null {
  return value.trim() || null;
}

function languageLabel(language: CodingLanguage): string {
  if (language === "cpp") {
    return "C++";
  }
  if (language === "systemverilog") {
    return "SystemVerilog";
  }
  return language.replaceAll("_", " ");
}

function monacoLanguage(language: CodingLanguage): string {
  if (language === "cpp") {
    return "cpp";
  }
  if (language === "systemverilog") {
    return "systemverilog";
  }
  if (language === "text") {
    return "plaintext";
  }
  return language;
}

function snippetDraftFromSnippet(snippet: CodeSnippet): SnippetDraft {
  return {
    content: snippet.content,
    fileId: snippet.fileId ?? "",
    language: snippet.language,
    notes: snippet.notes ?? "",
    projectId: snippet.projectId ?? "",
    title: snippet.title
  };
}

export function CodingWorkspacePage({
  client
}: Readonly<{ client?: AetheriumApiClient }>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [snippets, setSnippets] = React.useState<CodeSnippet[]>([]);
  const [exercises, setExercises] = React.useState<CodingExercise[]>([]);
  const [assistantRequests, setAssistantRequests] = React.useState<CodeAssistantRequest[]>([]);
  const [runnerStatus, setRunnerStatus] = React.useState<CodeRunnerStatus | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = React.useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(null);
  const [snippetDraft, setSnippetDraft] = React.useState<SnippetDraft>(emptySnippetDraft);
  const [exerciseDraft, setExerciseDraft] = React.useState<ExerciseDraft>(emptyExerciseDraft);
  const [assistantPrompt, setAssistantPrompt] = React.useState("");
  const [includeProjectContext, setIncludeProjectContext] = React.useState(false);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const selectedSnippet = React.useMemo(
    () => snippets.find((snippet) => snippet.id === selectedSnippetId) ?? null,
    [selectedSnippetId, snippets]
  );
  const selectedExercise = React.useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId]
  );

  const load = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [snippetPage, exercisePage, assistantPage, runner] = await Promise.all([
        apiClient.coding.listSnippets({ limit: PAGE_LIMIT, offset: 0 }),
        apiClient.coding.listExercises({ limit: PAGE_LIMIT, offset: 0 }),
        apiClient.coding.listAssistantRequests({ limit: 10, offset: 0 }),
        apiClient.coding.getRunnerStatus()
      ]);
      setSnippets(snippetPage.items);
      setExercises(exercisePage.items);
      setAssistantRequests(assistantPage.items);
      setRunnerStatus(runner);
      const firstSnippet = snippetPage.items[0] ?? null;
      if (firstSnippet) {
        setSelectedSnippetId(firstSnippet.id);
        setSnippetDraft(snippetDraftFromSnippet(firstSnippet));
      }
      setStatus("ready");
    } catch (loadError) {
      setError(friendlyError(loadError));
      setStatus("error");
    }
  }, [apiClient]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function runAction(actionId: string, action: () => Promise<void>): Promise<void> {
    setActiveAction(actionId);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (actionError) {
      setError(friendlyError(actionError));
    } finally {
      setActiveAction(null);
    }
  }

  function selectDraft(): void {
    setSelectedSnippetId(null);
    setSnippetDraft(emptySnippetDraft);
  }

  function selectSnippet(snippet: CodeSnippet): void {
    setSelectedSnippetId(snippet.id);
    setSnippetDraft(snippetDraftFromSnippet(snippet));
  }

  async function saveNewSnippet(): Promise<void> {
    const parsed = codeSnippetCreateRequestSchema.safeParse({
      content: snippetDraft.content,
      fileId: formId(snippetDraft.fileId),
      language: snippetDraft.language,
      notes: snippetDraft.notes.trim() || null,
      projectId: formId(snippetDraft.projectId),
      title: snippetDraft.title.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("snippet:create", async () => {
      const snippet = await apiClient.coding.createSnippet(parsed.data);
      setSnippets((current) => [snippet, ...current.filter((item) => item.id !== snippet.id)]);
      setSelectedSnippetId(snippet.id);
      setSnippetDraft(snippetDraftFromSnippet(snippet));
      setNotice("Snippet saved.");
    });
  }

  async function updateSelectedSnippet(): Promise<void> {
    if (!selectedSnippet) {
      return;
    }
    const parsed = codeSnippetUpdateRequestSchema.safeParse({
      content: snippetDraft.content,
      fileId: formId(snippetDraft.fileId),
      language: snippetDraft.language,
      notes: snippetDraft.notes.trim() || null,
      projectId: formId(snippetDraft.projectId),
      title: snippetDraft.title.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("snippet:update", async () => {
      const snippet = await apiClient.coding.updateSnippet(selectedSnippet.id, parsed.data);
      setSnippets((current) => current.map((item) => (item.id === snippet.id ? snippet : item)));
      setSnippetDraft(snippetDraftFromSnippet(snippet));
      setNotice("Snippet updated.");
    });
  }

  async function archiveSelectedSnippet(): Promise<void> {
    if (!selectedSnippet) {
      return;
    }
    await runAction("snippet:archive", async () => {
      await apiClient.coding.archiveSnippet(selectedSnippet.id);
      const remaining = snippets.filter((snippet) => snippet.id !== selectedSnippet.id);
      setSnippets(remaining);
      const next = remaining[0] ?? null;
      setSelectedSnippetId(next?.id ?? null);
      setSnippetDraft(next ? snippetDraftFromSnippet(next) : emptySnippetDraft);
      setNotice("Snippet archived.");
    });
  }

  async function createExercise(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = codingExerciseCreateRequestSchema.safeParse({
      difficulty: exerciseDraft.difficulty,
      language: snippetDraft.language,
      projectId: formId(snippetDraft.projectId),
      prompt: exerciseDraft.prompt.trim(),
      starterCode: exerciseDraft.starterCode,
      title: exerciseDraft.title.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("exercise:create", async () => {
      const exercise = await apiClient.coding.createExercise(parsed.data);
      setExercises((current) => [exercise, ...current.filter((item) => item.id !== exercise.id)]);
      setSelectedExerciseId(exercise.id);
      setExerciseDraft(emptyExerciseDraft);
      setNotice("Exercise created.");
    });
  }

  async function submitAttempt(): Promise<void> {
    if (!selectedExercise) {
      setError("Select an exercise before submitting an attempt.");
      return;
    }
    await runAction("exercise:attempt", async () => {
      await apiClient.coding.createAttempt(selectedExercise.id, {
        snippetId: selectedSnippet?.id ?? null,
        submittedCode: snippetDraft.content
      });
      setNotice("Exercise attempt recorded. Code was not executed.");
    });
  }

  function useStarter(exercise: CodingExercise): void {
    setSelectedExerciseId(exercise.id);
    setSnippetDraft((current) => ({
      ...current,
      content: exercise.starterCode,
      language: exercise.language,
      title: `${exercise.title} attempt`
    }));
  }

  async function requestAssistant(kind: "explain" | "review"): Promise<void> {
    const parsed = codeAssistantCreateRequestSchema.safeParse({
      code: selectedSnippet ? undefined : snippetDraft.content,
      includeProjectContext,
      language: snippetDraft.language,
      projectId: formId(snippetDraft.projectId),
      prompt: assistantPrompt.trim() || null,
      snippetId: selectedSnippet?.id ?? null
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction(`assistant:${kind}`, async () => {
      const response =
        kind === "explain"
          ? await apiClient.coding.explain(parsed.data)
          : await apiClient.coding.review(parsed.data);
      setAssistantRequests((current) =>
        [response, ...current.filter((item) => item.id !== response.id)].slice(0, 10)
      );
      setAssistantPrompt("");
      setNotice(kind === "explain" ? "Explanation generated." : "Review generated.");
    });
  }

  if (status === "loading") {
    return (
      <section className="content-stack" aria-busy="true">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Coding Workspace</p>
            <h1>Coding</h1>
          </div>
        </header>
        <section className="work-panel">
          <p className="empty-note">Loading coding workspace...</p>
        </section>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="content-stack">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Coding Workspace</p>
            <h1>Coding</h1>
          </div>
          <button className="secondary-action" onClick={() => void load()} type="button">
            Retry
          </button>
        </header>
        <section className="inline-alert" role="alert">
          {error ?? "Coding workspace is unavailable."}
        </section>
      </section>
    );
  }

  return (
    <section className="content-stack coding-workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Coding Workspace</p>
          <h1>Coding</h1>
        </div>
        <span className="state-pill">
          {snippets.length} {snippets.length === 1 ? "snippet" : "snippets"}
        </span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      {notice ? <section className="inline-success">{notice}</section> : null}

      <section className="coding-layout">
        <aside className="work-panel coding-sidebar">
          <header className="coding-panel-header">
            <div>
              <h2>Tabs</h2>
              <p className="empty-note">Saved snippets are persistent editor tabs.</p>
            </div>
            <button className="secondary-action" onClick={selectDraft} type="button">
              New
            </button>
          </header>
          <button
            aria-pressed={selectedSnippetId === null}
            className="coding-tab-row"
            onClick={selectDraft}
            type="button"
          >
            <strong>Draft</strong>
            <span>{languageLabel(snippetDraft.language)}</span>
          </button>
          {snippets.length === 0 ? (
            <p className="empty-note">No saved snippets yet. Save the draft to create one.</p>
          ) : null}
          {snippets.map((snippet) => (
            <button
              aria-pressed={selectedSnippetId === snippet.id}
              className="coding-tab-row"
              key={snippet.id}
              onClick={() => selectSnippet(snippet)}
              type="button"
            >
              <strong>{snippet.title}</strong>
              <span>{languageLabel(snippet.language)}</span>
            </button>
          ))}
        </aside>

        <section className="work-panel coding-editor-panel">
          <header className="coding-editor-toolbar">
            <label>
              Title
              <input
                onChange={(event) =>
                  setSnippetDraft((current) => ({ ...current, title: event.target.value }))
                }
                value={snippetDraft.title}
              />
            </label>
            <label>
              Language
              <select
                onChange={(event) =>
                  setSnippetDraft((current) => ({
                    ...current,
                    language: event.target.value as CodingLanguage
                  }))
                }
                value={snippetDraft.language}
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {languageLabel(language)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Project UUID
              <input
                onChange={(event) =>
                  setSnippetDraft((current) => ({ ...current, projectId: event.target.value }))
                }
                value={snippetDraft.projectId}
              />
            </label>
            <label>
              Vault file UUID
              <input
                onChange={(event) =>
                  setSnippetDraft((current) => ({ ...current, fileId: event.target.value }))
                }
                value={snippetDraft.fileId}
              />
            </label>
          </header>

          <div className="monaco-shell">
            <Editor
              height="430px"
              language={monacoLanguage(snippetDraft.language)}
              onChange={(value) =>
                setSnippetDraft((current) => ({ ...current, content: value ?? "" }))
              }
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                renderWhitespace: "selection",
                scrollBeyondLastLine: false,
                wordWrap: "on"
              }}
              theme="vs-dark"
              value={snippetDraft.content}
            />
          </div>

          <label className="coding-notes-field">
            Notes
            <textarea
              onChange={(event) =>
                setSnippetDraft((current) => ({ ...current, notes: event.target.value }))
              }
              value={snippetDraft.notes}
            />
          </label>

          <div className="coding-action-row">
            <button
              className="primary-action"
              disabled={activeAction === "snippet:create"}
              onClick={() => void saveNewSnippet()}
              type="button"
            >
              Save new snippet
            </button>
            <button
              className="secondary-action"
              disabled={!selectedSnippet || activeAction === "snippet:update"}
              onClick={() => void updateSelectedSnippet()}
              type="button"
            >
              Update selected
            </button>
            <button
              className="danger-action"
              disabled={!selectedSnippet || activeAction === "snippet:archive"}
              onClick={() => void archiveSelectedSnippet()}
              type="button"
            >
              Archive selected
            </button>
          </div>
        </section>

        <aside className="coding-side-stack">
          <section className="work-panel">
            <h2>AI coding assistant</h2>
            <label className="coding-notes-field">
              Request
              <textarea
                onChange={(event) => setAssistantPrompt(event.target.value)}
                placeholder="Ask for a focused explanation or review."
                value={assistantPrompt}
              />
            </label>
            <label className="toggle-row">
              <input
                checked={includeProjectContext}
                onChange={(event) => setIncludeProjectContext(event.target.checked)}
                type="checkbox"
              />
              Include project context
            </label>
            <div className="coding-action-row">
              <button
                className="secondary-action"
                disabled={activeAction === "assistant:explain"}
                onClick={() => void requestAssistant("explain")}
                type="button"
              >
                Explain
              </button>
              <button
                className="secondary-action"
                disabled={activeAction === "assistant:review"}
                onClick={() => void requestAssistant("review")}
                type="button"
              >
                Review
              </button>
            </div>
            {assistantRequests.length === 0 ? (
              <p className="empty-note">No AI coding requests yet.</p>
            ) : (
              <ul className="coding-history-list">
                {assistantRequests.map((request) => (
                  <li key={request.id}>
                    <strong>{request.kind}</strong>
                    <p>{request.response}</p>
                    <small>
                      {request.providerName ?? "No provider"} - {request.modelName ?? "No model"}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="work-panel">
            <h2>Exercises</h2>
            <form className="coding-exercise-form" onSubmit={(event) => void createExercise(event)}>
              <label>
                Title
                <input
                  onChange={(event) =>
                    setExerciseDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  value={exerciseDraft.title}
                />
              </label>
              <label>
                Difficulty
                <select
                  onChange={(event) =>
                    setExerciseDraft((current) => ({
                      ...current,
                      difficulty: event.target.value as CodingExerciseDifficulty
                    }))
                  }
                  value={exerciseDraft.difficulty}
                >
                  <option value="intro">Intro</option>
                  <option value="practice">Practice</option>
                  <option value="challenge">Challenge</option>
                </select>
              </label>
              <label className="wide-field">
                Prompt
                <textarea
                  onChange={(event) =>
                    setExerciseDraft((current) => ({ ...current, prompt: event.target.value }))
                  }
                  value={exerciseDraft.prompt}
                />
              </label>
              <label className="wide-field">
                Starter code
                <textarea
                  onChange={(event) =>
                    setExerciseDraft((current) => ({
                      ...current,
                      starterCode: event.target.value
                    }))
                  }
                  value={exerciseDraft.starterCode}
                />
              </label>
              <button className="secondary-action" disabled={activeAction === "exercise:create"}>
                Create exercise
              </button>
            </form>
            {exercises.length === 0 ? (
              <p className="empty-note">No coding exercises yet.</p>
            ) : (
              <ul className="coding-history-list">
                {exercises.map((exercise) => (
                  <li key={exercise.id}>
                    <strong>{exercise.title}</strong>
                    <p>{exercise.prompt}</p>
                    <div className="coding-action-row">
                      <button
                        aria-pressed={selectedExerciseId === exercise.id}
                        className="secondary-action"
                        onClick={() => useStarter(exercise)}
                        type="button"
                      >
                        Use starter
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="primary-action"
              disabled={!selectedExercise || activeAction === "exercise:attempt"}
              onClick={() => void submitAttempt()}
              type="button"
            >
              Submit attempt
            </button>
          </section>

          <section className="work-panel">
            <h2>Code runner</h2>
            <span className="status-token status-token-danger">
              {runnerStatus?.availability ?? "unavailable"}
            </span>
            <p className="empty-note">
              {runnerStatus?.reason ??
                "No isolated execution provider is configured for this workspace."}
            </p>
            <ul className="chip-list">
              {(runnerStatus?.securityRequirements ?? []).slice(0, 6).map((requirement) => (
                <li key={requirement}>{requirement.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </section>
  );
}
