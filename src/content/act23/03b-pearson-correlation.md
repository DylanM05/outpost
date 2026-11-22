---
id: pearson-correlation
title: Measure linear relationships with Pearson correlation matrices
system: Stats deck
symbol: instrument
scene: tests
skills: applied-statistics
---

## Briefing

Do colder ridge temperatures correlate with higher battery draw? **Pearson's $r$** measures linear association between $-1$ (perfect inverse), $0$ (no linear relationship), and $+1$ (perfect positive) — invariant to units like Celsius vs. Fahrenheit!

## Concept

1. **`pearson_r(xs, ys)`:**
   - Requires equal lengths `n >= 2` (else raise `ValueError`).
   - Compute means $\bar{x}, \bar{y}$, centered deviations $dx_i = x_i - \bar{x}$, $dy_i = y_i - \bar{y}$.
   - $\text{denom} = \sqrt{\sum dx_i^2 \cdot \sum dy_i^2}$.
   - If $\text{denom} == 0$ (either series is constant), return `0.0`.
   - Else return $\frac{\sum dx_i dy_i}{\text{denom}}$.
2. **`correlation_matrix(columns)`:**
   - `columns` is a dict `{col_name: list_of_numbers}` (all lists equal length `>= 2`).
   - Return `{c1: {c2: round(pearson_r(columns[c1], columns[c2]), 4) for c2 in sorted_cols} for c1 in sorted_cols}`.

## Objective

Implement `pearson_r(xs, ys)` and `correlation_matrix(columns)`.

## Hints

1. Watch out for floating-point rounding slightly outside `[-1, 1]` (like `1.0000000000000002`) — clamping to `max(-1.0, min(1.0, r))` keeps $r$ cleanly bounded.

## Starter: guided

```python
import math


def pearson_r(xs, ys):
    if len(xs) != len(ys) or len(xs) < 2:
        raise ValueError("need equal-length sequences of length >= 2")
    mx = sum(xs) / len(xs)
    my = sum(ys) / len(ys)
    # Compute covariance numerator and sqrt(ssx * ssy) denominator.
    pass


def correlation_matrix(columns):
    pass
```

## Starter: standard

```python
import math


def pearson_r(xs, ys):
    pass


def correlation_matrix(columns):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("perfect positive correlation is 1.0", lambda: round(get("pearson_r")([1, 2, 3, 4], [10, 20, 30, 40]), 6), 1.0)
expect("perfect negative correlation is -1.0", lambda: round(get("pearson_r")([1, 2, 3, 4], [8, 6, 4, 2]), 6), -1.0)
expect("constant series returns 0.0 safely", lambda: get("pearson_r")([1, 2, 3], [5, 5, 5]), 0.0)
expect("builds symmetric correlation matrix", lambda: get("correlation_matrix")({"temp": [0, 10, 20], "draw": [30, 20, 10]}), {
    "draw": {"draw": 1.0, "temp": -1.0},
    "temp": {"draw": -1.0, "temp": 1.0},
})
```

## Hidden checks

```python
def _mismatched():
    try:
        get("pearson_r")([1, 2], [1, 2, 3])
        return False
    except ValueError:
        return True
expect("mismatched lengths raise ValueError", _mismatched, True)
expect("orthogonal pattern gives 0.0", lambda: round(get("pearson_r")([-1, 0, 1], [1, 0, 1]), 6), 0.0)
```

## Solution

```python
import math


def pearson_r(xs, ys):
    if len(xs) != len(ys) or len(xs) < 2:
        raise ValueError("need equal-length sequences of length >= 2")
    mx = sum(xs) / len(xs)
    my = sum(ys) / len(ys)
    num = 0.0
    ssx = 0.0
    ssy = 0.0
    for x, y in zip(xs, ys):
        dx = x - mx
        dy = y - my
        num += dx * dy
        ssx += dx * dx
        ssy += dy * dy
    denom = math.sqrt(ssx * ssy)
    if denom == 0.0:
        return 0.0
    return max(-1.0, min(1.0, num / denom))


def correlation_matrix(columns):
    names = sorted(columns.keys())
    return {
        c1: {c2: round(pearson_r(columns[c1], columns[c2]), 4) for c2 in names}
        for c1 in names
    }
```

## Restored

The stats deck now maps pairwise correlations across station telemetry channels.
