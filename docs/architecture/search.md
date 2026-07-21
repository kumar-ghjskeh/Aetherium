# Search Architecture

## Current Scope

The search foundation exposes an authenticated `/api/v1/search` API and Command Palette UI over
implemented Aetherium data.

Implemented targets:

- File metadata.
- Extracted file chunks.
- Collections.
- Tags.

Reserved future targets:

- Notes.
- AI conversations.
- Learning topics.
- Projects.
- Tasks.
- Habits.
- Achievements.

Reserved targets do not return fake results before their tables exist.

## Ranking

PostgreSQL deployments use full-text search functions and GIN expression indexes over file metadata,
chunk `search_text`, collection metadata, and tag names. SQLite-backed tests use a deterministic
case-insensitive fallback.

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
generation, vector ranking, reranking, and AI retrieval are deferred until the AI gateway and
consent controls are implemented.
