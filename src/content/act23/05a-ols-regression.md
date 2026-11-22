---
id: ols-regression
title: Fit ordinary least squares linear regression and R-squared
system: Forecast rail
symbol: controller
scene: tests
skills: forecasting-cohorts
---

## Briefing

How fast is solar output declining per degree of frost? **Ordinary Least Squares (OLS)** finds the exact best-fit line $\hat{y} = m x + b$ minimizing squared prediction errors, along with $R^2$ showing how much of the variance the line explains.

## Concept

Given equal-length numeric lists `xs` and `ys` with `n >= 2` (raise `ValueError` if mismatched, `n < 2`, or all `xs` are identical so variance of $x$ is `0`):
- $\bar{x} = \frac{1}{n}\sum x_i$, $\bar{y} = \frac{1}{n}\sum y_i$.
- Slope $m = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2}$.
- Intercept $b = \bar{y} - m\,\bar{x}$.
- Predictions $\hat{y}_i = m x_i + b$:
  - $SS_{res} = \sum (y_i - \hat{y}_i)^2$
  - $SS_{tot} = \sum (y_i - \bar{y})^2$
  - $R^2 = 1.0$ if $SS_{tot} == 0$ (constant $y$, zero residual) else $1.0 - SS_{res} / SS_{tot}$.
- Return `{"slope": round(m, 6), "intercept": round(b, 6), "r2": round(r2, 6)}`.

## Objective

Implement `fit_linear_regression(xs, ys)` and `predict_linear(model, x)` returning `model["slope"] * x + model["intercept"]`.

## Hints

1. Check `ssx = sum((x - mx) ** 2 for x in xs)` — if `ssx == 0`, no unique slope exists so raise `ValueError`.

## Starter: guided

```python
def fit_linear_regression(xs, ys):
    if len(xs) != len(ys) or len(xs) < 2:
        raise ValueError("need equal-length xs and ys with length >= 2")
    mx = sum(xs) / len(xs)
    my = sum(ys) / len(ys)
    ssx = sum((x - mx) ** 2 for x in xs)
    if ssx == 0:
        raise ValueError("x values cannot all be identical")
    # Compute slope, intercept, ss_res, ss_tot, and r2.
    pass


def predict_linear(model, x):
    return model["slope"] * x + model["intercept"]
```

## Starter: standard

```python
def fit_linear_regression(xs, ys):
    pass


def predict_linear(model, x):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _exact():
    m = get("fit_linear_regression")([1, 2, 3, 4], [5, 8, 11, 14])
    return (m, round(get("predict_linear")(m, 10), 4))
expect("fits exact linear relation y = 3x + 2 with R^2 = 1.0", _exact, (
    {"slope": 3.0, "intercept": 2.0, "r2": 1.0},
    32.0,
))

def _noisy():
    m = get("fit_linear_regression")([1, 2, 3, 4], [2, 3, 5, 4])
    return (round(m["slope"], 4), round(m["intercept"], 4), round(m["r2"], 4))
expect("fits noisy data with OLS slope, intercept, and R^2", _noisy, (0.8, 1.5, 0.64))
```

## Hidden checks

```python
expect("constant y gives slope 0 and R^2 = 1.0", lambda: get("fit_linear_regression")([1, 2, 3], [7, 7, 7]), {"slope": 0.0, "intercept": 7.0, "r2": 1.0})
def _const_x():
    try:
        get("fit_linear_regression")([2, 2, 2], [1, 2, 3])
        return False
    except ValueError:
        return True
expect("identical x values raise ValueError", _const_x, True)
```

## Solution

```python
def fit_linear_regression(xs, ys):
    if len(xs) != len(ys) or len(xs) < 2:
        raise ValueError("need equal-length xs and ys with length >= 2")
    mx = sum(xs) / len(xs)
    my = sum(ys) / len(ys)
    ssx = sum((x - mx) ** 2 for x in xs)
    if ssx == 0:
        raise ValueError("x values cannot all be identical")
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    slope = sxy / ssx
    intercept = my - slope * mx
    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(xs, ys))
    ss_tot = sum((y - my) ** 2 for y in ys)
    r2 = 1.0 if ss_tot == 0 else 1.0 - (ss_res / ss_tot)
    return {
        "slope": round(slope, 6),
        "intercept": round(intercept, 6),
        "r2": round(r2, 6),
    }


def predict_linear(model, x):
    return model["slope"] * x + model["intercept"]
```

## Restored

The forecast rail now fits OLS trend lines and reports exact goodness-of-fit $R^2$ scores.
