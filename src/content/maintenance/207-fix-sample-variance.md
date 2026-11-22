---
id: maintenance-fix-sample-variance
title: Fix a sample variance helper missing Bessel's correction
system: Stats deck
symbol: instrument
scene: tests
skills: applied-statistics
reviewSkill: applied-statistics
prerequisite: bootstrap-ci
---

## Briefing

A statistics helper is underestimating sample variance on small experiments because it divides by `n` (population variance) instead of `n - 1` (Bessel-corrected sample variance) and doesn't guard against `n < 2`!

## Objective

Fix `sample_variance(values)` so it raises `ValueError` when `len(values) < 2` and returns `round(sum((x - mean) ** 2 for x in values) / (len(values) - 1), 4)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Divide by `len(values) - 1` instead of `len(values)`, and raise `ValueError` if `len(values) < 2`.

## Starter

```python
def sample_variance(values):
    mean = sum(values) / len(values)
    return round(sum((x - mean) ** 2 for x in values) / len(values), 4)
```

## Checks

```python
expect("applies Bessel's n-1 correction", lambda: get("sample_variance")([2, 4, 6]), 4.0)
expect("computes sample variance for [1, 2, 3, 4]", lambda: get("sample_variance")([1, 2, 3, 4]), 1.6667)
```

## Hidden checks

```python
def _short():
    try:
        get("sample_variance")([5])
        return False
    except ValueError:
        return True
expect("fewer than 2 values raises ValueError", _short, True)
```

## Solution

```python
def sample_variance(values):
    if len(values) < 2:
        raise ValueError("need at least 2 values for sample variance")
    mean = sum(values) / len(values)
    return round(sum((x - mean) ** 2 for x in values) / (len(values) - 1), 4)
```

## Restored

Sample variance now applies Bessel's `n - 1` correction accurately for small samples.
