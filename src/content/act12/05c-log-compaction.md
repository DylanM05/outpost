---
id: log-compaction
kind: code
title: Compact a distributed commit log
system: Control plane
symbol: equipment
scene: tests
skills: distributed-systems
---

## Briefing

Distributed logs like Kafka and etcd record every state change as an append-only sequence of `(offset, key, value)` records — where `value is None` is a **tombstone** marking a deletion. Over weeks of updates, the log grows huge unless **log compaction** discards superseded older entries for each key while preserving exact offset ordering!

## Objective

Write `compact_log(entries, drop_tombstones=False)`:

- `entries` is a list of dicts `{"offset": int, "key": str, "value": any}` sorted by ascending `offset`.
- For each distinct `key`, keep **only** the entry with the highest (latest) `offset`.
- If `drop_tombstones` is `True`, drop any surviving entry whose `"value"` is `None` (used once all downstream consumers have seen the deletion!). If `False`, keep the latest tombstone so replicas still learn the key was deleted!
- Return the compacted entries as a list of dicts ordered by ascending `offset`.

```python
compact_log([
    {"offset": 0, "key": "freq", "value": 147.3},
    {"offset": 1, "key": "power", "value": 40},
    {"offset": 2, "key": "freq", "value": 147.9},
    {"offset": 3, "key": "power", "value": None},
])
# [{"offset": 2, "key": "freq", "value": 147.9}, {"offset": 3, "key": "power", "value": None}]
```

## Concept

Why keep tombstones (`drop_tombstones=False`) during normal compaction? Because if a replica was offline from offset 1 to offset 4 and wakes up to catch up, deleting the tombstone prematurely would leave that replica stuck with `"power": 40` forever! Only after a retention window (or full snapshot) is it safe to purge tombstones.

## Hints

1. Walk `entries` once recording `latest[entry["key"]] = entry` (or keeping the entry with larger `offset`).
2. Filter out `entry["value"] is None` only when `drop_tombstones` is `True`, and sort the surviving entries by `entry["offset"]`.

## Starter: guided

```python
def compact_log(entries, drop_tombstones=False):
    latest = {}
    for entry in entries:
        # TODO: keep the entry with the highest offset per key
        pass
    kept = list(latest.values())
    if drop_tombstones:
        kept = [e for e in kept if e["value"] is not None]
    return sorted(kept, key=lambda e: e["offset"])
```

## Starter: standard

```python
def compact_log(entries, drop_tombstones=False):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
log = [
    {"offset": 0, "key": "freq", "value": 147.3},
    {"offset": 1, "key": "power", "value": 40},
    {"offset": 2, "key": "freq", "value": 147.9},
    {"offset": 3, "key": "power", "value": None},
    {"offset": 4, "key": "mode", "value": "winter"},
]
expect(
    "keeps latest per key including tombstones in offset order",
    lambda: get("compact_log")(log),
    [
        {"offset": 2, "key": "freq", "value": 147.9},
        {"offset": 3, "key": "power", "value": None},
        {"offset": 4, "key": "mode", "value": "winter"},
    ],
)
expect(
    "drop_tombstones=True removes deleted keys for snapshots",
    lambda: get("compact_log")(log, drop_tombstones=True),
    [
        {"offset": 2, "key": "freq", "value": 147.9},
        {"offset": 4, "key": "mode", "value": "winter"},
    ],
)
```

## Hidden checks

```python
recreated = [
    {"offset": 0, "key": "k", "value": "v1"},
    {"offset": 1, "key": "k", "value": None},
    {"offset": 2, "key": "k", "value": "v2"},
]
expect("key recreated after tombstone survives compaction", lambda: get("compact_log")(recreated, drop_tombstones=True), [{"offset": 2, "key": "k", "value": "v2"}])
expect("empty log compacts to []", lambda: get("compact_log")([]), [])
```

## Solution

```python
def compact_log(entries, drop_tombstones=False):
    latest = {}
    for entry in entries:
        key = entry["key"]
        if key not in latest or entry["offset"] >= latest[key]["offset"]:
            latest[key] = dict(entry)
    kept = [e for e in latest.values() if not (drop_tombstones and e["value"] is None)]
    return sorted(kept, key=lambda e: e["offset"])
```

## Restored

Weeks of redundant updates collapse into a compact log while preserving tombstones for recovering replicas.
