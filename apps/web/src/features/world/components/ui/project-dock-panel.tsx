import Link from "next/link";
import React from "react";

import {
  buildProjectDockViewModel,
  type ProjectDockOverviewData
} from "../../engine/project-dock-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const DOCK_LOCATION = WORLD_LOCATIONS_MANIFEST.find((location) => location.id === "project-dock");

export function ProjectDockPanel({
  overview
}: Readonly<{
  overview: ProjectDockOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildProjectDockViewModel(overview), [overview]);
  const nearDock = usePlayerStore((state) => {
    if (!DOCK_LOCATION) {
      return false;
    }
    const [x, , z] = DOCK_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 112;
  });

  if (!nearDock) {
    return null;
  }

  return (
    <aside aria-label="Project Dock real project overview" className="world-project-dock-panel">
      <header>
        <span>Project Dock</span>
        <strong>{viewModel.projectCountLabel}</strong>
      </header>
      <section className="world-project-dock-featured">
        <span>Featured build</span>
        <strong>{viewModel.featuredProjectLabel}</strong>
        <small>{viewModel.featuredProgressLabel}</small>
      </section>
      <dl className="world-project-dock-metrics">
        <div>
          <dt>Milestones</dt>
          <dd>{viewModel.milestoneLabel}</dd>
        </div>
        <div>
          <dt>Tasks</dt>
          <dd>{viewModel.taskLabel}</dd>
        </div>
        <div>
          <dt>Blockers</dt>
          <dd>{viewModel.openBlockerLabel}</dd>
        </div>
      </dl>
      <section className="world-project-dock-list">
        <span>Construction berths</span>
        {viewModel.projectBerths.length === 0 ? (
          <p>No projects yet. The first berth is ready for a new build.</p>
        ) : (
          <ul>
            {viewModel.projectBerths.slice(0, 4).map((berth) => (
              <li key={berth.id}>
                <i style={{ backgroundColor: berth.accent }} />
                <strong>{berth.name}</strong>
                <small>
                  {berth.statusLabel} - {berth.evidenceLabel}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
      {viewModel.blockerSignals.length > 0 ? (
        <section className="world-project-dock-blockers">
          <span>Open blockers</span>
          <ul>
            {viewModel.blockerSignals.map((blocker) => (
              <li key={blocker.id}>{blocker.title}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="world-project-dock-context">
        <span>Project context</span>
        <strong>
          {viewModel.linkedFileLabel}, {viewModel.technologyLabel}
        </strong>
        <small>
          {viewModel.technologies.length > 0
            ? viewModel.technologies.join(", ")
            : "No technologies linked yet"}
          {` - ${viewModel.activityLabel}`}
        </small>
      </section>
      <nav aria-label="Project Dock command actions" className="world-project-dock-actions">
        <Link href="/app/projects">Open Projects</Link>
        <Link href="/app/projects">Review Work</Link>
        <Link href="/app/ai">Open AI Hall</Link>
      </nav>
    </aside>
  );
}
