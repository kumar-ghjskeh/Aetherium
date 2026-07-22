import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  AccountDeletionRequest,
  Certificate,
  DataExportRequest,
  FavoriteProject,
  FavoriteResource,
  PrivacySettings,
  ProfileLink,
  UserProfile
} from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient
} from "../../test/api-client";
import { SettingsPage } from "./settings-page";

const now = "2026-07-21T00:00:00Z";
const userId = "11111111-1111-4111-8111-111111111111";

const profile: UserProfile = {
  avatarFileId: null,
  avatarKind: "preset",
  avatarPreset: "lumen",
  bio: "Working through compiler systems and learning operations.",
  createdAt: now,
  displayName: "Aetherium Learner",
  email: "learner@example.com",
  headline: "Systems learner",
  id: "22222222-2222-4222-8222-222222222222",
  isEmailVerified: false,
  location: "UTC",
  updatedAt: now,
  userId,
  websiteUrl: "https://example.com"
};

const privacy: PrivacySettings = {
  aiMemoryEnabled: false,
  allowProfileInAiContext: false,
  allowProfileSearchIndexing: false,
  createdAt: now,
  id: "33333333-3333-4333-8333-333333333333",
  includeProfileInExports: true,
  productAnalyticsEnabled: false,
  profileVisibility: "private",
  showEmailOnProfile: false,
  updatedAt: now
};

const link: ProfileLink = {
  createdAt: now,
  id: "44444444-4444-4444-8444-444444444444",
  linkType: "portfolio",
  title: "Portfolio",
  updatedAt: now,
  url: "https://example.com/work"
};

const favoriteProject: FavoriteProject = {
  createdAt: now,
  id: "55555555-5555-4555-8555-555555555555",
  projectId: "66666666-6666-4666-8666-666666666666",
  updatedAt: now
};

const favoriteResource: FavoriteResource = {
  createdAt: now,
  fileId: null,
  id: "77777777-7777-4777-8777-777777777777",
  learningResourceId: null,
  notes: "Useful reference.",
  resourceType: "external_link",
  title: "Profile systems guide",
  updatedAt: now,
  url: "https://example.com/guide"
};

const certificate: Certificate = {
  createdAt: now,
  credentialUrl: "https://example.com/certificate",
  expiresOn: null,
  fileId: null,
  id: "88888888-8888-4888-8888-888888888888",
  issuedOn: "2026-07-01",
  issuer: "Aetherium Lab",
  notes: null,
  title: "Learning Systems",
  updatedAt: now
};

const dataExportRequest: DataExportRequest = {
  completedAt: null,
  createdAt: now,
  downloadUrl: null,
  expiresAt: null,
  id: "99999999-9999-4999-8999-999999999999",
  includedCategories: ["profile", "settings"],
  note: null,
  requestedAt: now,
  status: "requested",
  updatedAt: now
};

const accountDeletionRequest: AccountDeletionRequest = {
  canceledAt: null,
  createdAt: now,
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  metadata: { execution: "manual_future_workflow" },
  reason: "Testing",
  requestedAt: now,
  scheduledDeletionAt: null,
  status: "requested",
  updatedAt: now
};

function page<T>(items: T[]): { items: T[]; limit: number; offset: number; total: number } {
  return {
    items,
    limit: 25,
    offset: 0,
    total: items.length
  };
}

