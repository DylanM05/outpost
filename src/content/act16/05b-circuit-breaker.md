---
id: circuit-breaker
title: Isolate failing backends with a circuit breaker
system: Load director
symbol: controller
scene: tests
skills: traffic-engineering
---

## Briefing

When a downstream database stalls, retrying endlessly piles up waiting threads and cascades the outage across the whole outpost. A **circuit breaker** trips `OPEN` after consecutive failures, fails fast during a cooldown window, and sends a single `HALF_OPEN` probe once the cooldown expires.

## Concept

Three states: `"closed"`, `"open"`, `"half_open"`.
Parameters: `failure_threshold` (`>= 1`) and `recovery_timeout` (`> 0`).
- Starts `"closed"` with `failures = 0`.
- `state(now)`: if currently `"open"` and `now - opened_at >= recovery_timeout`, transitions to `"half_open"`! Return current state string.
- `allow_request(now)`:
  - `"closed"` -> `True`
  - `"open"` -> `False` (unless `recovery_timeout` elapsed, which transitions to `"half_open"` and allows ONE probe!)
  - `"half_open"` -> allows `True` ONLY if no probe is already in flight (`not self.probe_in_flight`); once granted, sets `self.probe_in_flight = True`, so concurrent requests wait/fail fast until the probe resolves!
- `record_success(now)`: resets to `"closed"`, `failures = 0`, `probe_in_flight = False`.
- `record_failure(now)`:
  - If currently `"half_open"`: probe failed -> immediately trip back `"open"`, `opened_at = now`, `probe_in_flight = False`.
  - If currently `"closed"`: increment `failures += 1`; if `failures >= failure_threshold`, trip `"open"` with `opened_at = now`.

## Objective

Implement `CircuitBreaker(failure_threshold=3, recovery_timeout=30.0)` with `state(now)`, `allow_request(now)`, `record_success(now)`, and `record_failure(now)`.

## Hints

1. Call a small `_check_cooldown(now)` helper at the start of `state(now)`, `allow_request(now)`, and `record_failure(now)` so expired `"open"` breakers seamlessly become `"half_open"`.
2. In `"half_open"`, only ONE call to `allow_request(now)` returns `True` until `record_success` or `record_failure` clears `probe_in_flight`.

## Starter: guided

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=30.0):
        if failure_threshold < 1 or recovery_timeout <= 0:
            raise ValueError("invalid circuit breaker parameters")
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._state = "closed"
        self.failures = 0
        self.opened_at = None
        self.probe_in_flight = False

    def _refresh(self, now):
        if self._state == "open" and now - self.opened_at >= self.recovery_timeout:
            self._state = "half_open"
            self.probe_in_flight = False

    def state(self, now):
        self._refresh(now)
        return self._state

    def allow_request(self, now):
        self._refresh(now)
        # Allow when closed; allow one probe when half_open; deny when open
        return False

    def record_success(self, now):
        pass

    def record_failure(self, now):
        pass
```

## Starter: standard

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=30.0):
        pass

    def state(self, now):
        pass

    def allow_request(self, now):
        pass

    def record_success(self, now):
        pass

    def record_failure(self, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _lifecycle():
    cb = get("CircuitBreaker")(failure_threshold=2, recovery_timeout=10.0)
    cb.record_failure(1.0)
    s1 = (cb.state(1.0), cb.allow_request(1.0))
    cb.record_failure(2.0)
    s2 = (cb.state(5.0), cb.allow_request(5.0))
    probe1 = cb.allow_request(12.0)
    probe2 = cb.allow_request(12.0)
    s3 = cb.state(12.0)
    cb.record_success(13.0)
    s4 = (cb.state(13.0), cb.allow_request(13.0))
    return (s1, s2, probe1, probe2, s3, s4)
expect("transitions closed -> open -> half_open (single probe) -> closed", _lifecycle, (
    ("closed", True),
    ("open", False),
    True,
    False,
    "half_open",
    ("closed", True),
))

def _reopen():
    cb = get("CircuitBreaker")(failure_threshold=1, recovery_timeout=10.0)
    cb.record_failure(0.0)
    p = cb.allow_request(10.0)
    cb.record_failure(11.0)
    return (p, cb.state(15.0), cb.allow_request(15.0), cb.state(21.0))
expect("failed half-open probe re-opens for another recovery timeout", _reopen, (True, "open", False, "half_open"))
```

## Hidden checks

```python
def _reset_count():
    cb = get("CircuitBreaker")(failure_threshold=3, recovery_timeout=10.0)
    cb.record_failure(1.0)
    cb.record_failure(2.0)
    cb.record_success(3.0)
    cb.record_failure(4.0)
    cb.record_failure(5.0)
    return cb.state(5.0)
expect("success resets consecutive failure counter", _reset_count, "closed")
```

## Solution

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=30.0):
        if failure_threshold < 1 or recovery_timeout <= 0:
            raise ValueError("invalid circuit breaker parameters")
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._state = "closed"
        self.failures = 0
        self.opened_at = None
        self.probe_in_flight = False

    def _refresh(self, now):
        if self._state == "open" and self.opened_at is not None and now - self.opened_at >= self.recovery_timeout:
            self._state = "half_open"
            self.probe_in_flight = False

    def state(self, now):
        self._refresh(now)
        return self._state

    def allow_request(self, now):
        self._refresh(now)
        if self._state == "closed":
            return True
        if self._state == "half_open" and not self.probe_in_flight:
            self.probe_in_flight = True
            return True
        return False

    def record_success(self, now):
        self._state = "closed"
        self.failures = 0
        self.opened_at = None
        self.probe_in_flight = False

    def record_failure(self, now):
        self._refresh(now)
        if self._state == "half_open":
            self._state = "open"
            self.opened_at = now
            self.probe_in_flight = False
            return
        if self._state == "closed":
            self.failures += 1
            if self.failures >= self.failure_threshold:
                self._state = "open"
                self.opened_at = now
```

## Restored

Failing backends now trip open cleanly, protect upstream callers, and recover via controlled single-request probes.
