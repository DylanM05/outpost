---
id: maintenance-r-squared-score
title: Compute the R-squared goodness-of-fit score for predictions
system: Forecast rail
symbol: controller
scene: tests
skills: forecasting-cohorts
reviewSkill: forecasting-cohorts
prerequisite: cohort-retention
---

## Briefing

Comparing a forecasting model against simply predicting the historical average $\bar{y}$ is captured by $R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$ (which can even be negative if a model performs worse than predicting the mean!).

## Objective

Write `r2_score(actual, predicted)` requiring non-empty equal-length lists (else raise `ValueError`). If `ss_tot == 0`, return `1.0` when `ss_res == 0` else `0.0`; otherwise return `round(1.0 - ss_res / ss_tot, 4)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Compute `mean_y = sum(actual) / len(actual)`, `ss_res = sum((a - p) ** 2 for a, p in zip(actual, predicted))`, and `ss_tot = sum((a - mean_y) ** 2 for a in actual)`.

## Starter

```python
```

## Checks

```python
expect("perfect predictions score 1.0", lambda: get("r2_score")([1, 2, 3], [1, 2, 3]), 1.0)
expect("predicting the constant mean scores 0.0", lambda: get("r2_score")([1, 2, 3], [2, 2, 2]), 0.0)
expect("worse-than-mean predictions yield negative R^2", lambda: get("r2_score")([1, 2, 3], [3, 2, 1]), -3.0)
```

## Hidden checks

```python
expect("constant actual with exact match returns 1.0", lambda: get("r2_score")([4, 4, 4], [4, 4, 4]), 1.0)
expect("constant actual with wrong predictions returns 0.0", lambda: get("r2_score")([4, 4, 4], [4, 5, 4]), 0.0)
```

## Solution

```python
def r2_score(actual, predicted):
    if not actual or len(actual) != len(predicted):
        raise ValueError("actual and predicted must be non-empty and equal length")
    mean_y = sum(actual) / len(actual)
    ss_res = sum((a - p) ** 2 for a, p in zip(actual, predicted))
    ss_tot = sum((a - mean_y) ** 2 for a in actual)
    if ss_tot == 0:
        return 1.0 if ss_res == 0 else 0.0
    return round(1.0 - ss_res / ss_tot, 4)
```

## Restored

Model evaluation now reports exact $R^2$ scores including negative worse-than-baseline fits.
