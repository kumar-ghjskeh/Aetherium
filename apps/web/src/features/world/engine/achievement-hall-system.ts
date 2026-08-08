import type {
  AchievementCategory,
  AchievementPage,
  AchievementRarity,
  AchievementSummary,
  CertificatePage,
  ProjectPage
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export interface AchievementHallOverviewData {
  achievements: AchievementPage;
  certificates: CertificatePage;
  projects: ProjectPage;
  summary: AchievementSummary;
}

export interface AchievementExhibitViewModel {
  accent: string;
  categoryLabel: string;
  id: string;
  pointsLabel: string;
  position: Vector3Tuple;
  rarity: AchievementRarity;
  title: string;
  unlockedLabel: string;
}

export interface CertificatePlaqueViewModel {
  id: string;
  issuedLabel: string;
  issuerLabel: string;
  title: string;
}

export interface CompletedProjectExhibitViewModel {
  completedLabel: string;
  id: string;
  name: string;
}

export interface WorldUnlockExhibitViewModel {
  id: string;
  locationLabel: string;
  sourceLabel: string;
  unlockedLabel: string;
}

export interface AchievementHallViewModel {
  achievementExhibits: AchievementExhibitViewModel[];
  certificateLabel: string;
  certificatePlaques: CertificatePlaqueViewModel[];
  completedProjectExhibits: CompletedProjectExhibitViewModel[];
  completedProjectLabel: string;
  lockedLabel: string;
  pointsLabel: string;
  unlockedLabel: string;
  worldUnlockExhibits: WorldUnlockExhibitViewModel[];
  worldUnlockLabel: string;
}

const ACHIEVEMENT_POSITIONS: Vector3Tuple[] = [
  [-20, 1.7, -9],
  [-10, 1.7, -13],
  [0, 1.7, -14],
  [10, 1.7, -13],
  [20, 1.7, -9],
  [-20, 1.7, 8],
  [-10, 1.7, 12],
  [0, 1.7, 13],
  [10, 1.7, 12],
  [20, 1.7, 8]
];

const CATEGORY_ACCENTS: Record<AchievementCategory, string> = {
  coding: "#55d9f2",
  files: "#9dcfe0",
  habits: "#77d98b",
  learning: "#82b6ff",
  projects: "#ffb066"
};

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Date not recorded";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(parsed);
}

function categoryLabel(category: AchievementCategory): string {
  return `${category[0]?.toUpperCase() ?? ""}${category.slice(1)}`;
}

export function buildAchievementHallViewModel(
  data: AchievementHallOverviewData
): AchievementHallViewModel {
  const unlockedAchievements = data.achievements.items.filter(
    (achievement) => achievement.unlockedAt !== null
  );
  const completedProjects = data.projects.items.filter((project) => project.status === "completed");

  return {
    achievementExhibits: unlockedAchievements
      .slice(0, ACHIEVEMENT_POSITIONS.length)
      .map((achievement, index) => ({
        accent: CATEGORY_ACCENTS[achievement.category],
        categoryLabel: categoryLabel(achievement.category),
        id: achievement.definitionId,
        pointsLabel: `${achievement.points} points`,
        position: ACHIEVEMENT_POSITIONS[index] ?? [0, 1.7, 0],
        rarity: achievement.rarity,
        title: achievement.title,
        unlockedLabel: `Unlocked ${formatDate(achievement.unlockedAt)}`
      })),
    certificateLabel: formatCount(data.certificates.total, "certificate"),
    certificatePlaques: data.certificates.items.slice(0, 6).map((certificate) => ({
      id: certificate.id,
      issuedLabel: certificate.issuedOn
        ? `Issued ${formatDate(certificate.issuedOn)}`
        : "Issue date not recorded",
      issuerLabel: certificate.issuer ?? "Issuer not recorded",
      title: certificate.title
    })),
    completedProjectExhibits: completedProjects.slice(0, 5).map((project) => ({
      completedLabel: project.completedAt
        ? `Completed ${formatDate(project.completedAt)}`
        : "Completion date not recorded",
      id: project.id,
      name: project.name
    })),
    completedProjectLabel: formatCount(completedProjects.length, "completed project"),
    lockedLabel: formatCount(data.summary.lockedCount, "locked definition"),
    pointsLabel: `${data.summary.unlockedPoints}/${data.summary.totalPoints} points earned`,
    unlockedLabel: `${data.summary.unlockedCount}/${data.summary.totalAchievements} unlocked`,
    worldUnlockExhibits: data.summary.worldUnlocks.slice(0, 6).map((unlock) => ({
      id: unlock.id,
      locationLabel: unlock.locationId.replaceAll("_", " "),
      sourceLabel: unlock.unlockSource,
      unlockedLabel: `Unlocked ${formatDate(unlock.unlockedAt)}`
    })),
    worldUnlockLabel: formatCount(data.summary.worldUnlocks.length, "world unlock")
  };
}
