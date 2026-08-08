import type {
  AchievementPage,
  AchievementSummary,
  CertificatePage,
  ProjectPage
} from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildAchievementHallViewModel } from "./achievement-hall-system";

const achievements: AchievementPage = {
  items: [
    {
      category: "learning",
      createdAt: "2026-08-01T00:00:00Z",
      definitionId: "achievement-1",
      description: "Private achievement explanation",
      points: 25,
      progressCount: 1,
      rarity: "focused",
      rewards: [
        {
          description: "Private reward",
          id: "reward-1",
          metadata: { secret: true },
          rewardType: "badge",
          title: "Badge"
        }
      ],
      slug: "first-lesson",
      targetCount: 1,
      title: "First Lesson",
      unlockedAt: "2026-08-03T00:00:00Z",
      updatedAt: "2026-08-03T00:00:00Z",
      worldUnlocks: []
    },
    {
      category: "coding",
      createdAt: "2026-08-01T00:00:00Z",
      definitionId: "achievement-2",
      description: "Locked achievement",
      points: 50,
      progressCount: 0,
      rarity: "milestone",
      rewards: [],
      slug: "coding-starter",
      targetCount: 1,
      title: "Coding Starter",
      unlockedAt: null,
      updatedAt: "2026-08-03T00:00:00Z",
      worldUnlocks: []
    }
  ],
  limit: 25,
  offset: 0,
  total: 2
};

const summary: AchievementSummary = {
  lockedCount: 1,
  recentUnlocks: [achievements.items[0]!],
  totalAchievements: 2,
  totalPoints: 75,
  unlockedCount: 1,
  unlockedPoints: 25,
  worldUnlocks: [
    {
      achievementDefinitionId: "achievement-1",
      id: "unlock-1",
      locationId: "achievement-hall-gallery",
      rewardDefinitionId: "reward-1",
      unlockSource: "First Lesson",
      unlockedAt: "2026-08-03T00:00:00Z"
    }
  ]
};

const certificates: CertificatePage = {
  items: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      credentialUrl: "https://private.example.test/certificate",
      expiresOn: null,
      fileId: "private-file-id",
      id: "certificate-1",
      issuedOn: "2026-07-01",
      issuer: "Aetherium University",
      notes: "Private certificate note",
      title: "Digital Systems",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 12,
  offset: 0,
  total: 1
};

const projects: ProjectPage = {
  items: [
    {
      archivedAt: null,
      completedAt: "2026-08-04T00:00:00Z",
      createdAt: "2026-07-01T00:00:00Z",
      description: "Private project description",
      id: "project-1",
      name: "CPU Model",
      objective: "Private project objective",
      repositoryUrl: "https://private.example.test/repository",
      startedOn: null,
      status: "completed",
      targetDate: null,
      updatedAt: "2026-08-04T00:00:00Z"
    }
  ],
  limit: 25,
  offset: 0,
  total: 1
};

describe("Achievement Hall view model", () => {
  it("creates exhibits only from real unlocked records, certificates, and completed projects", () => {
    const viewModel = buildAchievementHallViewModel({
      achievements,
      certificates,
      projects,
      summary
    });

    expect(viewModel.unlockedLabel).toBe("1/2 unlocked");
    expect(viewModel.lockedLabel).toBe("1 locked definition");
    expect(viewModel.achievementExhibits).toHaveLength(1);
    expect(viewModel.achievementExhibits[0]).toMatchObject({
      title: "First Lesson",
      pointsLabel: "25 points"
    });
    expect(viewModel.certificatePlaques[0]).toMatchObject({
      title: "Digital Systems",
      issuerLabel: "Aetherium University"
    });
    expect(viewModel.completedProjectExhibits[0]).toMatchObject({ name: "CPU Model" });
    expect(viewModel.worldUnlockExhibits[0]).toMatchObject({
      locationLabel: "achievement-hall-gallery"
    });
  });

  it("omits locked trophies and private descriptions, URLs, file IDs, notes, and reward metadata", () => {
    const serialized = JSON.stringify(
      buildAchievementHallViewModel({ achievements, certificates, projects, summary })
    );

    expect(serialized).not.toContain("Coding Starter");
    expect(serialized).not.toContain("Private achievement explanation");
    expect(serialized).not.toContain("Private reward");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("private.example.test");
    expect(serialized).not.toContain("private-file-id");
    expect(serialized).not.toContain("Private certificate note");
    expect(serialized).not.toContain("Private project description");
    expect(serialized).not.toContain("Private project objective");
  });

  it("keeps an honest empty hall when no records are unlocked", () => {
    const viewModel = buildAchievementHallViewModel({
      achievements: { ...achievements, items: [achievements.items[1]!] },
      certificates: { ...certificates, items: [], total: 0 },
      projects: { ...projects, items: [], total: 0 },
      summary: {
        ...summary,
        recentUnlocks: [],
        unlockedCount: 0,
        unlockedPoints: 0,
        worldUnlocks: []
      }
    });

    expect(viewModel.achievementExhibits).toEqual([]);
    expect(viewModel.certificatePlaques).toEqual([]);
    expect(viewModel.completedProjectExhibits).toEqual([]);
    expect(viewModel.worldUnlockExhibits).toEqual([]);
  });
});
