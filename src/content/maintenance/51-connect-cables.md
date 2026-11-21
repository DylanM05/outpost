---
id: maintenance-connect-cables
title: Cheapest cable splices
system: Priority board
symbol: equipment
scene: tests
skills: heaps
reviewSkill: heaps
prerequisite: urgent-repairs
---

## Briefing

Splicing two cable lengths `a` and `b` together takes `a + b` minutes and produces one cable of length `a + b`. To splice a bundle of cables into one single cable in the **minimum** total time, always splice the two **shortest** cables next — a classic min-heap problem!

## Objective

Write `min_splice_time(lengths)`. Return the minimum total minutes to connect all cables into one (`0` if there are 0 or 1 cables).

```python
min_splice_time([2, 4, 3])  # 14: splice 2+3=5 (5 min), then 5+4=9 (9 min) -> total 14
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Copy `lengths` into a list and call `heapq.heapify(heap)`.
2. While `len(heap) > 1`: pop the two smallest `a` and `b`, add `a + b` to `total`, and `heapq.heappush(heap, a + b)`.

## Starter

```python
```

## Checks

```python
expect("min_splice_time([2, 4, 3])", lambda: get("min_splice_time")([2, 4, 3]), 14)
expect("min_splice_time([1, 8, 3, 5])", lambda: get("min_splice_time")([1, 8, 3, 5]), 30)
```

## Hidden checks

```python
expect("empty list returns 0", lambda: get("min_splice_time")([]), 0)
expect("single cable returns 0", lambda: get("min_splice_time")([10]), 0)
orig = [4, 2, 3]
check("does not mutate caller's list", lambda: (get("min_splice_time")(orig), orig)[1] == [4, 2, 3])
```

## Solution

```python
import heapq


def min_splice_time(lengths):
    if len(lengths) <= 1:
        return 0
    heap = list(lengths)
    heapq.heapify(heap)
    total = 0
    while len(heap) > 1:
        combined = heapq.heappop(heap) + heapq.heappop(heap)
        total += combined
        heapq.heappush(heap, combined)
    return total
```

## Restored

The crew always splices the two shortest cables first, saving hours across the relay line.
