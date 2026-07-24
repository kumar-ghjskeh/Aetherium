import type { WorldInteractionManifestEntry } from "../schemas/world-manifest-schema";

export const WORLD_INTERACTIONS_MANIFEST: WorldInteractionManifestEntry[] = [
  {
    accessibilityLabel: "Open the Knowledge Library in Command Mode",
    commandRoute: "/app/library",
    gamepadAction: "primary",
    id: "interaction-library-terminal",
    keyboardAction: "KeyE",
    locationId: "knowledge-library",
    position: [3.4, 0.36, -2.8],
    prompt: "Open Library",
    radius: 2.35,
    type: "open_file_collection"
  },
  {
    accessibilityLabel: "Ask an AI mentor in Command Mode",
    commandRoute: "/app/ai",
    gamepadAction: "primary",
    id: "interaction-ai-terminal",
    keyboardAction: "KeyE",
    locationId: "ai-observatory",
    position: [-3.4, 0.36, -2.8],
    prompt: "Ask AI",
    radius: 2.35,
    type: "start_ai_conversation"
  },
  {
    accessibilityLabel: "Open Habit Garden in Command Mode",
    commandRoute: "/app/habits",
    gamepadAction: "primary",
    id: "interaction-habit-terminal",
    keyboardAction: "KeyE",
    locationId: "habit-garden",
    position: [3.4, 0.36, 2.8],
    prompt: "Open Habits",
    radius: 2.35,
    type: "open_habit_dashboard"
  },
  {
    accessibilityLabel: "Open analytics in Command Mode",
    commandRoute: "/app/analytics",
    gamepadAction: "primary",
    id: "interaction-analytics-terminal",
    keyboardAction: "KeyE",
    locationId: "progress-tower",
    position: [-3.4, 0.36, 2.8],
    prompt: "Open Analytics",
    radius: 2.35,
    type: "open_analytics"
  },
  {
    accessibilityLabel: "Open the Project Dock in Command Mode",
    commandRoute: "/app/projects",
    gamepadAction: "primary",
    id: "interaction-project-terminal",
    keyboardAction: "KeyE",
    locationId: "project-dock",
    position: [0, 0.36, -5.2],
    prompt: "Open Projects",
    radius: 2.35,
    type: "open_project"
  },
  {
    accessibilityLabel: "Open Achievement Hall in Command Mode",
    commandRoute: "/app/achievements",
    gamepadAction: "primary",
    id: "interaction-achievement-terminal",
    keyboardAction: "KeyE",
    locationId: "achievement-hall",
    position: [0, 0.36, 5.2],
    prompt: "Open Achievements",
    radius: 2.35,
    type: "open_achievement_display"
  }
];
