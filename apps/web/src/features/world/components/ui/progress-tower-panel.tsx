import Link from "next/link";
import React from "react";

import {
  buildProgressTowerViewModel,
  type ProgressTowerOverviewData
} from "../../engine/progress-tower-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const TOWER_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "progress-tower"
);

export function ProgressTowerPanel({
  overview
}: Readonly<{
  overview: ProgressTowerOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildProgressTowerViewModel(overview), [overview]);
  const nearTower = usePlayerStore((state) => {
    if (!TOWER_LOCATION) {
      return false;
    }
    const [x, , z] = TOWER_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 108;
  });

  if (!nearTower) {
    return null;
  }

  return (
    <aside
      aria-label="Progress Tower real analytics overview"
      className="world-progress-tower-panel"
    >
      <header>
        <div>
          <span>Progress Tower</span>
          <strong>{viewModel.periodLabel}</strong>
        </div>
        <small>{viewModel.periodRangeLabel}</small>
      </header>
      <section className="world-progress-tower-status">
        <strong>{viewModel.activityLabel}</strong>
        <span>{viewModel.generatedLabel}</span>
      </section>
      <dl className="world-progress-tower-counts">
        <div>
          <dt>Available</dt>
          <dd>{viewModel.availableMetricLabel}</dd>
        </div>
        <div>
          <dt>Unavailable</dt>
          <dd>{viewModel.unavailableMetricLabel}</dd>
        </div>
      </dl>
      <section className="world-progress-tower-metrics">
        <span>Stored metrics</span>
        <ul>
          {viewModel.metricSignals.slice(0, 6).map((metric) => (
            <li data-available={metric.available} key={metric.id}>
              <i style={{ backgroundColor: metric.accent }} />
              <strong>{metric.label}</strong>
              <span>{metric.valueLabel}</span>
              <small>{metric.explanation}</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="world-progress-tower-trend">
        <span>Study trend</span>
        <strong>{viewModel.studyTrendLabel}</strong>
        <small>
          World columns compare study minutes only; detailed charts remain in Command Mode.
        </small>
      </section>
      <nav aria-label="Progress Tower command actions" className="world-progress-tower-actions">
        <Link href="/app/analytics">Open Analytics</Link>
        <Link href="/app/learning">Learning</Link>
        <Link href="/app/habits">Habits</Link>
        <Link href="/app/projects">Projects</Link>
      </nav>
    </aside>
  );
}
