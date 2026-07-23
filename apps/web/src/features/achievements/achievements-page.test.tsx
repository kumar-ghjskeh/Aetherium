import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  AchievementPage,
  AchievementProgress,
  AchievementSummary
} from "@aetherium/shared-types";
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
  createUnusedUsersClient,
  createUnusedWorldClient
} from "../../test/api-client";
import { AchievementsPage } from "./achievements-page";

const unlockedAchievement: AchievementProgress = {
  category: "files",
  createdAt: "2026-07-21T00:00:00Z",
  definitionId: "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  description: "Upload your first Personal Vault file.",
  points: 10,
  progressCount: 1,
  rarity: "common",
  rewards: [
    {
      description: "Permanent achievement marker.",
      id: "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      metadata: { slug: "first-file" },
      rewardType: "badge",
      title: "First File badge"
    }
  ],
  slug: "first-file",
  targetCount: 1,
  title: "First File",
  unlockedAt: "2026-07-21T00:05:00Z",
  updatedAt: "2026-07-21T00:00:00Z",
  worldUnlocks: [
    {
      achievementDefinitionId: "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      id: "33333333-cccc-4ccc-8ccc-cccccccccccc",
      locationId: "achievement_hall:first_file_display",
      rewardDefinitionId: "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      unlockedAt: "2026-07-21T00:05:00Z",
      unlockSource: "achievement"
    }
  ]
};

const lockedAchievement: AchievementProgress = {
  ...unlockedAchievement,
  category: "coding",
  definitionId: "44444444-dddd-4ddd-8ddd-dddddddddddd",
  description: "Reserved for the coding workspace foundation.",
  points: 0,
  progressCount: 0,
  slug: "coding-starter",
  title: "Coding Starter",
  unlockedAt: null,
  worldUnlocks: []
};

const summary: AchievementSummary = {
  lockedCount: 1,
  recentUnlocks: [unlockedAchievement],
  totalAchievements: 2,
  totalPoints: 10,
  unlockedCount: 1,
  unlockedPoints: 10,
  worldUnlocks: unlockedAchievement.worldUnlocks
};

const page: AchievementPage = {
  items: [unlockedAchievement, lockedAchievement],
  limit: 50,
  offset: 0,
  total: 2
};

function createClient(
  overrides: Partial<AetheriumApiClient["achievements"]> = {}
): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-achievement call"));

  return {
    achievements: {
      ...createUnusedAchievementsClient(),
      list: vi.fn(() => Promise.resolve(page)),
      process: vi.fn(() =>
        Promise.resolve({
          newUnlockCount: 0,
          processedEventCount: 0,
          unlocked: []
        })
      ),
      summary: vi.fn(() => Promise.resolve(summary)),
      ...overrides
    },
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
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: createUnusedWorldClient()
  };
}

describe("AchievementsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads achievement summaries and progression records", async () => {
    const client = createClient();

    render(<AchievementsPage client={client} />);

    expect(screen.getByText("Loading achievements...")).toBeInTheDocument();
    expect(await screen.findByText("First File")).toBeInTheDocument();
    expect(screen.getByText("Coding Starter")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("achievement_hall:first_file_display")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "First File progress 100%" })
    ).toBeInTheDocument();
  });

  it("reloads the list when filtering to unlocked records", async () => {
    const user = userEvent.setup();
    const list = vi.fn((query?: { unlockedOnly?: boolean }) =>
      Promise.resolve({
        ...page,
        items: query?.unlockedOnly ? [unlockedAchievement] : page.items
      })
    );
    const client = createClient({ list });

    render(<AchievementsPage client={client} />);

    await screen.findByText("Coding Starter");
    await user.click(screen.getByLabelText("Unlocked only"));

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({
        limit: 50,
        offset: 0,
        unlockedOnly: true
      });
    });
  });

  it("processes achievement events and refreshes the page", async () => {
    const user = userEvent.setup();
    const list = vi.fn(() => Promise.resolve(page));
    const process = vi.fn(() =>
      Promise.resolve({
        newUnlockCount: 1,
        processedEventCount: 2,
        unlocked: [unlockedAchievement]
      })
    );
    const client = createClient({ list, process });

    render(<AchievementsPage client={client} />);

    await screen.findByText("First File");
    await user.click(screen.getByRole("button", { name: "Sync progress" }));

    expect(
      await screen.findByText(/1 achievement unlocked from 2 event records/i)
    ).toBeInTheDocument();
    expect(process).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("shows errors without rendering false unlocks", async () => {
    const client = createClient({
      list: vi.fn(() => Promise.reject(new Error("Achievements unavailable")))
    });

    render(<AchievementsPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Achievements unavailable");
    expect(screen.queryByText("First File")).not.toBeInTheDocument();
  });

  it("renders world unlock records accessibly", async () => {
    const client = createClient();

    render(<AchievementsPage client={client} />);

    const row = await screen.findByRole("row", {
      name: /achievement_hall:first_file_display/i
    });
    expect(within(row).getByText("achievement")).toBeInTheDocument();
  });
});
