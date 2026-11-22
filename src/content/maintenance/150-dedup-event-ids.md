---
id: maintenance-dedup-event-ids
title: Deduplicate stream events within a TTL window
system: Window desk
symbol: instrument
scene: tests
skills: stream-processing
reviewSkill: stream-processing
prerequisite: session-windows
---

## Briefing

At-least-once delivery sends duplicate event IDs on retries. Keep a bounded deduplication cache so any `event_id` seen within the last `ttl` seconds is dropped, while an ID reappearing after `ttl` expires is accepted again.

## Objective

Write `dedup_stream(events, ttl)` where `events` is a list of `(event_id, ts)` tuples ordered by non-decreasing `ts`, and `ttl > 0` (raise `ValueError` if `ttl <= 0`).

An event `(eid, ts)` is a **duplicate** iff `eid` was previously accepted at `prev_ts` with `ts - prev_ts < ttl`. Accepted events update `seen[eid] = ts`; dropped duplicates do NOT refresh `seen[eid]`.

Return the list of accepted `(event_id, ts)` tuples in order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if eid in seen and ts - seen[eid] < ttl: continue`.
2. Otherwise record `seen[eid] = ts` and append `(eid, ts)` to `out`.

## Starter

```python
```

## Checks

```python
expect(
    "drops duplicates inside TTL and accepts again once expired",
    lambda: get("dedup_stream")([("e1", 10), ("e1", 15), ("e2", 16), ("e1", 20)], ttl=10),
    [("e1", 10), ("e2", 16), ("e1", 20)],
)
expect(
    "dropped duplicate does not extend TTL window",
    lambda: get("dedup_stream")([("e1", 0), ("e1", 8), ("e1", 11)], ttl=10),
    [("e1", 0), ("e1", 11)],
)
```

## Hidden checks

```python
def _bad():
    try:
        get("dedup_stream")([], 0)
        return False
    except ValueError:
        return True
expect("ttl <= 0 raises ValueError", _bad, True)
```

## Solution

```python
def dedup_stream(events, ttl):
    if ttl <= 0:
        raise ValueError("ttl must be > 0")
    seen = {}
    out = []
    for eid, ts in events:
        if eid in seen and ts - seen[eid] < ttl:
            continue
        seen[eid] = ts
        out.append((eid, ts))
    return out
```

## Restored

Retry duplicates vanish inside the TTL window without letting stale retries keep extending expiry forever.
