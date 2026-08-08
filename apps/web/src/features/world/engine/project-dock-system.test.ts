import type { ProjectDetail, ProjectPage } from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildProjectDockViewModel } from "./project-dock-system";

const featuredProject: ProjectDetail = {
  archivedAt: null,
  blockers: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      description: "Private blocker description",
      id: "blocker-1",
      projectId: "project-1",
      resolvedAt: null,
      status: "open",
      title: "Waiting for test hardware",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  completedAt: null,
  createdAt: "2026-08-01T00:00:00Z",
  description: "Private project description",
  files: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      description: "Private file description",
      fileId: "private-file-id",
      id: "project-file-1",
      projectId: "project-1",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  id: "project-1",
  links: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      id: "link-1",
      projectId: "project-1",
      title: "Private repository",
      updatedAt: "2026-08-01T00:00:00Z",
      url: "https://private.example.test"
    }
  ],
  milestones: [
    {
      completedAt: null,
      createdAt: "2026-08-01T00:00:00Z",
      description: "Private milestone description",
      dueDate: "2026-09-01",
      id: "milestone-1",
      position: 0,
      projectId: "project-1",
      status: "active",
      title: "Board bring-up",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  name: "FPGA Learning Board",
  notes: [
    {
      body: "Private project note body",
      createdAt: "2026-08-01T00:00:00Z",
      id: "note-1",
      projectId: "project-1",
      title: "Private note title",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  objective: "Private objective",
  recentActivity: [
    {
      activityType: "project.task_updated",
      createdAt: "2026-08-01T00:00:00Z",
      description: "Private activity description",
      id: "activity-1",
      metadata: { privateValue: "secret" },
      projectId: "project-1"
    }
  ],
  repositoryUrl: "https://private.example.test/repository",
  startedOn: "2026-08-01",
  status: "active",
  targetDate: "2026-10-01",
  tasks: [
    {
      completedAt: "2026-08-02T00:00:00Z",
      createdAt: "2026-08-01T00:00:00Z",
      description: "Private task description",
      dueDate: null,
      id: "task-1",
      milestoneId: "milestone-1",
      priority: "high",
      projectId: "project-1",
      status: "done",
      title: "Wire the clock domain",
      updatedAt: "2026-08-02T00:00:00Z"
    },
    {
      completedAt: null,
      createdAt: "2026-08-01T00:00:00Z",
      description: null,
      dueDate: null,
      id: "task-2",
      milestoneId: "milestone-1",
      priority: "medium",
      projectId: "project-1",
      status: "in_progress",
      title: "Add reset synchronizer",
      updatedAt: "2026-08-02T00:00:00Z"
    }
  ],
  technologies: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      id: "technology-1",
      name: "SystemVerilog",
      projectId: "project-1",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  topics: [],
  updatedAt: "2026-08-02T00:00:00Z"
};

const projects: ProjectPage = {
  items: [
    featuredProject,
    {
      archivedAt: null,
      completedAt: "2026-07-01T00:00:00Z",
      createdAt: "2026-06-01T00:00:00Z",
      description: null,
      id: "project-2",
      name: "Completed CPU Model",
      objective: null,
      repositoryUrl: null,
      startedOn: null,
      status: "completed",
      targetDate: null,
      updatedAt: "2026-07-01T00:00:00Z"
    }
  ],
  limit: 5,
  offset: 0,
  total: 2
};

describe("Project Dock view model", () => {
  it("maps real projects into construction berths and featured project signals", () => {
    const viewModel = buildProjectDockViewModel({ featuredProject, projects });

    expect(viewModel.projectCountLabel).toBe("2 projects");
    expect(viewModel.featuredProjectLabel).toBe("FPGA Learning Board");
    expect(viewModel.featuredProgressLabel).toBe("1/2 tasks complete");
    expect(viewModel.openBlockerLabel).toBe("1 open blocker");
    expect(viewModel.projectBerths[0]).toMatchObject({
      blockerCount: 1,
      constructionState: "under_construction",
      evidenceLabel: "1/2 tasks complete",
      name: "FPGA Learning Board"
    });
    expect(viewModel.projectBerths[1]).toMatchObject({
      constructionState: "completed",
      heightScale: 1,
      name: "Completed CPU Model"
    });
    expect(viewModel.milestoneSignals[0]).toMatchObject({
      label: "Board bring-up",
      status: "active"
    });
    expect(viewModel.blockerSignals).toEqual([
      { id: "blocker-1", title: "Waiting for test hardware" }
    ]);
    expect(viewModel.technologies).toEqual(["SystemVerilog"]);
  });

  it("omits private descriptions, notes, URLs, file IDs, task details, and activity metadata", () => {
    const serialized = JSON.stringify(buildProjectDockViewModel({ featuredProject, projects }));

    expect(serialized).not.toContain("Private project description");
    expect(serialized).not.toContain("Private objective");
    expect(serialized).not.toContain("Private blocker description");
    expect(serialized).not.toContain("Private milestone description");
    expect(serialized).not.toContain("Private task description");
    expect(serialized).not.toContain("Private project note body");
    expect(serialized).not.toContain("private.example.test");
    expect(serialized).not.toContain("private-file-id");
    expect(serialized).not.toContain("Private activity description");
    expect(serialized).not.toContain("privateValue");
  });

  it("provides an honest empty dock without fabricated progress", () => {
    const viewModel = buildProjectDockViewModel({
      featuredProject: null,
      projects: { ...projects, items: [], total: 0 }
    });

    expect(viewModel.projectBerths).toEqual([]);
    expect(viewModel.featuredProjectLabel).toBe("No active project selected");
    expect(viewModel.featuredProgressLabel).toBe("Status-derived construction state");
    expect(viewModel.taskLabel).toBe("0 tasks available");
    expect(viewModel.openBlockerLabel).toBe("0 open blockers");
  });
});
