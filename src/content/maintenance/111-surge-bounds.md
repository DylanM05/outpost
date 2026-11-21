---
id: maintenance-surge-bounds
title: Compute rolling-update replica bounds
system: Rollout bay
symbol: equipment
scene: tests
skills: orchestration
reviewSkill: orchestration
prerequisite: cluster-reconciler
---

## Briefing

During a rolling deployment, two safety rails keep the service alive: at least `min_available` ready pods must stay up, and total pods (old + new) must never exceed `max_total`.

## Objective

Write `rollout_bounds(desired, max_surge, max_unavailable)` where all three arguments are non-negative integers.

Return `(min_available, max_total)` where:
- `min_available = max(0, desired - max_unavailable)`
- `max_total = desired + max_surge`

Raise `ValueError` if any argument is negative, or if `desired > 0` and both `max_surge == 0` and `max_unavailable == 0` (which would deadlock any rollout!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `desired >= 0`, `max_surge >= 0`, `max_unavailable >= 0`, and guard against `desired > 0 and max_surge == 0 and max_unavailable == 0`.
2. Clamp `min_available` at `0` so `desired < max_unavailable` never yields a negative lower bound.

## Starter

```python
```

## Checks

```python
expect("standard 4-replica rollout bounds", lambda: get("rollout_bounds")(4, 1, 1), (3, 5))
expect("clamps min_available at zero", lambda: get("rollout_bounds")(2, 1, 5), (0, 3))
def _deadlock():
    try:
        get("rollout_bounds")(3, 0, 0)
        return False
    except ValueError:
        return True
expect("rejects zero surge and zero unavailable when desired > 0", _deadlock, True)
```

## Hidden checks

```python
expect("desired 0 with 0/0 is valid", lambda: get("rollout_bounds")(0, 0, 0), (0, 0))
def _neg():
    try:
        get("rollout_bounds")(3, -1, 1)
        return False
    except ValueError:
        return True
expect("negative values raise ValueError", _neg, True)
```

## Solution

```python
def rollout_bounds(desired, max_surge, max_unavailable):
    if desired < 0 or max_surge < 0 or max_unavailable < 0:
        raise ValueError("rollout parameters must be non-negative")
    if desired > 0 and max_surge == 0 and max_unavailable == 0:
        raise ValueError("max_surge and max_unavailable cannot both be zero")
    return (max(0, desired - max_unavailable), desired + max_surge)
```

## Restored

Rolling-update safety rails reject deadlocked configs and enforce exact surge and availability limits.
