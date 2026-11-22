---
id: maintenance-accumulator-ticks
title: Drain a fixed-timestep accumulator with a max-step spiral guard
system: Navigation core
symbol: controller
scene: tests
skills: simulation-pathfinding
reviewSkill: simulation-pathfinding
prerequisite: steering-avoidance
---

## Briefing

If a browser tab sleeps for five seconds, a naive accumulator loop can trigger a "spiral of death" trying to simulate hundreds of catch-up ticks at once. Production loops cap the number of ticks per frame and drop excess backlog when capped.

## Objective

Write `drain_accumulator(acc, delta, dt, max_steps=10)` where `dt > 0`, `delta >= 0`, `acc >= 0`, and `max_steps >= 1` (raise `ValueError` otherwise). Add `delta` to `acc`, compute how many full `dt` steps fit:
- If `total_steps <= max_steps`, return `(total_steps, acc - total_steps * dt)`.
- If `total_steps > max_steps`, clamp to `max_steps` and reset remainder to `0` (`(max_steps, 0)`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `total_steps = int((acc + delta) // dt)` (works cleanly for both integer and exact float steps!).
2. If `total_steps > max_steps`, return `(max_steps, 0)` to break any catch-up spiral.

## Starter

```python
```

## Checks

```python
expect("drains normal frame and preserves remainder", lambda: get("drain_accumulator")(5, 17, 10, max_steps=5), (2, 2))
expect("caps catch-up ticks and clears backlog", lambda: get("drain_accumulator")(0, 250, 10, max_steps=5), (5, 0))
```

## Hidden checks

```python
expect("zero steps carries full accumulator forward", lambda: get("drain_accumulator")(2, 3, 10), (0, 5))
def _bad():
    try:
        get("drain_accumulator")(0, 10, 0)
        return False
    except ValueError:
        return True
expect("non-positive dt raises ValueError", _bad, True)
```

## Solution

```python
def drain_accumulator(acc, delta, dt, max_steps=10):
    if dt <= 0 or delta < 0 or acc < 0 or max_steps < 1:
        raise ValueError("invalid accumulator arguments")
    total = acc + delta
    steps = int(total // dt)
    if steps > max_steps:
        return (max_steps, 0)
    return (steps, total - steps * dt)
```

## Restored

The accumulator loop now stays deterministic while protecting against frame-drop spirals of death.
