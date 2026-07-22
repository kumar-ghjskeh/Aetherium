# Search Architecture

## Current Scope

The search foundation exposes an authenticated `/api/v1/search` API and Command Palette UI over
implemented Aetherium data.

Implemented targets:

- File metadata.
- Extracted file chunks.
- Collections.
- Tags.
- AI conversation titles.
- Active habit metadata.
- Learning topic metadata.
- Active project metadata.
- Active project task metadata.
- Achievement definitions and the authenticated user's unlock status.

Reserved future targets:

- Notes.

Reserved targets do not return fake results before their tables exist.

## Ranking

PostgreSQL deployments use full-text search functions and GIN expression indexes over file metadata,
chunk `search_text`, collection metadata, tag names, conversation titles, habit metadata, learning
topic metadata, project metadata, and project task metadata. Achievement search currently uses the
deterministic metadata fallback because achievement definitions are seeded application
configuration. SQLite-backed tests use the same deterministic case-insensitive fallback.

Search results are merged in the service layer and sorted by relevance or recency. Result pages are
bounded by request limits, and the API enforces owner scope in every target query.

## Result Contract

Each result includes:

- Entity type.
- Entity ID.
- Title.
- Plain-text snippet.
- Match reason.
- Score.
- Open URL.
- Future world-location identifier.
- Optional source metadata for file chunks.

Snippets are plain text and must not be rendered as trusted HTML.

## Recent Searches

`recent_searches` stores the authenticated user's query, selected entity types, filters, and result
count. Search uses `POST /api/v1/search` because recording a recent search writes user-owned data.

## Semantic Boundary

The API supports a `hybrid` mode contract, but `semanticEnabled` is currently `false`. Embedding
generation for global search and pgvector-backed result ranking remain deferred until a later
semantic-search slice wires embedding jobs to the AI gateway with explicit consent controls.

Document Q&A now has its own bounded retrieval path under `/api/v1/ai/document-qa`. It searches
owner-scoped ready chunks, can rerank bounded candidates with stored chunk embeddings when present,
and returns citations only for retrieved chunks. That implementation does not change the global
search endpoint's `semanticEnabled` flag yet.
