import Link from "next/link";
import React from "react";

import {
  buildCentralPlazaViewModel,
  type CentralPlazaOverviewData
} from "../../engine/central-plaza-system";

export function CentralPlazaOverviewPanel({
  overview
}: Readonly<{
  overview: CentralPlazaOverviewData;
}>): React.ReactElement {
  const viewModel = React.useMemo(() => buildCentralPlazaViewModel(overview), [overview]);

  return (
    <aside aria-label="Central Plaza live overview" className="world-plaza-panel">
      <header>
        <span>Central Plaza</span>
        <strong>{viewModel.greeting}</strong>
      </header>
      <dl className="world-plaza-metrics">
        <div>
          <dt>Streak</dt>
          <dd>{viewModel.currentStreakLabel}</dd>
        </div>
        <div>
          <dt>Alerts</dt>
          <dd>{viewModel.unreadNotificationLabel}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{viewModel.currentTimeLabel}</dd>
        </div>
      </dl>
      <div className="world-plaza-focus">
        <span>Today</span>
        <ul>
          {viewModel.todayHabitLabels.map((habitLabel) => (
            <li key={habitLabel}>{habitLabel}</li>
          ))}
        </ul>
      </div>
      <nav aria-label="Central Plaza terminals" className="world-plaza-terminals">
        {viewModel.terminals.map((terminal) => (
          <Link href={terminal.commandRoute} key={terminal.id}>
            <span>{terminal.label}</span>
            <strong>{terminal.value}</strong>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
