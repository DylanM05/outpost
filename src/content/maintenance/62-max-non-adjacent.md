---
id: maintenance-max-non-adjacent
title: Spaced solar panels
system: Supply ledger
symbol: controller
scene: tests
skills: dynamic-programming
reviewSkill: dynamic-programming
prerequisite: cheapest-supply-plan
---

## Briefing

Because adjacent solar panels share a heat bus, you cannot draw full power from two neighboring panels in the same row. Pick a subset of non-adjacent panels that maximizes total watts.

## Objective

Write `max_solar_output(panels)` given a list of non-negative integers `panels`. Return the maximum sum you can collect without choosing two adjacent elements (`0` for an empty list).

```python
max_solar_output([2, 7, 9, 3, 1])  # 12 (2 + 9 + 1)
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track two values as you scan left to right: `prev2` (best up to `i - 2`) and `prev1` (best up to `i - 1`).
2. At each panel `w`, the new best is `max(prev1, prev2 + w)`. Shift `prev2, prev1 = prev1, best`.

## Starter

```python
```

## Checks

```python
expect("max_solar_output([2, 7, 9, 3, 1])", lambda: get("max_solar_output")([2, 7, 9, 3, 1]), 12)
expect("max_solar_output([5, 1, 1, 5])", lambda: get("max_solar_output")([5, 1, 1, 5]), 10)
```

## Hidden checks

```python
expect("empty list returns 0", lambda: get("max_solar_output")([]), 0)
expect("single panel", lambda: get("max_solar_output")([42]), 42)
expect("2000-panel array finishes in linear time", lambda: get("max_solar_output")([3, 1] * 1000), 3000)
```

## Solution

```python
def max_solar_output(panels):
    prev2 = 0
    prev1 = 0
    for watts in panels:
        prev2, prev1 = prev1, max(prev1, prev2 + watts)
    return prev1
```

## Restored

The array controller pulls maximum wattage without ever overheating two neighboring panels.
