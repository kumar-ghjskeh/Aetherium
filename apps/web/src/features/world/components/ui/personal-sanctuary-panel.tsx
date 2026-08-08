import Link from "next/link";
import React from "react";

import {
  buildPersonalSanctuaryViewModel,
  type PersonalSanctuaryOverviewData
} from "../../engine/personal-sanctuary-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const SANCTUARY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "personal-sanctuary"
);

export function PersonalSanctuaryPanel({
  overview
}: Readonly<{
  overview: PersonalSanctuaryOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildPersonalSanctuaryViewModel(overview), [overview]);
  const nearSanctuary = usePlayerStore((state) => {
    if (!SANCTUARY_LOCATION) {
      return false;
    }
    const [x, , z] = SANCTUARY_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 112;
  });

  if (!nearSanctuary) {
    return null;
  }

  return (
    <aside
      aria-label="Personal Sanctuary profile and settings overview"
      className="world-sanctuary-panel"
    >
      <header>
        <span>Personal Sanctuary</span>
        <strong>{viewModel.displayName}</strong>
        <small>{viewModel.headline}</small>
      </header>
      <dl className="world-sanctuary-counts">
        <div>
          <dt>Avatar</dt>
          <dd>{viewModel.avatar.label}</dd>
        </div>
        <div>
          <dt>Projects</dt>
          <dd>{viewModel.favoriteProjectLabel}</dd>
        </div>
        <div>
          <dt>Resources</dt>
          <dd>{viewModel.favoriteResourceLabel}</dd>
        </div>
        <div>
          <dt>Certificates</dt>
          <dd>{viewModel.certificateLabel}</dd>
        </div>
      </dl>
      <section className="world-sanctuary-statuses">
        <span>Privacy controls</span>
        <ul>
          {viewModel.privacyStatuses.map((status) => (
            <li key={status.label}>
              <i data-enabled={status.enabled} />
              <span>{status.label}</span>
              <strong>{status.value}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section className="world-sanctuary-featured">
        <span>Featured records</span>
        {viewModel.favoriteProjects.length === 0 &&
        viewModel.favoriteResources.length === 0 &&
        viewModel.links.length === 0 ? (
          <p>No favorite projects, resources, or profile links are saved yet.</p>
        ) : (
          <ul>
            {[...viewModel.favoriteProjects, ...viewModel.favoriteResources, ...viewModel.links]
              .slice(0, 4)
              .map((record) => (
                <li key={record.id}>
                  <strong>{record.label}</strong>
                  <small>{record.meta}</small>
                </li>
              ))}
          </ul>
        )}
      </section>
      <nav aria-label="Personal Sanctuary command actions" className="world-sanctuary-actions">
        <Link href="/app/settings">Profile &amp; privacy</Link>
        <Link href="/app/projects">Favorite projects</Link>
        <Link href="/app/library">Favorite resources</Link>
      </nav>
    </aside>
  );
}
