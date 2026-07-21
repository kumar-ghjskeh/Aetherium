export interface ShellNavigationItem {
  href: string;
  id: string;
  label: string;
  shortLabel: string;
}

export const shellNavigation: ShellNavigationItem[] = [
  { href: "/app", id: "overview", label: "Overview", shortLabel: "Home" },
  { href: "/app/library", id: "library", label: "Library", shortLabel: "Library" },
  { href: "/app/ai", id: "ai", label: "AI Hall", shortLabel: "AI" },
  { href: "/app/learning", id: "learning", label: "Learning", shortLabel: "Learn" },
  { href: "/app/coding", id: "coding", label: "Coding", shortLabel: "Code" },
  { href: "/app/habits", id: "habits", label: "Habits", shortLabel: "Habits" },
  { href: "/app/projects", id: "projects", label: "Projects", shortLabel: "Projects" },
  { href: "/app/analytics", id: "analytics", label: "Analytics", shortLabel: "Stats" },
  { href: "/app/achievements", id: "achievements", label: "Achievements", shortLabel: "Awards" },
  { href: "/app/settings", id: "settings", label: "Settings", shortLabel: "Settings" },
  { href: "/app/world", id: "world", label: "World", shortLabel: "World" }
];

export interface CommandAction {
  available: boolean;
  href?: string;
  id: string;
  label: string;
  reason?: string;
}

export const commandActions: CommandAction[] = [
  { available: true, href: "/app/library", id: "open-library", label: "Open Library" },
  { available: true, href: "/app/ai", id: "ask-ai", label: "Ask AI" },
  { available: true, href: "/app/library", id: "upload-file", label: "Upload file" },
  { available: true, href: "/app/habits", id: "create-habit", label: "Create habit" },
  {
    available: false,
    id: "create-task",
    label: "Create task",
    reason: "Task creation arrives with projects and planning."
  },
  {
    available: false,
    id: "create-project",
    label: "Create project",
    reason: "Project creation arrives in Project Dock."
  },
  { available: true, href: "/app/analytics", id: "open-analytics", label: "Open analytics" },
  { available: true, href: "/app/settings", id: "open-settings", label: "Open settings" },
  { available: true, href: "/app/world", id: "open-world", label: "Open future World Mode page" },
  { available: true, id: "logout", label: "Logout" }
];
