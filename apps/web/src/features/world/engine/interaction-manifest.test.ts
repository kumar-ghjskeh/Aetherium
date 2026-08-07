import type { WorldDeepLinkPage, WorldLocationPage } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildDiagnosticWorldInteractions } from "./interaction-manifest";

const locationPage: WorldLocationPage = {
  currentLocationId: "central_plaza",
  items: [
    {
      category: "vault",
      commandRoute: "/app/library",
      current: false,
      deepLinkEntityTypes: ["file"],
      defaultUnlocked: true,
      description: "Files",
      futureSceneKey: "knowledge-library",
      id: "library",
      spawn: false,
      subtitle: "Vault",
      title: "Library",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    },
    {
      category: "ai",
      commandRoute: "/app/ai",
      current: false,
      deepLinkEntityTypes: ["mentor", "conversation"],
      defaultUnlocked: true,
      description: "Mentors",
      futureSceneKey: "ai-observatory",
      id: "ai_hall",
      spawn: false,
      subtitle: "Mentors",
      title: "AI Hall",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    },
    {
      category: "habits",
      commandRoute: "/app/habits",
      current: false,
      deepLinkEntityTypes: ["habit", "habit_log"],
      defaultUnlocked: true,
      description: "Habits",
      futureSceneKey: "habit-garden",
      id: "habit_garden",
      spawn: false,
      subtitle: "Rhythms",
      title: "Habit Garden",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    },
    {
      category: "learning",
      commandRoute: "/app/learning",
      current: false,
      deepLinkEntityTypes: ["subject", "topic", "course", "lesson", "quiz", "flashcard"],
      defaultUnlocked: true,
      description: "Learning records",
      futureSceneKey: "learning-academy",
      id: "research_laboratory",
      spawn: false,
      subtitle: "Learning Academy",
      title: "Learning Academy",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    },
    {
      category: "coding",
      commandRoute: "/app/coding",
      current: false,
      deepLinkEntityTypes: ["code_snippet", "coding_exercise", "project"],
      defaultUnlocked: true,
      description: "Coding workspace records",
      futureSceneKey: "coding-arena",
      id: "programming_tower",
      spawn: false,
      subtitle: "Coding Arena",
      title: "Coding Arena",
      unlockDependencyIds: [],
      unlocked: true,
      visited: false,
      visualStatus: "data_contract_ready"
    },
    {
      category: "achievements",
      commandRoute: "/app/achievements",
      current: false,
      deepLinkEntityTypes: ["achievement"],
      defaultUnlocked: false,
      description: "Milestones",
      futureSceneKey: "achievement-hall",
      id: "achievement_hall",
      spawn: false,
      subtitle: "Milestones",
      title: "Achievement Hall",
      unlockDependencyIds: [],
      unlocked: false,
      visited: false,
      visualStatus: "data_contract_ready"
    }
  ],
  total: 6,
  unlockedCount: 5,
  visitedCount: 0
};

const deepLinks: WorldDeepLinkPage = {
  items: [
    {
      commandRoute: "/app/ai",
      entityTypes: ["mentor", "conversation"],
      label: "AI Hall",
      locationId: "ai_hall",
      notes: "Route",
      routePattern: "/app/ai{?conversationId}"
    },
    {
      commandRoute: "/app/habits",
      entityTypes: ["habit", "habit_log"],
      label: "Habit Garden",
      locationId: "habit_garden",
      notes: "Route",
      routePattern: "/app/habits{?habitId}"
    },
    {
      commandRoute: "/app/library",
      entityTypes: ["file"],
      label: "Library",
      locationId: "library",
      notes: "Route",
      routePattern: "/app/library{?entityId}"
    },
    {
      commandRoute: "/app/learning",
      entityTypes: ["subject", "topic", "course", "lesson", "quiz", "flashcard"],
      label: "Learning Academy",
      locationId: "research_laboratory",
      notes: "Route",
      routePattern: "/app/learning{?topicId,lessonId}"
    },
    {
      commandRoute: "/app/coding",
      entityTypes: ["code_snippet", "coding_exercise", "project"],
      label: "Coding Arena",
      locationId: "programming_tower",
      notes: "Route",
      routePattern: "/app/coding{?snippetId,exerciseId,projectId}"
    }
  ],
  total: 5
};

