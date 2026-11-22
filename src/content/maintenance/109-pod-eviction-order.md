---
id: maintenance-pod-eviction-order
title: Choose pods to evict on scale-down
system: Desired state
symbol: equipment
scene: tests
skills: orchestration
reviewSkill: orchestration
prerequisite: cluster-reconciler
---

## Briefing

When a node runs low on memory or a deployment scales down, the controller must pick the least disruptive pods to evict first.

## Objective

Write `pick_eviction_targets(pods, count)` where `pods` is a list of dicts with keys `"id"` (`str`), `"priority"` (`int`), `"ready"` (`bool`), and `"created_at"` (`int`).

Return a list of up to `count` pod `"id"` values ordered from **first to evict** to last using these tie-breakers in order:
1. Lowest `"priority"` first.
2. Unready (`ready == False`) before ready (`ready == True`).
3. Newest `"created_at"` first (largest timestamp evicted before older stable pods).
4. Lexicographically smallest `"id"` first.

If `count <= 0`, return `[]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Sort `pods` with key `lambda p: (p["priority"], p["ready"], -p["created_at"], p["id"])` (`False < True` in Python!).
2. Slice the first `max(0, count)` entries and extract `p["id"]`.

## Starter

```python
```

## Checks

```python
def _case1():
    pods = [
        {"id": "p-old", "priority": 10, "ready": True, "created_at": 100},
        {"id": "p-new", "priority": 10, "ready": True, "created_at": 200},
        {"id": "p-bad", "priority": 10, "ready": False, "created_at": 50},
        {"id": "p-low", "priority": 1, "ready": True, "created_at": 10},
    ]
    return get("pick_eviction_targets")(pods, 3)
expect("orders by priority, unready, newest", _case1, ["p-low", "p-bad", "p-new"])

def _tie():
    pods = [
        {"id": "b", "priority": 5, "ready": True, "created_at": 100},
        {"id": "a", "priority": 5, "ready": True, "created_at": 100},
    ]
    return get("pick_eviction_targets")(pods, 1)
expect("breaks full ties by id ascending", _tie, ["a"])
```

## Hidden checks

```python
expect("count <= 0 returns empty", lambda: get("pick_eviction_targets")([{"id": "a", "priority": 1, "ready": False, "created_at": 1}], 0), [])
expect("count larger than pods returns all", lambda: get("pick_eviction_targets")([{"id": "x", "priority": 1, "ready": True, "created_at": 1}], 5), ["x"])
```

## Solution

```python
def pick_eviction_targets(pods, count):
    if count <= 0:
        return []
    ordered = sorted(
        pods,
        key=lambda p: (p["priority"], p["ready"], -p["created_at"], p["id"]),
    )
    return [p["id"] for p in ordered[:count]]
```

## Restored

Scale-downs now shed low-priority and unready pods first while protecting veteran healthy replicas.
