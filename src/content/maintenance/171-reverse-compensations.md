---
id: maintenance-reverse-compensations
title: Plan reverse Saga compensation steps
system: Saga rail
symbol: controller
scene: tests
skills: event-sourcing
reviewSkill: event-sourcing
prerequisite: saga-orchestrator
---

## Briefing

Before triggering a Saga rollback at step `failed_index`, build the exact list of compensating actions to execute: every completed step strictly before `failed_index` that defines a compensation name, in reverse order!

## Objective

Write `compensation_plan(steps, failed_index)` where `steps` is a list of `(step_name, undo_name_or_None)` tuples and `0 <= failed_index < len(steps)` (raise `ValueError` if out of range).

Return the list of non-`None` `undo_name` strings for steps at indices `0 .. failed_index - 1`, in **reverse** order (`failed_index - 1` down to `0`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Slice `steps[:failed_index]`, reverse it, and keep `[undo for _, undo in reversed(steps[:failed_index]) if undo is not None]`.

## Starter

```python
```

## Checks

```python
expect(
    "returns non-None undo actions before failed_index in reverse order",
    lambda: get("compensation_plan")([("auth", None), ("reserve", "release"), ("charge", "refund"), ("ship", "cancel")], 3),
    ["refund", "release"],
)
expect("failure at index 0 requires no compensations", lambda: get("compensation_plan")([("reserve", "release")], 0), [])
```

## Hidden checks

```python
def _oob():
    try:
        get("compensation_plan")([("a", "u")], 1)
        return False
    except ValueError:
        return True
expect("out-of-range failed_index raises ValueError", _oob, True)
```

## Solution

```python
def compensation_plan(steps, failed_index):
    if failed_index < 0 or failed_index >= len(steps):
        raise ValueError("failed_index out of range")
    return [undo for _, undo in reversed(steps[:failed_index]) if undo is not None]
```

## Restored

Saga rollback plans unwind only completed side-effecting steps in strict reverse order.
