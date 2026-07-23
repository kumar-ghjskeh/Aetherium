# Phase W0 - Visual World Architecture

## Status

Validated for the `docs: define visual world architecture` commit.

## Boundary

Phase W0 is documentation and planning only. It selects the visual runtime architecture and creates
the implementation roadmap for future phases. It does not install 3D dependencies, render a canvas,
create a scene, add models, add textures, or change the current `/app/world` runtime behavior.

## Affected Areas

- Architecture decisions under `docs/architecture/decisions/`.
- World design and runtime documentation under `docs/world/`.
- World task roadmap under `docs/tasks/world/`.
- Existing repository status documentation.

## Security And Privacy Implications

- World Mode will run in an untrusted browser client.
- All real data must be fetched through existing authenticated APIs.
- World manifests must not contain private user data or secrets.
- AI mentor interactions must continue to respect consent and source-access controls.
- Asset sources must be licensed and recorded before commit.

## Performance Implications

- Visual dependencies remain deferred until W1.
- Runtime architecture requires route-level lazy loading, district boundaries, adaptive pixel ratio,
  tab-background pause, and progressive fallback.
- RTX 4060 Laptop GPU at 2560 x 1440 Balanced preset is the primary performance target.

## Validation Checklist

- [x] W0 ADR created.
- [x] World architecture documentation created.
- [x] Art direction documentation created.
- [x] World layout documentation created.
- [x] Performance budgets created.
- [x] Asset register template created.
- [x] Visual testing strategy created.
- [x] Complete W0-W25 roadmap created.
- [x] No visual dependencies installed.
- [x] No 3D rendering code added.
- [x] Validation suite passes.
- [ ] Phase commit pushed.
