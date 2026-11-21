---
id: mvcc-visibility
kind: predict
title: MVCC snapshot visibility
system: Snapshot lock
symbol: controller
scene: console
skills: storage-engines, reading-code
---

## Briefing

How does PostgreSQL let a long reporting query read a consistent database snapshot while hundreds of writers keep updating rows at the same time — **without readers blocking writers or writers blocking readers**?

**MVCC (Multi-Version Concurrency Control)** keeps multiple timestamped versions of every key (`[(commit_ts, value), ...]`), and every transaction reads only the newest version committed **at or before** its own `snapshot_ts`!

## Objective

Trace the two overlapping transactions below and predict **every line it prints**.

## Concept

When `T1` starts at `snapshot_ts = 1`, it sees only versions with `commit_ts <= 1` (`"fuel": 100`). While `T1` is still running, `T2` commits a brand-new version `(commit_ts=2, 75)`. Because `2 > 1`, `T1` still reads `100` (repeatable snapshot!), while a fresh `T3` starting at `snapshot_ts = 2` immediately sees `75`!

## Hints

1. `read_at("fuel", 1)` looks at versions with `ts <= 1` -> `(1, 100)` -> `100`.
2. After `T2` appends `(2, 75)`, `T1` STILL queries with `snapshot_ts = 1` -> still `100`!
3. `T3` starts at `snapshot_ts = 2` -> newest version with `ts <= 2` is `75`.

## Program

```python
versions = {"fuel": [(1, 100)]}


def read_at(key, snapshot_ts):
    visible = [val for ts, val in versions.get(key, []) if ts <= snapshot_ts]
    return visible[-1] if visible else None


t1_snap = 1
print("T1 before T2:", read_at("fuel", t1_snap))

# T2 commits a new version at timestamp 2
versions["fuel"].append((2, 75))

print("T1 after T2:", read_at("fuel", t1_snap))
print("T3 at ts=2:", read_at("fuel", 2))
```

## Output

```text
T1 before T2: 100
T1 after T2: 100
T3 at ts=2: 75
```

## Restored

Readers see frozen point-in-time snapshots without ever locking out concurrent writers.
