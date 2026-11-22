---
id: maintenance-fix-ewma-weight
title: Fix an EWMA smoother that swaps the new-observation and history weights
system: Forecast rail
symbol: controller
scene: tests
skills: forecasting-cohorts
reviewSkill: forecasting-cohorts
prerequisite: cohort-retention
---

## Briefing

An EWMA forecasting helper is reacting *backward* to `alpha` — setting `alpha = 0.9` barely moves toward new readings because `(1 - alpha)` and `alpha` were swapped!

## Objective

Fix `ewma_step(prev_ema, observation, alpha)` (raising `ValueError` unless `0.0 < alpha <= 1.0`) so it returns `alpha * observation + (1.0 - alpha) * prev_ema`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Higher `alpha` (closer to `1.0`) weights the *new* `observation` more heavily, while `(1.0 - alpha)` weights `prev_ema`.

## Starter

```python
def ewma_step(prev_ema, observation, alpha):
    if not (0.0 < alpha <= 1.0):
        raise ValueError("alpha must be in (0, 1]")
    return (1.0 - alpha) * observation + alpha * prev_ema
```

## Checks

```python
expect("alpha=0.8 weights new observation at 80%", lambda: round(get("ewma_step")(10.0, 20.0, 0.8), 6), 18.0)
expect("alpha=1.0 jumps directly to new observation", lambda: round(get("ewma_step")(10.0, 25.0, 1.0), 6), 25.0)
```

## Hidden checks

```python
expect("alpha=0.2 keeps 80% of previous EMA", lambda: round(get("ewma_step")(10.0, 20.0, 0.2), 6), 12.0)
```

## Solution

```python
def ewma_step(prev_ema, observation, alpha):
    if not (0.0 < alpha <= 1.0):
        raise ValueError("alpha must be in (0, 1]")
    return alpha * observation + (1.0 - alpha) * prev_ema
```

## Restored

EWMA smoothing weights now respond proportionally to `alpha`.
