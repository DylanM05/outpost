---
id: maintenance-weighted-average
title: Compute weighted averages with strict weight validation
system: Stats deck
symbol: instrument
scene: tests
skills: applied-statistics
reviewSkill: applied-statistics
prerequisite: bootstrap-ci
---

## Briefing

To avoid Simpson's paradox when combining segment metrics, weight each segment's average by its sample size rather than taking an unweighted average of averages.

## Objective

Write `weighted_mean(values, weights)` raising `ValueError` if lists differ in length, are empty, contain any negative weight, or sum of weights is `0`. Return `round(sum(v * w) / sum(w), 4)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `any(w < 0 for w in weights)` and `total_w == 0` before dividing.

## Starter

```python
```

## Checks

```python
expect("computes weighted mean accurately", lambda: get("weighted_mean")([20.0, 90.0], [200, 100]), 43.3333)
expect("ignores zero-weight entries safely", lambda: get("weighted_mean")([10, 999], [5, 0]), 10.0)
```

## Hidden checks

```python
def _bad():
    bad = 0
    for args in [([1], [-1]), ([1], [0]), ([], []), ([1, 2], [1])]:
        try:
            get("weighted_mean")(*args)
        except ValueError:
            bad += 1
    return bad
expect("rejects negative, zero-sum, empty, and mismatched weights", _bad, 4)
```

## Solution

```python
def weighted_mean(values, weights):
    if not values or len(values) != len(weights):
        raise ValueError("values and weights must be non-empty and equal length")
    if any(w < 0 for w in weights):
        raise ValueError("weights must be non-negative")
    total_w = sum(weights)
    if total_w == 0:
        raise ValueError("total weight must be positive")
    return round(sum(v * w for v, w in zip(values, weights)) / total_w, 4)
```

## Restored

Weighted averages now combine stratified segments cleanly without sample-size bias.
