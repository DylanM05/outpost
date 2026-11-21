---
id: maintenance-least-connections
title: Route to the least-busy healthy backend
system: Load director
symbol: controller
scene: tests
skills: traffic-engineering
reviewSkill: traffic-engineering
prerequisite: backoff-schedule
---

## Briefing

When request durations vary widely, round-robin can pile slow jobs onto one backend. Pick the healthy backend with the fewest active connections!

## Objective

Write `pick_least_busy(backends)` where `backends` is a list of dicts `{"name": str, "active": int, "healthy": bool}`.

Return the `"name"` of the healthy backend with the lowest `"active"` count, breaking ties by `"name"` ascending. Return `None` if no backends are healthy.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter `[b for b in backends if b["healthy"]]`.
2. Return `min(healthy, key=lambda b: (b["active"], b["name"]))["name"]` (or `None` if empty).

## Starter

```python
```

## Checks

```python
expect("picks healthy backend with fewest active requests", lambda: get("pick_least_busy")([
    {"name": "b1", "active": 5, "healthy": True},
    {"name": "b2", "active": 0, "healthy": False},
    {"name": "b3", "active": 2, "healthy": True},
]), "b3")
expect("breaks equal-load ties by name ascending", lambda: get("pick_least_busy")([
    {"name": "node-b", "active": 3, "healthy": True},
    {"name": "node-a", "active": 3, "healthy": True},
]), "node-a")
```

## Hidden checks

```python
expect("returns None when all backends are unhealthy", lambda: get("pick_least_busy")([{"name": "b1", "active": 0, "healthy": False}]), None)
expect("returns None on empty list", lambda: get("pick_least_busy")([]), None)
```

## Solution

```python
def pick_least_busy(backends):
    healthy = [b for b in backends if b["healthy"]]
    if not healthy:
        return None
    return min(healthy, key=lambda b: (b["active"], b["name"]))["name"]
```

## Restored

Slow workloads balance smoothly toward whichever healthy server has the lightest queue.
