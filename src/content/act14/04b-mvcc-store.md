---
id: mvcc-store
kind: code
title: Snapshot isolation and write-write conflicts
system: Snapshot lock
symbol: controller
scene: tests
skills: storage-engines
---

## Briefing

Snapshot isolation lets concurrent transactions run without blocking each other — until **two overlapping transactions both try to modify the exact same key**! To prevent lost updates, MVCC databases enforce **First-Committer-Wins**: the first transaction to commit succeeds, and the second aborts with a write-write conflict!

## Objective

Write a class `MVCCStore`:

- `__init__(self)` starts with `self._ts = 0` (latest committed timestamp) and `self._versions = {}` (`key -> list[(commit_ts, value)]`).
- `begin(self)` — creates and returns a new transaction handle/dict `{"snapshot_ts": self._ts, "writes": {}, "closed": False}`.
- `get(self, tx, key)`:
  - If `key in tx["writes"]`: return `tx["writes"][key]` (a transaction must always read its own uncommitted writes!).
  - Otherwise find the newest version `(ts, val)` in `self._versions.get(key, [])` with `ts <= tx["snapshot_ts"]` and return `val` (or `None` if none exists).
- `put(self, tx, key, value)`:
  - Raise `RuntimeError` if `tx["closed"]`.
  - Buffer `tx["writes"][key] = value` (invisible to other transactions until `commit`!).
- `commit(self, tx)`:
  - Raise `RuntimeError` if `tx["closed"]`.
  - **First-Committer-Wins check:** for every `key` in `tx["writes"]`, inspect the latest committed timestamp in `self._versions.get(key, [])`. If any `latest_ts > tx["snapshot_ts"]`, mark `tx["closed"] = True` and raise `RuntimeError("write-write conflict")` without committing **any** of `tx`'s writes!
  - Otherwise increment `self._ts += 1`, append `(self._ts, val)` to `self._versions[key]` for every `key, val` in `tx["writes"]`, mark `tx["closed"] = True`, and return `self._ts`!

## Concept

Notice the three ACID guarantees this ~40-line class delivers:
1. **Read-your-own-writes** (`tx["writes"]` checked first).
2. **Repeatable snapshot reads** (`ts <= tx["snapshot_ts"]`, unaffected by concurrent commits).
3. **Atomic First-Committer-Wins** (all keys checked *before* any version is appended, so a conflicting transaction aborts cleanly as a whole!).

## Hints

1. Check every key in `tx["writes"]` for conflicts in a loop *before* incrementing `self._ts` or appending anything to `self._versions`!
2. Read-only transactions (empty `tx["writes"]`) always commit cleanly without conflict.

## Starter: guided

```python
class MVCCStore:
    def __init__(self):
        self._ts = 0
        self._versions = {}

    def begin(self):
        return {"snapshot_ts": self._ts, "writes": {}, "closed": False}

    def get(self, tx, key):
        if key in tx["writes"]:
            return tx["writes"][key]
        # TODO: return newest committed version with ts <= tx["snapshot_ts"], else None
        pass

    def put(self, tx, key, value):
        if tx["closed"]:
            raise RuntimeError("transaction already closed")
        tx["writes"][key] = value

    def commit(self, tx):
        if tx["closed"]:
            raise RuntimeError("transaction already closed")
        # TODO: check First-Committer-Wins on every key in tx["writes"], then atomically commit at self._ts + 1
        pass
```

## Starter: standard

```python
class MVCCStore:
    def __init__(self):
        pass

    def begin(self):
        pass

    def get(self, tx, key):
        pass

    def put(self, tx, key, value):
        pass

    def commit(self, tx):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
MVCC = get("MVCCStore")
def test_snapshot_and_conflict():
    db = MVCC()
    t0 = db.begin()
    db.put(t0, "a", 10)
    db.put(t0, "b", 20)
    db.commit(t0)

    t1 = db.begin()
    t2 = db.begin()
    db.put(t1, "a", 11)
    db.put(t2, "a", 22)
    db.put(t2, "b", 25)
    t1_own = db.get(t1, "a")       # read-your-own-write -> 11
    t2_sees_b = db.get(t2, "b")    # 25
    db.commit(t1)                  # first committer wins!
    # t2 still sees snapshot b=20? No, t2 wrote b=25, but t2's commit MUST fail because 'a' conflicted!
    conflict = False
    try:
        db.commit(t2)
    except RuntimeError:
        conflict = True
    # Check atomicity: t2's write to 'b' must NOT have leaked!
    t3 = db.begin()
    return (t1_own, t2_sees_b, conflict, db.get(t3, "a"), db.get(t3, "b"))

expect("enforces snapshot isolation, read-your-own-writes, and atomic First-Committer-Wins", test_snapshot_and_conflict, (11, 25, True, 11, 20))
```

## Hidden checks

```python
MVCC = get("MVCCStore")
def test_disjoint_writes_both_commit():
    db = MVCC()
    t1 = db.begin()
    t2 = db.begin()
    db.put(t1, "x", 1)
    db.put(t2, "y", 2)
    db.commit(t1)
    db.commit(t2)   # different keys -> no conflict!
    t3 = db.begin()
    return (db.get(t3, "x"), db.get(t3, "y"))

expect("concurrent transactions writing disjoint keys both commit cleanly", test_disjoint_writes_both_commit, (1, 2))
```

## Solution

```python
class MVCCStore:
    def __init__(self):
        self._ts = 0
        self._versions = {}

    def begin(self):
        return {"snapshot_ts": self._ts, "writes": {}, "closed": False}

    def get(self, tx, key):
        if key in tx["writes"]:
            return tx["writes"][key]
        history = self._versions.get(key, [])
        for ts, val in reversed(history):
            if ts <= tx["snapshot_ts"]:
                return val
        return None

    def put(self, tx, key, value):
        if tx["closed"]:
            raise RuntimeError("transaction already closed")
        tx["writes"][key] = value

    def commit(self, tx):
        if tx["closed"]:
            raise RuntimeError("transaction already closed")
        for key in tx["writes"]:
            history = self._versions.get(key, [])
            if history and history[-1][0] > tx["snapshot_ts"]:
                tx["closed"] = True
                raise RuntimeError(f"write-write conflict on {key}")
        self._ts += 1
        for key, val in tx["writes"].items():
            self._versions.setdefault(key, []).append((self._ts, val))
        tx["closed"] = True
        return self._ts
```

## Restored

Concurrent readers and disjoint writers fly in parallel while conflicting writes fail atomically under First-Committer-Wins.
