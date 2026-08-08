import type {
  AnalyticsMetric,
  AnalyticsMetricKey,
  AnalyticsSummary
} from "@aetherium/shared-types";

export interface ProgressTowerOverviewData {
  summary: AnalyticsSummary;
}

export interface ProgressTowerMetricViewModel {
  accent: string;
  available: boolean;
  explanation: string;
  id: AnalyticsMetricKey;
  label: string;
  signalStrength: number;
  valueLabel: string;
}

export interface ProgressTowerTrendViewModel {
  heightScale: number;
  id: string;
  label: string;
  studyMinutes: number;
}

export interface ProgressTowerViewModel {
  activityLabel: string;
  availableMetricLabel: string;
  generatedLabel: string;
  metricSignals: ProgressTowerMetricViewModel[];
  periodLabel: string;
  periodRangeLabel: string;
  studyTrendLabel: string;
  trendSignals: ProgressTowerTrendViewModel[];
  unavailableMetricLabel: string;
}

const METRIC_ACCENTS: Record<AnalyticsMetricKey, string> = {
  ai_requests: "#b8a7ff",
  ai_tokens: "#907cff",
  coding_sessions: "#55d9f2",
  files_opened: "#d8f2ff",
  files_processed: "#a9dff0",
  habit_completion_rate: "#77d98b",
  habit_completions: "#9be7a8",
  lessons_completed: "#78b9ff",
  project_progress: "#ffb066",
  quiz_accuracy: "#72d4e8",
  study_minutes: "#82e6f0",
  topic_mastery: "#8b9dff"
};

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  }).format(parsed);
}

export function formatAnalyticsMetric(metric: AnalyticsMetric): string {
  if (!metric.available || metric.value === null) {
    return "Unavailable";
  }

  if (metric.unit === "ratio") {
    return `${Math.round(metric.value * 100)}%`;
  }

  const value = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(metric.value);
  return metric.unit === "minutes" ? `${value} min` : `${value} ${metric.unit}`;
}

function signalStrength(metric: AnalyticsMetric): number {
  if (!metric.available || metric.value === null) {
    return 0.08;
  }
  return metric.value > 0 ? 0.72 : 0.28;
}

function formatPeriodLabel(period: AnalyticsSummary["period"]): string {
  return `${period[0]?.toUpperCase() ?? ""}${period.slice(1)} view`;
}

export function buildProgressTowerViewModel(
  data: ProgressTowerOverviewData
): ProgressTowerViewModel {
  const availableMetrics = data.summary.metrics.filter(
    (metric) => metric.available && metric.value !== null
  );
  const unavailableMetrics = data.summary.metrics.length - availableMetrics.length;
  const hasActivity = availableMetrics.some((metric) => (metric.value ?? 0) > 0);
  const maxStudyMinutes = Math.max(
    0,
    ...data.summary.trendBuckets.map((bucket) => bucket.studyMinutes)
  );
  const totalStudyMinutes = data.summary.trendBuckets.reduce(
    (total, bucket) => total + bucket.studyMinutes,
    0
  );

  return {
    activityLabel: hasActivity ? "Stored activity recorded" : "No activity in this period",
    availableMetricLabel: formatCount(availableMetrics.length, "available metric"),
    generatedLabel: `Updated ${formatDate(data.summary.generatedAt)}`,
    metricSignals: data.summary.metrics.map((metric) => ({
      accent: METRIC_ACCENTS[metric.key],
      available: metric.available && metric.value !== null,
      explanation: metric.explanation,
      id: metric.key,
      label: metric.label,
      signalStrength: signalStrength(metric),
      valueLabel: formatAnalyticsMetric(metric)
    })),
    periodLabel: formatPeriodLabel(data.summary.period),
    periodRangeLabel: `${formatDate(data.summary.periodStart)} - ${formatDate(data.summary.periodEnd)}`,
    studyTrendLabel:
      data.summary.trendBuckets.length === 0
        ? "No study trend buckets"
        : `${totalStudyMinutes} study minutes across ${formatCount(data.summary.trendBuckets.length, "period")}`,
    trendSignals: data.summary.trendBuckets.map((bucket) => ({
      heightScale:
        maxStudyMinutes === 0 ? 0.12 : 0.18 + (bucket.studyMinutes / maxStudyMinutes) * 0.82,
      id: `${bucket.periodStart}-${bucket.periodEnd}`,
      label: bucket.label,
      studyMinutes: bucket.studyMinutes
    })),
    unavailableMetricLabel: formatCount(unavailableMetrics, "unavailable metric")
  };
}
