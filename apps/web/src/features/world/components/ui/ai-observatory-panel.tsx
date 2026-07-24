import Link from "next/link";
import React from "react";

import {
  buildAIObservatoryViewModel,
  type AIObservatoryOverviewData,
  type AIProbeState
} from "../../engine/ai-observatory-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const OBSERVATORY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "ai-observatory"
);

const STATE_LABELS: Record<AIProbeState, string> = {
  error: "Provider error",
  greeting: "Conversation ready",
  idle: "Idle",
  listening: "Listening",
  offline: "Archived",
  retrieving: "Retrieving",
  speaking: "Speaking",
  thinking: "Thinking",
  waiting: "Permission limited"
};

export function AIObservatoryPanel({
  overview
}: Readonly<{
  overview: AIObservatoryOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildAIObservatoryViewModel(overview), [overview]);
  const nearObservatory = usePlayerStore((state) => {
    if (!OBSERVATORY_LOCATION) {
      return false;
    }
    const [x, , z] = OBSERVATORY_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 108;
  });

  if (!nearObservatory) {
    return null;
  }

  return (
    <aside aria-label="AI Observatory mentor and provider overview" className="world-ai-panel">
      <header>
        <span>AI Observatory</span>
        <strong>{viewModel.totalMentorLabel}</strong>
      </header>
      <dl className="world-ai-metrics">
        <div>
          <dt>Conversations</dt>
          <dd>{viewModel.activeConversationLabel}</dd>
        </div>
        <div>
          <dt>Providers</dt>
          <dd>{viewModel.configuredProviderLabel}</dd>
        </div>
        <div>
          <dt>Models</dt>
          <dd>{viewModel.enabledModelLabel}</dd>
        </div>
      </dl>
      <section className="world-ai-probes">
        <span>Mentor probes</span>
        {viewModel.probes.length === 0 ? (
          <p>No mentors are available yet.</p>
        ) : (
          <ul>
            {viewModel.probes.slice(0, 4).map((probe) => (
              <li key={probe.id}>
                <strong>{probe.label}</strong>
                <small>{STATE_LABELS[probe.state]}</small>
                <em>{probe.detail}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="world-ai-status">
        <span>Gateway</span>
        <strong>{viewModel.recentUsageLabel}</strong>
        <small>
          Conversations and document Q&A open in Command Mode panels so source citations stay
          readable.
        </small>
      </section>
      <nav aria-label="AI Observatory command actions" className="world-ai-actions">
        <Link href="/app/ai">Mentor Chat</Link>
        <Link href="/app/ai">Document Q&amp;A</Link>
        <Link href="/app/settings">AI Settings</Link>
      </nav>
    </aside>
  );
}
