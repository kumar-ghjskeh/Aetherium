import type {
  Project,
  ProjectBlocker,
  ProjectDetail,
  ProjectMilestoneStatus,
  ProjectPage,
  ProjectStatus
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export interface ProjectDockOverviewData {
  featuredProject: ProjectDetail | null;
  projects: ProjectPage;
}

export type ProjectConstructionState = "archived" | "completed" | "paused" | "under_construction";

export interface ProjectBerthViewModel {
  accent: string;
  blockerCount: number;
  constructionState: ProjectConstructionState;
  evidenceLabel: string;
  heightScale: number;
  id: string;
  name: string;
  position: Vector3Tuple;
  statusLabel: string;
}

export interface ProjectMilestoneSignalViewModel {
  accent: string;
  id: string;
  label: string;
  status: ProjectMilestoneStatus;
}

export interface ProjectDockViewModel {
  activityLabel: string;
  blockerSignals: Array<Pick<ProjectBlocker, "id" | "title">>;
  featuredProjectLabel: string;
  featuredProgressLabel: string;
  linkedFileLabel: string;
  milestoneLabel: string;
  milestoneSignals: ProjectMilestoneSignalViewModel[];
  openBlockerLabel: string;
  projectBerths: ProjectBerthViewModel[];
  projectCountLabel: string;
  taskLabel: string;
  technologies: string[];
  technologyLabel: string;
}

const PROJECT_BERTH_POSITIONS: Vector3Tuple[] = [
  [-24, 1.8, -8],
  [-12, 1.8, -14],
  [0, 1.8, -17],
  [12, 1.8, -14],
  [24, 1.8, -8]
];

const STATUS_ACCENTS: Record<ProjectStatus, string> = {
  active: "#ffb066",
  archived: "#7e9298",
  completed: "#f0c766",
  paused: "#8bd6db"
};

const MILESTONE_ACCENTS: Record<ProjectMilestoneStatus, string> = {
  active: "#ffb066",
  blocked: "#ff826f",
  completed: "#f0c766",
  planned: "#8bd6db"
};

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function constructionState(status: ProjectStatus): ProjectConstructionState {
  switch (status) {
    case "completed":
      return "completed";
    case "paused":
      return "paused";
    case "archived":
      return "archived";
    case "active":
    default:
      return "under_construction";
  }
}

function completionEvidence(detail: ProjectDetail | null): {
  label: string;
  ratio: number | null;
} {
  if (!detail) {
    return { label: "Status-derived construction state", ratio: null };
  }
  if (detail.tasks.length > 0) {
    const completed = detail.tasks.filter((task) => task.status === "done").length;
    return {
      label: `${completed}/${detail.tasks.length} tasks complete`,
      ratio: completed / detail.tasks.length
    };
  }
  if (detail.milestones.length > 0) {
    const completed = detail.milestones.filter(
      (milestone) => milestone.status === "completed"
    ).length;
    return {
      label: `${completed}/${detail.milestones.length} milestones complete`,
      ratio: completed / detail.milestones.length
    };
  }
  return { label: `Project ${statusLabel(detail.status)}`, ratio: null };
}

function statusHeight(status: ProjectStatus): number {
  switch (status) {
    case "completed":
      return 1;
    case "active":
      return 0.68;
    case "paused":
      return 0.48;
    case "archived":
    default:
      return 0.34;
  }
}

function berthHeight(project: Project, detail: ProjectDetail | null): number {
  if (project.status === "completed") {
    return 1;
  }
  const evidence = completionEvidence(detail);
  if (evidence.ratio === null) {
    return statusHeight(project.status);
  }
  return Math.max(0.34, Math.min(0.92, 0.34 + evidence.ratio * 0.58));
}

export function buildProjectDockViewModel(data: ProjectDockOverviewData): ProjectDockViewModel {
  const featured = data.featuredProject;
  const openBlockers = featured?.blockers.filter((blocker) => blocker.status === "open") ?? [];
  const completedTasks = featured?.tasks.filter((task) => task.status === "done").length ?? 0;
  const evidence = completionEvidence(featured);

  return {
    activityLabel: formatCount(featured?.recentActivity.length ?? 0, "recent activity event"),
    blockerSignals: openBlockers.slice(0, 4).map((blocker) => ({
      id: blocker.id,
      title: blocker.title
    })),
    featuredProgressLabel: evidence.label,
    featuredProjectLabel: featured?.name ?? "No active project selected",
    linkedFileLabel: formatCount(featured?.files.length ?? 0, "linked file"),
    milestoneLabel: formatCount(featured?.milestones.length ?? 0, "milestone"),
    milestoneSignals:
      featured?.milestones.slice(0, 6).map((milestone) => ({
        accent: MILESTONE_ACCENTS[milestone.status],
        id: milestone.id,
        label: milestone.title,
        status: milestone.status
      })) ?? [],
    openBlockerLabel: formatCount(openBlockers.length, "open blocker"),
    projectBerths: data.projects.items
      .slice(0, PROJECT_BERTH_POSITIONS.length)
      .map((project, index) => {
        const detail = featured?.id === project.id ? featured : null;
        return {
          accent: STATUS_ACCENTS[project.status],
          blockerCount: detail
            ? detail.blockers.filter((blocker) => blocker.status === "open").length
            : 0,
          constructionState: constructionState(project.status),
          evidenceLabel: detail ? completionEvidence(detail).label : statusLabel(project.status),
          heightScale: berthHeight(project, detail),
          id: project.id,
          name: project.name,
          position: PROJECT_BERTH_POSITIONS[index] ?? [0, 1.8, 0],
          statusLabel: statusLabel(project.status)
        };
      }),
    projectCountLabel: formatCount(data.projects.total, "project"),
    taskLabel: featured
      ? `${completedTasks}/${featured.tasks.length} tasks complete`
      : "0 tasks available",
    technologies: featured?.technologies.slice(0, 6).map((technology) => technology.name) ?? [],
    technologyLabel: formatCount(featured?.technologies.length ?? 0, "technology")
  };
}
