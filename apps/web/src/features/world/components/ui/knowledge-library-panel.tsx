import Link from "next/link";
import React from "react";

import {
  buildKnowledgeLibraryViewModel,
  type KnowledgeLibraryOverviewData
} from "../../engine/knowledge-library-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const LIBRARY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "knowledge-library"
);

export function KnowledgeLibraryPanel({
  overview
}: Readonly<{
  overview: KnowledgeLibraryOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildKnowledgeLibraryViewModel(overview), [overview]);
  const nearLibrary = usePlayerStore((state) => {
    if (!LIBRARY_LOCATION) {
      return false;
    }
    const [x, , z] = LIBRARY_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 105;
  });

  if (!nearLibrary) {
    return null;
  }

  return (
    <aside aria-label="Knowledge Library live vault overview" className="world-library-panel">
      <header>
        <span>Knowledge Library</span>
        <strong>{viewModel.totalFilesLabel}</strong>
      </header>
      <dl className="world-library-metrics">
        <div>
          <dt>Ready</dt>
          <dd>{viewModel.readyCountLabel}</dd>
        </div>
        <div>
          <dt>Favorites</dt>
          <dd>{viewModel.favoriteCountLabel}</dd>
        </div>
        <div>
          <dt>Collections</dt>
          <dd>{viewModel.collectionCountLabel}</dd>
        </div>
      </dl>
      <section className="world-library-focus">
        <span>Featured</span>
        {viewModel.featuredFiles.length === 0 ? (
          <p>No files in the Personal Vault yet.</p>
        ) : (
          <ul>
            {viewModel.featuredFiles.slice(0, 4).map((file) => (
              <li key={file.id}>
                <strong>{file.label}</strong>
                <small>{file.detail}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="world-library-tags">
        <span>Tags</span>
        <div>
          {viewModel.tagLabels.map((tag) => (
            <small key={tag}>{tag}</small>
          ))}
        </div>
      </section>
      <nav aria-label="Knowledge Library command actions" className="world-library-actions">
        <Link href="/app/library">Browse Vault</Link>
        <Link href="/app/library">Search Files</Link>
        <Link href="/app/ai">Ask AI</Link>
      </nav>
    </aside>
  );
}
