---
id: tumbling-windows
title: Aggregate streams into tumbling time windows
system: Window desk
symbol: instrument
scene: tests
skills: stream-processing
---

## Briefing

Raw sensor readings arrive at irregular timestamps (`t=103`, `t=107`, `t=119`). Group them into fixed-width non-overlapping **tumbling windows** (`[start, start + size)`) so dashboards show crisp 10-second or 60-second rollups.

## Concept

For an integer `ts` and window width `size >= 1`, the window start aligned to multiples of `size` is:
`win_start = (ts // size) * size`
covering `[win_start, win_start + size)`.

Notice Python's floor division `//` aligns cleanly even for `ts = 0` (`0..size-1` -> `0`, `size..2*size-1` -> `size`).

## Objective

Write `tumbling_sum(events, size)` where `events` is an iterable of `(ts, value)` pairs and `size >= 1` (raise `ValueError` if `size < 1`).

Aggregate the sum of `value` and count of events per window, and return a list of dicts sorted by ascending `"start"`:
`[{"start": win_start, "end": win_start + size, "count": count, "total": total}, ...]`.

## Hints

1. Accumulate `[count, total]` in a dict keyed by `(ts // size) * size`.
2. Sort keys ascending and build the output dicts.

## Starter: guided

```python
def tumbling_sum(events, size):
    if size < 1:
        raise ValueError("window size must be >= 1")
    buckets = {}
    for ts, value in events:
        win_start = (ts // size) * size
        # Update count and total for win_start
        pass
    return [
        {"start": s, "end": s + size, "count": buckets[s][0], "total": buckets[s][1]}
        for s in sorted(buckets)
    ]
```

## Starter: standard

```python
def tumbling_sum(events, size):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "groups out-of-order events into aligned 10s windows",
    lambda: get("tumbling_sum")([(25, 3), (12, 4), (19, 6), (20, 1), (10, 2)], 10),
    [
        {"start": 10, "end": 20, "count": 3, "total": 12},
        {"start": 20, "end": 30, "count": 2, "total": 4},
    ],
)
expect("empty stream returns empty list", lambda: get("tumbling_sum")([], 60), [])
```

## Hidden checks

```python
def _bad():
    try:
        get("tumbling_sum")([(1, 1)], 0)
        return False
    except ValueError:
        return True
expect("size < 1 raises ValueError", _bad, True)
```

## Solution

```python
def tumbling_sum(events, size):
    if size < 1:
        raise ValueError("window size must be >= 1")
    buckets = {}
    for ts, value in events:
        start = (ts // size) * size
        if start not in buckets:
            buckets[start] = [0, 0]
        buckets[start][0] += 1
        buckets[start][1] += value
    return [
        {"start": s, "end": s + size, "count": c, "total": t}
        for s, (c, t) in sorted(buckets.items())
    ]
```

## Restored

Irregular event streams now fold cleanly into aligned tumbling-window summaries.
