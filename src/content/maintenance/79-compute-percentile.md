---
id: maintenance-compute-percentile
title: Nearest-rank latency percentile
system: Telemetry bus
symbol: instrument
scene: tests
skills: observability
reviewSkill: observability
prerequisite: latency-and-errors
---

## Briefing

Averages hide tail latency: 99 fast requests and 1 stalled 10-second request average 110ms, while real operators feel the `p95` spike. Compute the nearest-rank percentile from raw latency samples.

## Objective

Write `percentile(samples, p)` returning the nearest-rank `p`-th percentile (`0 < p <= 100`) of a list of numbers `samples`:

- Return `0.0` if `samples` is empty.
- Sort a copy of `samples` ascending (do not mutate `samples`).
- Use nearest-rank index `idx = math.ceil((p / 100) * len(ordered)) - 1` (clamped to `>= 0`) and return `ordered[idx]`.

```python
percentile([40, 10, 50, 20, 30], 50)  # 30
percentile([40, 10, 50, 20, 30], 95)  # 50
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `ordered = sorted(samples)` so the caller's list isn't mutated.
2. `idx = max(0, math.ceil((p / 100) * len(ordered)) - 1)`.

## Starter

```python
```

## Checks

```python
expect("p50 of 5 samples", lambda: get("percentile")([40, 10, 50, 20, 30], 50), 30)
expect("p95 of 5 samples", lambda: get("percentile")([40, 10, 50, 20, 30], 95), 50)
expect("p95 of 100 samples (1..100)", lambda: get("percentile")(list(range(100, 0, -1)), 95), 95)
```

## Hidden checks

```python
expect("empty list returns 0.0", lambda: get("percentile")([], 95), 0.0)
raw = [30, 10, 20]
get("percentile")(raw, 50)
expect("does not mutate input list", lambda: raw, [30, 10, 20])
```

## Solution

```python
import math


def percentile(samples, p):
    if not samples:
        return 0.0
    ordered = sorted(samples)
    idx = max(0, math.ceil((p / 100) * len(ordered)) - 1)
    return ordered[idx]
```

## Restored

Tail latency spikes now show up immediately on the telemetry dashboard instead of hiding behind an average.
