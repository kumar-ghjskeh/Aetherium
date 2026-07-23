# ADR 0020: Knowledge Graph Data Foundation

## Status

Accepted

## Context

Aetherium needs a Knowledge Observatory later, but the approved roadmap requires a standalone,
non-visual graph foundation first. The graph must connect existing user-owned learning topics,
files, lessons, projects, questions, skills, and achievements without creating a second source of
truth or adding a 3D visualization prematurely.

## Decision

Aetherium stores graph data in owner-scoped PostgreSQL tables:

- `knowledge_nodes`
- `knowledge_relationships`

Graph nodes may represent topics, files, lessons, projects, skills, questions, and achievements.
Relationships use a controlled vocabulary: `requires`, `explains`, `references`, `practices`,
`used_in`, `related_to`, `mastered_through`, and `derived_from`.

Source-backed nodes are synchronized from approved system actions and existing owner-scoped records.
Manual creation is limited to skill nodes for this phase. The service enforces owner checks for all
source and target nodes before returning or creating relationships.

The Command Mode Learning page exposes a simple 2D graph panel with summary counts, related topics,
prerequisites-backed context, and review recommendations. Visual graph rendering and 3D Knowledge
Observatory work remain deferred.

## Consequences

- Future World Mode and Knowledge Observatory features can consume graph APIs without inventing a
  separate data model.
- The graph inherits existing authorization boundaries because every row stores `owner_user_id`.
- Graph sync can be idempotent because source-backed nodes use stable source keys and relationships
  are unique per owner, source node, target node, and relationship type.
- The first recommendation engine remains transparent and conservative rather than pretending to
  infer mastery scientifically.
- The graph does not store raw private document text, reducing accidental disclosure risk.

## Alternatives Considered

- **Use only existing learning `topic_relations`:** rejected because the graph must also connect
  files, lessons, projects, questions, achievements, and future skills.
- **Introduce a graph database:** rejected for the current slice because PostgreSQL is already the
  Aetherium source of truth and the first graph queries are bounded and owner-scoped.
- **Build a visual graph now:** rejected because the roadmap explicitly stops before visual 3D and
  does not require a canvas graph for Phase 16.
