import Link from "next/link";
import React from "react";

import {
  buildLearningAcademyViewModel,
  type LearningAcademyOverviewData
} from "../../engine/learning-academy-system";
import { WORLD_LOCATIONS_MANIFEST } from "../../manifests/locations.manifest";
import { usePlayerStore } from "../../state/player-store";

const ACADEMY_LOCATION = WORLD_LOCATIONS_MANIFEST.find(
  (location) => location.id === "learning-academy"
);

export function LearningAcademyPanel({
  overview
}: Readonly<{
  overview: LearningAcademyOverviewData;
}>): React.ReactElement | null {
  const viewModel = React.useMemo(() => buildLearningAcademyViewModel(overview), [overview]);
  const nearAcademy = usePlayerStore((state) => {
    if (!ACADEMY_LOCATION) {
      return false;
    }
    const [x, , z] = ACADEMY_LOCATION.position;
    return Math.hypot(state.position[0] - x, state.position[2] - z) <= 112;
  });

  if (!nearAcademy) {
    return null;
  }

  return (
    <aside aria-label="Learning Academy real study overview" className="world-learning-panel">
      <header>
        <span>Learning Academy</span>
        <strong>{viewModel.masteryAverageLabel} mastery</strong>
      </header>
      <dl className="world-learning-metrics">
        <div>
          <dt>Subjects</dt>
          <dd>{viewModel.subjectCountLabel}</dd>
        </div>
        <div>
          <dt>Topics</dt>
          <dd>{viewModel.topicCountLabel}</dd>
        </div>
        <div>
          <dt>Lessons</dt>
          <dd>{viewModel.lessonCountLabel}</dd>
        </div>
      </dl>
      <section className="world-learning-list">
        <span>Active path</span>
        {viewModel.wings.length === 0 ? (
          <p>No subjects yet. The Academy is ready for the first learning path.</p>
        ) : (
          <ul>
            {viewModel.wings.slice(0, 4).map((wing) => (
              <li key={wing.id}>
                <strong>{wing.label}</strong>
                <small>
                  {wing.masteryLabel} - {wing.accessState}
                </small>
                <em>{wing.detail}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="world-learning-status">
        <span>Study tools</span>
        <strong>
          {viewModel.quizLabel}, {viewModel.flashcardLabel}, {viewModel.roadmapLabel}
        </strong>
        <small>
          {viewModel.activeGoalLabel}. {viewModel.prerequisitePolicyLabel}
        </small>
      </section>
      <nav aria-label="Learning Academy command actions" className="world-learning-actions">
        <Link href="/app/learning">Open Learning</Link>
        <Link href="/app/learning">Resume Lesson</Link>
        <Link href="/app/ai">Ask Mentor</Link>
      </nav>
    </aside>
  );
}
