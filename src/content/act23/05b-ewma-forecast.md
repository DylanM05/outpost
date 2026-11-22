---
id: ewma-forecast
title: Smooth noisy time series with exponential moving averages
system: Forecast rail
symbol: controller
scene: tests
skills: forecasting-cohorts
---

## Briefing

Simple moving averages treat a reading from 10 minutes ago the same as a reading from 1 second ago and require storing the full window. **Exponentially Weighted Moving Averages (EWMA)** react smoothly to recent shifts in $O(1)$ state — and **Holt's linear trend** adds a slope term for trending series!

## Concept

1. **`ewma(series, alpha)`:**
   - Validate `0.0 < alpha <= 1.0` (else raise `ValueError`).
   - Empty `series` -> return `[]`.
   - Initialize `s = float(series[0])`; emit `round(s, 4)`.
   - For each subsequent `x` in `series[1:]`:
     $$s_t = \alpha \cdot x_t + (1 - \alpha) \cdot s_{t-1}$$
     emit `round(s_t, 4)`.
2. **`forecast_mae(actual, predicted)`:**
   - Validate non-empty equal-length lists (else raise `ValueError`).
   - Return Mean Absolute Error: `round(sum(abs(a - p) for a, p in zip(actual, predicted)) / len(actual), 4)`.

## Objective

Implement `ewma(series, alpha)` and `forecast_mae(actual, predicted)`.

## Hints

1. Keep full floating-point precision in `s` during recurrence updates and only round when appending to the output list!

## Starter: guided

```python
def ewma(series, alpha):
    if not (0.0 < alpha <= 1.0):
        raise ValueError("alpha must be in (0, 1]")
    if not series:
        return []
    # Start s = float(series[0]), then update s = alpha * x + (1 - alpha) * s.
    pass


def forecast_mae(actual, predicted):
    pass
```

## Starter: standard

```python
def ewma(series, alpha):
    pass


def forecast_mae(actual, predicted):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("computes EWMA with alpha=0.5", lambda: get("ewma")([10, 20, 20, 10], 0.5), [10.0, 15.0, 17.5, 13.75])
expect("alpha=1.0 reproduces series unchanged", lambda: get("ewma")([3, 7, 2], 1.0), [3.0, 7.0, 2.0])
expect("computes Mean Absolute Error", lambda: get("forecast_mae")([10, 20, 30], [12, 18, 33]), 2.3333)
```

## Hidden checks

```python
expect("empty series returns []", lambda: get("ewma")([], 0.3), [])
def _bad_alpha():
    try:
        get("ewma")([1, 2], 0.0)
        return False
    except ValueError:
        return True
expect("alpha <= 0 raises ValueError", _bad_alpha, True)
```

## Solution

```python
def ewma(series, alpha):
    if not (0.0 < alpha <= 1.0):
        raise ValueError("alpha must be in (0, 1]")
    if not series:
        return []
    s = float(series[0])
    out = [round(s, 4)]
    for x in series[1:]:
        s = alpha * x + (1.0 - alpha) * s
        out.append(round(s, 4))
    return out


def forecast_mae(actual, predicted):
    if not actual or len(actual) != len(predicted):
        raise ValueError("actual and predicted must be non-empty and equal length")
    return round(sum(abs(a - p) for a, p in zip(actual, predicted)) / len(actual), 4)
```

## Restored

The forecast rail now smooths noisy telemetry streams and scores prediction accuracy with MAE.
