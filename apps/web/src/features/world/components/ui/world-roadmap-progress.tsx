import React from "react";

type WorldRoadmapPhaseStatus = "complete" | "next" | "remaining";

interface WorldRoadmapPhase {
  id: string;
  label: string;
  status: WorldRoadmapPhaseStatus;
}

const WORLD_ROADMAP_PHASES: WorldRoadmapPhase[] = [
  { id: "W0", label: "Visual architecture", status: "complete" },
  { id: "W1", label: "Runtime foundation", status: "complete" },
  { id: "W2", label: "Player controller", status: "complete" },
  { id: "W3", label: "Camera system", status: "complete" },
  { id: "W4", label: "Interactions", status: "complete" },
  { id: "W5", label: "World manifests", status: "complete" },
  { id: "W6", label: "Terrain foundation", status: "complete" },
  { id: "W7", label: "Central Plaza", status: "complete" },
  { id: "W8", label: "Knowledge Library", status: "complete" },
  { id: "W9", label: "AI Observatory", status: "complete" },
  { id: "W10", label: "Habit Garden", status: "complete" },
  { id: "W11", label: "Learning Academy", status: "complete" },
  { id: "W12", label: "Coding Arena", status: "complete" },
  { id: "W13", label: "Project Dock", status: "complete" },
  { id: "W14", label: "Progress Tower", status: "complete" },
  { id: "W15", label: "Achievement Hall", status: "complete" },
  { id: "W16", label: "Personal Sanctuary", status: "complete" },
  { id: "W17", label: "Navigation", status: "complete" },
  { id: "W18", label: "Atmosphere", status: "complete" },
  { id: "W19", label: "Audio", status: "next" },
  { id: "W20", label: "Command integration", status: "remaining" },
  { id: "W21", label: "Performance", status: "remaining" },
  { id: "W22", label: "Asset pipeline", status: "remaining" },
  { id: "W23", label: "Visual testing", status: "remaining" },
  { id: "W24", label: "Accessibility", status: "remaining" },
  { id: "W25", label: "Final polish", status: "remaining" }
];

export function WorldRoadmapProgress(): React.ReactElement {
  const completedCount = WORLD_ROADMAP_PHASES.filter((phase) => phase.status === "complete").length;
  const totalCount = WORLD_ROADMAP_PHASES.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const nextPhase = WORLD_ROADMAP_PHASES.find((phase) => phase.status === "next");
  const remainingCount = totalCount - completedCount;

  return (
    <aside aria-label="World Mode implementation progress" className="world-roadmap-progress">
      <header>
        <span>World Mode Build</span>
        <strong>{progressPercent}%</strong>
      </header>
      <div
        aria-label={`${completedCount} of ${totalCount} World Mode phases complete`}
        aria-valuemax={totalCount}
        aria-valuemin={0}
        aria-valuenow={completedCount}
        className="world-roadmap-progress-bar"
        role="progressbar"
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <dl>
        <div>
          <dt>Complete</dt>
          <dd>
            {completedCount}/{totalCount}
          </dd>
        </div>
        <div>
          <dt>Left</dt>
          <dd>{remainingCount}</dd>
        </div>
      </dl>
      <section>
        <span>Next phase</span>
        <strong>
          {nextPhase?.id ?? "Done"} - {nextPhase?.label ?? "Ready"}
        </strong>
      </section>
      <ol>
        {WORLD_ROADMAP_PHASES.slice(Math.max(completedCount - 3, 0), completedCount + 5).map(
          (phase) => (
            <li data-status={phase.status} key={phase.id}>
              <span>{phase.id}</span>
              <small>{phase.label}</small>
            </li>
          )
        )}
      </ol>
    </aside>
  );
}
