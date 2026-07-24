import type {
  AIModelConfigurationPage,
  AIProviderPage,
  AIUsageRecordPage,
  ConversationPage,
  Mentor,
  MentorPage
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export type AIProbeState =
  | "error"
  | "greeting"
  | "idle"
  | "listening"
  | "offline"
  | "retrieving"
  | "speaking"
  | "thinking"
  | "waiting";

export interface AIObservatoryOverviewData {
  conversations: ConversationPage;
  modelConfigs: AIModelConfigurationPage;
  mentors: MentorPage;
  providers: AIProviderPage;
  usage: AIUsageRecordPage;
}

export interface AIProbeViewModel {
  color: string;
  detail: string;
  id: string;
  label: string;
  position: Vector3Tuple;
  shape: "crystal" | "orb" | "ring" | "spire";
  state: AIProbeState;
}

export interface AIObservatoryViewModel {
  activeConversationLabel: string;
  configuredProviderLabel: string;
  enabledModelLabel: string;
  probes: AIProbeViewModel[];
  recentUsageLabel: string;
  totalMentorLabel: string;
}

const PROBE_COLORS = ["#8be8ff", "#7d68ff", "#f0c766", "#77d98b", "#ffb55e", "#b9a8ff"];
const PROBE_SHAPES: AIProbeViewModel["shape"][] = ["orb", "crystal", "ring", "spire"];
const PROBE_POSITIONS: Vector3Tuple[] = [
  [-9, 3.2, -8],
  [9, 3.2, -8],
  [-8, 3.2, 7],
  [8, 3.2, 7],
  [0, 5.2, -12],
  [0, 4.6, 11]
];

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function conversationCountForMentor(mentor: Mentor, conversations: ConversationPage): number {
  return conversations.items.filter((conversation) => conversation.mentorId === mentor.id).length;
}

function hasRecentUsageFailure(usage: AIUsageRecordPage): boolean {
  return usage.items.some(
    (record) => record.status === "failed" || record.status === "rate_limited"
  );
}

function resolveProbeState(
  mentor: Mentor,
  conversations: ConversationPage,
  usage: AIUsageRecordPage
): AIProbeState {
  if (mentor.archivedAt) {
    return "offline";
  }
  if (hasRecentUsageFailure(usage)) {
    return "error";
  }
  if (!mentor.permissions.allowConversations) {
    return "waiting";
  }
  if (conversationCountForMentor(mentor, conversations) > 0) {
    return "greeting";
  }
  return "idle";
}

export function buildAIObservatoryViewModel(
  data: AIObservatoryOverviewData
): AIObservatoryViewModel {
  const configuredProviderCount = data.providers.items.filter(
    (provider) => provider.configured
  ).length;
  const enabledModelCount = data.modelConfigs.items.filter((config) => config.enabled).length;
  const recentUsageCount = data.usage.items.length;

  return {
    activeConversationLabel: formatCount(data.conversations.total, "conversation"),
    configuredProviderLabel: formatCount(configuredProviderCount, "configured provider"),
    enabledModelLabel: formatCount(enabledModelCount, "enabled model"),
    probes: data.mentors.items.slice(0, 6).map((mentor, index) => {
      const conversationCount = conversationCountForMentor(mentor, data.conversations);
      return {
        color: PROBE_COLORS[index % PROBE_COLORS.length] ?? "#8be8ff",
        detail:
          conversationCount > 0
            ? formatCount(conversationCount, "conversation")
            : mentor.permissions.allowConversations
              ? mentor.description
              : "Conversations disabled by mentor permissions",
        id: mentor.id,
        label: mentor.name,
        position: PROBE_POSITIONS[index % PROBE_POSITIONS.length] ?? [0, 3.2, 0],
        shape: PROBE_SHAPES[index % PROBE_SHAPES.length] ?? "orb",
        state: resolveProbeState(mentor, data.conversations, data.usage)
      };
    }),
    recentUsageLabel: formatCount(recentUsageCount, "recent AI request"),
    totalMentorLabel: formatCount(data.mentors.items.length, "mentor")
  };
}
