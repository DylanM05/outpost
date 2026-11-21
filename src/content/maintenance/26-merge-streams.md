---
id: maintenance-merge-streams
title: Merge two sensor streams
system: Sample sorter
symbol: equipment
scene: work
skills: sorting
reviewSkill: sorting
prerequisite: loading-order
---

## Briefing

Two wind gauges each log timestamps in ascending order. Combine them into one sorted list without calling `sorted()` or `.sort()`.

## Objective

Write `merge_streams(a, b)`. Both `a` and `b` are sorted ascending. Return a single sorted list containing every item from `a` and `b` without using `sorted()` or `.sort()`. On two 1,000-item streams, make at most 2,200 comparisons.

```python
merge_streams([1, 4, 9], [2, 4, 7])  # [1, 2, 4, 4, 7, 9]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Keep two indices `i = 0` and `j = 0`, appending whichever of `a[i]` or `b[j]` is smaller.
2. When one list finishes, extend the output with the rest of the other list.

## Starter

```python
```

## Checks

```python
check("Merges by hand without sorted() or .sort()", lambda: not uses("sorted", "sort"))
expect("merge_streams([1, 4, 9], [2, 4, 7])", lambda: get("merge_streams")([1, 4, 9], [2, 4, 7]), [1, 2, 4, 4, 7, 9])
```

## Hidden checks

```python
expect("one list empty", lambda: get("merge_streams")([], [1, 2]), [1, 2])
expect("both empty", lambda: get("merge_streams")([], []), [])
left = compared(list(range(0, 2000, 2)))
right = compared(list(range(1, 2000, 2)))
expect_comparisons("merge two 1,000-item streams", lambda: get("merge_streams")(left, right), list(range(2000)), 2000, 2200, "Walk each list once with two indices.")
```

## Solution

```python
def merge_streams(a, b):
    out = []
    i = 0
    j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out
```

## Restored

Both wind logs merge in one linear pass without wasting a single comparison.
