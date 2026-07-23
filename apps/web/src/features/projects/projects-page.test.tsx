import type { AetheriumApiClient } from "@aetherium/api-client";
import type { Project, ProjectActivity, ProjectDetail, ProjectPage } from "@aetherium/shared-types";
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
  createUnusedNotificationsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient
} from "../../test/api-client";
import { ProjectsPage } from "./projects-page";

const now = "2026-07-21T00:00:00Z";

const project: Project = {
  archivedAt: null,
  completedAt: null,
  createdAt: now,
  description: "Build a compiler study tool.",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Compiler Lab",
  objective: "Ship a parser prototype.",
  repositoryUrl: "https://github.com/example/compiler-lab",
  startedOn: "2026-07-21",
  status: "active",
  targetDate: "2026-08-15",
  updatedAt: now
};

const milestone = {
  completedAt: null,
  createdAt: now,
  description: null,
  dueDate: "2026-07-30",
  id: "22222222-2222-4222-8222-222222222222",
  position: 0,
  projectId: project.id,
  status: "planned" as const,
  title: "Parser milestone",
  updatedAt: now
};

const task = {
  completedAt: null,
  createdAt: now,
  description: null,
  dueDate: null,
  id: "33333333-3333-4333-8333-333333333333",
  milestoneId: milestone.id,
  priority: "high" as const,
  projectId: project.id,
  status: "todo" as const,
  title: "Tokenize input",
  updatedAt: now
};

const note = {
  body: "Use a recursive descent parser first.",
  createdAt: now,
  id: "44444444-4444-4444-8444-444444444444",
  projectId: project.id,
  title: "Implementation note",
  updatedAt: now
};

const link = {
  createdAt: now,
  id: "55555555-5555-4555-8555-555555555555",
  projectId: project.id,
  title: "Repository",
  updatedAt: now,
  url: "https://github.com/example/compiler-lab"
};

const technology = {
  createdAt: now,
  id: "66666666-6666-4666-8666-666666666666",
  name: "TypeScript",
  projectId: project.id,
  updatedAt: now
};

const blocker = {
  createdAt: now,
  description: "Need parser error strategy.",
  id: "77777777-7777-4777-8777-777777777777",
  projectId: project.id,
  resolvedAt: null,
  status: "open" as const,
  title: "Error handling",
  updatedAt: now
};

const activity: ProjectActivity = {
  activityType: "project.created",
  createdAt: now,
  description: "Project created.",
  id: "88888888-8888-4888-8888-888888888888",
  metadata: { projectId: project.id },
  projectId: project.id
};

function projectDetail(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    ...project,
    blockers: [blocker],
    files: [],
    links: [link],
    milestones: [milestone],
    notes: [note],
    recentActivity: [activity],
    tasks: [task],
    technologies: [technology],
    topics: [],
    ...overrides
  };
}

function page(items: Project[]): ProjectPage {
  return {
    items,
    limit: 25,
    offset: 0,
    total: items.length
  };
}

function requireElement(element: HTMLElement | null): HTMLElement {
  expect(element).not.toBeNull();
  if (element === null) {
    throw new Error("Expected element to exist.");
  }
  return element;
}

