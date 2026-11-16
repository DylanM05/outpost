---
id: maintenance-busiest-window
title: Find the busiest stretch
system: Sensor mast
symbol: instrument
scene: tests
skills: lists
reviewSkill: lists
prerequisite: find-the-jumps
---

## Briefing

The wind counter logs gusts each hour. The planners want the busiest stretch: the most gusts in any run of consecutive hours of a given length.

## Objective

Write `busiest(counts, hours)`. Return the largest total of any `hours` consecutive counts. `counts` always has at least `hours` items, and `hours` is at least 1.

```python
busiest([2, 9, 1, 7, 7, 0], 2)  # 14, from 7 and 7
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. A stretch starting at position `i` is the slice `counts[i:i + hours]`.
2. The last stretch starts at position `len(counts) - hours`, so loop with `range(len(counts) - hours + 1)`.
3. Keep the biggest total seen so far, starting from the first stretch's total.

## Starter

```python
```

## Checks

```python
expect("busiest([2, 9, 1, 7, 7, 0], 2)", lambda: get("busiest")([2, 9, 1, 7, 7, 0], 2), 14)
expect("busiest([4, 1, 1, 4], 3)", lambda: get("busiest")([4, 1, 1, 4], 3), 6)
```

## Hidden checks

```python
expect("busiest([5], 1)", lambda: get("busiest")([5], 1), 5)
expect("busiest([1, 2, 3], 3)", lambda: get("busiest")([1, 2, 3], 3), 6, "The whole list is one stretch.")
expect("busiest([9, 0, 0, 0], 2)", lambda: get("busiest")([9, 0, 0, 0], 2), 9, "The first stretch counts too.")
expect("busiest([0, 0, 0, 8], 1)", lambda: get("busiest")([0, 0, 0, 8], 1), 8, "The last stretch counts too.")
```

## Solution

```python
def busiest(counts, hours):
    best = sum(counts[0:hours])
    for i in range(1, len(counts) - hours + 1):
        best = max(best, sum(counts[i:i + hours]))
    return best
```

## Restored

The busiest stretch goes on the planners' board, and the drones stay grounded through it.
