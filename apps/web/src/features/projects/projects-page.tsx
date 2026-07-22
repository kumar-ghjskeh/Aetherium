"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Project,
  ProjectActivity,
  ProjectDetail,
  ProjectPriority,
  ProjectStatus
} from "@aetherium/shared-types";
import {
  projectBlockerCreateRequestSchema,
  projectCreateRequestSchema,
  projectFileCreateRequestSchema,
  projectLinkCreateRequestSchema,
  projectMilestoneCreateRequestSchema,
  projectNoteCreateRequestSchema,
  projectTaskCreateRequestSchema,
  projectTechnologyCreateRequestSchema,
  projectTopicCreateRequestSchema,
  projectUpdateRequestSchema
} from "@aetherium/validation";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

const PROJECT_LIMIT = 25;

interface ProjectDraft {
  description: string;
  name: string;
  objective: string;
  repositoryUrl: string;
  targetDate: string;
}

const emptyProjectDraft: ProjectDraft = {
  description: "",
  name: "",
  objective: "",
  repositoryUrl: "",
  targetDate: ""
};

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The project request failed.";
}

function firstIssueMessage(result: {
  error: { issues: Array<{ message: string }> };
  success: false;
}): string {
  return result.error.issues[0]?.message ?? "Project details are invalid.";
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function progressFor(project: ProjectDetail | null): number {
  if (!project || project.tasks.length === 0) {
    return 0;
  }
  const completed = project.tasks.filter((task) => task.status === "done").length;
  return Math.round((completed / project.tasks.length) * 100);
}

function buildProjectPayload(draft: ProjectDraft): {
  description: string | null;
  name: string;
  objective: string | null;
  repositoryUrl: string | null;
  targetDate: string | null;
} {
  return {
    description: draft.description.trim() || null,
    name: draft.name.trim(),
    objective: draft.objective.trim() || null,
    repositoryUrl: draft.repositoryUrl.trim() || null,
    targetDate: draft.targetDate || null
  };
}

export function ProjectsPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<ProjectDetail | null>(null);
  const [activity, setActivity] = React.useState<ProjectActivity[]>([]);
  const [projectDraft, setProjectDraft] = React.useState<ProjectDraft>(emptyProjectDraft);
  const [milestoneTitle, setMilestoneTitle] = React.useState("");
  const [milestoneDueDate, setMilestoneDueDate] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskPriority, setTaskPriority] = React.useState<ProjectPriority>("medium");
  const [taskMilestoneId, setTaskMilestoneId] = React.useState("");
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteBody, setNoteBody] = React.useState("");
  const [linkTitle, setLinkTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [technologyName, setTechnologyName] = React.useState("");
  const [blockerTitle, setBlockerTitle] = React.useState("");
  const [blockerDescription, setBlockerDescription] = React.useState("");
  const [fileId, setFileId] = React.useState("");
  const [fileDescription, setFileDescription] = React.useState("");
  const [topicId, setTopicId] = React.useState("");
  const [includeArchived, setIncludeArchived] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const loadProjectDetail = React.useCallback(
    async (projectId: string): Promise<void> => {
      const [detail, activityPage] = await Promise.all([
        apiClient.projects.get(projectId),
        apiClient.projects.listActivity(projectId, { limit: 10, offset: 0 })
      ]);
      setSelectedProject(detail);
      setActivity(activityPage.items);
      setTaskMilestoneId(detail.milestones[0]?.id ?? "");
    },
    [apiClient]
  );

  const loadProjects = React.useCallback(
    async (showLoading = true, preferredProjectId?: string) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const page = await apiClient.projects.list({
          includeArchived,
          limit: PROJECT_LIMIT,
          offset: 0
        });
        setProjects(page.items);
        const nextProjectId =
          preferredProjectId ||
          selectedProject?.id ||
          page.items.find((project) => project.status !== "archived")?.id ||
          page.items[0]?.id ||
          "";
        if (nextProjectId) {
          await loadProjectDetail(nextProjectId);
        } else {
          setSelectedProject(null);
          setActivity([]);
        }
      } catch (loadError) {
        setError(friendlyError(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, includeArchived, loadProjectDetail, selectedProject?.id]
  );

  React.useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

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

  async function handleSelectProject(projectId: string): Promise<void> {
    await runAction(`project:select:${projectId}`, async () => {
      await loadProjectDetail(projectId);
    });
  }

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = projectCreateRequestSchema.safeParse(buildProjectPayload(projectDraft));
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }

    await runAction("project:create", async () => {
      const project = await apiClient.projects.create(parsed.data);
      setProjectDraft(emptyProjectDraft);
      setNotice("Project created.");
      await loadProjects(false, project.id);
    });
  }

  async function handleProjectStatus(status: ProjectStatus): Promise<void> {
    if (!selectedProject) {
      return;
    }
    const parsed = projectUpdateRequestSchema.safeParse({ status });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction(`project:status:${status}`, async () => {
      await apiClient.projects.update(selectedProject.id, parsed.data);
      setNotice(status === "completed" ? "Project completed." : "Project status updated.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleArchiveProject(): Promise<void> {
    if (!selectedProject) {
      return;
    }
    await runAction("project:archive", async () => {
      await apiClient.projects.archive(selectedProject.id);
      setNotice("Project archived.");
      await loadProjects(false);
    });
  }

  async function handleCreateMilestone(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectMilestoneCreateRequestSchema.safeParse({
      dueDate: milestoneDueDate || null,
      title: milestoneTitle.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("milestone:create", async () => {
      await apiClient.projects.createMilestone(selectedProject.id, parsed.data);
      setMilestoneTitle("");
      setMilestoneDueDate("");
      setNotice("Milestone added.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectTaskCreateRequestSchema.safeParse({
      milestoneId: taskMilestoneId || null,
      priority: taskPriority,
      title: taskTitle.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("task:create", async () => {
      await apiClient.projects.createTask(selectedProject.id, parsed.data);
      setTaskTitle("");
      setNotice("Task added.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleTaskDone(taskId: string): Promise<void> {
    if (!selectedProject) {
      return;
    }
    await runAction(`task:done:${taskId}`, async () => {
      await apiClient.projects.updateTask(taskId, { status: "done" });
      setNotice("Task marked done.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectNoteCreateRequestSchema.safeParse({
      body: noteBody.trim(),
      title: noteTitle.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("note:create", async () => {
      await apiClient.projects.createNote(selectedProject.id, parsed.data);
      setNoteTitle("");
      setNoteBody("");
      setNotice("Note added.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleCreateLink(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectLinkCreateRequestSchema.safeParse({
      title: linkTitle.trim(),
      url: linkUrl.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("link:create", async () => {
      await apiClient.projects.createLink(selectedProject.id, parsed.data);
      setLinkTitle("");
      setLinkUrl("");
      setNotice("Link added.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleAddTechnology(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectTechnologyCreateRequestSchema.safeParse({
      name: technologyName.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("technology:create", async () => {
      await apiClient.projects.addTechnology(selectedProject.id, parsed.data);
      setTechnologyName("");
      setNotice("Technology added.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleCreateBlocker(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectBlockerCreateRequestSchema.safeParse({
      description: blockerDescription.trim() || null,
      title: blockerTitle.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("blocker:create", async () => {
      await apiClient.projects.createBlocker(selectedProject.id, parsed.data);
      setBlockerTitle("");
      setBlockerDescription("");
      setNotice("Blocker recorded.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleResolveBlocker(blockerId: string): Promise<void> {
    if (!selectedProject) {
      return;
    }
    await runAction(`blocker:resolve:${blockerId}`, async () => {
      await apiClient.projects.updateBlocker(blockerId, { status: "resolved" });
      setNotice("Blocker resolved.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleAttachFile(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectFileCreateRequestSchema.safeParse({
      description: fileDescription.trim() || null,
      fileId: fileId.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("file:attach", async () => {
      await apiClient.projects.attachFile(selectedProject.id, parsed.data);
      setFileId("");
      setFileDescription("");
      setNotice("File attached.");
      await loadProjects(false, selectedProject.id);
    });
  }

  async function handleLinkTopic(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    const parsed = projectTopicCreateRequestSchema.safeParse({
      topicId: topicId.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("topic:link", async () => {
      await apiClient.projects.linkTopic(selectedProject.id, parsed.data);
      setTopicId("");
      setNotice("Topic linked.");
      await loadProjects(false, selectedProject.id);
    });
  }

  const completedTasks =
    selectedProject?.tasks.filter((task) => task.status === "done").length ?? 0;
  const progress = progressFor(selectedProject);

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Project Dock</p>
          <h1>Projects</h1>
        </div>
        <span className="state-pill">
          {isLoading
            ? "Loading"
            : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
        </span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      {notice ? <section className="inline-success">{notice}</section> : null}

      <section className="metric-grid project-metrics" aria-label="Project metrics">
        <article className="metric-panel">
          <span>Active projects</span>
          <strong>{projects.filter((project) => project.status === "active").length}</strong>
          <small>Only real project records are counted.</small>
        </article>
        <article className="metric-panel">
          <span>Open tasks</span>
          <strong>
            {selectedProject?.tasks.filter((task) => task.status !== "done").length ?? 0}
          </strong>
          <small>For the selected project.</small>
        </article>
        <article className="metric-panel">
          <span>Completed tasks</span>
          <strong>{completedTasks}</strong>
          <small>Marked done by the user.</small>
        </article>
        <article className="metric-panel">
          <span>Progress</span>
          <strong>{progress}%</strong>
          <small>Based on done tasks, not time spent.</small>
        </article>
      </section>

      <section className="project-grid">
        <section className="work-panel">
          <header className="project-panel-header">
            <div>
              <h2>Create project</h2>
              <p className="empty-note">Define the objective before adding milestones and tasks.</p>
            </div>
          </header>
          <form className="project-form" onSubmit={(event) => void handleCreateProject(event)}>
            <label>
              Name
              <input
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, name: event.target.value }))
                }
                value={projectDraft.name}
              />
            </label>
            <label>
              Target date
              <input
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, targetDate: event.target.value }))
                }
                type="date"
                value={projectDraft.targetDate}
              />
            </label>
            <label className="wide-field">
              Objective
              <textarea
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, objective: event.target.value }))
                }
                value={projectDraft.objective}
              />
            </label>
            <label className="wide-field">
              Description
              <textarea
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, description: event.target.value }))
                }
                value={projectDraft.description}
              />
            </label>
            <label className="wide-field">
              Repository URL
              <input
                onChange={(event) =>
                  setProjectDraft((current) => ({ ...current, repositoryUrl: event.target.value }))
                }
                value={projectDraft.repositoryUrl}
              />
            </label>
            <button className="primary-action" disabled={activeAction === "project:create"}>
              {activeAction === "project:create" ? "Creating" : "Create project"}
            </button>
          </form>
        </section>

        <section className="work-panel">
          <header className="project-panel-header">
            <div>
              <h2>Project list</h2>
              <p className="empty-note">
                Archived projects stay available when the filter is enabled.
              </p>
            </div>
            <label className="project-toggle">
              <input
                checked={includeArchived}
                onChange={(event) => setIncludeArchived(event.target.checked)}
                type="checkbox"
              />
              Include archived
            </label>
          </header>

          {isLoading ? <p className="empty-note">Loading projects...</p> : null}
          {!isLoading && projects.length === 0 ? (
            <p className="empty-note">No projects exist yet. Create one to start planning work.</p>
          ) : null}
          <div className="project-list">
            {projects.map((project) => (
              <button
                aria-pressed={selectedProject?.id === project.id}
                className="project-row"
                key={project.id}
                onClick={() => void handleSelectProject(project.id)}
                type="button"
              >
                <span>
                  <strong>{project.name}</strong>
                  <small>
                    {project.objective || project.description || "No objective recorded."}
                  </small>
                </span>
                <em>{statusLabel(project.status)}</em>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="project-detail-layout">
        <section className="work-panel project-detail-panel">
          <header className="project-panel-header">
            <div>
              <h2>{selectedProject ? selectedProject.name : "Select a project"}</h2>
              <p className="empty-note">
                {selectedProject?.objective ||
                  "Choose a project from the list to manage milestones, tasks, and context."}
              </p>
            </div>
            {selectedProject ? (
              <span className="status-token">{statusLabel(selectedProject.status)}</span>
            ) : null}
          </header>

          {!selectedProject ? <p className="empty-note">Project detail is empty.</p> : null}

          {selectedProject ? (
            <>
              <div className="project-progress-track" aria-label={`Project progress ${progress}%`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="project-actions">
                <button
                  className="secondary-action"
                  disabled={activeAction === "project:status:active"}
                  onClick={() => void handleProjectStatus("active")}
                  type="button"
                >
                  Set active
                </button>
                <button
                  className="secondary-action"
                  disabled={activeAction === "project:status:paused"}
                  onClick={() => void handleProjectStatus("paused")}
                  type="button"
                >
                  Pause
                </button>
                <button
                  className="secondary-action"
                  disabled={activeAction === "project:status:completed"}
                  onClick={() => void handleProjectStatus("completed")}
                  type="button"
                >
                  Complete project
                </button>
                <button
                  className="danger-action"
                  disabled={activeAction === "project:archive"}
                  onClick={() => void handleArchiveProject()}
                  type="button"
                >
                  Archive
                </button>
              </div>

              <section className="project-section-grid">
                <article>
                  <h3>Milestones</h3>
                  <form
                    className="project-inline-form"
                    onSubmit={(event) => void handleCreateMilestone(event)}
                  >
                    <label>
                      Title
                      <input
                        onChange={(event) => setMilestoneTitle(event.target.value)}
                        value={milestoneTitle}
                      />
                    </label>
                    <label>
                      Due
                      <input
                        onChange={(event) => setMilestoneDueDate(event.target.value)}
                        type="date"
                        value={milestoneDueDate}
                      />
                    </label>
                    <button className="secondary-action">Add</button>
                  </form>
                  <ul className="project-mini-list">
                    {selectedProject.milestones.map((milestone) => (
                      <li key={milestone.id}>
                        <span>
                          <strong>{milestone.title}</strong>
                          <small>{milestone.dueDate ?? "No due date"}</small>
                        </span>
                        <em>{statusLabel(milestone.status)}</em>
                      </li>
                    ))}
                  </ul>
                </article>

                <article>
                  <h3>Tasks</h3>
                  <form
                    className="project-inline-form"
                    onSubmit={(event) => void handleCreateTask(event)}
                  >
                    <label>
                      Title
                      <input
                        onChange={(event) => setTaskTitle(event.target.value)}
                        value={taskTitle}
                      />
                    </label>
                    <label>
                      Priority
                      <select
                        onChange={(event) => setTaskPriority(event.target.value as ProjectPriority)}
                        value={taskPriority}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                    <label>
                      Milestone
                      <select
                        onChange={(event) => setTaskMilestoneId(event.target.value)}
                        value={taskMilestoneId}
                      >
                        <option value="">No milestone</option>
                        {selectedProject.milestones.map((milestone) => (
                          <option key={milestone.id} value={milestone.id}>
                            {milestone.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="secondary-action">Add</button>
                  </form>
                  <ul className="project-mini-list">
                    {selectedProject.tasks.map((task) => (
                      <li key={task.id}>
                        <span>
                          <strong>{task.title}</strong>
                          <small>
                            {statusLabel(task.status)} - {task.priority}
                          </small>
                        </span>
                        {task.status === "done" ? (
                          <em>done</em>
                        ) : (
                          <button
                            className="secondary-action"
                            onClick={() => void handleTaskDone(task.id)}
                            type="button"
                          >
                            Mark done
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            </>
          ) : null}
        </section>

        {selectedProject ? (
          <aside className="project-side-panels">
            <section className="work-panel">
              <h2>Project context</h2>
              <form className="project-form" onSubmit={(event) => void handleCreateNote(event)}>
                <label>
                  Note title
                  <input onChange={(event) => setNoteTitle(event.target.value)} value={noteTitle} />
                </label>
                <label className="wide-field">
                  Note
                  <textarea
                    onChange={(event) => setNoteBody(event.target.value)}
                    value={noteBody}
                  />
                </label>
                <button className="secondary-action">Add note</button>
              </form>
              <form
                className="project-inline-form"
                onSubmit={(event) => void handleCreateLink(event)}
              >
                <label>
                  Link title
                  <input onChange={(event) => setLinkTitle(event.target.value)} value={linkTitle} />
                </label>
                <label>
                  URL
                  <input onChange={(event) => setLinkUrl(event.target.value)} value={linkUrl} />
                </label>
                <button className="secondary-action">Add link</button>
              </form>
              <ul className="project-mini-list">
                {selectedProject.notes.map((note) => (
                  <li key={note.id}>
                    <span>
                      <strong>{note.title}</strong>
                      <small>{note.body}</small>
                    </span>
                  </li>
                ))}
                {selectedProject.links.map((link) => (
                  <li key={link.id}>
                    <span>
                      <strong>{link.title}</strong>
                      <small>{link.url}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="work-panel">
              <h2>Resources and topics</h2>
              <form className="project-form" onSubmit={(event) => void handleAttachFile(event)}>
                <label className="wide-field">
                  File UUID
                  <input onChange={(event) => setFileId(event.target.value)} value={fileId} />
                </label>
                <label className="wide-field">
                  File note
                  <input
                    onChange={(event) => setFileDescription(event.target.value)}
                    value={fileDescription}
                  />
                </label>
                <button className="secondary-action">Attach file</button>
              </form>
              <form
                className="project-inline-form"
                onSubmit={(event) => void handleLinkTopic(event)}
              >
                <label>
                  Topic UUID
                  <input onChange={(event) => setTopicId(event.target.value)} value={topicId} />
                </label>
                <button className="secondary-action">Link topic</button>
              </form>
              <form
                className="project-inline-form"
                onSubmit={(event) => void handleAddTechnology(event)}
              >
                <label>
                  Technology
                  <input
                    onChange={(event) => setTechnologyName(event.target.value)}
                    value={technologyName}
                  />
                </label>
                <button className="secondary-action">Add technology</button>
              </form>
              <ul className="chip-list">
                {selectedProject.technologies.map((technology) => (
                  <li key={technology.id}>{technology.name}</li>
                ))}
                {selectedProject.files.map((file) => (
                  <li key={file.id}>File {file.fileId}</li>
                ))}
                {selectedProject.topics.map((topic) => (
                  <li key={topic.id}>Topic {topic.topicId}</li>
                ))}
              </ul>
            </section>

            <section className="work-panel">
              <h2>Blockers</h2>
              <form className="project-form" onSubmit={(event) => void handleCreateBlocker(event)}>
                <label>
                  Title
                  <input
                    onChange={(event) => setBlockerTitle(event.target.value)}
                    value={blockerTitle}
                  />
                </label>
                <label className="wide-field">
                  Description
                  <textarea
                    onChange={(event) => setBlockerDescription(event.target.value)}
                    value={blockerDescription}
                  />
                </label>
                <button className="secondary-action">Record blocker</button>
              </form>
              <ul className="project-mini-list">
                {selectedProject.blockers.map((blocker) => (
                  <li key={blocker.id}>
                    <span>
                      <strong>{blocker.title}</strong>
                      <small>{blocker.description ?? "No description"}</small>
                    </span>
                    {blocker.status === "open" ? (
                      <button
                        className="secondary-action"
                        onClick={() => void handleResolveBlocker(blocker.id)}
                        type="button"
                      >
                        Resolve
                      </button>
                    ) : (
                      <em>resolved</em>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="work-panel">
              <h2>Activity</h2>
              {activity.length === 0 ? (
                <p className="empty-note">No activity recorded yet.</p>
              ) : null}
              <ul className="project-mini-list">
                {activity.map((event) => (
                  <li key={event.id}>
                    <span>
                      <strong>{event.description}</strong>
                      <small>{event.activityType}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        ) : null}
      </section>
    </section>
  );
}
