# Atmosphere System

## Ownership

`DynamicWorldAtmosphere` owns World Mode sky color, background, fog, sun, ambient light, clouds,
mist, wind, and light rain. District components remain responsible only for their local materials
and bounded accent lights.

The system is presentation-only. It does not duplicate backend preferences or claim that a local
weather choice persists.

## Time

The default cycle lasts eight minutes and interpolates source-controlled light and color keyframes.
Fixed `day`, `sunset`, and `night` modes provide deterministic inspection and screenshot states.
Reduced-motion mode resolves the animated cycle to a stable daytime state while still allowing an
explicitly selected fixed time.

## Weather

Weather modes are `automatic`, `clear`, `mist`, and `rain`. Automatic selection is deterministic
from an Aetherium-owned seed and a coarse UTC time bucket. It does not use location, user content,
browser geolocation, or an external service.

Rain is a bounded point field, clouds and mist are bounded procedural meshes, and wind changes only
their local transform. Reduced motion preserves the semantic weather label but removes rain motion
and wind.

## Runtime Controls

The Atmosphere disclosure in World Mode provides a segmented time control, weather toggle, and
weather-pattern selector. All controls have native keyboard behavior and visible focus states. They
are transient for the current World Mode visit until a future reviewed backend preference is
introduced.