describe("diagnostic world interaction manifest", () => {
  it("builds command-route interactions from world deep links and location unlock state", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });
    const library = interactions.find((interaction) => interaction.locationId === "library");
    const achievements = interactions.find(
      (interaction) => interaction.locationId === "achievement_hall"
    );

    expect(library?.commandRoute).toBe("/app/library");
    expect(library?.status).toBe("available");
    expect(achievements?.commandRoute).toBe("/app/achievements");
    expect(achievements?.status).toBe("permission_denied");
  });

  it("keeps Central Plaza terminal routes from the authored interaction manifest", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });
    const mapTerminal = interactions.find(
      (interaction) => interaction.id === "interaction-plaza-map-terminal"
    );

    expect(mapTerminal?.locationId).toBe("central_plaza");
    expect(mapTerminal?.commandRoute).toBe("/app/world");
    expect(mapTerminal?.status).toBe("available");
  });

  it("adds Knowledge Library district terminals for vault browsing and AI Q&A", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });

    expect(
      interactions.find((interaction) => interaction.id === "interaction-library-search-terminal")
    ).toMatchObject({
      commandRoute: "/app/library",
      locationId: "library",
      prompt: "Search Files",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-library-ai-terminal")
    ).toMatchObject({
      commandRoute: "/app/ai",
      locationId: "library",
      prompt: "Ask About Files",
      status: "available"
    });
  });

  it("adds AI Observatory terminals for mentor chat, document Q&A, and provider settings", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });

    expect(
      interactions.find((interaction) => interaction.id === "interaction-observatory-mentor-chat")
    ).toMatchObject({
      commandRoute: "/app/ai",
      locationId: "ai_hall",
      prompt: "Open Mentor Chat",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-observatory-document-qa")
    ).toMatchObject({
      commandRoute: "/app/ai",
      locationId: "ai_hall",
      prompt: "Open Document Q&A",
      status: "available"
    });
    expect(
      interactions.find(
        (interaction) => interaction.id === "interaction-observatory-provider-status"
      )
    ).toMatchObject({
      commandRoute: "/app/settings",
      locationId: "ai_hall",
      prompt: "Review AI Settings",
      status: "available"
    });
  });

  it("adds Habit Garden terminals for logging, creation, and milestones", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });

    expect(
      interactions.find((interaction) => interaction.id === "interaction-garden-log-terminal")
    ).toMatchObject({
      commandRoute: "/app/habits",
      locationId: "habit_garden",
      prompt: "Log Today",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-garden-create-terminal")
    ).toMatchObject({
      commandRoute: "/app/habits",
      locationId: "habit_garden",
      prompt: "Create Habit",
      status: "available"
    });
    expect(
      interactions.find(
        (interaction) => interaction.id === "interaction-garden-milestones-terminal"
      )
    ).toMatchObject({
      commandRoute: "/app/achievements",
      locationId: "habit_garden",
      prompt: "Review Milestones",
      status: "available"
    });
  });

  it("adds Learning Academy terminals for lessons, practice, review, roadmaps, and mentors", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });

    expect(
      interactions.find((interaction) => interaction.id === "interaction-academy-resume-lesson")
    ).toMatchObject({
      commandRoute: "/app/learning",
      locationId: "research_laboratory",
      prompt: "Resume Lesson",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-academy-quiz-terminal")
    ).toMatchObject({
      commandRoute: "/app/learning",
      locationId: "research_laboratory",
      prompt: "Take Quiz",
      status: "available"
    });
    expect(
      interactions.find(
        (interaction) => interaction.id === "interaction-academy-flashcards-terminal"
      )
    ).toMatchObject({
      commandRoute: "/app/learning",
      locationId: "research_laboratory",
      prompt: "Review Flashcards",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-academy-mentor-terminal")
    ).toMatchObject({
      commandRoute: "/app/ai",
      locationId: "research_laboratory",
      prompt: "Ask Mentor",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-academy-roadmap-terminal")
    ).toMatchObject({
      commandRoute: "/app/learning",
      locationId: "research_laboratory",
      prompt: "Open Roadmap",
      status: "available"
    });
  });

  it("adds Coding Arena terminals for workspace, exercises, AI review, runner status, and projects", () => {
    const interactions = buildDiagnosticWorldInteractions({ deepLinks, locationPage });

    expect(
      interactions.find((interaction) => interaction.id === "interaction-arena-workspace-terminal")
    ).toMatchObject({
      commandRoute: "/app/coding",
      locationId: "programming_tower",
      prompt: "Open Workspace",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-arena-exercise-terminal")
    ).toMatchObject({
      commandRoute: "/app/coding",
      locationId: "programming_tower",
      prompt: "Choose Exercise",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-arena-review-terminal")
    ).toMatchObject({
      commandRoute: "/app/coding",
      locationId: "programming_tower",
      prompt: "Review Code",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-arena-runner-terminal")
    ).toMatchObject({
      commandRoute: "/app/coding",
      locationId: "programming_tower",
      prompt: "Runner Status",
      status: "available"
    });
    expect(
      interactions.find((interaction) => interaction.id === "interaction-arena-project-terminal")
    ).toMatchObject({
      commandRoute: "/app/projects",
      locationId: "programming_tower",
      prompt: "Linked Projects",
      status: "available"
    });
  });
});
