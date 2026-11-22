---
id: maintenance-fill-missing-median
title: Impute missing numeric column values with the median
system: Census bench
symbol: instrument
scene: tests
skills: tabular-wrangling
reviewSkill: tabular-wrangling
prerequisite: pivot-and-melt
---

## Briefing

Real telemetry tables contain `None` gaps where sensors dropped packets. Filling missing values with the column **median** avoids skewing the dataset when outliers exist.

## Objective

Write `fill_median(values)` taking a list of numbers and/or `None`. Raise `ValueError` if there are no non-`None` values; otherwise compute the median of the non-`None` entries (average of the two middle values for even count) and return a new list with every `None` replaced by that median.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter `nums = sorted(v for v in values if v is not None)` and compute `med = nums[n // 2]` (odd) or `(nums[n // 2 - 1] + nums[n // 2]) / 2` (even).

## Starter

```python
```

## Checks

```python
expect("replaces None with odd median", lambda: get("fill_median")([10, None, 2, 100, None]), [10, 10, 2, 100, 10])
expect("replaces None with even median", lambda: get("fill_median")([1, None, 5, 3, 9]), [1, 4.0, 5, 3, 9])
```

## Hidden checks

```python
def _all_none():
    try:
        get("fill_median")([None, None])
        return False
    except ValueError:
        return True
expect("all-None input raises ValueError", _all_none, True)
```

## Solution

```python
def fill_median(values):
    nums = sorted(v for v in values if v is not None)
    if not nums:
        raise ValueError("no non-None values to compute median")
    n = len(nums)
    med = nums[n // 2] if n % 2 == 1 else (nums[n // 2 - 1] + nums[n // 2]) / 2.0
    return [med if v is None else v for v in values]
```

## Restored

Missing sensor entries now impute cleanly with the column median.
