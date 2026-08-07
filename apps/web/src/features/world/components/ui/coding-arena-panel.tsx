import Link from "next/link";
import React from "react";

import {
  buildCodingArenaViewModel,
  type CodingArenaOverviewData
} from "../../engine/coding-arena-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const ARENA_LOCATION = WORLD_LOCATIONS_MANIFEST.find((location) => location.id === "coding-arena");

export function CodingArenaPanel({
  overview
}: Readonly<{
  overview: CodingArenaOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildCodingArenaViewModel(overview), [overview]);
  const nearArena = usePlayerStore((state) => {
    if (!ARENA_LOCATION) {
      return false;
    }
    const [x, , z] = ARENA_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 112;
  });

  if (!nearArena) {
    return null;
  }

  return (
    <aside aria-label="Coding Arena real workspace overview" className="world-coding-panel">
      <header>
        <span>Coding Arena</span>
        <strong data-available={viewModel.runnerAvailable}>{viewModel.runnerStatusLabel}</strong>
      </header>
      <dl className="world-coding-metrics">
        <div>
          <dt>Workspace</dt>
          <dd>{viewModel.snippetCountLabel}</dd>
        </div>
        <div>
          <dt>Practice</dt>
          <dd>{viewModel.exerciseCountLabel}</dd>
        </div>
        <div>
          <dt>Projects</dt>
          <dd>{viewModel.linkedProjectCountLabel}</dd>
        </div>
      </dl>
      <section className="world-coding-list">
        <span>Saved code tabs</span>
        {viewModel.snippetConsoles.length === 0 ? (
          <p>No saved snippets yet. The arena is ready for the first workspace tab.</p>
        ) : (
          <ul>
            {viewModel.snippetConsoles.slice(0, 4).map((console) => (
              <li key={console.id}>
                <i style={{ backgroundColor: console.accent }} />
                <strong>{console.title}</strong>
                <small>
                  {console.languageLabel} - {console.linkedProjectLabel}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="world-coding-runner">
        <span>Execution boundary</span>
        <strong>{viewModel.runnerDetail}</strong>
        <small>{viewModel.runnerLanguageLabel}</small>
        {viewModel.runnerRequirements.length > 0 ? (
          <ul aria-label="Required runner isolation controls">
            {viewModel.runnerRequirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="world-coding-assistant">
        <span>AI assistant</span>
        <strong>{viewModel.assistantActivityLabel}</strong>
        <small>{viewModel.assistantCountLabel}</small>
      </section>
      <nav aria-label="Coding Arena command actions" className="world-coding-actions">
        <Link href="/app/coding">Open Workspace</Link>
        <Link href="/app/coding">Choose Exercise</Link>
        <Link href="/app/projects">Linked Projects</Link>
      </nav>
    </aside>
  );
}
