"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  DailyCheckIn,
  Habit,
  HabitCreateRequest,
  HabitPage,
  HabitScheduleType,
  HabitSummary,
  HabitValueType,
  WeeklyReview
} from "@aetherium/shared-types";
import { habitCreateRequestSchema } from "@aetherium/validation";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

const HABIT_LIMIT = 25;

const weekdayOptions = [
  { label: "Mon", value: 0 },
  { label: "Tue", value: 1 },
  { label: "Wed", value: 2 },
  { label: "Thu", value: 3 },
  { label: "Fri", value: 4 },
  { label: "Sat", value: 5 },
  { label: "Sun", value: 6 }
] as const;

interface HabitDraft {
  name: string;
  description: string;
  valueType: HabitValueType;
  targetValue: string;
  targetUnit: string;
  scheduleType: HabitScheduleType;
  weekdays: number[];
  weeklyTarget: string;
}

interface LogDraft {
  note: string;
  value: string;
}

interface CheckInDraft {
  energy: string;
  mood: string;
  notes: string;
}

interface WeeklyReviewDraft {
  challenges: string;
  nextSteps: string;
  weekStart: string;
  wins: string;
}

const initialHabitDraft: HabitDraft = {
  description: "",
  name: "",
  scheduleType: "daily",
  targetUnit: "",
  targetValue: "1",
  valueType: "boolean",
  weekdays: [],
  weeklyTarget: "3"
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentWeekStartIso(): string {
  const current = new Date(`${todayIso()}T00:00:00Z`);
  const day = current.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  current.setUTCDate(current.getUTCDate() + mondayOffset);
  return current.toISOString().slice(0, 10);
}

function defaultTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The habit request failed.";
}

function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function scheduleLabel(habit: Habit): string {
  if (habit.schedule.scheduleType === "daily") {
    return "Daily";
  }
  if (habit.schedule.scheduleType === "weekly_target") {
    return `${habit.schedule.weeklyTarget ?? 1} times per week`;
  }
  const labels = habit.schedule.weekdays
    .map((day) => weekdayOptions.find((option) => option.value === day)?.label)
    .filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : "Selected weekdays";
}

function checkInDraftFrom(checkIn: DailyCheckIn | null): CheckInDraft {
  return {
    energy: checkIn?.energy ? String(checkIn.energy) : "",
    mood: checkIn?.mood ? String(checkIn.mood) : "",
    notes: checkIn?.notes ?? ""
  };
}

function buildHabitPayload(draft: HabitDraft): HabitCreateRequest {
  const payload: HabitCreateRequest = {
    name: draft.name.trim(),
    scheduleType: draft.scheduleType,
    startsOn: todayIso(),
    targetValue: Number(draft.targetValue),
    timeZone: defaultTimeZone(),
    valueType: draft.valueType
  };
  if (draft.description.trim()) {
    payload.description = draft.description.trim();
  }
  if (draft.targetUnit.trim()) {
    payload.targetUnit = draft.targetUnit.trim();
  }
  if (draft.scheduleType === "selected_weekdays") {
    payload.weekdays = draft.weekdays;
  }
  if (draft.scheduleType === "weekly_target") {
    payload.weeklyTarget = Number(draft.weeklyTarget);
  }
  return payload;
}

