# ADR 0018: Personal Profile, Privacy, And Request Foundation

## Status

Accepted.

## Context

Phase 14 adds user profile and settings capabilities before production-grade export generation,
account deletion execution, public profile discovery, or visual Personal Home rendering exist.
Aetherium must stay standalone and must not make privacy-sensitive actions appear complete when they
are only workflow foundations.

## Decision

Aetherium will store personal profile and privacy settings as owner-scoped Aetherium records:

- `user_profiles` stores optional profile metadata and avatar selection.
- Display name remains on `users` so authentication and profile responses share one source of truth.
- Avatar file references must point to active image files owned by the authenticated user.
- `privacy_settings` stores profile-specific privacy controls.
- Global AI memory and product analytics flags remain in `user_preferences`.
- Profile links, favorite projects/resources, and certificates are metadata-only records.
- Data export and account deletion endpoints create idempotent request records and notifications,
  but do not generate archives or delete data in this phase.

## Consequences

- Future Personal Home, portfolio, and World Mode surfaces can render the same backend profile state
  without separate models.
- Privacy controls remain conservative by default and do not publish profile data.
- Export and deletion workflows are auditable without pretending destructive or downloadable work
  has already happened.
- Future production hardening must add separate implementation for export generation,
  authorization-protected downloads, deletion execution, retention windows, and backup interaction.

## Rejected Alternatives

- Store avatar binaries or generated avatar assets directly in the profile table. This would bypass
  the Personal Vault storage and ownership model.
- Duplicate AI memory and analytics flags in `privacy_settings`. That would violate the one-source
  preference model.
- Delete account data immediately from the request endpoint. That would be unsafe before retention,
  backup, confirmation, and recovery procedures are designed and tested.
