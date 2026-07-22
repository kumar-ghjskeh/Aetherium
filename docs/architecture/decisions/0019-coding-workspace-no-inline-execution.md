# ADR 0019: Coding Workspace Without Inline Code Execution

## Status

Accepted.

## Context

Phase 15 adds the Command Mode Coding workspace before Aetherium has a validated sandbox service.
The product roadmap requires coding practice, saved snippets, AI help, and a future code-runner
interface, but it also prohibits executing arbitrary code on the main application infrastructure.

## Decision

Aetherium will implement the Coding workspace as owner-scoped product data plus a safe runner
contract:

- `code_snippets` stores saved code and optional links to owned projects or Personal Vault files.
- `coding_exercises` stores prompts, starter code, difficulty, and optional owned topic/project
  links.
- `coding_exercise_attempts` stores submitted answers without claiming execution results.
- `code_assistant_requests` stores AI explanation/review history while AI usage records remain
  metadata-only.
- The `CodeRunner` interface exists, but the active Phase 15 provider is `UnavailableCodeRunner`.
- The API, worker, database, and web containers never execute arbitrary user code.

AI explanation and review requests use the provider-neutral AI gateway under the `coding_assistant`
feature. Project context is included only when explicitly requested and permitted by consent
controls.

## Consequences

- Users can start saving snippets, practicing exercises, and getting AI feedback without waiting for
  sandbox infrastructure.
- Future sandbox providers can implement the same `CodeRunner` boundary with resource limits,
  network restrictions, ephemeral filesystems, language allowlists, output caps, and secret
  isolation.
- Analytics can continue marking coding-session execution metrics unavailable until a real session
  source exists.
- The UI must show that code execution is unavailable and must not display a run button that implies
  execution exists.

## Rejected Alternatives

- Execute code in the FastAPI or worker container. This would expose application secrets, database
  connectivity, object-storage credentials, and shared runtime resources.
- Add a fake runner response. That would violate the product rule against false success states.
- Store coding snippets only in browser state. That would break refresh persistence, ownership
  checks, future project linking, and future World Mode presentation over the same backend data.