export function HabitsPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [habitPage, setHabitPage] = React.useState<HabitPage | null>(null);
  const [summary, setSummary] = React.useState<HabitSummary | null>(null);
  const [checkIn, setCheckIn] = React.useState<DailyCheckIn | null>(null);
  const [weeklyReviews, setWeeklyReviews] = React.useState<WeeklyReview[]>([]);
  const [habitDraft, setHabitDraft] = React.useState<HabitDraft>(initialHabitDraft);
  const [checkInDraft, setCheckInDraft] = React.useState<CheckInDraft>(checkInDraftFrom(null));
  const [weeklyReviewDraft, setWeeklyReviewDraft] = React.useState<WeeklyReviewDraft>({
    challenges: "",
    nextSteps: "",
    weekStart: currentWeekStartIso(),
    wins: ""
  });
  const [logDrafts, setLogDrafts] = React.useState<Record<string, LogDraft>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const loadHabits = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const today = todayIso();
        const [loadedHabits, loadedSummary, loadedCheckIn, loadedReviews] = await Promise.all([
          apiClient.habits.list({ limit: HABIT_LIMIT, offset: 0 }),
          apiClient.habits.getSummary({ period: "week" }),
          apiClient.habits.getCheckIn(today),
          apiClient.habits.listWeeklyReviews({ limit: 4, offset: 0 })
        ]);
        setHabitPage(loadedHabits);
        setSummary(loadedSummary);
        setCheckIn(loadedCheckIn);
        setCheckInDraft(checkInDraftFrom(loadedCheckIn));
        setWeeklyReviews(loadedReviews.items);
      } catch (loadError) {
        setError(friendlyError(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient]
  );

  React.useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  async function handleCreateHabit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const payload = buildHabitPayload(habitDraft);
    const parsed = habitCreateRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Habit details are invalid.");
      return;
    }

    await runAction("habit:create", async () => {
      await apiClient.habits.create(parsed.data);
      setHabitDraft(initialHabitDraft);
      setNotice("Habit created.");
      await loadHabits(false);
    });
  }

  async function handleLogHabit(habit: Habit): Promise<void> {
    const draft = logDrafts[habit.id] ?? { note: "", value: "" };
    const value = draft.value.trim() ? Number(draft.value) : habit.target.targetValue;
    if (!Number.isFinite(value) || value <= 0) {
      setError("Log value must be greater than zero.");
      return;
    }
    await runAction(`log:${habit.id}`, async () => {
      await apiClient.habits.log(habit.id, {
        logDate: todayIso(),
        note: draft.note.trim() || undefined,
        value
      });
      setLogDrafts((current) => ({ ...current, [habit.id]: { note: "", value: "" } }));
      setNotice("Habit logged for today.");
      await loadHabits(false);
    });
  }

  async function handleArchiveHabit(habit: Habit): Promise<void> {
    await runAction(`archive:${habit.id}`, async () => {
      await apiClient.habits.archive(habit.id);
      setNotice("Habit archived.");
      await loadHabits(false);
    });
  }

  async function handleSaveCheckIn(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await runAction("check-in:save", async () => {
      await apiClient.habits.upsertCheckIn(todayIso(), {
        energy: checkInDraft.energy ? Number(checkInDraft.energy) : null,
        mood: checkInDraft.mood ? Number(checkInDraft.mood) : null,
        notes: checkInDraft.notes.trim() || null
      });
      setNotice("Daily check-in saved.");
      await loadHabits(false);
    });
  }

  async function handleSaveWeeklyReview(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await runAction("weekly-review:save", async () => {
      await apiClient.habits.upsertWeeklyReview({
        challenges: weeklyReviewDraft.challenges.trim() || null,
        nextSteps: weeklyReviewDraft.nextSteps.trim() || null,
        weekStart: weeklyReviewDraft.weekStart,
        wins: weeklyReviewDraft.wins.trim() || null
      });
      setWeeklyReviewDraft((current) => ({
        ...current,
        challenges: "",
        nextSteps: "",
        wins: ""
      }));
      setNotice("Weekly review saved.");
      await loadHabits(false);
    });
  }

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

  const habits = habitPage?.items ?? [];
  const completionRate = summary?.completionRate ?? 0;

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Rhythm</p>
          <h1>Habits</h1>
        </div>
        <span className="state-pill">
          {isLoading ? "Syncing" : `${habitPage?.total ?? 0} active`}
        </span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      {notice ? (
        <section className="inline-success" aria-live="polite">
          {notice}
        </section>
      ) : null}

      <div className="metric-grid habit-metrics">
        <section className="metric-panel">
          <span>Completion</span>
          <strong>{summary ? percentLabel(summary.completionRate) : "..."}</strong>
          <small>This week from stored logs</small>
        </section>
        <section className="metric-panel">
          <span>Logs</span>
          <strong>{summary?.completedLogCount ?? 0}</strong>
          <small>{summary?.scheduledCount ?? 0} scheduled targets</small>
        </section>
        <section className="metric-panel">
          <span>Best streak</span>
          <strong>{summary?.bestStreak ?? 0}</strong>
          <small>Across active habits</small>
        </section>
        <section className="metric-panel">
          <span>Garden signal</span>
          <strong>{summary?.gardenGrowthPoints ?? 0}</strong>
          <small>One point per meaningful log</small>
        </section>
      </div>

      <div className="habit-grid">
        <section className="work-panel habit-garden-panel">
          <header>
            <div>
              <h2>Habit Garden State</h2>
              <p className="empty-note">Non-visual progress signal for the future World Mode.</p>
            </div>
          </header>
          <div
            aria-label={`Weekly habit completion ${percentLabel(completionRate)}`}
            className="habit-growth-track"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(completionRate * 100)}
          >
            <span style={{ width: `${Math.max(4, Math.round(completionRate * 100))}%` }} />
          </div>
          <dl className="detail-list compact-detail-list">
            <dt>Active habits</dt>
            <dd>{summary?.activeHabitCount ?? 0}</dd>
            <dt>Recovery streaks</dt>
            <dd>{summary?.recoveryStreakTotal ?? 0}</dd>
            <dt>Period</dt>
            <dd>{summary ? `${summary.startDate} to ${summary.endDate}` : "Loading"}</dd>
          </dl>
        </section>

        <section className="work-panel">
          <header>
            <div>
              <h2>Create Habit</h2>
              <p className="empty-note">Track useful routines without shame-based penalties.</p>
            </div>
          </header>
          <form className="habit-create-form" onSubmit={(event) => void handleCreateHabit(event)}>
            <label>
              Name
              <input
                onChange={(event) =>
                  setHabitDraft((current) => ({ ...current, name: event.target.value }))
                }
                required
                value={habitDraft.name}
              />
            </label>
            <label>
              Type
              <select
                onChange={(event) =>
                  setHabitDraft((current) => ({
                    ...current,
                    valueType: event.target.value as HabitValueType
                  }))
                }
                value={habitDraft.valueType}
              >
                <option value="boolean">Completion</option>
                <option value="duration">Duration</option>
                <option value="count">Count</option>
                <option value="quantity">Quantity</option>
              </select>
            </label>
            <label>
              Target
              <input
                min="0.01"
                onChange={(event) =>
                  setHabitDraft((current) => ({ ...current, targetValue: event.target.value }))
                }
                step="0.01"
                type="number"
                value={habitDraft.targetValue}
              />
            </label>
            <label>
              Unit
              <input
                onChange={(event) =>
                  setHabitDraft((current) => ({ ...current, targetUnit: event.target.value }))
                }
                placeholder="minutes, pages, sessions"
                value={habitDraft.targetUnit}
              />
            </label>
            <label>
              Schedule
              <select
                onChange={(event) =>
                  setHabitDraft((current) => ({
                    ...current,
                    scheduleType: event.target.value as HabitScheduleType
                  }))
                }
                value={habitDraft.scheduleType}
              >
                <option value="daily">Daily</option>
                <option value="selected_weekdays">Selected weekdays</option>
                <option value="weekly_target">Weekly target</option>
              </select>
            </label>
            {habitDraft.scheduleType === "weekly_target" ? (
              <label>
                Times per week
                <input
                  max="7"
                  min="1"
                  onChange={(event) =>
                    setHabitDraft((current) => ({
                      ...current,
                      weeklyTarget: event.target.value
                    }))
                  }
                  type="number"
                  value={habitDraft.weeklyTarget}
                />
              </label>
            ) : null}
            {habitDraft.scheduleType === "selected_weekdays" ? (
              <fieldset className="weekday-picker">
                <legend>Weekdays</legend>
                {weekdayOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      checked={habitDraft.weekdays.includes(option.value)}
                      onChange={(event) =>
                        setHabitDraft((current) => ({
                          ...current,
                          weekdays: event.target.checked
                            ? [...current.weekdays, option.value].sort()
                            : current.weekdays.filter((day) => day !== option.value)
                        }))
                      }
                      type="checkbox"
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            ) : null}
            <label className="habit-description-field">
              Notes
              <textarea
                onChange={(event) =>
                  setHabitDraft((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                value={habitDraft.description}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "habit:create"}
              type="submit"
            >
              Create habit
            </button>
          </form>
        </section>
      </div>

      <section className="work-panel">
        <header className="habit-panel-header">
          <div>
            <h2>Today</h2>
            <p className="empty-note">Logging updates streaks, summaries, and domain events.</p>
          </div>
          <button className="secondary-action" onClick={() => void loadHabits()} type="button">
            Refresh
          </button>
        </header>
        {isLoading ? <p className="empty-note">Loading habits...</p> : null}
        {!isLoading && habits.length === 0 ? (
          <p className="empty-note">No habits yet. Create one to begin tracking.</p>
        ) : null}
        {!isLoading && habits.length > 0 ? (
          <div className="habit-list">
            {habits.map((habit) => {
              const draft = logDrafts[habit.id] ?? { note: "", value: "" };
              return (
                <article className="habit-row" key={habit.id}>
                  <div className="habit-row-main">
                    <div>
                      <h3>{habit.name}</h3>
                      <p>{habit.description ?? "No description"}</p>
                    </div>
                    <span className={habit.completedToday ? "status-token" : "status-token muted"}>
                      {habit.completedToday ? "Logged" : "Open"}
                    </span>
                  </div>
                  <dl className="habit-detail-grid">
                    <div>
                      <dt>Schedule</dt>
                      <dd>{scheduleLabel(habit)}</dd>
                    </div>
                    <div>
                      <dt>Target</dt>
                      <dd>
                        {habit.target.targetValue} {habit.target.targetUnit ?? "completion"}
                      </dd>
                    </div>
                    <div>
                      <dt>Current streak</dt>
                      <dd>{habit.streak.currentStreak}</dd>
                    </div>
                    <div>
                      <dt>30-day rate</dt>
                      <dd>{percentLabel(habit.streak.completionRate30d)}</dd>
                    </div>
                  </dl>
                  <div className="habit-log-row">
                    <label>
                      <span className="sr-only">Value for {habit.name}</span>
                      <input
                        aria-label={`Value for ${habit.name}`}
                        min="0.01"
                        onChange={(event) =>
                          setLogDrafts((current) => ({
                            ...current,
                            [habit.id]: { ...draft, value: event.target.value }
                          }))
                        }
                        placeholder={String(habit.target.targetValue)}
                        step="0.01"
                        type="number"
                        value={draft.value}
                      />
                    </label>
                    <label>
                      <span className="sr-only">Note for {habit.name}</span>
                      <input
                        aria-label={`Note for ${habit.name}`}
                        onChange={(event) =>
                          setLogDrafts((current) => ({
                            ...current,
                            [habit.id]: { ...draft, note: event.target.value }
                          }))
                        }
                        placeholder="Optional note"
                        value={draft.note}
                      />
                    </label>
                    <button
                      className="primary-action"
                      disabled={activeAction === `log:${habit.id}`}
                      onClick={() => void handleLogHabit(habit)}
                      type="button"
                    >
                      Log today
                    </button>
                    <button
                      className="secondary-action"
                      disabled={activeAction === `archive:${habit.id}`}
                      onClick={() => void handleArchiveHabit(habit)}
                      type="button"
                    >
                      Archive
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="habit-grid">
        <section className="work-panel">
          <header>
            <div>
              <h2>Daily Check-In</h2>
              <p className="empty-note">
                Mood and energy are optional context, not medical measurements.
              </p>
            </div>
          </header>
          <form className="check-in-form" onSubmit={(event) => void handleSaveCheckIn(event)}>
            <label>
              Mood
              <select
                onChange={(event) =>
                  setCheckInDraft((current) => ({ ...current, mood: event.target.value }))
                }
                value={checkInDraft.mood}
              >
                <option value="">Not set</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <label>
              Energy
              <select
                onChange={(event) =>
                  setCheckInDraft((current) => ({ ...current, energy: event.target.value }))
                }
                value={checkInDraft.energy}
              >
                <option value="">Not set</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <label className="habit-description-field">
              Notes
              <textarea
                onChange={(event) =>
                  setCheckInDraft((current) => ({ ...current, notes: event.target.value }))
                }
                value={checkInDraft.notes}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "check-in:save"}
              type="submit"
            >
              Save check-in
            </button>
          </form>
          {checkIn ? <p className="empty-note">Last saved for {checkIn.checkInDate}.</p> : null}
        </section>

        <section className="work-panel">
          <header>
            <div>
              <h2>Weekly Review</h2>
              <p className="empty-note">Reflect on useful progress without resetting history.</p>
            </div>
          </header>
          <form
            className="weekly-review-form"
            onSubmit={(event) => void handleSaveWeeklyReview(event)}
          >
            <label>
              Week start
              <input
                onChange={(event) =>
                  setWeeklyReviewDraft((current) => ({
                    ...current,
                    weekStart: event.target.value
                  }))
                }
                type="date"
                value={weeklyReviewDraft.weekStart}
              />
            </label>
            <label>
              Wins
              <textarea
                onChange={(event) =>
                  setWeeklyReviewDraft((current) => ({
                    ...current,
                    wins: event.target.value
                  }))
                }
                value={weeklyReviewDraft.wins}
              />
            </label>
            <label>
              Challenges
              <textarea
                onChange={(event) =>
                  setWeeklyReviewDraft((current) => ({
                    ...current,
                    challenges: event.target.value
                  }))
                }
                value={weeklyReviewDraft.challenges}
              />
            </label>
            <label>
              Next steps
              <textarea
                onChange={(event) =>
                  setWeeklyReviewDraft((current) => ({
                    ...current,
                    nextSteps: event.target.value
                  }))
                }
                value={weeklyReviewDraft.nextSteps}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "weekly-review:save"}
              type="submit"
            >
              Save review
            </button>
          </form>
          {weeklyReviews.length > 0 ? (
            <ul className="plain-list">
              {weeklyReviews.map((review) => (
                <li key={review.id}>
                  <span>
                    <strong>{review.weekStart}</strong>
                    <small>{review.wins ?? "No wins recorded"}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No weekly reviews yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}
