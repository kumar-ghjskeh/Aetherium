import type {
  CodeAssistantRequestPage,
  CodeRunnerStatus,
  CodeSnippetPage,
  CodingExerciseDifficulty,
  CodingExercisePage,
  CodingLanguage,
  ProjectPage
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export interface CodingArenaOverviewData {
  assistantRequests: CodeAssistantRequestPage;
  exercises: CodingExercisePage;
  projects: ProjectPage;
  runner: CodeRunnerStatus;
  snippets: CodeSnippetPage;
}

export interface SnippetConsoleViewModel {
  accent: string;
  id: string;
  languageLabel: string;
  linkedProjectLabel: string;
  position: Vector3Tuple;
  title: string;
}

export interface ExercisePylonViewModel {
  accent: string;
  difficulty: CodingExerciseDifficulty;
  id: string;
  languageLabel: string;
  position: Vector3Tuple;
  title: string;
}

export interface CodingArenaViewModel {
  assistantActivityLabel: string;
  assistantCountLabel: string;
  exerciseCountLabel: string;
  exercisePylons: ExercisePylonViewModel[];
  linkedProjectCountLabel: string;
  runnerAvailable: boolean;
  runnerDetail: string;
  runnerLanguageLabel: string;
  runnerRequirements: string[];
  runnerStatusLabel: string;
  snippetConsoles: SnippetConsoleViewModel[];
  snippetCountLabel: string;
}

const SNIPPET_CONSOLE_POSITIONS: Vector3Tuple[] = [
  [-18, 1.7, -9],
  [-11, 1.7, -18],
  [0, 1.7, -21],
  [11, 1.7, -18],
  [18, 1.7, -9],
  [0, 1.7, 17]
];

const EXERCISE_PYLON_POSITIONS: Vector3Tuple[] = [
  [-22, 1.5, 9],
  [-13, 1.5, 17],
  [13, 1.5, 17],
  [22, 1.5, 9],
  [-8, 1.5, 25],
  [8, 1.5, 25]
];

const LANGUAGE_COLORS: Record<CodingLanguage, string> = {
  cpp: "#7dc9ff",
  javascript: "#f0c766",
  python: "#79d7a6",
  sql: "#c2a9ff",
  systemverilog: "#ff9c6e",
  text: "#d7e4ea",
  typescript: "#55d9f2"
};

const DIFFICULTY_COLORS: Record<CodingExerciseDifficulty, string> = {
  challenge: "#ff8f70",
  intro: "#79d7a6",
  practice: "#55d9f2"
};

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function languageLabel(language: CodingLanguage): string {
  if (language === "cpp") {
    return "C++";
  }
  if (language === "systemverilog") {
    return "SystemVerilog";
  }
  if (language === "sql") {
    return "SQL";
  }
  return `${language.slice(0, 1).toUpperCase()}${language.slice(1)}`;
}

function requirementLabel(requirement: string): string {
  return requirement.replaceAll("_", " ");
}

export function buildCodingArenaViewModel(data: CodingArenaOverviewData): CodingArenaViewModel {
  const projectsById = new Map(data.projects.items.map((project) => [project.id, project]));
  const linkedProjectIds = new Set(
    [...data.snippets.items, ...data.exercises.items]
      .map((item) => item.projectId)
      .filter((projectId): projectId is string => projectId !== null)
  );
  const latestAssistantRequest = data.assistantRequests.items[0];

  return {
    assistantActivityLabel: latestAssistantRequest
      ? `${latestAssistantRequest.kind === "review" ? "Review" : "Explanation"} ${
          latestAssistantRequest.status
        }`
      : "No AI coding requests yet",
    assistantCountLabel: formatCount(data.assistantRequests.total, "AI request"),
    exerciseCountLabel: formatCount(data.exercises.total, "exercise"),
    exercisePylons: data.exercises.items
      .slice(0, EXERCISE_PYLON_POSITIONS.length)
      .map((exercise, index) => ({
        accent: DIFFICULTY_COLORS[exercise.difficulty],
        difficulty: exercise.difficulty,
        id: exercise.id,
        languageLabel: languageLabel(exercise.language),
        position: EXERCISE_PYLON_POSITIONS[index] ?? [0, 1.5, 0],
        title: exercise.title
      })),
    linkedProjectCountLabel: formatCount(linkedProjectIds.size, "linked project"),
    runnerAvailable: data.runner.executionAvailable,
    runnerDetail: data.runner.reason,
    runnerLanguageLabel:
      data.runner.supportedLanguages.length > 0
        ? data.runner.supportedLanguages.map(languageLabel).join(", ")
        : "No languages enabled",
    runnerRequirements: data.runner.securityRequirements.slice(0, 6).map(requirementLabel),
    runnerStatusLabel: data.runner.executionAvailable ? "Isolated runner ready" : "Safe run sealed",
    snippetConsoles: data.snippets.items
      .slice(0, SNIPPET_CONSOLE_POSITIONS.length)
      .map((snippet, index) => ({
        accent: LANGUAGE_COLORS[snippet.language],
        id: snippet.id,
        languageLabel: languageLabel(snippet.language),
        linkedProjectLabel: snippet.projectId
          ? (projectsById.get(snippet.projectId)?.name ?? "Linked project")
          : "Independent snippet",
        position: SNIPPET_CONSOLE_POSITIONS[index] ?? [0, 1.7, 0],
        title: snippet.title
      })),
    snippetCountLabel: formatCount(data.snippets.total, "saved snippet")
  };
}
