---
id: maintenance-top-n-per-group
title: Extract top-k rows per group with deterministic tie-breaking
system: Census bench
symbol: instrument
scene: tests
skills: tabular-wrangling
reviewSkill: tabular-wrangling
prerequisite: pivot-and-melt
---

## Briefing

Leaderboards and monitoring digests frequently need the top `k` highest-scoring records within each region or service group.

## Objective

Write `top_k_per_group(rows, group_col, score_col, id_col, k)` where `k >= 0` (raise `ValueError` if `k < 0`). Return `{group: [id_1, ..., id_k]}` sorted by `score_col` **descending**, breaking ties by `id_col` **ascending**.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Sort each group's rows with `key=lambda r: (-r[score_col], r[id_col])` and slice `[:k]`.

## Starter

```python
```

## Checks

```python
_ROWS = [
    {"team": "a", "id": "u2", "pts": 50},
    {"team": "a", "id": "u1", "pts": 50},
    {"team": "a", "id": "u3", "pts": 20},
    {"team": "b", "id": "u9", "pts": 10},
]
expect("returns top k IDs per group with ascending ID tie-break", lambda: get("top_k_per_group")(_ROWS, "team", "pts", "id", 2), {"a": ["u1", "u2"], "b": ["u9"]})
```

## Hidden checks

```python
expect("k=0 returns empty lists per group", lambda: get("top_k_per_group")([{"g": "x", "id": "1", "s": 5}], "g", "s", "id", 0), {"x": []})
```

## Solution

```python
def top_k_per_group(rows, group_col, score_col, id_col, k):
    if k < 0:
        raise ValueError("k must be non-negative")
    groups = {}
    for r in rows:
        groups.setdefault(r[group_col], []).append(r)
    return {
        g: [r[id_col] for r in sorted(items, key=lambda r: (-r[score_col], r[id_col]))[:k]]
        for g, items in sorted(groups.items())
    }
```

## Restored

Grouped top-k queries now rank leaders cleanly with deterministic tie-breaking.
