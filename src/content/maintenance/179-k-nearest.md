---
id: maintenance-k-nearest
title: Select the k nearest 2D entities with deterministic ties
system: Spatial vault
symbol: equipment
scene: tests
skills: spatial-indexing
reviewSkill: spatial-indexing
prerequisite: quadtree-range
---

## Briefing

After broad-phase spatial indexing returns candidate neighbors, narrow-phase selection ranks them by distance and returns the `k` closest entity IDs with deterministic tie-breaking.

## Objective

Write `k_nearest(entities, query, k)` where `entities` is a list of `(entity_id, x, y)`, `query` is `(qx, qy)`, and `k >= 0` (raise `ValueError` if `k < 0`). Return the `k` closest `entity_id`s ordered by squared Euclidean distance ascending, breaking ties by `entity_id` ascending.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Sort `entities` by `key=lambda e: ((e[1] - qx) ** 2 + (e[2] - qy) ** 2, e[0])` and return `[e[0] for e in ordered[:k]]`.

## Starter

```python
```

## Checks

```python
expect("returns k closest sorted by distance then ID", lambda: get("k_nearest")([("b", 1, 0), ("a", -1, 0), ("c", 5, 0)], (0, 0), 2), ["a", "b"])
expect("k=0 returns empty list", lambda: get("k_nearest")([("a", 0, 0)], (0, 0), 0), [])
```

## Hidden checks

```python
expect("k larger than len(entities) returns all", lambda: get("k_nearest")([("z", 3, 4), ("a", 1, 1)], (0, 0), 5), ["a", "z"])
def _neg_k():
    try:
        get("k_nearest")([], (0, 0), -1)
        return False
    except ValueError:
        return True
expect("negative k raises ValueError", _neg_k, True)
```

## Solution

```python
def k_nearest(entities, query, k):
    if k < 0:
        raise ValueError("k must be non-negative")
    qx, qy = query
    ordered = sorted(entities, key=lambda e: ((e[1] - qx) ** 2 + (e[2] - qy) ** 2, e[0]))
    return [e[0] for e in ordered[:k]]
```

## Restored

Narrow-phase k-nearest neighbor ranking now breaks distance ties deterministically.
