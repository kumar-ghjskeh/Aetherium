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

export interface PersonalSanctuaryOverviewData {
  certificates: CertificatePage;
  favoriteProjects: FavoriteProjectPage;
  favoriteResources: FavoriteResourcePage;
  preferences: UserPreferences;
  privacy: PrivacySettings;
  profile: UserProfile;
  profileLinks: ProfileLinkPage;
  projects: ProjectPage;
}

export type SanctuaryAvatarShape = "crystal" | "orb" | "prism";

export interface SanctuaryAvatarViewModel {
  accent: string;
  label: string;
  shape: SanctuaryAvatarShape;
}

export interface SanctuaryRecordViewModel {
  id: string;
  label: string;
  meta: string;
}

export interface SanctuaryStatusViewModel {
  enabled: boolean;
  label: string;
  value: string;
}

export interface PersonalSanctuaryViewModel {
  avatar: SanctuaryAvatarViewModel;
  certificateLabel: string;
  certificates: SanctuaryRecordViewModel[];
  displayName: string;
  favoriteProjectLabel: string;
  favoriteProjects: SanctuaryRecordViewModel[];
  favoriteResourceLabel: string;
  favoriteResources: SanctuaryRecordViewModel[];
  headline: string;
  links: SanctuaryRecordViewModel[];
  privacyStatuses: SanctuaryStatusViewModel[];
  settingStatuses: SanctuaryStatusViewModel[];
}

const AVATAR_STYLES: Record<string, SanctuaryAvatarViewModel> = {
  builder: { accent: "#ffb066", label: "Builder preset", shape: "prism" },
  explorer: { accent: "#77d98b", label: "Explorer preset", shape: "orb" },
  scholar: { accent: "#82b6ff", label: "Scholar preset", shape: "crystal" },
  sentinel: { accent: "#f0c766", label: "Sentinel preset", shape: "prism" }
};

function compactLabel(value: string | null | undefined, fallback: string, maxLength = 48): string {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function resolveAvatar(profile: UserProfile): SanctuaryAvatarViewModel {
  if (profile.avatarKind === "vault_file") {
    return { accent: "#b8a7ff", label: "Vault avatar", shape: "orb" };
  }
  return (
    AVATAR_STYLES[profile.avatarPreset ?? ""] ?? {
      accent: "#b8a7ff",
      label: profile.avatarPreset ? "Custom preset" : "Default Aetherium preset",
      shape: "crystal"
    }
  );
}

export function buildPersonalSanctuaryViewModel(
  data: PersonalSanctuaryOverviewData
): PersonalSanctuaryViewModel {
  const projectsById = new Map(data.projects.items.map((project) => [project.id, project]));
  const favoriteProjects = data.favoriteProjects.items.slice(0, 5).map((favorite) => {
    const project = projectsById.get(favorite.projectId);
    return {
      id: favorite.id,
      label: compactLabel(project?.name, "Saved project"),
      meta: project ? titleCase(project.status) : "Project details unavailable"
    };
  });

  return {
    avatar: resolveAvatar(data.profile),
    certificateLabel: formatCount(data.certificates.total, "certificate"),
    certificates: data.certificates.items.slice(0, 5).map((certificate) => ({
      id: certificate.id,
      label: compactLabel(certificate.title, "Certificate"),
      meta: compactLabel(certificate.issuer, "Issuer not recorded")
    })),
    displayName: compactLabel(data.profile.displayName, "Aetherium learner", 32),
    favoriteProjectLabel: formatCount(data.favoriteProjects.total, "favorite project"),
    favoriteProjects,
    favoriteResourceLabel: formatCount(data.favoriteResources.total, "favorite resource"),
    favoriteResources: data.favoriteResources.items.slice(0, 5).map((resource) => ({
      id: resource.id,
      label: compactLabel(resource.title, "Saved resource"),
      meta: titleCase(resource.resourceType)
    })),
    headline: compactLabel(data.profile.headline, "A private place for your learning identity", 72),
    links: data.profileLinks.items.slice(0, 4).map((link) => ({
      id: link.id,
      label: compactLabel(link.title, "Profile link"),
      meta: titleCase(link.linkType)
    })),
    privacyStatuses: [
      {
        enabled: data.privacy.profileVisibility === "private",
        label: "Profile visibility",
        value: data.privacy.profileVisibility === "private" ? "Private" : "Unlisted"
      },
      {
        enabled: data.privacy.allowProfileInAiContext,
        label: "AI profile context",
        value: data.privacy.allowProfileInAiContext ? "Allowed" : "Blocked"
      },
      {
        enabled: data.privacy.aiMemoryEnabled,
        label: "AI memory",
        value: data.privacy.aiMemoryEnabled ? "Enabled" : "Disabled"
      },
      {
        enabled: data.privacy.productAnalyticsEnabled,
        label: "Product analytics",
        value: data.privacy.productAnalyticsEnabled ? "Enabled" : "Disabled"
      }
    ],
    settingStatuses: [
      {
        enabled: true,
        label: "Graphics",
        value: titleCase(data.preferences.performancePreset)
      },
      {
        enabled: data.preferences.reducedMotion,
        label: "Reduced motion",
        value: data.preferences.reducedMotion ? "Enabled" : "Disabled"
      },
      {
        enabled: data.preferences.backgroundMusicEnabled,
        label: "Background music",
        value: data.preferences.backgroundMusicEnabled ? "Enabled" : "Muted"
      },
      {
        enabled: data.preferences.ambientAudioEnabled,
        label: "Ambient audio",
        value: data.preferences.ambientAudioEnabled ? "Enabled" : "Muted"
      },
      {
        enabled: data.preferences.cameraEffectsEnabled,
        label: "Camera effects",
        value: data.preferences.cameraEffectsEnabled ? "Enabled" : "Disabled"
      }
    ]
  };
}
