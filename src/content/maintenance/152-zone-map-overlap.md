---
id: maintenance-zone-map-overlap
title: Test inclusive zone-map interval overlap
system: Column vault
symbol: equipment
scene: tests
skills: analytical-storage
reviewSkill: analytical-storage
prerequisite: reservoir-sample
---

## Briefing

Range queries (`BETWEEN q_lo AND q_hi`) prune columnar row groups by checking whether a row group's `[rg_min, rg_max]` overlaps `[q_lo, q_hi]`.

## Objective

Write `intervals_overlap(a_min, a_max, b_min, b_max)` returning `True` iff the two closed intervals `[a_min, a_max]` and `[b_min, b_max]` share at least one point.

Raise `ValueError` if `a_min > a_max` or `b_min > b_max`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `a_min <= a_max` and `b_min <= b_max`.
2. Two closed intervals overlap iff `a_min <= b_max and b_min <= a_max`.

## Starter

```python
```

## Checks

```python
expect("overlapping and touching intervals return True", lambda: (get("intervals_overlap")(10, 20, 15, 30), get("intervals_overlap")(10, 20, 20, 25)), (True, True))
expect("disjoint intervals return False", lambda: (get("intervals_overlap")(10, 20, 21, 30), get("intervals_overlap")(30, 40, 10, 20)), (False, False))
```

## Hidden checks

```python
expect("contained single-point interval overlaps", lambda: get("intervals_overlap")(10, 20, 15, 15), True)
def _bad():
    try:
        get("intervals_overlap")(20, 10, 15, 25)
        return False
    except ValueError:
        return True
expect("inverted interval raises ValueError", _bad, True)
```

## Solution

```python
def intervals_overlap(a_min, a_max, b_min, b_max):
    if a_min > a_max or b_min > b_max:
        raise ValueError("interval min cannot exceed max")
    return a_min <= b_max and b_min <= a_max
```

## Restored

Zone-map interval overlap checks catch touching boundaries and reject malformed inverted ranges.
