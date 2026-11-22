---
id: ab-ztest
title: Run a two-proportion A/B hypothesis test with p-values
system: Experiment bay
symbol: equipment
scene: tests
skills: applied-statistics
---

## Briefing

Variant B converted 135/1000 visitors while Variant A converted 100/1000. Is that +3.5% lift real, or just coin-flip noise? A **two-proportion Z-test** uses Python's exact `math.erfc` normal tail probability to compute the two-sided **p-value** and decide statistical significance at `alpha = 0.05`.

## Concept

Given control `(wins_a, n_a)` and treatment `(wins_b, n_b)` (require `n_a > 0`, `n_b > 0`, `0 <= wins_a <= n_a`, `0 <= wins_b <= n_b`, else raise `ValueError`):
- Conversion rates: $p_a = \text{wins}_a / n_a$, $p_b = \text{wins}_b / n_b$, $\text{lift} = p_b - p_a$.
- Pooled proportion under $H_0$: $\hat{p} = \frac{\text{wins}_a + \text{wins}_b}{n_a + n_b}$.
- Pooled standard error: $\text{se} = \sqrt{\hat{p}(1 - \hat{p})\left(\frac{1}{n_a} + \frac{1}{n_b}\right)}$.
- If $\text{se} == 0$: `z = 0.0`, `p_value = 1.0`.
- Else: $z = \frac{p_b - p_a}{\text{se}}$, and exact two-sided normal p-value is `p_value = math.erfc(abs(z) / math.sqrt(2.0))`!
- Return:
  `{"rate_a": round(p_a, 4), "rate_b": round(p_b, 4), "lift": round(lift, 4), "z": round(z, 4), "p_value": round(p_value, 6), "significant": p_value < alpha}`.

## Objective

Write `ab_proportion_test(wins_a, n_a, wins_b, n_b, alpha=0.05)` returning the result dictionary above.

## Hints

1. Python's standard library `math.erfc(abs(z) / math.sqrt(2.0))` gives the exact two-tailed standard normal p-value with zero external libraries!

## Starter: guided

```python
import math


def ab_proportion_test(wins_a, n_a, wins_b, n_b, alpha=0.05):
    if n_a <= 0 or n_b <= 0 or not (0 <= wins_a <= n_a) or not (0 <= wins_b <= n_b):
        raise ValueError("invalid trial or win counts")
    pa = wins_a / n_a
    pb = wins_b / n_b
    # Compute pooled p_hat, standard error, z-score, two-sided p-value via math.erfc.
    pass
```

## Starter: standard

```python
import math


def ab_proportion_test(wins_a, n_a, wins_b, n_b, alpha=0.05):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _sig():
    res = get("ab_proportion_test")(100, 1000, 140, 1000, alpha=0.05)
    return (res["rate_a"], res["rate_b"], res["lift"], res["significant"], res["p_value"] < 0.01)
expect("detects statistically significant lift", _sig, (0.1, 0.14, 0.04, True, True))

def _noise():
    res = get("ab_proportion_test")(50, 500, 54, 500, alpha=0.05)
    return (res["significant"], res["p_value"] > 0.5)
expect("does not flag small sample noise as significant", _noise, (False, True))
```

## Hidden checks

```python
expect("handles zero variance (0 wins in both arms) cleanly", lambda: get("ab_proportion_test")(0, 100, 0, 100)["p_value"], 1.0)
def _bad():
    try:
        get("ab_proportion_test")(110, 100, 10, 100)
        return False
    except ValueError:
        return True
expect("rejects wins > n", _bad, True)
```

## Solution

```python
import math


def ab_proportion_test(wins_a, n_a, wins_b, n_b, alpha=0.05):
    if n_a <= 0 or n_b <= 0 or not (0 <= wins_a <= n_a) or not (0 <= wins_b <= n_b):
        raise ValueError("invalid trial or win counts")
    pa = wins_a / n_a
    pb = wins_b / n_b
    lift = pb - pa
    p_pool = (wins_a + wins_b) / (n_a + n_b)
    se = math.sqrt(p_pool * (1.0 - p_pool) * (1.0 / n_a + 1.0 / n_b))
    if se == 0.0:
        z = 0.0
        p_val = 1.0
    else:
        z = lift / se
        p_val = math.erfc(abs(z) / math.sqrt(2.0))
    return {
        "rate_a": round(pa, 4),
        "rate_b": round(pb, 4),
        "lift": round(lift, 4),
        "z": round(z, 4),
        "p_value": round(p_val, 6),
        "significant": p_val < alpha,
    }
```

## Restored

The experiment bay now separates real product improvements from random noise with exact Z-tests.
