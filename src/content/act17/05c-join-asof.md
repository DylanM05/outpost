---
id: join-asof
title: Align time series with backward ASOF joins
system: Pipeline deck
symbol: equipment
scene: tests
skills: stream-processing, data-pipelines
---

## Briefing

Sensor readings arrive every second, while calibration offsets only update once an hour — their timestamps never match exactly! A **backward ASOF join** matches each reading `(ts, val)` to the most recent calibration with `cal_ts <= ts` (never looking into the future, preventing data leakage!).

## Concept

Given two lists sorted ascending by timestamp:
- `readings`: `[(ts, reading_val), ...]`
- `calibrations`: `[(cal_ts, offset), ...]`

Walk with two pointers (`j` tracks the newest calibration with `cal_ts <= ts`) in $O(n + m)$ time!
- Advance `j` while `j + 1 < len(calibrations)` and `calibrations[j + 1][0] <= ts`.
- If `calibrations` is non-empty and `calibrations[j][0] <= ts`: check optional `tolerance` (`ts - cal_ts <= tolerance` if `tolerance is not None`). If within tolerance, pair with `calibrations[j][1]`; else `None`.
- Never match a calibration whose `cal_ts > ts`!

## Objective

Write `asof_join(readings, calibrations, tolerance=None)` returning `[(ts, reading_val, matched_offset_or_None), ...]` in the same order as `readings` (assuming both inputs are sorted ascending by timestamp).

## Hints

1. Keep pointer `j = -1`: for each `(ts, val)` in `readings`, while `j + 1 < len(calibrations) and calibrations[j + 1][0] <= ts: j += 1`.
2. If `j >= 0` and `(tolerance is None or ts - calibrations[j][0] <= tolerance)`, emit `(ts, val, calibrations[j][1])`, else `(ts, val, None)`.

## Starter: guided

```python
def asof_join(readings, calibrations, tolerance=None):
    out = []
    j = -1
    n = len(calibrations)
    for ts, val in readings:
        while j + 1 < n and calibrations[j + 1][0] <= ts:
            j += 1
        # Check j >= 0 and tolerance bound, then append (ts, val, matched_or_None)
        out.append((ts, val, None))
    return out
```

## Starter: standard

```python
def asof_join(readings, calibrations, tolerance=None):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "matches each reading to most recent prior calibration",
    lambda: get("asof_join")([(5, "r0"), (10, "r1"), (14, "r2"), (25, "r3")], [(10, 0.1), (20, 0.5)]),
    [(5, "r0", None), (10, "r1", 0.1), (14, "r2", 0.1), (25, "r3", 0.5)],
)
expect(
    "respects optional max staleness tolerance",
    lambda: get("asof_join")([(12, "r1"), (20, "r2")], [(10, 1.5)], tolerance=5),
    [(12, "r1", 1.5), (20, "r2", None)],
)
```

## Hidden checks

```python
expect("empty calibrations yields None for every reading", lambda: get("asof_join")([(1, "a"), (2, "b")], []), [(1, "a", None), (2, "b", None)])
expect("multiple calibrations at same timestamp uses last one", lambda: get("asof_join")([(10, "x")], [(10, "old"), (10, "new")]), [(10, "x", "new")])
```

## Solution

```python
def asof_join(readings, calibrations, tolerance=None):
    out = []
    j = -1
    n = len(calibrations)
    for ts, val in readings:
        while j + 1 < n and calibrations[j + 1][0] <= ts:
            j += 1
        if j >= 0 and (tolerance is None or ts - calibrations[j][0] <= tolerance):
            out.append((ts, val, calibrations[j][1]))
        else:
            out.append((ts, val, None))
    return out
```

## Restored

Time-series streams join cleanly in $O(n + m)$ backward ASOF order with zero future-data leakage.
