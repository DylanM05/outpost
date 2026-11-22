---
id: maintenance-vc-dominant
title: Prune obsolete vector-clock siblings
system: Quorum vault
symbol: equipment
scene: tests
skills: distributed-systems
reviewSkill: distributed-systems
prerequisite: vector-clocks
---

## Briefing

During read repair, replicas return several `(vector_clock, value)` versions of a key. Any version causally superseded by a newer one can be discarded, while truly concurrent siblings must both survive.

## Objective

Write `prune_obsolete(versions)` where `versions` is a list of `(clock, value)` tuples and each `clock` is a `dict[str, int]` (missing node keys default to `0`).

A clock `a` is strictly before `b` if `a.get(k, 0) <= b.get(k, 0)` for every node `k` in `a` or `b`, and strictly less for at least one `k`.

Return a list containing only the `(clock, value)` entries that are **not** strictly before any other entry in `versions`, preserving their original order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Write a helper `is_before(a, b)` over `keys = set(a) | set(b)`.
2. Keep entry `i` iff `not any(is_before(clock_i, clock_j) for j, (clock_j, _) in enumerate(versions) if j != i)`.

## Starter

```python
```

## Checks

```python
expect(
    "drops causally superseded ancestor",
    lambda: get("prune_obsolete")([({"a": 1}, "v1"), ({"a": 2, "b": 1}, "v2")]),
    [({"a": 2, "b": 1}, "v2")],
)
expect(
    "keeps concurrent siblings",
    lambda: get("prune_obsolete")([({"a": 2, "b": 0}, "left"), ({"a": 1, "b": 1}, "right")]),
    [({"a": 2, "b": 0}, "left"), ({"a": 1, "b": 1}, "right")],
)
```

## Hidden checks

```python
expect(
    "drops ancestor while preserving two concurrent descendants",
    lambda: get("prune_obsolete")([
        ({"a": 1}, "root"),
        ({"a": 2}, "branch1"),
        ({"a": 1, "b": 1}, "branch2"),
    ]),
    [({"a": 2}, "branch1"), ({"a": 1, "b": 1}, "branch2")],
)
expect("empty list returns empty", lambda: get("prune_obsolete")([]), [])
```

## Solution

```python
def _is_before(a, b):
    keys = set(a) | set(b)
    strictly_less = False
    for k in keys:
        va = a.get(k, 0)
        vb = b.get(k, 0)
        if va > vb:
            return False
        if va < vb:
            strictly_less = True
    return strictly_less


def prune_obsolete(versions):
    kept = []
    for i, (clock_i, val_i) in enumerate(versions):
        dominated = any(
            _is_before(clock_i, clock_j)
            for j, (clock_j, _) in enumerate(versions)
            if j != i
        )
        if not dominated:
            kept.append((clock_i, val_i))
    return kept
```

## Restored

Read repair drops causally superseded ancestors while preserving genuinely concurrent siblings.