function createClient(overrides: Partial<AetheriumApiClient["projects"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-project call"));

  return {
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
    achievements: createUnusedAchievementsClient(),
    analytics: createUnusedAnalyticsClient(),
    auditLogs: { list: vi.fn(reject) },
    auth: {
      login: vi.fn(reject),
      logout: vi.fn(reject),
      me: vi.fn(reject),
      register: vi.fn(reject)
    },
    coding: createUnusedCodingClient(),
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    habits: createUnusedHabitsClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    knowledge: createUnusedKnowledgeClient(),
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: createUnusedNotificationsClient(),
    projects: {
      ...createUnusedProjectsClient(),
      addTechnology: vi.fn(() => Promise.resolve(technology)),
      archive: vi.fn(() => Promise.resolve({ ...project, archivedAt: now })),
      attachFile: vi.fn(() =>
        Promise.resolve({
          createdAt: now,
          description: "Design notes",
          fileId: "99999999-9999-4999-8999-999999999999",
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          projectId: project.id,
          updatedAt: now
        })
      ),
      create: vi.fn(() => Promise.resolve(project)),
      createBlocker: vi.fn(() => Promise.resolve(blocker)),
      createLink: vi.fn(() => Promise.resolve(link)),
      createMilestone: vi.fn(() => Promise.resolve(milestone)),
      createNote: vi.fn(() => Promise.resolve(note)),
      createTask: vi.fn(() => Promise.resolve(task)),
      get: vi.fn(() => Promise.resolve(projectDetail())),
      linkTopic: vi.fn(() =>
        Promise.resolve({
          createdAt: now,
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          projectId: project.id,
          topicId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          updatedAt: now
        })
      ),
      list: vi.fn(() => Promise.resolve(page([]))),
      listActivity: vi.fn(() =>
        Promise.resolve({ items: [activity], limit: 10, offset: 0, total: 1 })
      ),
      update: vi.fn(() => Promise.resolve({ ...project, status: "completed" as const })),
      updateBlocker: vi.fn(() =>
        Promise.resolve({ ...blocker, resolvedAt: now, status: "resolved" as const })
      ),
      updateMilestone: vi.fn(() => Promise.resolve({ ...milestone, status: "active" as const })),
      updateTask: vi.fn(() =>
        Promise.resolve({ ...task, completedAt: now, status: "done" as const })
      ),
      ...overrides
    },
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: { getProfile: vi.fn(reject), updateProfile: vi.fn(reject), visit: vi.fn(reject) }
  };
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state and then an empty Project Dock", async () => {
    let resolveProjects: (value: ProjectPage) => void = () => undefined;
    const pendingProjects = new Promise<ProjectPage>((resolve) => {
      resolveProjects = resolve;
    });
    const client = createClient({
      list: vi.fn(() => pendingProjects)
    });

    render(<ProjectsPage client={client} />);

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();

    resolveProjects(page([]));

    await waitFor(() => {
      expect(
        screen.getByText("No projects exist yet. Create one to start planning work.")
      ).toBeInTheDocument();
    });
  });

  it("validates project creation before calling the API", async () => {
    const user = userEvent.setup();
    const client = createClient();
    render(<ProjectsPage client={client} />);

    await waitFor(() => {
      expect(
        screen.getByText("No projects exist yet. Create one to start planning work.")
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(client.projects.create).not.toHaveBeenCalled();
  });

  it("creates a project and manages selected project records", async () => {
    const user = userEvent.setup();
    const client = createClient({
      list: vi.fn(() => Promise.resolve(page([project])))
    });
    render(<ProjectsPage client={client} />);

    await screen.findByRole("button", { name: /Compiler Lab/ });

    await user.type(screen.getByLabelText("Name"), "Compiler Lab");
    await user.type(screen.getByLabelText("Objective"), "Ship a parser prototype.");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(client.projects.create).toHaveBeenCalledWith({
        description: null,
        name: "Compiler Lab",
        objective: "Ship a parser prototype.",
        repositoryUrl: null,
        targetDate: null
      });
    });

    await user.click(screen.getByRole("button", { name: "Complete project" }));
    expect(client.projects.update).toHaveBeenCalledWith(project.id, { status: "completed" });

    const milestonePanel = within(
      requireElement(screen.getByText("Milestones").closest("article"))
    );
    await user.type(milestonePanel.getByLabelText("Title"), "Parser milestone");
    await user.click(milestonePanel.getByRole("button", { name: "Add" }));
    expect(client.projects.createMilestone).toHaveBeenCalledWith(project.id, {
      dueDate: null,
      title: "Parser milestone"
    });

    const taskPanel = within(requireElement(screen.getByText("Tasks").closest("article")));
    await user.type(taskPanel.getByLabelText("Title"), "Tokenize input");
    await user.selectOptions(taskPanel.getByLabelText("Priority"), "high");
    await user.click(taskPanel.getByRole("button", { name: "Add" }));
    expect(client.projects.createTask).toHaveBeenCalledWith(project.id, {
      milestoneId: milestone.id,
      priority: "high",
      title: "Tokenize input"
    });

    await user.click(screen.getByRole("button", { name: "Mark done" }));
    expect(client.projects.updateTask).toHaveBeenCalledWith(task.id, { status: "done" });

    await user.type(screen.getByLabelText("Note title"), "Implementation note");
    await user.type(screen.getByLabelText("Note"), "Use a recursive descent parser first.");
    await user.click(screen.getByRole("button", { name: "Add note" }));
    expect(client.projects.createNote).toHaveBeenCalled();

    await user.type(screen.getByLabelText("Technology"), "TypeScript");
    await user.click(screen.getByRole("button", { name: "Add technology" }));
    expect(client.projects.addTechnology).toHaveBeenCalledWith(project.id, { name: "TypeScript" });

    await user.click(screen.getByRole("button", { name: "Resolve" }));
    expect(client.projects.updateBlocker).toHaveBeenCalledWith(blocker.id, { status: "resolved" });
  });

  it("shows API failures without displaying false success", async () => {
    const client = createClient({
      list: vi.fn(() => Promise.reject(new Error("Projects unavailable")))
    });

    render(<ProjectsPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Projects unavailable");
    expect(screen.queryByText("Project created.")).not.toBeInTheDocument();
  });
});
