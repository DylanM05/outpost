---
id: maintenance-find-peak
title: Find the ridge peak
system: Map archive
symbol: instrument
scene: work
skills: searching
reviewSkill: searching
prerequisite: find-the-snow-line
---

## Briefing

A drone flies straight up one side of a ridge and down the other, logging heights that strictly climb to a single peak and then strictly fall. Find the peak's index without reading every measurement.

## Objective

Write `find_peak(heights)`. `heights` has at least 3 numbers that strictly increase to one maximum and then strictly decrease. Return the index of that peak. The hidden test uses 50,000 readings with a budget of 60 reads.

```python
find_peak([10, 35, 80, 60, 20])  # 2
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Compare `heights[mid]` with `heights[mid + 1]`.
2. If `heights[mid] < heights[mid + 1]`, you are still climbing — the peak is strictly to the right (`low = mid + 1`).
3. Otherwise you are on or past the peak (`high = mid`).

## Starter

```python
```

## Checks

```python
expect("find_peak([10, 35, 80, 60, 20])", lambda: get("find_peak")([10, 35, 80, 60, 20]), 2)
expect("find_peak([1, 5, 2])", lambda: get("find_peak")([1, 5, 2]), 1)
```

## Hidden checks

```python
peak_pos = 37_412
plain = list(range(peak_pos)) + list(range(peak_pos, 50_000 - peak_pos - 1, -1))
# Build clean strictly increasing then strictly decreasing 50,000-element ridge
plain = list(range(peak_pos)) + [peak_pos] + [peak_pos - i for i in range(1, 50_000 - peak_pos)]
ridge = tracked(plain)
expect_within("find_peak(50,000 readings)", lambda: get("find_peak")(ridge), peak_pos, ridge, 60, "Compare mid with mid + 1 to halve the ridge each step.")
```

## Solution

```python
def find_peak(heights):
    low = 0
    high = len(heights) - 1
    while low < high:
        mid = (low + high) // 2
        if heights[mid] < heights[mid + 1]:
            low = mid + 1
        else:
            high = mid
    return low
```

## Restored

The altimeter spots the ridge crest in fewer than forty comparisons.
