# Phase 16 - Knowledge Graph Data Foundation

## Task Boundary

Implement the non-visual knowledge graph foundation for Aetherium. This phase adds owner-scoped
graph data, approved system synchronization from existing records, API contracts, shared validation,
API-client methods, backend tests, and a simple accessible 2D Learning page panel.

This phase does not implement a 3D Knowledge Observatory, 3D graph visualization, React Three Fiber,
Three.js, world rendering, player movement, shaders, or visual world progression.

## Affected Modules

- `apps/api/alembic`: add migration `0015_knowledge_graph`.
- `apps/api/app/domain`: add knowledge node and relationship enums.
- `apps/api/app/models`: add `knowledge_nodes` and `knowledge_relationships`.
- `apps/api/app/services`: add graph synchronization and query service.
- `apps/api/app/api/v1`: expose owner-scoped `/api/v1/knowledge` routes.
- `packages/shared-types`, `packages/validation`, and `packages/api-client`: add typed contracts.
- `apps/web/src/features/learning`: add the non-visual graph summary, related-topic, and review
  panel.
- `docs`: document data, API, security, roadmap, and ADR decisions.

## Security And Privacy

- Every graph table includes `owner_user_id`.
- Source-backed graph nodes are synced only from records already owned by the authenticated user.
- Manual node creation is limited to user-created skill nodes in this phase.
- Relationship creation verifies both source and target nodes belong to the current user.
- Graph metadata stores small, approved descriptors and links, not raw private document text.
- Cross-user IDs return `not_found` or empty owner-scoped results.

## Migration Implications

Migration `0015_knowledge_graph` creates:

- `knowledge_nodes`
- `knowledge_relationships`

The migration is additive and non-destructive. It depends on `0014_coding_workspace`.

## Implementation Checklist

- [x] Add domain enums and SQLAlchemy models.
- [x] Add Alembic migration.
- [x] Add graph service with approved source sync.
- [x] Add knowledge API routes.
- [x] Add backend authorization and isolation tests.
- [x] Add shared TypeScript contracts and Zod validation.
- [x] Add API-client methods and contract tests.
- [x] Add Learning page graph panel and frontend tests.
- [x] Update architecture, product, security, testing, and roadmap documentation.
- [x] Run full validation.
- [x] Commit with `feat: add knowledge graph foundation`.

## Known Limitations

- Graph recommendations are transparent heuristics over current mastery and review dates.
- Semantic graph extraction from arbitrary document text is not implemented.
- The UI is a 2D list/table panel only; no visual graph canvas or 3D world presentation exists.
- World unlocks and visual Knowledge Observatory progression remain future phases.