function createClient(overrides: Partial<AetheriumApiClient["users"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-user call"));

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
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    habits: createUnusedHabitsClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    learning: createUnusedLearningClient(),
    mentors: createUnusedMentorsClient(),
    notifications: { list: vi.fn(reject), markRead: vi.fn(reject) },
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: {
      ...createUnusedUsersClient(),
      createAccountDeletionRequest: vi.fn(() => Promise.resolve(accountDeletionRequest)),
      createCertificate: vi.fn(() => Promise.resolve(certificate)),
      createDataExportRequest: vi.fn(() => Promise.resolve(dataExportRequest)),
      createFavoriteResource: vi.fn(() => Promise.resolve(favoriteResource)),
      createLink: vi.fn(() => Promise.resolve(link)),
      deleteCertificate: vi.fn(() => Promise.resolve()),
      deleteLink: vi.fn(() => Promise.resolve()),
      getPrivacy: vi.fn(() => Promise.resolve(privacy)),
      getProfile: vi.fn(() => Promise.resolve(profile)),
      listAccountDeletionRequests: vi.fn(() => Promise.resolve(page([]))),
      listCertificates: vi.fn(() => Promise.resolve(page([]))),
      listDataExportRequests: vi.fn(() => Promise.resolve(page([]))),
      listFavoriteProjects: vi.fn(() => Promise.resolve(page([]))),
      listFavoriteResources: vi.fn(() => Promise.resolve(page([]))),
      listLinks: vi.fn(() => Promise.resolve(page([]))),
      removeFavoriteProject: vi.fn(() => Promise.resolve()),
      removeFavoriteResource: vi.fn(() => Promise.resolve()),
      setFavoriteProject: vi.fn(() => Promise.resolve(favoriteProject)),
      updatePrivacy: vi.fn(() =>
        Promise.resolve({
          ...privacy,
          aiMemoryEnabled: true,
          allowProfileInAiContext: true,
          productAnalyticsEnabled: true,
          profileVisibility: "unlisted" as const
        })
      ),
      updateProfile: vi.fn(() =>
        Promise.resolve({
          ...profile,
          displayName: "Updated Learner",
          headline: "Learning systems architect"
        })
      ),
      ...overrides
    },
    world: { getProfile: vi.fn(reject), updateProfile: vi.fn(reject), visit: vi.fn(reject) }
  };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading and then the profile, privacy, and empty ownership states", async () => {
    let resolveProfile: (value: UserProfile) => void = () => undefined;
    const pendingProfile = new Promise<UserProfile>((resolve) => {
      resolveProfile = resolve;
    });
    const client = createClient({
      getProfile: vi.fn(() => pendingProfile)
    });

    render(<SettingsPage client={client} />);

    expect(screen.getByText("Loading profile settings...")).toBeInTheDocument();
    resolveProfile(profile);

    expect(await screen.findByDisplayValue("Aetherium Learner")).toBeInTheDocument();
    expect(screen.getByText("No export requests yet.")).toBeInTheDocument();
    expect(screen.getByText("No certificates saved.")).toBeInTheDocument();
    expect(screen.getByText("No account deletion requests recorded.")).toBeInTheDocument();
  });

  it("validates profile URLs before saving", async () => {
    const user = userEvent.setup();
    const client = createClient();

    render(<SettingsPage client={client} />);

    await screen.findByDisplayValue("Aetherium Learner");
    const website = screen.getByLabelText("Website");
    await user.clear(website);
    await user.type(website, "ftp://example.com");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "URL must start with http:// or https://."
    );
    expect(client.users.updateProfile).not.toHaveBeenCalled();
  });

  it("saves profile and privacy settings through the users API", async () => {
    const user = userEvent.setup();
    const client = createClient();

    render(<SettingsPage client={client} />);

    await screen.findByDisplayValue("Aetherium Learner");
    const displayName = screen.getByLabelText("Display name");
    await user.clear(displayName);
    await user.type(displayName, "Updated Learner");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(client.users.updateProfile).toHaveBeenCalledWith({
        bio: "Working through compiler systems and learning operations.",
        displayName: "Updated Learner",
        headline: "Systems learner",
        location: "UTC",
        websiteUrl: "https://example.com"
      });
    });
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Profile visibility"), "unlisted");
    await user.click(screen.getByLabelText("Allow profile context in AI"));
    await user.click(screen.getByLabelText("AI memory"));
    await user.click(screen.getByLabelText("Product analytics"));
    await user.click(screen.getByRole("button", { name: "Save privacy" }));

    await waitFor(() => {
      expect(client.users.updatePrivacy).toHaveBeenCalledWith({
        aiMemoryEnabled: true,
        allowProfileInAiContext: true,
        includeProfileInExports: true,
        productAnalyticsEnabled: true,
        profileVisibility: "unlisted",
        showEmailOnProfile: false
      });
    });
  });

  it("creates profile records and request foundations without local-only state", async () => {
    const user = userEvent.setup();
    const client = createClient();

    render(<SettingsPage client={client} />);

    await screen.findByDisplayValue("Aetherium Learner");

    const linksPanel = within(screen.getByText("Profile links").closest("form") as HTMLElement);
    await user.type(linksPanel.getByLabelText("Title"), "Portfolio");
    await user.type(linksPanel.getByLabelText("URL"), "https://example.com/work");
    await user.click(linksPanel.getByRole("button", { name: "Add link" }));
    expect(await screen.findByText("Profile link added.")).toBeInTheDocument();
    expect(client.users.createLink).toHaveBeenCalledWith({
      linkType: "portfolio",
      title: "Portfolio",
      url: "https://example.com/work"
    });

    const projectPanel = within(
      screen.getByText("Favorite project").closest("form") as HTMLElement
    );
    await user.type(projectPanel.getByLabelText("Project ID"), favoriteProject.projectId);
    await user.click(projectPanel.getByRole("button", { name: "Add project" }));
    expect(client.users.setFavoriteProject).toHaveBeenCalledWith({
      projectId: favoriteProject.projectId
    });

    const resourcePanel = within(
      screen.getByText("Favorite resource").closest("form") as HTMLElement
    );
    await user.type(resourcePanel.getByLabelText("Title"), "Profile systems guide");
    await user.type(resourcePanel.getByLabelText("URL"), "https://example.com/guide");
    await user.click(resourcePanel.getByRole("button", { name: "Add resource" }));
    expect(client.users.createFavoriteResource).toHaveBeenCalledWith({
      notes: null,
      resourceType: "external_link",
      title: "Profile systems guide",
      url: "https://example.com/guide"
    });

    const certificatePanel = within(
      screen.getByText("Certificates").closest("form") as HTMLElement
    );
    await user.type(certificatePanel.getByLabelText("Title"), "Learning Systems");
    await user.type(certificatePanel.getByLabelText("Issuer"), "Aetherium Lab");
    await user.type(certificatePanel.getByLabelText("Issued on"), "2026-07-01");
    await user.type(
      certificatePanel.getByLabelText("Credential URL"),
      "https://example.com/certificate"
    );
    await user.click(certificatePanel.getByRole("button", { name: "Add certificate" }));
    expect(client.users.createCertificate).toHaveBeenCalledWith({
      credentialUrl: "https://example.com/certificate",
      issuedOn: "2026-07-01",
      issuer: "Aetherium Lab",
      title: "Learning Systems"
    });

    await user.click(screen.getByRole("button", { name: "Request export" }));
    expect(client.users.createDataExportRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        includedCategories: ["profile", "settings", "files", "habits", "learning", "projects", "ai"]
      })
    );
  });

  it("requires the exact account deletion confirmation phrase", async () => {
    const user = userEvent.setup();
    const client = createClient();

    render(<SettingsPage client={client} />);

    await screen.findByDisplayValue("Aetherium Learner");
    await user.click(screen.getByRole("button", { name: "Record deletion request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter the exact confirmation phrase to record a deletion request."
    );
    expect(client.users.createAccountDeletionRequest).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Confirmation phrase"), "DELETE MY AETHERIUM ACCOUNT");
    await user.type(screen.getByLabelText("Reason"), "Testing future deletion workflow.");
    await user.click(screen.getByRole("button", { name: "Record deletion request" }));

    await waitFor(() => {
      expect(client.users.createAccountDeletionRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmation: "DELETE MY AETHERIUM ACCOUNT",
          reason: "Testing future deletion workflow."
        })
      );
    });
    expect(
      screen.getByText("Account deletion request recorded. No data was deleted.")
    ).toBeInTheDocument();
  });

  it("shows existing records and server errors without false success", async () => {
    const client = createClient({
      getProfile: vi.fn(() => Promise.reject(new Error("Settings unavailable"))),
      listAccountDeletionRequests: vi.fn(() => Promise.resolve(page([accountDeletionRequest]))),
      listCertificates: vi.fn(() => Promise.resolve(page([certificate]))),
      listDataExportRequests: vi.fn(() => Promise.resolve(page([dataExportRequest]))),
      listFavoriteProjects: vi.fn(() => Promise.resolve(page([favoriteProject]))),
      listFavoriteResources: vi.fn(() => Promise.resolve(page([favoriteResource]))),
      listLinks: vi.fn(() => Promise.resolve(page([link])))
    });

    render(<SettingsPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Settings unavailable");
    expect(screen.queryByText("Profile saved.")).not.toBeInTheDocument();
  });
});
