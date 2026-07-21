# ADR 0009: Hybrid Search Foundation Before AI Retrieval

## Status

Accepted.

## Context

Aetherium needs a global search surface before AI document Q&A and broader Command Mode domains are
implemented. The current repository has real searchable data for Personal Vault metadata,
collections, tags, and extracted file chunks. Later phases will add AI conversations, learning,
habits, projects, achievements, and vector embeddings.

## Decision

Aetherium introduces `/api/v1/search` as an authenticated, owner-scoped search API. Search uses
PostgreSQL full-text functions and GIN expression indexes where available, with a SQLite-compatible
fallback for tests. The first implementation searches only implemented data:

- Files.
- File content chunks.
- Collections.
- Tags.

The API accepts reserved entity types for future domains but does not fabricate results for tables
that do not exist yet. The response includes result type, title, snippet, match reason, open URL,
future world-location identifier, and source metadata for file chunks.

`recent_searches` stores the authenticated user's query, selected entity types, filters, and result
count. Search is a POST endpoint because recording a recent search is a write.

Semantic search is represented by the `hybrid` mode contract but `semanticEnabled` remains `false`
until a later semantic-search slice wires embedding jobs to the AI gateway with explicit consent
controls.

## Consequences

- Command Palette can search real Aetherium data without fake analytics or AI claims.
- File chunk results can later become citation candidates, but this phase does not generate AI
  answers.
- Recent searches are user-owned product data and must follow backup, deletion, and privacy rules.
- Later domains can register additional result producers without changing the frontend result shape.
