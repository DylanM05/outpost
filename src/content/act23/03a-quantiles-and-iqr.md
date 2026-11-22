---
id: quantiles-and-iqr
title: Compute linear-interpolated quantiles and Tukey IQR outlier fences
system: Stats deck
symbol: instrument
scene: tests
skills: applied-statistics
---

## Briefing

A single broken sensor reading of `99999` ruins the arithmetic mean and standard deviation. **Quantiles** (`Q1`, median `Q2`, `Q3`) and **Tukey's IQR fences** (`[Q1 - 1.5·IQR, Q3 + 1.5·IQR]`) resist extreme outliers and flag corrupted telemetry cleanly.

## Concept

1. **`quantile(values, q)`** (linear interpolation, identical to NumPy/Pandas default `method="linear"`):
   - Requires non-empty `values` and `0.0 <= q <= 1.0` (else raise `ValueError`).
   - Sort `s = sorted(values)` of length `n`.
   - Fractional index `pos = q * (n - 1)`, `lo = math.floor(pos)`, `hi = math.ceil(pos)`, `frac = pos - lo`.
   - Return `s[lo] + frac * (s[hi] - s[lo])`.
2. **`iqr_summary(values)`:**
   - Compute `q1 = quantile(values, 0.25)`, `median = quantile(values, 0.5)`, `q3 = quantile(values, 0.75)`, `iqr = q3 - q1`.
   - `lower = q1 - 1.5 * iqr`, `upper = q3 + 1.5 * iqr`.
   - `outliers = [v for v in values if v < lower or v > upper]` (preserving input order).
   - Return `{"q1": round(q1, 4), "median": round(median, 4), "q3": round(q3, 4), "iqr": round(iqr, 4), "lower": round(lower, 4), "upper": round(upper, 4), "outliers": outliers}`.

## Objective

Implement `quantile(values, q)` and `iqr_summary(values)`.

## Hints

1. Check `if not values or not (0.0 <= q <= 1.0): raise ValueError(...)`.
2. For `values = [10, 20, 30, 40]`, `q = 0.25` gives `pos = 0.75` -> `10 + 0.75 * (20 - 10) = 17.5`.

## Starter: guided

```python
import math


def quantile(values, q):
    if not values or not (0.0 <= q <= 1.0):
        raise ValueError("empty values or q out of [0, 1]")
    s = sorted(values)
    pos = q * (len(s) - 1)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return s[lo] + (pos - lo) * (s[hi] - s[lo])


def iqr_summary(values):
    pass
```

## Starter: standard

```python
import math


def quantile(values, q):
    pass


def iqr_summary(values):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("linearly interpolates Q1 on even-length list", lambda: get("quantile")([10, 20, 30, 40], 0.25), 17.5)
expect("computes IQR fences and extracts outliers in input order", lambda: get("iqr_summary")([10, 12, 11, 13, 12, 14, 100, 11]), {
    "q1": 11.0,
    "median": 12.0,
    "q3": 13.25,
    "iqr": 2.25,
    "lower": 7.625,
    "upper": 16.625,
    "outliers": [100],
})
```

## Hidden checks

```python
expect("single value has zero IQR and no outliers", lambda: get("iqr_summary")([42])["outliers"], [])
def _bad_q():
    try:
        get("quantile")([1, 2, 3], 1.5)
        return False
    except ValueError:
        return True
expect("rejects q > 1.0", _bad_q, True)
```

## Solution

```python
import math


def quantile(values, q):
    if not values or not (0.0 <= q <= 1.0):
        raise ValueError("values must be non-empty and 0 <= q <= 1")
    s = sorted(values)
    pos = q * (len(s) - 1)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return float(s[lo] + (pos - lo) * (s[hi] - s[lo]))


def iqr_summary(values):
    q1 = quantile(values, 0.25)
    med = quantile(values, 0.5)
    q3 = quantile(values, 0.75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    outliers = [v for v in values if v < lower or v > upper]
    return {
        "q1": round(q1, 4),
        "median": round(med, 4),
        "q3": round(q3, 4),
        "iqr": round(iqr, 4),
        "lower": round(lower, 4),
        "upper": round(upper, 4),
        "outliers": outliers,
    }
```

## Restored

The stats deck now computes robust quantiles and Tukey fences that isolate sensor spikes automatically.
