# Roadmap

## Phase 0 - Product And Architecture

Status: baseline documented in this repository.

- Product requirements.
- System overview.
- Data model plan.
- API plan.
- World engine plan.
- AI gateway and retrieval plan.
- Threat model.
- Testing strategy.
- ADRs for assumptions.

## Phase 1 - Vertical-Slice MVP

Current approved slice:

- Docker development infrastructure.
- FastAPI scaffold.
- PostgreSQL connection and Alembic.
- Next.js scaffold.
- Shared validation and API types.
- Health endpoints.
- CI validation.
- Standalone password authentication and server-side sessions.
- User-owned data foundation for preferences, non-visual world state, domain events, notifications,
  audit logs, ownership checks, and pagination.
- Command Mode app shell with protected `/app` routes, responsive sidebar and mobile navigation,
  command palette, notifications panel, profile menu, settings integration, and a non-visual future
  World Mode route.
- Personal Vault file storage with user-owned metadata, presigned uploads/downloads, collections,
  tags, favorites, deletion state, and a Library UI.
- Async file processing with durable jobs, worker processing, extraction results, chunks, failure
  visibility, retries, and owner-scoped chunk/job APIs.
- Global search over files, extracted chunks, collections, tags, AI conversations, habits, learning
  topics, projects, and project tasks with recent searches and Command Palette integration.
- Provider-neutral AI gateway foundation with consent policies, model configurations, usage records,
  deterministic test/local adapter, external provider adapter boundaries, rate limits, retries, and
  fallback support.
- AI mentors and conversations with fictional default mentors, custom mentor creation, owner-scoped
  conversation history, memory controls, exports, edit/resend, regeneration, AI Hall UI, and
  conversation search.
- Citation-backed document Q&A with explicit AI file-content consent, owner-scoped ready-chunk
  retrieval, source-label validation, no-evidence responses, and AI Hall document workflow.
- Habit tracking with owner-scoped habits, schedules, targets, logs, streaks, daily check-ins,
  weekly reviews, summary metrics, non-visual Habit Garden progress signals, global search, and the
  Command Mode Habits UI.
- Learning and mastery engine with owner-scoped subjects, topics, prerequisites, courses, modules,
  lessons, study sessions, quizzes, questions, attempts, flashcards, reviews, mastery records,
  learning goals, study roadmaps, global search, and the Command Mode Learning UI.
- Project Dock foundation with owner-scoped projects, milestones, project tasks, notes, links, file
  links, topic links, technologies, blockers, activity history, completion events, global search,
  and the Command Mode Projects UI.
- Progress analytics with owner-scoped summary metrics, weekly/monthly/quarterly/yearly trend
  buckets, accessible Command Mode charts, unavailable metric flags for unsupported signals, and no
  fabricated activity.
- Achievement progression foundation with seeded definitions, idempotent domain-event processing,
  user achievements, progress counters, reward definitions, future world-unlock records, global
  search, and the Command Mode Achievements UI.
- Personal profile and settings with owner-scoped profile metadata, avatar preset or owned
  vault-image references, profile links, favorite projects/resources, certificates, privacy
  controls, data-export request records, account deletion request records, and the Command Mode
  Settings UI.
- Coding workspace foundation with owner-scoped snippets, exercises, submitted attempts, AI
  explain/review requests, Monaco editor UI, project/file linking, and an unavailable code-runner
  contract that prevents arbitrary execution in Aetherium service containers.

Later Phase 1 slices:

- Non-visual world data expansion only until the visual 3D phase is explicitly started.

## Phase 2 - Learning System

Status: implemented as the non-visual Phase 10 learning-engine vertical slice.

- Subjects and topics.
- Courses, modules, lessons.
- Quizzes and flashcards.
- Study sessions.
- Transparent mastery heuristic.
- Research Laboratory and Knowledge Observatory remain future UI/world presentations over the same
  owner-scoped data.

## Phase 3 - AI Mentor Expansion

- Multiple mentors.
- Custom mentor creation.
- Provider selection.
- Voice behind feature flags.
- Study plans and quiz generation.
- Memory controls.
- Cost and token dashboard.

## Phase 4 - Projects And Coding

Project status: implemented as the non-visual Phase 11 Project Dock foundation.

- Project Workshop records.
- Milestones and project tasks.
- Git links.
- Project notes, resources, technologies, blockers, and activity history.
- Project-specific AI context remains future explicit-consent behavior.

Coding status: implemented as the non-visual Phase 15 Coding workspace foundation.

- Code editor.
- Saved snippets, project/file linking, exercises, and submitted attempts.
- AI code explanation and review through the provider-neutral AI gateway.
- CodeRunner abstraction with an unavailable provider until a separately isolated sandbox exists.
- Programming Tower remains a future World Mode presentation over these records.

## Phase 5 - World Progression

- Domain event processing: implemented for non-visual achievements.
- Achievements: implemented as non-visual progression records.
- World unlocks: implemented as future identifier records only.
- Building evolution.
- Achievement Hall.
- Personal Home customization. Profile metadata exists as a non-visual foundation.

## Phase 6 - Production Hardening

- Security review.
- Accessibility audit.
- Load testing.
- Performance optimization.
- Backup and recovery testing.
- Monitoring and deployment pipelines.
- Account deletion and data export execution workflows. Privacy controls and request records exist.
