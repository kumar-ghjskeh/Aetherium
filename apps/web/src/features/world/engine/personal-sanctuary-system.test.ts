import type {
  CertificatePage,
  FavoriteProjectPage,
  FavoriteResourcePage,
  PrivacySettings,
  ProfileLinkPage,
  ProjectPage,
  UserPreferences,
  UserProfile
} from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildPersonalSanctuaryViewModel } from "./personal-sanctuary-system";

const profile: UserProfile = {
  avatarFileId: "private-avatar-file",
  avatarKind: "preset",
  avatarPreset: "scholar",
  bio: "Private biography text",
  createdAt: "2026-08-01T00:00:00Z",
  displayName: "Sai Kumar",
  email: "private@example.test",
  headline: "Systems learner",
  id: "profile-1",
  isEmailVerified: true,
  location: "Private location",
  updatedAt: "2026-08-01T00:00:00Z",
  userId: "user-1",
  websiteUrl: "https://private.example.test/profile"
};

const privacy: PrivacySettings = {
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
};

const preferences: UserPreferences = {
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
};

const projects: ProjectPage = {
  items: [
    {
      archivedAt: null,
      completedAt: null,
      createdAt: "2026-08-01T00:00:00Z",
      description: "Private project description",
      id: "project-1",
      name: "CPU Learning Model",
      objective: "Private objective",
      repositoryUrl: "https://private.example.test/repository",
      startedOn: null,
      status: "active",
      targetDate: null,
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 25,
  offset: 0,
  total: 1
};

const favoriteProjects: FavoriteProjectPage = {
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
};

const favoriteResources: FavoriteResourcePage = {
  items: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      fileId: "private-resource-file",
      id: "favorite-resource-1",
      learningResourceId: null,
      notes: "Private resource notes",
      resourceType: "external_link",
      title: "Architecture Reference",
      updatedAt: "2026-08-01T00:00:00Z",
      url: "https://private.example.test/resource"
    }
  ],
  limit: 12,
  offset: 0,
  total: 1
};

const certificates: CertificatePage = {
  items: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      credentialUrl: "https://private.example.test/credential",
      expiresOn: null,
      fileId: "private-certificate-file",
      id: "certificate-1",
      issuedOn: "2026-07-01",
      issuer: "Aetherium University",
      notes: "Private certificate notes",
      title: "Digital Systems",
      updatedAt: "2026-08-01T00:00:00Z"
    }
  ],
  limit: 12,
  offset: 0,
  total: 1
};

const profileLinks: ProfileLinkPage = {
  items: [
    {
      createdAt: "2026-08-01T00:00:00Z",
      id: "link-1",
      linkType: "portfolio",
      title: "Engineering Portfolio",
      updatedAt: "2026-08-01T00:00:00Z",
      url: "https://private.example.test/portfolio"
    }
  ],
  limit: 8,
  offset: 0,
  total: 1
};

const overview = {
  certificates,
  favoriteProjects,
  favoriteResources,
  preferences,
  privacy,
  profile,
  profileLinks,
  projects
};

describe("Personal Sanctuary view model", () => {
  it("maps real profile, favorite, certificate, privacy, and preference records", () => {
    const viewModel = buildPersonalSanctuaryViewModel(overview);

    expect(viewModel.displayName).toBe("Sai Kumar");
    expect(viewModel.avatar).toMatchObject({ label: "Scholar preset", shape: "crystal" });
    expect(viewModel.favoriteProjects[0]).toMatchObject({
      label: "CPU Learning Model",
      meta: "Active"
    });
    expect(viewModel.favoriteResources[0]).toMatchObject({
      label: "Architecture Reference",
      meta: "External Link"
    });
    expect(viewModel.certificates[0]).toMatchObject({
      label: "Digital Systems",
      meta: "Aetherium University"
    });
    expect(viewModel.privacyStatuses).toContainEqual({
      enabled: true,
      label: "Profile visibility",
      value: "Private"
    });
    expect(viewModel.settingStatuses).toContainEqual({
      enabled: true,
      label: "Graphics",
      value: "Balanced"
    });
  });

  it("omits private profile fields, URLs, notes, file IDs, and project details", () => {
    const serialized = JSON.stringify(buildPersonalSanctuaryViewModel(overview));

    expect(serialized).not.toContain("private@example.test");
    expect(serialized).not.toContain("Private biography text");
    expect(serialized).not.toContain("Private location");
    expect(serialized).not.toContain("private.example.test");
    expect(serialized).not.toContain("private-avatar-file");
    expect(serialized).not.toContain("private-resource-file");
    expect(serialized).not.toContain("private-certificate-file");
    expect(serialized).not.toContain("Private resource notes");
    expect(serialized).not.toContain("Private certificate notes");
    expect(serialized).not.toContain("Private project description");
    expect(serialized).not.toContain("Private objective");
  });

  it("keeps empty saved-record areas honest", () => {
    const viewModel = buildPersonalSanctuaryViewModel({
      ...overview,
      certificates: { ...certificates, items: [], total: 0 },
      favoriteProjects: { ...favoriteProjects, items: [], total: 0 },
      favoriteResources: { ...favoriteResources, items: [], total: 0 },
      profileLinks: { ...profileLinks, items: [], total: 0 },
      projects: { ...projects, items: [], total: 0 }
    });

    expect(viewModel.favoriteProjects).toEqual([]);
    expect(viewModel.favoriteResources).toEqual([]);
    expect(viewModel.certificates).toEqual([]);
    expect(viewModel.links).toEqual([]);
    expect(viewModel.favoriteProjectLabel).toBe("0 favorite projects");
  });
});
