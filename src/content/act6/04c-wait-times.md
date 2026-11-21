---
id: wait-times
title: Wait times
system: Dispatch line
symbol: equipment
scene: work
skills: linear-structures, complexity
---

## Briefing

When storms roll over the deep ridge, drones arrive at the charging bay in bursts and leave one at a time. The dispatch board needs a rolling window check: for each incoming drone's arrival time, how many drones arrived within the last `window` minutes (including itself)? The current script re-scans earlier arrivals from the beginning on every check and bogged down during yesterday's storm.

## Objective

Write `recent_arrivals(times, window)`. `times` is a sorted list of arrival timestamps (in minutes, non-decreasing), and `window` is a non-negative integer. Return a list of the same length where position `i` is the number of timestamps in `times[:i + 1]` that are at least `times[i] - window`.

```python
recent_arrivals([1, 2, 10, 11, 12], 3)  # [1, 2, 1, 2, 3]
```

At time `12` with `window = 3`, arrivals from `9` through `12` count: `[10, 11, 12]`, so `3`.

The hidden test has 2,000 arrivals and allows 4,000 reads of `times`.

## Concept

A **sliding window** over sorted timestamps is a queue in disguise!

As each new timestamp `t` arrives:

1. Push `t` onto the back of a queue (`collections.deque`).
2. While the front of the queue is older than `t - window`, pop it from the front (`popleft()`).
3. Everything left in the queue is inside the window, so `len(queue)` is the answer for `t`.

Each timestamp enters the queue once and leaves at most once, so the whole pass reads `times` only **once** (`O(n)` total work), even when thousands of arrivals fall in the same window.

## Hints

1. Import `deque` from `collections` and start with `q = deque()` and `counts = []`.
2. For each `t` in `times`: `q.append(t)`, then `while q[0] < t - window: q.popleft()`.
3. Append `len(q)` to `counts`.

## Starter: guided

```python
from collections import deque


def recent_arrivals(times, window):
    q = deque()
    counts = []
    for t in times:
        q.append(t)
        # Remove timestamps from the front of q that are < t - window.
        counts.append(len(q))
    return counts


print(recent_arrivals([1, 2, 10, 11, 12], 3))
```

## Starter: standard

```python
def recent_arrivals(times, window):
    # Correct, but re-scans earlier arrivals for every timestamp: O(n^2) reads.
    counts = []
    for i in range(len(times)):
        cutoff = times[i] - window
        count = 0
        for j in range(i, -1, -1):
            if times[j] >= cutoff:
                count += 1
            else:
                break
        counts.append(count)
    return counts
```

## Starter: challenge

```python
```

## Checks

```python
expect("recent_arrivals([1, 2, 10, 11, 12], 3)", lambda: get("recent_arrivals")([1, 2, 10, 11, 12], 3), [1, 2, 1, 2, 3])
expect("recent_arrivals([5, 5, 5], 0)", lambda: get("recent_arrivals")([5, 5, 5], 0), [1, 2, 3])
burst_plain = [i // 2 for i in range(200)]
burst = tracked(burst_plain)
def _expected(seq, w):
    from collections import deque as _d
    q = _d()
    out = []
    for t in seq:
        q.append(t)
        while q[0] < t - w:
            q.popleft()
        out.append(len(q))
    return out
expect_within(
    "recent_arrivals(200 arrivals, window 10)",
    lambda: get("recent_arrivals")(burst, 10),
    _expected(burst_plain, 10),
    burst,
    400,
    "Keep the active window in a deque instead of scanning backwards through times.",
)
```

## Hidden checks

```python
expect("empty list", lambda: get("recent_arrivals")([], 5), [])
expect("single arrival", lambda: get("recent_arrivals")([42], 0), [1])
plain = [i for i in range(2000)]
storm = tracked(plain)
expect_within(
    "recent_arrivals(2,000 arrivals, window 500)",
    lambda: get("recent_arrivals")(storm, 500),
    _expected(plain, 500),
    storm,
    4000,
    "Use a deque so each timestamp is read once and evicted from the front.",
)
```

## Solution

```python
from collections import deque


def recent_arrivals(times, window):
    q = deque()
    counts = []
    for t in times:
        q.append(t)
        while q[0] < t - window:
            q.popleft()
        counts.append(len(q))
    return counts
```

## Restored

The charging bay tracks storm surges in a single pass, reporting rolling queue pressure as fast as drones touch down.
