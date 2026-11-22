---
id: bootstrap-ci
title: Estimate non-parametric confidence intervals via bootstrapping
system: Experiment bay
symbol: equipment
scene: tests
skills: applied-statistics
---

## Briefing

When data is heavily skewed (like API latencies or revenue per user), normal-distribution formulas break down. **Bootstrapping** estimates a confidence interval for *any* statistic (mean, median, p95) by repeatedly resampling the observed data **with replacement** and taking the empirical percentiles of the resampled statistics!

## Concept

Write `bootstrap_ci(values, stat_fn, n_resamples=500, ci=0.95, seed=42)`:
- Validate `len(values) >= 1`, `n_resamples >= 1`, and `0.0 < ci < 1.0` (else raise `ValueError`).
- Create a local seeded generator `rng = random.Random(seed)` so results are 100% reproducible without mutating Python's global RNG!
- For `_ in range(n_resamples)`:
  - Draw a sample of length `len(values)` with replacement using `[values[rng.randrange(n)] for _ in range(n)]` (note: `rng.choices(values, k=n)` works too — let's use linear-interpolated percentile bounds on the sorted resampled estimates!).
  - Compute `stat_fn(sample)` and append to `estimates`.
- Sort `estimates`. Let `alpha = (1.0 - ci) / 2.0`.
- Compute `low = quantile(estimates, alpha)` and `high = quantile(estimates, 1.0 - alpha)` using linear interpolation, plus `point = stat_fn(values)`.
- Return `{"point": round(point, 4), "low": round(low, 4), "high": round(high, 4)}`.

## Objective

Implement `bootstrap_ci(values, stat_fn, n_resamples=500, ci=0.95, seed=42)`.

## Hints

1. Always instantiate a local `rng = random.Random(seed)` instead of calling `random.seed(seed)`.
2. For a constant dataset like `[10, 10, 10, 10]`, every resample yields `10`, so `low == point == high == 10.0`.

## Starter: guided

```python
import math
import random


def _quantile(sorted_vals, q):
    pos = q * (len(sorted_vals) - 1)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return sorted_vals[lo] + (pos - lo) * (sorted_vals[hi] - sorted_vals[lo])


def bootstrap_ci(values, stat_fn, n_resamples=500, ci=0.95, seed=42):
    if not values or n_resamples < 1 or not (0.0 < ci < 1.0):
        raise ValueError("invalid bootstrap parameters")
    rng = random.Random(seed)
    # Resample len(values) items with replacement n_resamples times, sort, compute CI bounds.
    pass
```

## Starter: standard

```python
import math
import random


def bootstrap_ci(values, stat_fn, n_resamples=500, ci=0.95, seed=42):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _boot():
    data = [10, 12, 11, 13, 12, 14, 15, 11, 12, 13]
    mean_fn = lambda xs: sum(xs) / len(xs)
    r1 = get("bootstrap_ci")(data, mean_fn, n_resamples=400, ci=0.95, seed=7)
    r2 = get("bootstrap_ci")(data, mean_fn, n_resamples=400, ci=0.95, seed=7)
    return (r1 == r2, r1["point"], r1["low"] < r1["point"] < r1["high"], r1["low"] >= 11.0, r1["high"] <= 14.0)
expect("produces reproducible CI bracketing the point estimate", _boot, (True, 12.3, True, True, True))
```

## Hidden checks

```python
expect("constant dataset collapses CI to exact point", lambda: get("bootstrap_ci")([5, 5, 5, 5], lambda xs: sum(xs) / len(xs), n_resamples=100, seed=1), {"point": 5.0, "low": 5.0, "high": 5.0})
def _bad():
    try:
        get("bootstrap_ci")([], sum, n_resamples=10)
        return False
    except ValueError:
        return True
expect("rejects empty dataset", _bad, True)
```

## Solution

```python
import math
import random


def _quantile(sorted_vals, q):
    pos = q * (len(sorted_vals) - 1)
    lo = math.floor(pos)
    hi = math.ceil(pos)
    return sorted_vals[lo] + (pos - lo) * (sorted_vals[hi] - sorted_vals[lo])


def bootstrap_ci(values, stat_fn, n_resamples=500, ci=0.95, seed=42):
    if not values or n_resamples < 1 or not (0.0 < ci < 1.0):
        raise ValueError("invalid bootstrap parameters")
    rng = random.Random(seed)
    n = len(values)
    estimates = sorted(stat_fn(rng.choices(values, k=n)) for _ in range(n_resamples))
    alpha = (1.0 - ci) / 2.0
    low = _quantile(estimates, alpha)
    high = _quantile(estimates, 1.0 - alpha)
    return {
        "point": round(float(stat_fn(values)), 4),
        "low": round(float(low), 4),
        "high": round(float(high), 4),
    }
```

## Restored

The experiment bay now quantifies uncertainty around skewed medians and means via deterministic bootstrapping.
