# ADR 0014: Learning And Mastery Engine

## Status

Accepted.

## Context

Phase 10 needs a functional learning system for subjects, topics, courses, lessons, quizzes,
flashcards, study sessions, goals, and roadmaps. The system must be useful in Command Mode now while
remaining compatible with later Research Laboratory, Knowledge Observatory, analytics, achievements,
and visual World Mode slices.

## Decision

Aetherium stores learning records as owner-scoped relational data and calculates topic mastery with
a transparent heuristic rather than time-only or opaque scoring.

The service:

- Uses `owner_user_id` on every learning table.
- Treats cross-user identifiers as `not_found`.
- Stores prerequisites as typed topic relations.
- Keeps courses, modules, and lessons separate so later guided learning can compose them safely.
- Records study sessions by mode without using elapsed time alone to raise mastery.
- Scores quiz attempts from stored questions and submitted answers.
- Records flashcard reviews with spaced-review metadata.
- Maintains one mastery record per owner/topic with calculation details that explain each signal.
- Emits idempotent `lesson.completed` and `quiz.completed` domain events.
- Writes sanitized audit logs for learning mutations.

The initial mastery heuristic combines quiz accuracy, successful recall, exercise completion,
confidence, review recency, hint usage, and a reserved project-evidence signal. Project evidence is
zero until the project-management phase creates approved project data.

## Consequences

- Users can inspect why a mastery score changed.
- Future analytics and achievements can consume learning events without reinterpreting raw records.
- Future AI mentor and document-learning features can reference the same owner-scoped learning data
  after explicit consent.
- The eventual Knowledge Observatory can use the same topic and relation tables without creating a
  separate graph store for the first version.
