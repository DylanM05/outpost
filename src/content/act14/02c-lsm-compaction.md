---
id: lsm-compaction
kind: code
title: K-way LSM-tree SSTable compaction
system: Memtable rack
symbol: equipment
scene: tests
skills: storage-engines
---

## Briefing

As memtables keep flushing, SSTables pile up — containing stale versions of updated keys and `None` tombstones for deleted keys. **LSM compaction** merges multiple sorted SSTables into **one** clean sorted SSTable in $O(N \log K)$ time using a min-heap (just like merge-k-sorted-lists from Act VI!), keeping only the **newest** value for every duplicate key!

## Objective

Write `compact_sstables(tables, drop_tombstones=False)`:

- `tables` is a list of sorted `[(key, value), ...]` lists ordered from **newest** (`tables[0]`) to **oldest** (`tables[-1]`).
- Merge all tables into one ascending-key sorted list of `(key, value)` tuples:
  - If the same `key` appears in multiple tables, keep the value from the **newest** table (smallest table index `table_idx`) and discard older versions!
  - If `drop_tombstones=True` (bottom-level compaction where no older levels exist!), omit any key whose surviving newest value is `None`. If `False`, keep the tombstone `(key, None)`.
- Return the compacted list of `(key, value)` tuples.

## Concept

Look how cleanly `heapq` solves tie-breaking across tables: push `(key, table_idx, entry_idx, value)` into the min-heap! Because `table_idx` is the second tuple element (`0` is newest, `1` is older, ...), Python's min-heap **automatically pops the newest version of `key` first** — and you simply skip any immediately following entries with the exact same `key`!

## Hints

1. Push `(tables[t][0][0], t, 0, tables[t][0][1])` for every non-empty table `t`.
2. Track `last_key = object()` (a unique sentinel!). When popping `(key, t, idx, val)`:
   - Always push the next item `(tables[t][idx+1][0], t, idx+1, tables[t][idx+1][1])` if `idx + 1 < len(tables[t])`.
   - Only emit `(key, val)` if `key != last_key` (and not `(drop_tombstones and val is None)`), then set `last_key = key`!

## Starter: guided

```python
import heapq


def compact_sstables(tables, drop_tombstones=False):
    heap = []
    for t_idx, table in enumerate(tables):
        if table:
            k, v = table[0]
            heapq.heappush(heap, (k, t_idx, 0, v))
    out = []
    last_key = object()
    while heap:
        key, t_idx, e_idx, val = heapq.heappop(heap)
        # TODO: push next entry from tables[t_idx] if present
        # TODO: emit (key, val) only for the first (newest) occurrence of key
        pass
    return out
```

## Starter: standard

```python
import heapq


def compact_sstables(tables, drop_tombstones=False):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
newest = [("a", 2), ("b", None), ("d", 4)]
middle = [("a", 1), ("b", 20), ("c", 3)]
oldest = [("a", 0), ("c", 0), ("e", 5)]

expect(
    "newest wins on duplicates and tombstones kept when drop_tombstones=False",
    lambda: get("compact_sstables")([newest, middle, oldest], drop_tombstones=False),
    [("a", 2), ("b", None), ("c", 3), ("d", 4), ("e", 5)],
)
expect(
    "bottom-level compaction drops surviving tombstones",
    lambda: get("compact_sstables")([newest, middle, oldest], drop_tombstones=True),
    [("a", 2), ("c", 3), ("d", 4), ("e", 5)],
)
```

## Hidden checks

```python
expect("handles empty tables in list", lambda: get("compact_sstables")([[], [("x", 1)], []]), [("x", 1)])
expect("newer resurrection overrides older tombstone", lambda: get("compact_sstables")([[("k", "alive")], [("k", None)]], drop_tombstones=True), [("k", "alive")])
```

## Solution

```python
import heapq


def compact_sstables(tables, drop_tombstones=False):
    heap = []
    for t_idx, table in enumerate(tables):
        if table:
            k, v = table[0]
            heapq.heappush(heap, (k, t_idx, 0, v))
    out = []
    last_key = object()
    while heap:
        key, t_idx, e_idx, val = heapq.heappop(heap)
        nxt = e_idx + 1
        if nxt < len(tables[t_idx]):
            nk, nv = tables[t_idx][nxt]
            heapq.heappush(heap, (nk, t_idx, nxt, nv))
        if key != last_key:
            last_key = key
            if not (drop_tombstones and val is None):
                out.append((key, val))
    return out
```

## Restored

Stale overwrites and old tombstones merge away cleanly in a single $O(N \log K)$ pass.
