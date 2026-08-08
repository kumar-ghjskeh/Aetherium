import Link from "next/link";
import React from "react";

import {
  buildAchievementHallViewModel,
  type AchievementHallOverviewData
} from "../../engine/achievement-hall-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const HALL_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "achievement-hall"
);

export function AchievementHallPanel({
  overview
}: Readonly<{
  overview: AchievementHallOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildAchievementHallViewModel(overview), [overview]);
  const nearHall = usePlayerStore((state) => {
    if (!HALL_LOCATION) {
      return false;
    }
    const [x, , z] = HALL_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 112;
  });

  if (!nearHall) {
    return null;
  }

  return (
    <aside
      aria-label="Achievement Hall real milestone overview"
      className="world-achievement-hall-panel"
    >
      <header>
        <span>Achievement Hall</span>
        <strong>{viewModel.unlockedLabel}</strong>
      </header>
      <dl className="world-achievement-hall-counts">
        <div>
          <dt>Points</dt>
          <dd>{viewModel.pointsLabel}</dd>
        </div>
        <div>
          <dt>Definitions</dt>
          <dd>{viewModel.lockedLabel}</dd>
        </div>
        <div>
          <dt>Certificates</dt>
          <dd>{viewModel.certificateLabel}</dd>
        </div>
        <div>
          <dt>Projects</dt>
          <dd>{viewModel.completedProjectLabel}</dd>
        </div>
      </dl>
      <section className="world-achievement-hall-list">
        <span>Unlocked exhibits</span>
        {viewModel.achievementExhibits.length === 0 ? (
          <p>No achievement exhibits have been earned yet.</p>
        ) : (
          <ul>
            {viewModel.achievementExhibits.slice(0, 5).map((exhibit) => (
              <li key={exhibit.id}>
                <i style={{ backgroundColor: exhibit.accent }} />
                <strong>{exhibit.title}</strong>
                <small>
                  {exhibit.categoryLabel} - {exhibit.pointsLabel} - {exhibit.unlockedLabel}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="world-achievement-hall-secondary">
        <span>Recorded displays</span>
        <strong>
          {viewModel.worldUnlockLabel}, {viewModel.completedProjectLabel}
        </strong>
        <small>
          Certificates and completed projects are shown only when matching owner-scoped records
          exist.
        </small>
      </section>
      <nav aria-label="Achievement Hall command actions" className="world-achievement-hall-actions">
        <Link href="/app/achievements">Achievements</Link>
        <Link href="/app/settings">Certificates</Link>
        <Link href="/app/projects">Projects</Link>
      </nav>
    </aside>
  );
}
