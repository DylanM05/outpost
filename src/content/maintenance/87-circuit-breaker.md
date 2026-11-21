---
id: maintenance-circuit-breaker
title: Consecutive-failure circuit breaker
system: Backup vault
symbol: equipment
scene: tests
skills: reliability
reviewSkill: reliability
prerequisite: retention-policy
---

## Briefing

When a downstream relay goes dead, hammering it with thousands of timeouts drags down the whole outpost. A **circuit breaker** trips open after `threshold` consecutive failures so callers fail fast.

## Objective

Write a class `CircuitBreaker`:

- `__init__(self, threshold)` stores `threshold` (integer `>= 1`), starts with `failures = 0` and `is_open = False`.
- `record_failure(self)` increments `self.failures`; if `self.failures >= self.threshold`, sets `self.is_open = True`.
- `record_success(self)` resets `self.failures = 0` and sets `self.is_open = False`.
- `allow_request(self)` returns `not self.is_open`.

```python
cb = CircuitBreaker(3)
cb.record_failure(); cb.record_failure()
cb.allow_request()  # True
cb.record_failure()
cb.allow_request()  # False
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Keep `self.threshold`, `self.failures = 0`, and `self.is_open = False` as attributes.
2. A single `record_success()` resets the consecutive failure counter to `0` and closes the circuit.

## Starter

```python
```

## Checks

```python
CB = get("CircuitBreaker")
def trip_and_recover():
    cb = CB(3)
    cb.record_failure()
    cb.record_failure()
    before = cb.allow_request()
    cb.record_failure()
    after = cb.allow_request()
    cb.record_success()
    recovered = (cb.allow_request(), cb.failures)
    return (before, after, recovered)
expect("trips at 3 failures and resets on success", trip_and_recover, (True, False, (True, 0)))
```

## Hidden checks

```python
CB = get("CircuitBreaker")
def non_consecutive():
    cb = CB(2)
    cb.record_failure()
    cb.record_success()
    cb.record_failure()
    return cb.allow_request()
expect("interleaved success resets consecutive failure count", non_consecutive, True)
```

## Solution

```python
class CircuitBreaker:
    def __init__(self, threshold):
        self.threshold = threshold
        self.failures = 0
        self.is_open = False

    def record_failure(self):
        self.failures += 1
        if self.failures >= self.threshold:
            self.is_open = True

    def record_success(self):
        self.failures = 0
        self.is_open = False

    def allow_request(self):
        return not self.is_open
```

## Restored

Repeated downstream failures now trip the breaker immediately instead of piling up timeouts across the grid.
