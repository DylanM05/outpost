---
id: maintenance-find-elevation
title: Find the elevation
system: Map archive
symbol: instrument
scene: work
skills: searching
reviewSkill: searching
prerequisite: find-the-snow-line
---

## Briefing

The map archive stores sorted elevation markers from the valley floor up to the ridge. Look up whether a target elevation is recorded without scanning the whole archive.

## Objective

Write `find_elevation(elevations, target)`. `elevations` is sorted in strictly ascending order. Return the index of `target`, or `-1` if it isn't present. Read at most 40 items on a 100,000-item archive.

```python
find_elevation([100, 250, 400, 620], 400)  # 2
find_elevation([100, 250, 400, 620], 300)  # -1
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Keep `low = 0` and `high = len(elevations) - 1`, halving the range each step.
2. Read `elevations[mid]` once into a variable so you don't spend two reads per step.
3. Move `low = mid + 1` when `val < target` and `high = mid - 1` when `val > target`.

## Starter

```python
```

## Checks

```python
expect("find_elevation([100, 250, 400, 620], 400)", lambda: get("find_elevation")([100, 250, 400, 620], 400), 2)
expect("find_elevation([100, 250, 400, 620], 300)", lambda: get("find_elevation")([100, 250, 400, 620], 300), -1)
```

## Hidden checks

```python
expect("empty list", lambda: get("find_elevation")([], 10), -1)
expect("first element", lambda: get("find_elevation")([5, 10, 15], 5), 0)
expect("last element", lambda: get("find_elevation")([5, 10, 15], 15), 2)
big = tracked(list(range(0, 200_000, 2)))
expect_within("find_elevation(100,000 items)", lambda: get("find_elevation")(big, 148_220), 74_110, big, 40, "Use binary search instead of scanning linearly.")
```

## Solution

```python
def find_elevation(elevations, target):
    low = 0
    high = len(elevations) - 1
    while low <= high:
        mid = (low + high) // 2
        val = elevations[mid]
        if val == target:
            return mid
        if val < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

## Restored

The archive pinpoints any elevation marker in under twenty looks.
