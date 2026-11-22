---
id: maintenance-rolling-window-mean
title: Compute a trailing rolling moving average over a series
system: Forecast rail
symbol: controller
scene: tests
skills: forecasting-cohorts
reviewSkill: forecasting-cohorts
prerequisite: cohort-retention
---

## Briefing

Trailing moving averages smooth daily spikes by averaging the most recent `window` observations (or as many observations as exist so far during warm-up).

## Objective

Write `rolling_mean(series, window)` requiring `window >= 1` (raise `ValueError` otherwise). For each index `i`, return the mean of `series[max(0, i - window + 1) : i + 1]` rounded to 4 decimal places.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Maintain a running sum (adding `series[i]` and subtracting `series[i - window]` once `i >= window`) for $O(n)$ time!

## Starter

```python
```

## Checks

```python
expect("computes trailing window=3 moving average with warmup", lambda: get("rolling_mean")([2, 4, 6, 8, 10], 3), [2.0, 3.0, 4.0, 6.0, 8.0])
```

## Hidden checks

```python
expect("empty series returns []", lambda: get("rolling_mean")([], 3), [])
def _bad():
    try:
        get("rolling_mean")([1, 2], 0)
        return False
    except ValueError:
        return True
expect("window < 1 raises ValueError", _bad, True)
```

## Solution

```python
def rolling_mean(series, window):
    if window < 1:
        raise ValueError("window must be >= 1")
    out = []
    running = 0.0
    for i, val in enumerate(series):
        running += val
        if i >= window:
            running -= series[i - window]
        count = min(i + 1, window)
        out.append(round(running / count, 4))
    return out
```

## Restored

Rolling averages now smooth daily telemetry in linear time.
