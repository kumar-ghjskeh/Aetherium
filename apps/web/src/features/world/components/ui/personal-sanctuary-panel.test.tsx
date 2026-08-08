import { render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type { PersonalSanctuaryOverviewData } from "../../engine/personal-sanctuary-system";
import { usePlayerStore } from "../../state/player-store";
import { PersonalSanctuaryPanel } from "./personal-sanctuary-panel";

const overview: PersonalSanctuaryOverviewData = {
  certificates: { items: [], limit: 12, offset: 0, total: 0 },
  favoriteProjects: {
    items: [
      {
        createdAt: "2026-08-01T00:00:00Z",
        id: "favorite-project-1",
        projectId: "project-1",
        updatedAt: "2026-08-01T00:00:00Z"
      }
    ],
    limit: 12,
    offset: 0,
    total: 1
  },
  favoriteResources: {
    items: [
      {
        createdAt: "2026-08-01T00:00:00Z",
        fileId: "file-1",
        id: "favorite-resource-1",
        learningResourceId: null,
        notes: null,
        resourceType: "file",
        title: "Architecture Notes",
        updatedAt: "2026-08-01T00:00:00Z",
        url: null
      }
    ],
    limit: 12,
    offset: 0,
    total: 1
  },
  preferences: {
    aiMemoryEnabled: false,
    ambientAudioEnabled: true,
    backgroundMusicEnabled: false,
    cameraEffectsEnabled: true,
    createdAt: "2026-08-01T00:00:00Z",
    defaultInterfaceMode: "world",
    id: "preferences-1",
    locale: "en-US",
    performancePreset: "balanced",
    productAnalyticsEnabled: false,
    reducedMotion: false,
    theme: "dark",
    timeZone: "UTC",
    updatedAt: "2026-08-01T00:00:00Z"
  },
  privacy: {
    aiMemoryEnabled: false,
    allowProfileInAiContext: false,
    allowProfileSearchIndexing: false,
    createdAt: "2026-08-01T00:00:00Z",
    id: "privacy-1",
    includeProfileInExports: true,
    productAnalyticsEnabled: false,
    profileVisibility: "private",
    showEmailOnProfile: false,
    updatedAt: "2026-08-01T00:00:00Z"
  },
  profile: {
    avatarFileId: null,
    avatarKind: "preset",
    avatarPreset: "scholar",
    bio: null,
    createdAt: "2026-08-01T00:00:00Z",
    displayName: "Sai Kumar",
    email: "sai@example.test",
    headline: "Systems learner",
    id: "profile-1",
    isEmailVerified: true,
    location: null,
    updatedAt: "2026-08-01T00:00:00Z",
    userId: "user-1",
    websiteUrl: null
  },
  profileLinks: { items: [], limit: 8, offset: 0, total: 0 },
  projects: {
    items: [
      {
        archivedAt: null,
        completedAt: null,
        createdAt: "2026-08-01T00:00:00Z",
        description: null,
        id: "project-1",
        name: "CPU Learning Model",
        objective: null,
        repositoryUrl: null,
        startedOn: null,
        status: "active",
        targetDate: null,
        updatedAt: "2026-08-01T00:00:00Z"
      }
    ],
    limit: 25,
    offset: 0,
    total: 1
  }
};

describe("PersonalSanctuaryPanel", () => {
  beforeEach(() => {
    usePlayerStore.setState({ position: [334, 1.1, 312] });
  });

  it("exposes real profile status and accessible Command Mode destinations", () => {
    render(<PersonalSanctuaryPanel overview={overview} />);

    const panel = screen.getByRole("complementary", {
      name: "Personal Sanctuary profile and settings overview"
    });
    expect(within(panel).getByText("Sai Kumar")).toBeInTheDocument();
    expect(within(panel).getByText("CPU Learning Model")).toBeInTheDocument();
    expect(within(panel).getByText("Architecture Notes")).toBeInTheDocument();
    expect(within(panel).getByText("Private")).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Profile & privacy" })).toHaveAttribute(
      "href",
      "/app/settings"
    );
    expect(within(panel).getByRole("link", { name: "Favorite projects" })).toHaveAttribute(
      "href",
      "/app/projects"
    );
    expect(within(panel).getByRole("link", { name: "Favorite resources" })).toHaveAttribute(
      "href",
      "/app/library"
    );
  });

  it("stays hidden outside the district boundary", () => {
    usePlayerStore.setState({ position: [0, 1.1, 0] });

    render(<PersonalSanctuaryPanel overview={overview} />);

    expect(
      screen.queryByRole("complementary", {
        name: "Personal Sanctuary profile and settings overview"
      })
    ).not.toBeInTheDocument();
  });
});
