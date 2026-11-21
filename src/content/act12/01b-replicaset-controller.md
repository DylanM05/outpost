---
id: replicaset-controller
kind: code
title: Reconcile a ReplicaSet
system: Desired state
symbol: controller
scene: tests
skills: orchestration
---

## Briefing

Real pods aren't just an integer count — each pod has an `id`, a `status` (`"Running"`, `"Pending"`, `"Failed"`, `"Terminating"`), and a `created_at` integer timestamp. A **ReplicaSet controller** ignores `"Failed"` and `"Terminating"` pods when counting active capacity, and when scaling down it deletes `"Pending"` pods before `"Running"` ones (and newest pods first so long-lived healthy pods stay warm!).

## Objective

Write `reconcile_replicas(desired, pods)`:

- `desired` is a non-negative integer.
- `pods` is a list of dicts `{"id": str, "status": str, "created_at": int}`.
- Only pods whose `status` is `"Running"` or `"Pending"` count as active (`active`).
- If `len(active) < desired`: return `{"create": desired - len(active), "delete": []}`.
- If `len(active) > desired`: pick `len(active) - desired` active pods to delete, prioritizing:
  1. `"Pending"` before `"Running"` (don't kill already-serving pods if unstarted ones exist!)
  2. Newer `created_at` first (higher `created_at` deleted before older pods)
  3. Tie-break by `id` ascending
  Return `{"create": 0, "delete": [pod_ids_in_deletion_order]}`.
- If `len(active) == desired`: return `{"create": 0, "delete": []}`.

## Concept

Smart scale-down ordering avoids unnecessary churn: deleting a `"Pending"` pod that hasn't even started serving traffic costs zero user impact, and keeping older `"Running"` pods preserves warm caches and open connections!

## Hints

1. Filter `active = [p for p in pods if p["status"] in ("Running", "Pending")]`.
2. Sort scale-down candidates with `key=lambda p: (0 if p["status"] == "Pending" else 1, -p["created_at"], p["id"])`.

## Starter: guided

```python
def reconcile_replicas(desired, pods):
    active = [p for p in pods if p["status"] in ("Running", "Pending")]
    diff = desired - len(active)
    if diff >= 0:
        return {"create": diff, "delete": []}
    # TODO: sort active so Pending comes first, then newest created_at, then id
    # TODO: return {"create": 0, "delete": [...]}
    pass
```

## Starter: standard

```python
def reconcile_replicas(desired, pods):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
pods = [
    {"id": "p1", "status": "Running", "created_at": 10},
    {"id": "p2", "status": "Failed", "created_at": 12},
    {"id": "p3", "status": "Terminating", "created_at": 15},
]
expect("ignores Failed and Terminating when scaling up", lambda: get("reconcile_replicas")(3, pods), {"create": 2, "delete": []})

scale_pods = [
    {"id": "p-old", "status": "Running", "created_at": 1},
    {"id": "p-new", "status": "Running", "created_at": 5},
    {"id": "p-pend", "status": "Pending", "created_at": 2},
    {"id": "p-mid", "status": "Running", "created_at": 3},
]
expect(
    "scale-down deletes Pending first, then newest Running",
    lambda: get("reconcile_replicas")(2, scale_pods),
    {"create": 0, "delete": ["p-pend", "p-new"]},
)
```

## Hidden checks

```python
expect("exact match does nothing", lambda: get("reconcile_replicas")(1, [{"id": "a", "status": "Running", "created_at": 1}]), {"create": 0, "delete": []})
expect("scale to 0 deletes all active pods in order", lambda: get("reconcile_replicas")(0, [{"id": "b", "status": "Running", "created_at": 5}, {"id": "a", "status": "Running", "created_at": 5}]), {"create": 0, "delete": ["a", "b"]})
```

## Solution

```python
def reconcile_replicas(desired, pods):
    active = [p for p in pods if p["status"] in ("Running", "Pending")]
    diff = desired - len(active)
    if diff >= 0:
        return {"create": diff, "delete": []}
    ordered = sorted(
        active,
        key=lambda p: (0 if p["status"] == "Pending" else 1, -p["created_at"], p["id"]),
    )
    return {"create": 0, "delete": [p["id"] for p in ordered[:-diff]]}
```

## Restored

The ReplicaSet replaces crashed pods immediately and trims surplus capacity without killing warm serving pods unnecessarily.
