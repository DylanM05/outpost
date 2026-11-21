---
id: maintenance-mvcc-read-at
title: Read the latest visible MVCC version
system: Snapshot lock
symbol: equipment
scene: tests
skills: storage-engines
reviewSkill: storage-engines
prerequisite: mvcc-store
---

## Briefing

Under MVCC snapshot isolation, a reader pinned to `snapshot_ts` must see the newest committed version with `commit_ts <= snapshot_ts` — ignoring both future commits and deleted (`None`) tombstones appropriately.

## Objective

Write `read_snapshot(versions, snapshot_ts)` where `versions` is a list of `(commit_ts, value)` tuples (not guaranteed to be sorted, all `commit_ts` distinct integers) and `snapshot_ts` is an integer.

Return the `value` belonging to the entry with the **largest** `commit_ts <= snapshot_ts`, or `None` if no entry has `commit_ts <= snapshot_ts` (or if that newest visible entry's `value` is `None`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter to `visible = [(ts, val) for ts, val in versions if ts <= snapshot_ts]`.
2. If `visible` is empty, return `None`; otherwise pick `max(visible, key=lambda item: item[0])[1]`.

## Starter

```python
```

## Checks

```python
expect("picks newest version at or before snapshot_ts", lambda: get("read_snapshot")([(10, "v2"), (3, "v1"), (15, "v3")], 12), "v2")
expect("includes exact timestamp match", lambda: get("read_snapshot")([(3, "v1"), (10, "v2")], 10), "v2")
expect("returns None when all versions are in the future", lambda: get("read_snapshot")([(5, "v1"), (9, "v2")], 4), None)
```

## Hidden checks

```python
expect("respects None tombstone shadowing older value", lambda: get("read_snapshot")([(2, "alive"), (6, None)], 8), None)
expect("sees older value before tombstone timestamp", lambda: get("read_snapshot")([(2, "alive"), (6, None)], 5), "alive")
```

## Solution

```python
def read_snapshot(versions, snapshot_ts):
    best_ts = None
    best_val = None
    for ts, val in versions:
        if ts <= snapshot_ts and (best_ts is None or ts > best_ts):
            best_ts = ts
            best_val = val
    return best_val
```

## Restored

Snapshot readers see an exact point-in-time view without being disturbed by concurrent newer commits.
