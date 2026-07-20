# ADR 0004: Authentication Security Foundation

## Status

Accepted

## Context

Aetherium now needs standalone password authentication without relying on another product's users,
sessions, cookies, secrets, database, or APIs. The first auth slice must support registration,
login, logout, current-user lookup, reusable authorization dependencies, and protected Command Mode
access.

## Decision

Aetherium will use product-owned email/password authentication with server-side sessions.

### Password Hashing

Passwords are hashed with Argon2id through `argon2-cffi`. Aetherium does not implement password
cryptography manually and never stores plaintext passwords.

The default password policy is:

- 12 to 128 characters.
- At least one lowercase letter.
- At least one uppercase letter.
- At least one number.
- At least one non-alphanumeric symbol.

Argon2id parameters are configurable with Aetherium-specific environment variables:

- `AETHERIUM_ARGON2_TIME_COST`
- `AETHERIUM_ARGON2_MEMORY_COST`
- `AETHERIUM_ARGON2_PARALLELISM`

### Server-Side Sessions

Login and registration create opaque, cryptographically random session tokens. Only an HMAC-SHA256
hash of the token is stored in the `sessions` table. The HMAC key comes from
`AETHERIUM_SESSION_SIGNING_SECRET`.

Sessions include creation, last-used, expiration, and revocation timestamps. Logout revokes the
current session and clears the cookie. Expired or revoked sessions are rejected.

### Cookie Security

The session cookie name is product-specific: `aetherium_session` by default. Generic names such as
`session` are rejected by configuration validation.

Session cookies are:

- HttpOnly.
- Secure in production.
- SameSite `lax` by default.
- Scoped to `/` by default.
- Configurable with an explicit domain for production deployments.
- Never stored in `localStorage` or `sessionStorage`.

### CSRF And Origin Strategy

Because the browser authenticates API requests with an HttpOnly cookie, state-changing
authentication routes validate `Origin` or `Referer` against configured Aetherium frontend origins.
Credentialed CORS is configured with explicit origins and does not allow wildcards.

A separate CSRF token is not introduced in this slice. The current deployment model uses JSON
requests, SameSite=Lax cookies, and allowed-origin validation for auth mutations. If Aetherium later
supports broader cross-site embedding, third-party integrations, or non-Lax cookie requirements,
this decision must be revisited.

### Rate Limiting

Registration and login are protected by an Aetherium-owned rate-limiter abstraction. The first
provider is process-local memory and uses the `aetherium:` namespace. A Redis provider can replace
it later without changing route contracts.

## Consequences

- Authentication remains standalone and does not reuse any other private product identity system.
- Horizontally scaled production deployments need a shared rate-limit provider before relying on
  rate limits as a strong abuse control.
- Production must provide a non-default `AETHERIUM_SESSION_SIGNING_SECRET` and secure cookie
  settings.
- Future user-owned tables should reference `users.id` as their ownership root.
