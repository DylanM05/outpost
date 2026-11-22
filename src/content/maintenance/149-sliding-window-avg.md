---
id: maintenance-sliding-window-avg
title: Compute O(n) sliding-window averages
system: Window desk
symbol: instrument
scene: tests
skills: stream-processing
reviewSkill: stream-processing
prerequisite: session-windows
---

## Briefing

Smoothing noisy voltage readings over a sliding window of width `w` shouldn't re-sum `w` elements on every step. Maintain a running sum so each new reading updates in $O(1)$!

## Objective

Write `sliding_averages(values, width)`:
- Validate `width >= 1` (raise `ValueError` otherwise).
- If `len(values) < width`, return `[]`.
- Otherwise return a list of floats where element `i` is the average of `values[i : i + width]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Initialize `running = sum(values[:width])`, append `running / width`.
2. For `i` from `width` to `len(values) - 1`: `running += values[i] - values[i - width]` and append `running / width`.

## Starter

```python
```

## Checks

```python
expect("computes sliding averages across width 3", lambda: get("sliding_averages")([2, 4, 6, 8, 10], 3), [4.0, 6.0, 8.0])
expect("returns empty when series shorter than width", lambda: get("sliding_averages")([1, 2], 5), [])
```

## Hidden checks

```python
expect("width 1 returns floats of original values", lambda: get("sliding_averages")([3, 7], 1), [3.0, 7.0])
def _bad():
    try:
        get("sliding_averages")([1, 2], 0)
        return False
    except ValueError:
        return True
expect("width < 1 raises ValueError", _bad, True)
```

## Solution

```python
def sliding_averages(values, width):
    if width < 1:
        raise ValueError("width must be >= 1")
    if len(values) < width:
        return []
    running = sum(values[:width])
    out = [running / width]
    for i in range(width, len(values)):
        running += values[i] - values[i - width]
        out.append(running / width)
    return out
```

## Restored

Sliding-window smoothing runs in linear time regardless of window width.
