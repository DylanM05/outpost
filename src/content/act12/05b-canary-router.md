---
id: canary-router
kind: code
title: Deterministic canary traffic splitting
system: Control plane
symbol: equipment
scene: tests
skills: orchestration, distributed-systems
---

## Briefing

Before shifting 100% of traffic to a new release, teams route 10% of stations to a **canary** deployment and compare its error rate against the stable version. Routing via a deterministic hash of `station_id` ensures a station doesn't flip back and forth between v1 and v2 on every single click!

## Objective

Write two functions:

1. `route_canary(request_key, stable_target, canary_target, canary_percent)`:
   - Validate `0 <= canary_percent <= 100` (raise `ValueError` otherwise).
   - Compute deterministic bucket `0..99`:
     ```python
     bucket = int.from_bytes(hashlib.sha256(str(request_key).encode("utf-8")).digest()[:4], "big") % 100
     ```
   - Return `canary_target` if `bucket < canary_percent`, else `stable_target`.
2. `canary_decision(stable_statuses, canary_statuses, max_error_delta=0.02, min_samples=10)`:
   - Compute `5xx` error rates (`500 <= s <= 599`) for both lists.
   - If `len(canary_statuses) < min_samples`: return `"hold"` (not enough data yet!).
   - If `canary_err - stable_err > max_error_delta`: return `"rollback"`.
   - Otherwise: return `"promote"`.

## Concept

Notice the two real-world deployment guardrails:
1. **Sticky deterministic bucketing:** `canary_percent = 10` routes buckets `0..9`; raising it to `25` routes `0..24` — so every station already on the canary *stays* on the canary as you ramp up!
2. **Minimum sample gate:** `1` error out of `2` requests (`50%`) shouldn't trigger automated promotion or false alarms until `min_samples` requests have been observed.

## Hints

1. Use `bucket = int.from_bytes(hashlib.sha256(str(request_key).encode("utf-8")).digest()[:4], "big") % 100`.
2. Compute `rate(xs) = sum(1 for s in xs if 500 <= s <= 599) / len(xs)` (or `0.0` if `xs` is empty).

## Starter: guided

```python
import hashlib


def route_canary(request_key, stable_target, canary_target, canary_percent):
    if not (0 <= canary_percent <= 100):
        raise ValueError("canary_percent must be 0..100")
    bucket = int.from_bytes(hashlib.sha256(str(request_key).encode("utf-8")).digest()[:4], "big") % 100
    return canary_target if bucket < canary_percent else stable_target


def canary_decision(stable_statuses, canary_statuses, max_error_delta=0.02, min_samples=10):
    # TODO: check min_samples, compare 5xx rates against max_error_delta -> hold / rollback / promote
    pass
```

## Starter: standard

```python
import hashlib


def route_canary(request_key, stable_target, canary_target, canary_percent):
    pass


def canary_decision(stable_statuses, canary_statuses, max_error_delta=0.02, min_samples=10):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def test_sticky_monotonic_ramp():
    keys = [f"station-{i}" for i in range(500)]
    at_0 = [get("route_canary")(k, "v1", "v2", 0) for k in keys]
    at_100 = [get("route_canary")(k, "v1", "v2", 100) for k in keys]
    c10 = {k for k in keys if get("route_canary")(k, "v1", "v2", 10) == "v2"}
    c30 = {k for k in keys if get("route_canary")(k, "v1", "v2", 30) == "v2"}
    return (all(x == "v1" for x in at_0), all(x == "v2" for x in at_100), c10.issubset(c30), 25 <= len(c10) <= 85)

expect("0% all stable, 100% all canary, 10% subset of 30%", test_sticky_monotonic_ramp, (True, True, True, True))
expect("holds when below min_samples", lambda: get("canary_decision")([200] * 20, [200] * 5, min_samples=10), "hold")
expect("rolls back when canary 5xx exceeds stable + delta", lambda: get("canary_decision")([200] * 100, [200] * 90 + [500] * 10, max_error_delta=0.02), "rollback")
expect("promotes when canary error rate is within delta", lambda: get("canary_decision")([200] * 99 + [500], [200] * 98 + [500] * 2, max_error_delta=0.02), "promote")
```

## Hidden checks

```python
expect("4xx errors do not trigger rollback", lambda: get("canary_decision")([200] * 20, [404] * 20, max_error_delta=0.01), "promote")
def bad_pct():
    try:
        get("route_canary")("k", "v1", "v2", 101)
        return False
    except ValueError:
        return True
check("canary_percent > 100 raises ValueError", bad_pct)
```

## Solution

```python
import hashlib


def route_canary(request_key, stable_target, canary_target, canary_percent):
    if not (0 <= canary_percent <= 100):
        raise ValueError("canary_percent must be 0..100")
    bucket = int.from_bytes(hashlib.sha256(str(request_key).encode("utf-8")).digest()[:4], "big") % 100
    return canary_target if bucket < canary_percent else stable_target


def _err_rate(statuses):
    if not statuses:
        return 0.0
    return sum(1 for code in statuses if 500 <= code <= 599) / len(statuses)


def canary_decision(stable_statuses, canary_statuses, max_error_delta=0.02, min_samples=10):
    if len(canary_statuses) < min_samples:
        return "hold"
    if _err_rate(canary_statuses) - _err_rate(stable_statuses) > max_error_delta:
        return "rollback"
    return "promote"
```

## Restored

Canary releases ramp smoothly from 10% to 100% with sticky station bucketing and automatic rollback on `5xx` spikes.
