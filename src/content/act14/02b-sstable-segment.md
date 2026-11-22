---
id: sstable-segment
kind: code
title: Immutable SSTable with sparse index
system: Memtable rack
symbol: equipment
scene: tests
skills: storage-engines
---

## Briefing

When an LSM-tree's in-memory **memtable** fills up, it flushes once to disk as an immutable **SSTable** (*Sorted String Table*): keys stored strictly in sorted order, plus a small **sparse index** keeping only every `stride`-th key's position so lookups narrow straight down to a tiny slice!

## Objective

Write a class `SSTable`:

- `__init__(self, items, stride=4)`:
  - `items` is an iterable of `(key, value)` pairs (or a dict — call `.items()` if `isinstance(items, dict)`).
  - Store `self.entries = sorted(pairs, key=lambda kv: kv[0])` (assuming unique keys).
  - Build a **sparse index** `self.index`: list of `(key, pos)` for `pos = 0, stride, 2*stride, ...` (`len(self.index) == ceil(len(entries) / stride)`).
- `get(self, key)` — returns `(True, value)` if `key` exists in `self.entries`, else `(False, None)`! (Returning a `(found, value)` tuple lets the caller tell `"key not in this SSTable"` apart from `"key was deleted with tombstone value None"`!)
  - Use binary search on `self.index` (or `self.entries`) so lookups run in $O(\log N)$ time!
- `scan(self, low, high)` — returns a list of `(key, value)` tuples for all entries where `low <= key <= high`, in ascending key order (using `bisect_left` to jump straight to `low` without scanning earlier keys!).

## Concept

Why does `SSTable.get(key)` return `(True, None)` for a tombstone instead of just `None`?

Because if SSTable #2 (newer) contains `("freq", None)` (a deletion tombstone) and SSTable #1 (older) still contains `("freq", 147.3)`, returning `(True, None)` tells the LSM reader **"stop searching older SSTables — this key was deleted!"**

## Hints

1. Use `bisect.bisect_right` on the sparse index keys to narrow `[lo, hi]` to a window of width `stride`, then scan/binary-search just that window!
2. In `scan(low, high)`, find the starting index with `bisect.bisect_left(keys, low)` and walk forward until `key > high`.

## Starter: guided

```python
import bisect


class SSTable:
    def __init__(self, items, stride=4):
        pairs = items.items() if isinstance(items, dict) else items
        self.entries = sorted(pairs, key=lambda kv: kv[0])
        self.stride = max(1, stride)
        self.index = [(self.entries[i][0], i) for i in range(0, len(self.entries), self.stride)]
        self._index_keys = [k for k, _ in self.index]

    def get(self, key):
        # TODO: locate block via bisect_right on self._index_keys, then search block [start : start + stride]
        pass

    def scan(self, low, high):
        # TODO: return all (k, v) with low <= k <= high in sorted order
        pass
```

## Starter: standard

```python
import bisect


class SSTable:
    def __init__(self, items, stride=4):
        pass

    def get(self, key):
        pass

    def scan(self, low, high):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
SST = get("SSTable")
data = {f"k{i:02d}": (None if i == 5 else i * 10) for i in range(20)}
t = SST(data, stride=4)

expect("sparse index has 5 entries for 20 keys with stride 4", lambda: len(t.index), 5)
expect("get finds existing value", lambda: t.get("k13"), (True, 130))
expect("get distinguishes tombstone None from missing key", lambda: (t.get("k05"), t.get("k99")), ((True, None), (False, None)))
expect("scan returns inclusive sorted range", lambda: t.scan("k04", "k06"), [("k04", 40), ("k05", None), ("k06", 60)])
```

## Hidden checks

```python
SST = get("SSTable")
empty = SST({})
expect("empty SSTable get and scan", lambda: (empty.get("a"), empty.scan("a", "z")), ((False, None), []))
expect("key smaller than first key returns (False, None)", lambda: SST({"b": 1, "c": 2}).get("a"), (False, None))
```

## Solution

```python
import bisect


class SSTable:
    def __init__(self, items, stride=4):
        pairs = items.items() if isinstance(items, dict) else items
        self.entries = sorted(pairs, key=lambda kv: kv[0])
        self.stride = max(1, stride)
        self.index = [(self.entries[i][0], i) for i in range(0, len(self.entries), self.stride)]
        self._index_keys = [k for k, _ in self.index]

    def get(self, key):
        if not self.entries:
            return False, None
        block = bisect.bisect_right(self._index_keys, key) - 1
        if block < 0:
            return False, None
        start = self.index[block][1]
        end = min(len(self.entries), start + self.stride)
        for i in range(start, end):
            k, v = self.entries[i]
            if k == key:
                return True, v
            if k > key:
                break
        return False, None

    def scan(self, low, high):
        if not self.entries or low > high:
            return []
        block = max(0, bisect.bisect_right(self._index_keys, low) - 1)
        pos = self.index[block][1]
        out = []
        while pos < len(self.entries):
            k, v = self.entries[pos]
            if k > high:
                break
            if k >= low:
                out.append((k, v))
            pos += 1
        return out
```

## Restored

Sparse-indexed SSTables locate keys and inclusive ranges cleanly while distinguishing deletion tombstones from absent keys.
