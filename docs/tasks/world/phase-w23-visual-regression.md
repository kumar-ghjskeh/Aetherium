# W23 Automated Visual Regression

## Boundary

W23 adds repeatable browser evidence for the existing visual World Mode. It does not add district
art or change product data. The suite runs the real FastAPI application against a disposable SQLite
database because Docker is not required for browser rendering checks.

## Implementation

- Start isolated FastAPI and Next.js development servers from Playwright.
- Register a normal test user and retain the real `aetherium_session` cookie.
- Unlock all source-controlled destinations only in the test-process API host.
- Capture all ten districts, fixed day/sunset/night states, Low/Balanced presets, reduced motion,
  unsupported WebGL2, and a deliberate data-loading failure.
- Reject blank canvases using decoded PNG pixel statistics.
- Fail on browser errors, page errors, failed Aetherium requests, or server responses at 500+.
- Record runtime metrics at 1080p Low, 1080p Balanced, and 1440p Balanced.
- Keep generated reports, traces, videos, and authentication state under ignored `artifacts/`.

## Security

`apps/api/visual_test_server.py` is not imported by the production API and exposes its unlock hook
only in the disposable test process. The hook requires both a valid authenticated session and a
test-only header. It stores no private or production data.

## Validation

- `pnpm world:check`
- `pnpm world:visual:update`
- `pnpm world:visual:test`
- `pnpm ci`
- Alembic upgrade SQL generation

## Completion Evidence

- Headed Chromium: 19/19 browser scenarios passed.
- Headless Chromium: 19/19 browser scenarios passed.
- Web unit and component suite: 52 files and 194 tests passed.
- The suite maintains separate headed and headless baselines so renderer differences do not hide
  regressions.
- Performance artifacts are written to `artifacts/playwright/world-performance-headed.json` and
  `artifacts/playwright/world-performance-headless.json`.
- Latest headed Chromium evidence:
  - 1080p Low: 60 FPS, 16.6 ms, 142 draw calls, 58,044 triangles.
  - 1080p Balanced: 44 FPS, 22.5 ms, 177 draw calls, 58,916 triangles.
  - 1440p Balanced: 60 FPS, 16.6 ms, 177 draw calls, 58,916 triangles.
- Latest headless software-renderer evidence:
  - 1080p Low: 48 FPS, 20.7 ms, 142 draw calls, 58,044 triangles.
  - 1080p Balanced: 39 FPS, 25.6 ms, 177 draw calls, 58,916 triangles.
  - 1440p Balanced: 33 FPS, 30.7 ms, 177 draw calls, 58,916 triangles.

These metrics are local browser regression evidence. The headed run uses the machine's available
browser graphics path; the headless run uses SwiftShader. Final W25 validation must still record the
browser renderer and confirm that the headed result is using the intended RTX 4060 before it is
treated as hardware qualification.
