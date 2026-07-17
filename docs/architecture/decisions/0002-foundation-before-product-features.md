# ADR 0002: Build Foundation Before Product Features

## Status

Accepted

## Context

Phase 1 contains many user-facing requirements, but the current request explicitly limits the first
implementation sequence to infrastructure, app scaffolds, shared contracts, health endpoints, and
CI.

## Decision

Implement only the foundation slice. Authentication, 3D world behavior, file ingestion, AI, habits,
learning, projects, and achievements are deferred.

## Consequences

- CI and local development paths are established first.
- Future slices can add product behavior behind tested boundaries.
- The current UI and API must not claim that product workflows are complete.
