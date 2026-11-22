---
id: idempotent-upsert
title: Apply idempotent out-of-order CDC upserts
system: Schema gate
symbol: controller
scene: tests
skills: data-pipelines
---

## Briefing

Change Data Capture (CDC) streams replay batches on retries and deliver updates out of order. Folding events by `(event_ts, seq)` ensures replaying the same batch twice — or receiving an older update late — produces the exact same table state!

## Concept

Each CDC event dict has:
`{"key": str, "op": "upsert" | "delete", "ts": int, "seq": int, "value": any}` (`"value"` optional for `"delete"`).
Maintain per-key state keeping the event with the **largest `(ts, seq)`** tuple!
- If an incoming event has `(ts, seq) <= current_version[key]`, ignore it (stale or duplicate replay!).
- After folding all events, emit only live keys whose winning event has `op == "upsert"` (omitting keys whose newest event was `"delete"`!).

## Objective

Write `apply_cdc(events)` returning a dict `{key: value}` representing the final live table snapshot. Raise `ValueError` for any event whose `"op"` is neither `"upsert"` nor `"delete"`.

## Hints

1. Track `latest[key] = ((ts, seq), op, value)`.
2. Only overwrite `latest[key]` when `key not in latest or (ts, seq) > latest[key][0]`. Finally return `{k: v for k, (_, op, v) in latest.items() if op == "upsert"}`.

## Starter: guided

```python
def apply_cdc(events):
    latest = {}
    for ev in events:
        op = ev["op"]
        if op not in ("upsert", "delete"):
            raise ValueError(f"unknown op: {op}")
        ver = (ev["ts"], ev["seq"])
        key = ev["key"]
        # Update latest[key] only if ver is strictly newer
        pass
    return {k: val for k, (_, op, val) in latest.items() if op == "upsert"}
```

## Starter: standard

```python
def apply_cdc(events):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _cdc():
    evs = [
        {"key": "a", "op": "upsert", "ts": 10, "seq": 1, "value": "v1"},
        {"key": "a", "op": "upsert", "ts": 20, "seq": 1, "value": "v2"},
        {"key": "a", "op": "upsert", "ts": 15, "seq": 9, "value": "stale"},
        {"key": "b", "op": "upsert", "ts": 10, "seq": 1, "value": "temp"},
        {"key": "b", "op": "delete", "ts": 10, "seq": 2},
    ]
    fn = get("apply_cdc")
    return (fn(evs), fn(evs + evs))
expect("handles out-of-order updates, tombstones, and duplicate replay idempotently", _cdc, ({"a": "v2"}, {"a": "v2"}))
```

## Hidden checks

```python
def _resurrect():
    evs = [
        {"key": "x", "op": "delete", "ts": 5, "seq": 1},
        {"key": "x", "op": "upsert", "ts": 6, "seq": 0, "value": "reborn"},
    ]
    return get("apply_cdc")(evs)
expect("newer upsert resurrects previously deleted key", _resurrect, {"x": "reborn"})
```

## Solution

```python
def apply_cdc(events):
    latest = {}
    for ev in events:
        op = ev["op"]
        if op not in ("upsert", "delete"):
            raise ValueError(f"unknown CDC op: {op}")
        key = ev["key"]
        ver = (ev["ts"], ev["seq"])
        prev = latest.get(key)
        if prev is None or ver > prev[0]:
            latest[key] = (ver, op, ev.get("value"))
    return {k: val for k, (_, op, val) in latest.items() if op == "upsert"}
```

## Restored

Out-of-order and replayed CDC batches now converge deterministically to the exact latest snapshot.
