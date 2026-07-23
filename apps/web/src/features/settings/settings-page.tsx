"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import {
  accountDeletionRequestCreateSchema,
  certificateCreateRequestSchema,
  dataExportRequestCreateSchema,
  favoriteProjectCreateRequestSchema,
  favoriteResourceCreateRequestSchema,
  monthlyReviewUpsertSchema,
  notificationPreferencesUpdateSchema,
  notificationWorkflowRunRequestSchema,
  privacySettingsUpdateSchema,
  profileLinkCreateRequestSchema,
  userProfileUpdateSchema
} from "@aetherium/validation";
import type {
  AccountDeletionRequest,
  Certificate,
  DataExportRequest,
  FavoriteProject,
  FavoriteResource,
  MonthlyReview,
  NotificationPreferences,
  NotificationWorkflowRecord,
  PrivacySettings,
  ProfileLink,
  UserProfile
} from "@aetherium/shared-types";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

type LoadStatus = "loading" | "ready" | "error";

interface SettingsData {
  certificates: Certificate[];
  deletionRequests: AccountDeletionRequest[];
  exportRequests: DataExportRequest[];
  favoriteProjects: FavoriteProject[];
  favoriteResources: FavoriteResource[];
  links: ProfileLink[];
  monthlyReviews: MonthlyReview[];
  notificationPreferences: NotificationPreferences;
  notificationWorkflows: NotificationWorkflowRecord[];
  privacy: PrivacySettings;
  profile: UserProfile;
}

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Settings are unavailable.";
}

function requestKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formString(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function currentMonthStart(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
}

function workflowLabel(value: string): string {
  return value
    .split("_")
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1))
    .join(" ");
}

function mergeWorkflowRecords(
  records: NotificationWorkflowRecord[],
  existing: NotificationWorkflowRecord[]
): NotificationWorkflowRecord[] {
  const seen = new Set<string>();
  return [...records, ...existing].filter((record) => {
    if (seen.has(record.id)) {
      return false;
    }
    seen.add(record.id);
    return true;
  });
}

function mergeMonthlyReviews(review: MonthlyReview, existing: MonthlyReview[]): MonthlyReview[] {
  const rest = existing.filter((item) => item.monthStart !== review.monthStart);
  return [review, ...rest].sort((left, right) => right.monthStart.localeCompare(left.monthStart));
}

