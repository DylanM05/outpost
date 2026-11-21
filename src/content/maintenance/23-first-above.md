---
id: maintenance-first-above
title: First reading above freezing
system: Map archive
symbol: instrument
scene: work
skills: searching
reviewSkill: searching
prerequisite: find-the-snow-line
---

## Briefing

Sorted temperature logs from the ridge start below zero and climb steadily. The heater controller wants the exact index where readings first reach or exceed a cutoff.

## Objective

Write `first_at_least(values, cutoff)`. `values` is sorted non-decreasing (may contain duplicates). Return the **smallest** index `i` where `values[i] >= cutoff`, or `len(values)` if every item is below `cutoff`. The hidden test checks 100,000 readings with a budget of 40 reads.

```python
first_at_least([-10, -2, 0, 0, 4], 0)  # 2
first_at_least([-10, -2], 0)           # 2
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use half-open bounds `low = 0`, `high = len(values)` and loop `while low < high:`.
2. If `values[mid] >= cutoff`, the answer is at `mid` or to its left (`high = mid`).
3. Otherwise move `low = mid + 1`. When the loop ends, `low` is the boundary index.

## Starter

```python
```

## Checks

```python
expect("first_at_least([-10, -2, 0, 0, 4], 0)", lambda: get("first_at_least")([-10, -2, 0, 0, 4], 0), 2)
expect("first_at_least([-10, -2], 0)", lambda: get("first_at_least")([-10, -2], 0), 2)
```

## Hidden checks

```python
expect("empty list", lambda: get("first_at_least")([], 5), 0)
expect("all above cutoff", lambda: get("first_at_least")([5, 5, 10], 5), 0)
big = tracked([i // 3 for i in range(100_000)])
expect_within("first_at_least(100,000 items with duplicates)", lambda: get("first_at_least")(big, 20_000), 60_000, big, 40, "Halve the search range instead of scanning linearly.")
```

## Solution

```python
def first_at_least(values, cutoff):
    low = 0
    high = len(values)
    while low < high:
        mid = (low + high) // 2
        if values[mid] >= cutoff:
            high = mid
        else:
            low = mid + 1
    return low
```

## Restored

The heater controller snaps straight to the freezing boundary even across thousands of duplicate readings.
