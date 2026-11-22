---
id: maintenance-iqr-outlier-mask
title: Return a boolean outlier mask using Tukey IQR fences
system: Stats deck
symbol: instrument
scene: tests
skills: applied-statistics
reviewSkill: applied-statistics
prerequisite: bootstrap-ci
---

## Briefing

Data cleaning pipelines often build a boolean mask (`[False, False, True, ...]`) marking which rows fall strictly outside `[Q1 - 1.5·IQR, Q3 + 1.5·IQR]` so downstream steps can filter or flag them.

## Objective

Write `outlier_mask(values)` (non-empty list of numbers; raise `ValueError` if empty) returning a `list[bool]` of the same length where entry `i` is `True` iff `values[i] < Q1 - 1.5 * IQR` or `values[i] > Q3 + 1.5 * IQR` (using linear-interpolated `Q1` and `Q3`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Sort a copy of `values` to compute `q1` and `q3`, then compare every item in the original `values` list against `[q1 - 1.5 * iqr, q3 + 1.5 * iqr]`.

## Starter

```python
```

## Checks

```python
expect("flags extreme spikes in original index positions", lambda: get("outlier_mask")([10, 11, 100, 12, 11, 13, -50, 12]), [False, False, True, False, False, False, True, False])
```

## Hidden checks

```python
expect("constant list has no outliers", lambda: get("outlier_mask")([5, 5, 5, 5]), [False, False, False, False])
def _empty():
    try:
        get("outlier_mask")([])
        return False
    except ValueError:
        return True
expect("empty list raises ValueError", _empty, True)
```

## Solution

```python
import math


def _q(s, q):
    pos = q * (len(s) - 1)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return s[lo] + (pos - lo) * (s[hi] - s[lo])


def outlier_mask(values):
    if not values:
        raise ValueError("values cannot be empty")
    s = sorted(values)
    q1 = _q(s, 0.25)
    q3 = _q(s, 0.75)
    iqr = q3 - q1
    lo = q1 - 1.5 * iqr
    hi = q3 + 1.5 * iqr
    return [v < lo or v > hi for v in values]
```

## Restored

Boolean Tukey masks now isolate sensor spikes without disturbing row alignment.
