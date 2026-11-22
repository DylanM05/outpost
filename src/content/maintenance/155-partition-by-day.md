---
id: maintenance-partition-by-day
title: Partition telemetry records by UTC day bucket
system: Pipeline deck
symbol: equipment
scene: tests
skills: data-pipelines
reviewSkill: data-pipelines
prerequisite: join-asof
---

## Briefing

Writing all records into one giant file forces every daily query to scan a year of history. Partition records into day buckets (`ts // 86400`) while preserving arrival order inside each bucket.

## Objective

Write `partition_by_day(records)` where `records` is a list of dicts each containing an integer `"ts"` key (Unix seconds).

Return a dict mapping each integer day index (`record["ts"] // 86400`) to the list of records belonging to that day, preserving their relative order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `86400` seconds = 1 UTC day (`24 * 60 * 60`).
2. Use `buckets.setdefault(rec["ts"] // 86400, []).append(rec)`.

## Starter

```python
```

## Checks

```python
expect(
    "groups records into day buckets preserving order",
    lambda: get("partition_by_day")([{"ts": 86400, "v": 1}, {"ts": 10, "v": 2}, {"ts": 86500, "v": 3}]),
    {1: [{"ts": 86400, "v": 1}, {"ts": 86500, "v": 3}], 0: [{"ts": 10, "v": 2}]},
)
expect("empty list returns empty dict", lambda: get("partition_by_day")([]), {})
```

## Hidden checks

```python
expect("boundary second 86399 belongs to day 0", lambda: list(get("partition_by_day")([{"ts": 86399}, {"ts": 86400}]).keys()), [0, 1])
```

## Solution

```python
def partition_by_day(records):
    buckets = {}
    for rec in records:
        day = rec["ts"] // 86400
        buckets.setdefault(day, []).append(rec)
    return buckets
```

## Restored

Telemetry batches now land cleanly in per-day partitions ready for fast date-pruned queries.
