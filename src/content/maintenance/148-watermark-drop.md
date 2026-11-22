---
id: maintenance-watermark-drop
title: Partition on-time vs late stream events
system: Window desk
symbol: instrument
scene: tests
skills: stream-processing
reviewSkill: stream-processing
prerequisite: session-windows
---

## Briefing

Stream processors track a monotonic watermark (`max_event_ts - allowed_lateness`) and route late arrivals to a side output instead of reopening closed windows.

## Objective

Write `partition_by_watermark(events, allowed_lateness)` where `events` is a list of `(ts, payload)` tuples and `allowed_lateness >= 0`.

Start with `watermark = 0`. For each `(ts, payload)` in arrival order:
- If `ts < watermark`, append `(ts, payload)` to `late`.
- Otherwise append `(ts, payload)` to `accepted` and update `watermark = max(watermark, ts - allowed_lateness)`.

Return `(accepted, late)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `ts < watermark` BEFORE updating `watermark`.
2. `watermark` never moves backward: always use `max(watermark, ts - allowed_lateness)`.

## Starter

```python
```

## Checks

```python
expect(
    "separates late arrivals once watermark advances",
    lambda: get("partition_by_watermark")([(10, "a"), (20, "b"), (12, "c"), (15, "d")], 5),
    ([(10, "a"), (20, "b"), (15, "d")], [(12, "c")]),
)
expect("empty stream returns two empty lists", lambda: get("partition_by_watermark")([], 5), ([], []))
```

## Hidden checks

```python
expect("zero lateness rejects any out-of-order older timestamp", lambda: get("partition_by_watermark")([(10, "a"), (9, "b"), (10, "c")], 0), ([(10, "a"), (10, "c")], [(9, "b")]))
```

## Solution

```python
def partition_by_watermark(events, allowed_lateness):
    if allowed_lateness < 0:
        raise ValueError("allowed_lateness must be >= 0")
    watermark = 0
    accepted = []
    late = []
    for ts, payload in events:
        if ts < watermark:
            late.append((ts, payload))
        else:
            accepted.append((ts, payload))
            watermark = max(watermark, ts - allowed_lateness)
    return (accepted, late)
```

## Restored

Late arrivals are cleanly diverted without letting the watermark ever regress.