export function SettingsPage({
  client
}: Readonly<{ client?: AetheriumApiClient }>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [status, setStatus] = React.useState<LoadStatus>("loading");
  const [data, setData] = React.useState<SettingsData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [
        profile,
        privacy,
        links,
        favoriteProjects,
        favoriteResources,
        certificates,
        exportRequests,
        deletionRequests,
        notificationPreferences,
        notificationWorkflows,
        monthlyReviews
      ] = await Promise.all([
        apiClient.users.getProfile(),
        apiClient.users.getPrivacy(),
        apiClient.users.listLinks({ limit: 25, offset: 0 }),
        apiClient.users.listFavoriteProjects({ limit: 25, offset: 0 }),
        apiClient.users.listFavoriteResources({ limit: 25, offset: 0 }),
        apiClient.users.listCertificates({ limit: 25, offset: 0 }),
        apiClient.users.listDataExportRequests({ limit: 10, offset: 0 }),
        apiClient.users.listAccountDeletionRequests({ limit: 10, offset: 0 }),
        apiClient.notifications.getPreferences(),
        apiClient.notifications.listWorkflows({ limit: 10, offset: 0 }),
        apiClient.notifications.listMonthlyReviews({ limit: 5, offset: 0 })
      ]);
      setData({
        certificates: certificates.items,
        deletionRequests: deletionRequests.items,
        exportRequests: exportRequests.items,
        favoriteProjects: favoriteProjects.items,
        favoriteResources: favoriteResources.items,
        links: links.items,
        monthlyReviews: monthlyReviews.items,
        notificationPreferences,
        notificationWorkflows: notificationWorkflows.items,
        privacy,
        profile
      });
      setStatus("ready");
    } catch (loadError) {
      setError(friendlyError(loadError));
      setStatus("error");
    }
  }, [apiClient]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function saveOperation(operation: () => Promise<void>, success: string): Promise<void> {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await operation();
      setMessage(success);
    } catch (operationError) {
      setError(friendlyError(operationError));
    } finally {
      setIsSaving(false);
    }
  }

  async function updateProfile(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = userProfileUpdateSchema.safeParse({
      bio: formString(form, "bio"),
      displayName: formString(form, "displayName"),
      headline: formString(form, "headline"),
      location: formString(form, "location"),
      websiteUrl: formString(form, "websiteUrl")
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Profile form is invalid.");
      return;
    }
    await saveOperation(async () => {
      const profile = await apiClient.users.updateProfile(parsed.data);
      setData((current) => (current ? { ...current, profile } : current));
    }, "Profile saved.");
  }

  async function updateAvatarPreset(preset: string): Promise<void> {
    const parsed = userProfileUpdateSchema.safeParse({ avatarPreset: preset });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Avatar preset is invalid.");
      return;
    }
    await saveOperation(async () => {
      const profile = await apiClient.users.updateProfile(parsed.data);
      setData((current) => (current ? { ...current, profile } : current));
    }, "Avatar preset saved.");
  }

  async function createLink(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = profileLinkCreateRequestSchema.safeParse({
      linkType: formString(form, "linkType") || "portfolio",
      title: formString(form, "title"),
      url: formString(form, "url")
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Link form is invalid.");
      return;
    }
    await saveOperation(async () => {
      const link = await apiClient.users.createLink(parsed.data);
      setData((current) => (current ? { ...current, links: [link, ...current.links] } : current));
      formElement.reset();
    }, "Profile link added.");
  }

  async function updatePrivacy(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = privacySettingsUpdateSchema.safeParse({
      aiMemoryEnabled: form.get("aiMemoryEnabled") === "on",
      allowProfileInAiContext: form.get("allowProfileInAiContext") === "on",
      includeProfileInExports: form.get("includeProfileInExports") === "on",
      productAnalyticsEnabled: form.get("productAnalyticsEnabled") === "on",
      profileVisibility: formString(form, "profileVisibility") || "private",
      showEmailOnProfile: form.get("showEmailOnProfile") === "on"
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Privacy form is invalid.");
      return;
    }
    await saveOperation(async () => {
      const privacy = await apiClient.users.updatePrivacy(parsed.data);
      setData((current) => (current ? { ...current, privacy } : current));
    }, "Privacy settings saved.");
  }

  async function updateNotificationPreferences(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = notificationPreferencesUpdateSchema.safeParse({
      aiProviderFailureEnabled: form.get("aiProviderFailureEnabled") === "on",
      habitRemindersEnabled: form.get("habitRemindersEnabled") === "on",
      inAppEnabled: form.get("inAppEnabled") === "on",
      learningRemindersEnabled: form.get("learningRemindersEnabled") === "on",
      monthlyReviewEnabled: form.get("monthlyReviewEnabled") === "on",
      processingFailureEnabled: form.get("processingFailureEnabled") === "on",
      projectDeadlineEnabled: form.get("projectDeadlineEnabled") === "on",
      reminderHour: Number(formString(form, "reminderHour")),
      weeklyReviewEnabled: form.get("weeklyReviewEnabled") === "on"
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Notification preferences are invalid.");
      return;
    }
    await saveOperation(async () => {
      const notificationPreferences = await apiClient.notifications.updatePreferences(parsed.data);
      setData((current) => (current ? { ...current, notificationPreferences } : current));
    }, "Notification preferences saved.");
  }

  async function runNotificationWorkflows(): Promise<void> {
    const parsed = notificationWorkflowRunRequestSchema.safeParse({});
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Notification workflow request is invalid.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiClient.notifications.runWorkflows(parsed.data);
      setData((current) =>
        current
          ? {
              ...current,
              notificationWorkflows: mergeWorkflowRecords(
                result.records,
                current.notificationWorkflows
              )
            }
          : current
      );
      setMessage(
        `Generated ${result.generatedCount} new notifications; ${result.existingCount} already existed.`
      );
    } catch (operationError) {
      setError(friendlyError(operationError));
    } finally {
      setIsSaving(false);
    }
  }

  async function upsertMonthlyReview(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = monthlyReviewUpsertSchema.safeParse({
      challenges: formString(form, "challenges") || null,
      monthStart: formString(form, "monthStart"),
      nextSteps: formString(form, "nextSteps") || null,
      wins: formString(form, "wins") || null
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Monthly review form is invalid.");
      return;
    }
    await saveOperation(async () => {
      const review = await apiClient.notifications.upsertMonthlyReview(parsed.data);
      setData((current) =>
        current
          ? { ...current, monthlyReviews: mergeMonthlyReviews(review, current.monthlyReviews) }
          : current
      );
      formElement.reset();
    }, "Monthly review saved.");
  }

  async function createFavoriteProject(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = favoriteProjectCreateRequestSchema.safeParse({
      projectId: formString(form, "projectId")
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Project ID is invalid.");
      return;
    }
    await saveOperation(async () => {
      const favorite = await apiClient.users.setFavoriteProject(parsed.data);
      setData((current) =>
        current
          ? { ...current, favoriteProjects: [favorite, ...current.favoriteProjects] }
          : current
      );
      formElement.reset();
    }, "Favorite project saved.");
  }

  async function createFavoriteResource(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = favoriteResourceCreateRequestSchema.safeParse({
      notes: formString(form, "notes") || null,
      resourceType: "external_link",
      title: formString(form, "title"),
      url: formString(form, "url")
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Resource form is invalid.");
      return;
    }
    await saveOperation(async () => {
      const resource = await apiClient.users.createFavoriteResource(parsed.data);
      setData((current) =>
        current
          ? { ...current, favoriteResources: [resource, ...current.favoriteResources] }
          : current
      );
      formElement.reset();
    }, "Favorite resource saved.");
  }

  async function createCertificate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = certificateCreateRequestSchema.safeParse({
      credentialUrl: formString(form, "credentialUrl"),
      issuedOn: formString(form, "issuedOn") || null,
      issuer: formString(form, "issuer") || null,
      title: formString(form, "title")
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Certificate form is invalid.");
      return;
    }
    await saveOperation(async () => {
      const certificate = await apiClient.users.createCertificate(parsed.data);
      setData((current) =>
        current ? { ...current, certificates: [certificate, ...current.certificates] } : current
      );
      formElement.reset();
    }, "Certificate saved.");
  }

  async function requestExport(): Promise<void> {
    const parsed = dataExportRequestCreateSchema.safeParse({
      idempotencyKey: requestKey("export"),
      includedCategories: ["profile", "settings", "files", "habits", "learning", "projects", "ai"]
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Export request is invalid.");
      return;
    }
    await saveOperation(async () => {
      const request = await apiClient.users.createDataExportRequest(parsed.data);
      setData((current) =>
        current ? { ...current, exportRequests: [request, ...current.exportRequests] } : current
      );
    }, "Data export request recorded.");
  }

  async function requestDeletion(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = accountDeletionRequestCreateSchema.safeParse({
      confirmation: formString(form, "confirmation"),
      idempotencyKey: requestKey("delete"),
      reason: formString(form, "reason")
    });
    if (!parsed.success) {
      setError("Enter the exact confirmation phrase to record a deletion request.");
      return;
    }
    await saveOperation(async () => {
      const request = await apiClient.users.createAccountDeletionRequest(parsed.data);
      setData((current) =>
        current ? { ...current, deletionRequests: [request, ...current.deletionRequests] } : current
      );
      formElement.reset();
    }, "Account deletion request recorded. No data was deleted.");
  }

  if (status === "loading") {
    return (
      <section className="content-stack" aria-busy="true">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Profile and privacy</h1>
          </div>
        </header>
        <section className="work-panel">
          <p className="empty-note">Loading profile settings...</p>
        </section>
      </section>
    );
  }

  if (status === "error" || data === null) {
    return (
      <section className="content-stack">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Profile and privacy</h1>
          </div>
          <button className="secondary-action" onClick={() => void load()} type="button">
            Retry
          </button>
        </header>
        <section className="inline-alert" role="alert">
          {error ?? "Settings are unavailable."}
        </section>
      </section>
    );
  }

  return (
    <section className="content-stack settings-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Profile and privacy</h1>
        </div>
        <span className="state-pill">{isSaving ? "Saving" : "Ready"}</span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      {message ? <section className="inline-success">{message}</section> : null}

      <section className="settings-layout">
        <form className="work-panel settings-form" onSubmit={(event) => void updateProfile(event)}>
          <h2>Profile</h2>
          <label>
            Display name
            <input name="displayName" defaultValue={data.profile.displayName} />
          </label>
          <label>
            Headline
            <input name="headline" defaultValue={data.profile.headline ?? ""} />
          </label>
          <label>
            Location
            <input name="location" defaultValue={data.profile.location ?? ""} />
          </label>
          <label>
            Website
            <input name="websiteUrl" defaultValue={data.profile.websiteUrl ?? ""} />
          </label>
          <label>
            Bio
            <textarea name="bio" defaultValue={data.profile.bio ?? ""} rows={4} />
          </label>
          <div className="settings-actions">
            <button className="primary-action" disabled={isSaving} type="submit">
              Save profile
            </button>
          </div>
        </form>

        <section className="work-panel">
          <h2>Avatar preset</h2>
          <div className="preset-strip" aria-label="Avatar presets">
            {["lumen", "aurora", "atlas", "ember", "sol"].map((preset) => (
              <button
                aria-pressed={data.profile.avatarPreset === preset}
                className="preset-button"
                key={preset}
                onClick={() => void updateAvatarPreset(preset)}
                type="button"
              >
                {preset}
              </button>
            ))}
          </div>
          <p className="empty-note">
            Avatar files can reference owned vault images through the API.
          </p>
        </section>
      </section>

      <section className="settings-layout">
        <form className="work-panel settings-form" onSubmit={(event) => void updatePrivacy(event)}>
          <h2>Privacy controls</h2>
          <label>
            Profile visibility
            <select name="profileVisibility" defaultValue={data.privacy.profileVisibility}>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.privacy.showEmailOnProfile}
              name="showEmailOnProfile"
              type="checkbox"
            />
            Show email on profile
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.privacy.allowProfileInAiContext}
              name="allowProfileInAiContext"
              type="checkbox"
            />
            Allow profile context in AI
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.privacy.aiMemoryEnabled}
              name="aiMemoryEnabled"
              type="checkbox"
            />
            AI memory
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.privacy.productAnalyticsEnabled}
              name="productAnalyticsEnabled"
              type="checkbox"
            />
            Product analytics
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.privacy.includeProfileInExports}
              name="includeProfileInExports"
              type="checkbox"
            />
            Include profile in exports
          </label>
          <button className="primary-action" disabled={isSaving} type="submit">
            Save privacy
          </button>
        </form>

        <section className="work-panel">
          <h2>Data ownership</h2>
          <div className="settings-actions">
            <button
              className="secondary-action"
              disabled={isSaving}
              onClick={() => void requestExport()}
              type="button"
            >
              Request export
            </button>
          </div>
          {data.exportRequests.length === 0 ? (
            <p className="empty-note">No export requests yet.</p>
          ) : (
            <RecordList
              items={data.exportRequests.map((request) => ({
                id: request.id,
                label: request.status,
                value: request.requestedAt
              }))}
            />
          )}
        </section>
      </section>

      <section className="settings-layout">
        <form
          className="work-panel settings-form"
          onSubmit={(event) => void updateNotificationPreferences(event)}
        >
          <h2>Notification workflows</h2>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.inAppEnabled}
              name="inAppEnabled"
              type="checkbox"
            />
            In-app notifications
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.weeklyReviewEnabled}
              name="weeklyReviewEnabled"
              type="checkbox"
            />
            Weekly review prompts
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.monthlyReviewEnabled}
              name="monthlyReviewEnabled"
              type="checkbox"
            />
            Monthly review prompts
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.learningRemindersEnabled}
              name="learningRemindersEnabled"
              type="checkbox"
            />
            Learning review reminders
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.habitRemindersEnabled}
              name="habitRemindersEnabled"
              type="checkbox"
            />
            Habit reminders
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.processingFailureEnabled}
              name="processingFailureEnabled"
              type="checkbox"
            />
            File-processing failures
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.aiProviderFailureEnabled}
              name="aiProviderFailureEnabled"
              type="checkbox"
            />
            AI-provider failures
          </label>
          <label className="toggle-row">
            <input
              defaultChecked={data.notificationPreferences.projectDeadlineEnabled}
              name="projectDeadlineEnabled"
              type="checkbox"
            />
            Project deadline reminders
          </label>
          <label>
            Reminder hour
            <input
              defaultValue={data.notificationPreferences.reminderHour}
              max={23}
              min={0}
              name="reminderHour"
              type="number"
            />
          </label>
          <button className="primary-action" disabled={isSaving} type="submit">
            Save notifications
          </button>
        </form>

        <section className="work-panel">
          <h2>Review queue</h2>
          <div className="settings-actions">
            <button
              className="secondary-action"
              disabled={isSaving}
              onClick={() => void runNotificationWorkflows()}
              type="button"
            >
              Run review workflow check
            </button>
          </div>
          {data.notificationWorkflows.length === 0 ? (
            <p className="empty-note">No workflow records yet.</p>
          ) : (
            <RecordList
              items={data.notificationWorkflows.map((record) => ({
                id: record.id,
                label: workflowLabel(record.workflowType),
                value: record.scheduledFor
              }))}
            />
          )}
        </section>
      </section>

      <section className="settings-layout">
        <form
          className="work-panel settings-form"
          onSubmit={(event) => void upsertMonthlyReview(event)}
        >
          <h2>Monthly review</h2>
          <label>
            Month
            <input
              defaultValue={data.monthlyReviews[0]?.monthStart ?? currentMonthStart()}
              name="monthStart"
              type="date"
            />
          </label>
          <label>
            Wins
            <textarea name="wins" rows={3} />
          </label>
          <label>
            Challenges
            <textarea name="challenges" rows={3} />
          </label>
          <label>
            Next steps
            <textarea name="nextSteps" rows={3} />
          </label>
          <button className="secondary-action" disabled={isSaving} type="submit">
            Save monthly review
          </button>
        </form>

        <section className="work-panel">
          <h2>Saved monthly reviews</h2>
          {data.monthlyReviews.length === 0 ? (
            <p className="empty-note">No monthly reviews saved.</p>
          ) : (
            <RecordList
              items={data.monthlyReviews.map((review) => ({
                id: review.id,
                label: review.monthStart,
                value: review.wins ?? "Recorded review"
              }))}
            />
          )}
        </section>
      </section>

      <section className="settings-layout">
        <form className="work-panel settings-form" onSubmit={(event) => void createLink(event)}>
          <h2>Profile links</h2>
          <label>
            Type
            <select name="linkType" defaultValue="portfolio">
              <option value="resume">Resume</option>
              <option value="portfolio">Portfolio</option>
              <option value="website">Website</option>
              <option value="github">GitHub</option>
              <option value="linkedin">LinkedIn</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Title
            <input name="title" />
          </label>
          <label>
            URL
            <input name="url" />
          </label>
          <button className="secondary-action" disabled={isSaving} type="submit">
            Add link
          </button>
        </form>
        <section className="work-panel">
          <h2>Saved links</h2>
          {data.links.length === 0 ? (
            <p className="empty-note">No profile links yet.</p>
          ) : (
            <RecordList
              items={data.links.map((link) => ({
                id: link.id,
                label: link.title,
                value: link.url
              }))}
            />
          )}
        </section>
      </section>

      <section className="settings-layout">
        <form
          className="work-panel settings-form"
          onSubmit={(event) => void createFavoriteProject(event)}
        >
          <h2>Favorite project</h2>
          <label>
            Project ID
            <input name="projectId" />
          </label>
          <button className="secondary-action" disabled={isSaving} type="submit">
            Add project
          </button>
          <p className="empty-note">Favorites validate that the project belongs to your account.</p>
        </form>
        <form
          className="work-panel settings-form"
          onSubmit={(event) => void createFavoriteResource(event)}
        >
          <h2>Favorite resource</h2>
          <label>
            Title
            <input name="title" />
          </label>
          <label>
            URL
            <input name="url" />
          </label>
          <label>
            Notes
            <input name="notes" />
          </label>
          <button className="secondary-action" disabled={isSaving} type="submit">
            Add resource
          </button>
        </form>
      </section>

      <section className="settings-layout">
        <section className="work-panel">
          <h2>Favorites</h2>
          {data.favoriteProjects.length === 0 && data.favoriteResources.length === 0 ? (
            <p className="empty-note">No favorite projects or resources yet.</p>
          ) : (
            <RecordList
              items={[
                ...data.favoriteProjects.map((project) => ({
                  id: project.id,
                  label: "Project",
                  value: project.projectId
                })),
                ...data.favoriteResources.map((resource) => ({
                  id: resource.id,
                  label: resource.title,
                  value: resource.url ?? resource.resourceType
                }))
              ]}
            />
          )}
        </section>
        <form
          className="work-panel settings-form"
          onSubmit={(event) => void createCertificate(event)}
        >
          <h2>Certificates</h2>
          <label>
            Title
            <input name="title" />
          </label>
          <label>
            Issuer
            <input name="issuer" />
          </label>
          <label>
            Issued on
            <input name="issuedOn" type="date" />
          </label>
          <label>
            Credential URL
            <input name="credentialUrl" />
          </label>
          <button className="secondary-action" disabled={isSaving} type="submit">
            Add certificate
          </button>
        </form>
      </section>

      <section className="settings-layout">
        <section className="work-panel">
          <h2>Saved certificates</h2>
          {data.certificates.length === 0 ? (
            <p className="empty-note">No certificates saved.</p>
          ) : (
            <RecordList
              items={data.certificates.map((certificate) => ({
                id: certificate.id,
                label: certificate.title,
                value: certificate.issuer ?? "No issuer"
              }))}
            />
          )}
        </section>
        <form
          className="work-panel settings-form danger-zone"
          onSubmit={(event) => void requestDeletion(event)}
        >
          <h2>Account deletion request</h2>
          <label>
            Confirmation phrase
            <input name="confirmation" />
          </label>
          <label>
            Reason
            <input name="reason" />
          </label>
          <button className="danger-action" disabled={isSaving} type="submit">
            Record deletion request
          </button>
          {data.deletionRequests.length === 0 ? (
            <p className="empty-note">No account deletion requests recorded.</p>
          ) : (
            <RecordList
              items={data.deletionRequests.map((request) => ({
                id: request.id,
                label: request.status,
                value: request.requestedAt
              }))}
            />
          )}
        </form>
      </section>
    </section>
  );
}

function RecordList({
  items
}: Readonly<{ items: Array<{ id: string; label: string; value: string }> }>): React.ReactElement {
  return (
    <ul className="settings-record-list">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.label}</strong>
          <span>{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
