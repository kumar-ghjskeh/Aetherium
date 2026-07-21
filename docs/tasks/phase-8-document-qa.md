# Phase 8 Task: Citation-Backed Document Q&A

## Scope

Implement source-grounded document question answering without starting visual World Mode.

Included:

- `/api/v1/ai/document-qa` endpoint.
- Explicit document-QA file-content consent enforcement.
- Owner-scoped active ready-chunk retrieval.
- Optional owned file and collection filters.
- Consent-scoped collection allowlist support.
- Bounded semantic reranking when stored chunk embeddings already exist.
- AI gateway answer generation.
- Citation objects linked to retrieved chunks and Library URLs.
- Invalid inline source-label stripping.
- No-evidence responses that do not call a model or fabricate citations.
- AI Hall document-QA panel with loading, error, consent, empty, and citation states.
- Backend, frontend, and API-client tests.

Excluded:

- Persistent document-QA conversations.
- Automatic mentor access to documents.
- Global semantic search.
- Worker-generated embeddings by default.
- Any visual 3D world implementation.

## Affected Modules

- `apps/api/app/services/document_qa.py`
- `apps/api/app/api/v1/ai.py`
- `apps/api/app/schemas/document_qa.py`
- `packages/shared-types`
- `packages/validation`
- `packages/api-client`
- `apps/web/src/features/ai`
- Documentation under `docs/`

## Security And Privacy

- Document Q&A requires explicit `document_qa` file-content consent.
- All retrieval queries include `owner_user_id`.
- Cross-user file IDs and collection IDs return not found.
- AI usage records store metadata only.
- The service does not log raw document chunks or prompts.
- The service never creates citations from model output.

## Migration Impact

No migration is required. The slice reuses `file_chunks`, `ai_consent_policies`, and
`ai_usage_records`.

## Acceptance Criteria

- A user can ask a question about processed Vault chunks.
- Answers include citations for retrieved chunks.
- No-evidence responses do not fabricate citations.
- File-content consent is required before source text is sent to AI.
- Optional file and collection filters are owner-scoped.
- Cross-user access is blocked.
- AI Hall exposes document Q&A without visual world graphics.
- Tests cover backend, frontend, and API-client behavior.

## Validation

Run:

- `pnpm format`
- `pnpm api:lint`
- `pnpm api:typecheck`
- `pnpm js:lint`
- `pnpm js:typecheck`
- `pnpm api:test -- apps/api/tests/test_document_qa.py`
- `pnpm --filter @aetherium/api-client test -- src/index.test.ts`
- `pnpm --filter @aetherium/web test -- src/features/ai/ai-hall-page.test.tsx`
- `pnpm run ci`

## Known Limitations

- Provider streaming is not used for document Q&A yet.
- Citation validation guarantees citation objects and source labels, not perfect claim-level proof
  for arbitrary provider prose.
- Semantic reranking only uses stored embeddings when present; ingestion still skips embedding jobs
  by default.
