import Link from "next/link";
import React from "react";

import {
  buildHabitGardenViewModel,
  type HabitGardenOverviewData
} from "../../engine/habit-garden-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const GARDEN_LOCATION = WORLD_LOCATIONS_MANIFEST.find((location) => location.id === "habit-garden");

export function HabitGardenPanel({
  overview
}: Readonly<{
  overview: HabitGardenOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildHabitGardenViewModel(overview), [overview]);
  const nearGarden = usePlayerStore((state) => {
    if (!GARDEN_LOCATION) {
      return false;
    }
    const [x, , z] = GARDEN_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 112;
  });

  if (!nearGarden) {
    return null;
  }

  return (
    <aside aria-label="Habit Garden real progress overview" className="world-habit-panel">
      <header>
        <span>Habit Garden</span>
        <strong>{viewModel.completionLabel} week</strong>
      </header>
      <dl className="world-habit-metrics">
        <div>
          <dt>Habits</dt>
          <dd>{viewModel.habitCountLabel}</dd>
        </div>
        <div>
          <dt>Best streak</dt>
          <dd>{viewModel.bestStreakLabel}</dd>
        </div>
        <div>
          <dt>Growth</dt>
          <dd>{viewModel.gardenGrowthLabel}</dd>
        </div>
      </dl>
      <section className="world-habit-plants">
        <span>Garden beds</span>
        {viewModel.plants.length === 0 ? (
          <p>No active habits yet. The garden is ready for the first bed.</p>
        ) : (
          <ul>
            {viewModel.plants.slice(0, 4).map((plant) => (
              <li key={plant.id}>
                <strong>{plant.label}</strong>
                <small>
                  {plant.stage} - {plant.health}
                </small>
                <em>{plant.detail}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="world-habit-status">
        <span>Progression</span>
        <strong>{viewModel.permanentFeatureLabel}</strong>
        <small>
          {viewModel.weeklySignalLabel}. Missed days do not erase established garden progress.
        </small>
      </section>
      <nav aria-label="Habit Garden command actions" className="world-habit-actions">
        <Link href="/app/habits">Open Habits</Link>
        <Link href="/app/habits">Log Today</Link>
        <Link href="/app/achievements">Milestones</Link>
      </nav>
    </aside>
  );
}
