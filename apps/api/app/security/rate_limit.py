from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from threading import Lock


@dataclass
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int


@dataclass
class _RateWindow:
    count: int
    reset_at: datetime


@dataclass
class InMemoryRateLimiter:
    namespace: str
    _windows: dict[str, _RateWindow] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def check(self, key: str, limit: int, window_seconds: int) -> RateLimitDecision:
        namespaced_key = f"{self.namespace}rate-limit:{key}"
        now = datetime.now(UTC)

        with self._lock:
            window = self._windows.get(namespaced_key)
            if window is None or window.reset_at <= now:
                self._windows[namespaced_key] = _RateWindow(
                    count=1,
                    reset_at=now + timedelta(seconds=window_seconds),
                )
                return RateLimitDecision(allowed=True, retry_after_seconds=0)

            if window.count >= limit:
                retry_after = max(1, int((window.reset_at - now).total_seconds()))
                return RateLimitDecision(allowed=False, retry_after_seconds=retry_after)

            window.count += 1
            return RateLimitDecision(allowed=True, retry_after_seconds=0)

    def reset(self) -> None:
        with self._lock:
            self._windows.clear()
