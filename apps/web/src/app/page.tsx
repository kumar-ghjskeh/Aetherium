const foundations = [
  "FastAPI",
  "PostgreSQL",
  "Alembic",
  "Next.js",
  "Shared contracts",
  "CI"
] as const;

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen bg-[var(--surface)] text-[var(--text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Phase 1 Foundation
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">Aetherium</h1>
          </div>
          <a
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            href="/api/health"
          >
            Web health
          </a>
        </header>

        <div className="grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="max-w-2xl text-xl leading-8 text-[var(--muted)]">
              The first working layer is intentionally small: service wiring, typed contracts,
              database migrations, and validation paths before product workflows are added.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-3" aria-label="Implemented foundation areas">
            {foundations.map((foundation) => (
              <li
                className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--muted)]"
                key={foundation}
              >
                {foundation}
              </li>
            ))}
          </ul>
        </div>

        <footer className="border-t border-white/10 pt-5 text-sm text-[var(--muted)]">
          No authentication, 3D world, AI, files, or habit workflows are implemented in this slice.
        </footer>
      </section>
    </main>
  );
}
