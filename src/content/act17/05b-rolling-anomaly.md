---
id: rolling-anomaly
title: Detect sensor spikes with rolling Z-scores
system: Pipeline deck
symbol: equipment
scene: tests
skills: data-pipelines
---

## Briefing

Static alert thresholds break as seasons change: `25°C` is normal in summer and a fire alarm in winter! A **rolling Z-score** compares each reading against the mean and standard deviation of the preceding `window` readings, flagging sudden spikes relative to recent behavior.

## Concept

For index `i >= window` (using the strictly preceding slice `prev = values[i - window : i]` so the current spike doesn't corrupt its own baseline!):
- `mean = sum(prev) / window`
- `variance = sum((x - mean) ** 2 for x in prev) / window` (population variance)
- `std = math.sqrt(variance)`
- If `std == 0.0`: flag index `i` as an anomaly iff `values[i] != mean` (a sudden jump away from a flatline!).
- Otherwise compute `z = abs(values[i] - mean) / std` and flag index `i` iff `z >= threshold`!

## Objective

Write `find_anomalies(values, window, threshold=3.0)`:
- Validate `window >= 2` and `threshold > 0` (else `ValueError`).
- Return a list of integer indices `i` (`window <= i < len(values)`) flagged as anomalies using the preceding `window` values as baseline.

## Hints

1. Never include `values[i]` inside `prev` — use `prev = values[i - window : i]`!
2. Handle `std == 0.0` carefully: a flatline `[10, 10, 10, 10]` followed by `10` is NOT an anomaly, whereas followed by `15` IS an anomaly!

## Starter: guided

```python
import math


def find_anomalies(values, window, threshold=3.0):
    if window < 2 or threshold <= 0:
        raise ValueError("window must be >= 2 and threshold > 0")
    flagged = []
    for i in range(window, len(values)):
        prev = values[i - window : i]
        # Compute mean, population std, and compare abs(values[i] - mean) / std >= threshold
        pass
    return flagged
```

## Starter: standard

```python
import math


def find_anomalies(values, window, threshold=3.0):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "flags clear spike above rolling baseline",
    lambda: get("find_anomalies")([10, 11, 9, 10, 11, 9, 30, 10], window=5, threshold=3.0),
    [6],
)
expect(
    "handles flatline baseline without ZeroDivisionError",
    lambda: get("find_anomalies")([20, 20, 20, 20, 25], window=3, threshold=3.0),
    [4],
)
```

## Hidden checks

```python
expect("series shorter than window has no anomalies", lambda: get("find_anomalies")([1, 100], window=4, threshold=2.0), [])
def _bad():
    try:
        get("find_anomalies")([1, 2, 3], window=1, threshold=2.0)
        return False
    except ValueError:
        return True
expect("window < 2 raises ValueError", _bad, True)
```

## Solution

```python
import math


def find_anomalies(values, window, threshold=3.0):
    if window < 2 or threshold <= 0:
        raise ValueError("window must be >= 2 and threshold > 0")
    flagged = []
    for i in range(window, len(values)):
        prev = values[i - window : i]
        mean = sum(prev) / window
        var = sum((x - mean) ** 2 for x in prev) / window
        std = math.sqrt(var)
        if std == 0.0:
            if values[i] != mean:
                flagged.append(i)
        elif abs(values[i] - mean) / std >= threshold:
            flagged.append(i)
    return flagged
```

## Restored

Rolling Z-score alerts adapt to seasonal drift and catch sudden anomalies without dividing by zero on flatlines.
