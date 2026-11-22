---
id: lru-buffer-pool
kind: code
title: O(1) LRU buffer pool cache
system: B-tree vault
symbol: controller
scene: tests
skills: storage-engines
---

## Briefing

Disk reads are thousands of times slower than RAM. Every relational database (PostgreSQL's `shared_buffers`, SQLite's page cache) keeps hot disk pages in a fixed-size **LRU (Least Recently Used) Buffer Pool**, evicting the page that hasn't been touched for the longest time whenever RAM fills up!

## Objective

Write a class `LRUCache`:

- `__init__(self, capacity)` — validate `capacity >= 1` (`ValueError` otherwise). Initializes empty cache plus `self.hits = 0` and `self.misses = 0`.
- `get(self, key)`:
  - If `key` is in the cache: increment `self.hits += 1`, mark `key` as **most recently used**, and return its value.
  - Otherwise: increment `self.misses += 1` and return `None`.
- `put(self, key, value)`:
  - If `key` is already in the cache: update its value and mark it **most recently used** (no eviction!).
  - Otherwise: if `len == capacity`, evict the **least recently used** key first; then insert `(key, value)` as most recently used.
- `keys_mru(self)` — returns current keys ordered from **most recently used** to **least recently used**.

## Concept

Combining a hash map with a doubly linked list gives **$O(1)$** `get`, **$O(1)$** `put`, and **$O(1)$** eviction! Python's standard library `collections.OrderedDict` implements this exact data structure natively (`move_to_end(key)` and `popitem(last=False)`).

## Hints

1. Keep `self._od = OrderedDict()`, treating the **right end** (`last=True`) as most recently used and the **left end** (`last=False`) as least recently used.
2. `self._od.move_to_end(key)` promotes a key in $O(1)$, `self._od.popitem(last=False)` evicts the LRU key in $O(1)$, and `list(reversed(self._od))` returns MRU -> LRU order!

## Starter: guided

```python
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self._od = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key not in self._od:
            self.misses += 1
            return None
        self.hits += 1
        # TODO: promote key to MRU and return value
        pass

    def put(self, key, value):
        # TODO: update/insert key as MRU, evicting LRU with popitem(last=False) if over capacity
        pass

    def keys_mru(self):
        return list(reversed(self._od))
```

## Starter: standard

```python
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        pass

    def put(self, key, value):
        pass

    def keys_mru(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
LRU = get("LRUCache")
def test_lru_eviction():
    c = LRU(2)
    c.put("p1", "A")
    c.put("p2", "B")
    v1 = c.get("p1")      # promotes p1 -> MRU is [p1, p2]
    c.put("p3", "C")      # evicts p2 (LRU)!
    v2 = c.get("p2")      # miss -> None
    c.put("p1", "A2")     # update existing -> promotes p1, no eviction!
    return (v1, v2, c.keys_mru(), c.hits, c.misses)

expect("evicts LRU page, promotes on get and update, tracks hits/misses", test_lru_eviction, ("A", None, ["p1", "p3"], 1, 1))
```

## Hidden checks

```python
LRU = get("LRUCache")
def test_large_o1():
    c = LRU(100)
    for i in range(2000):
        c.put(i, i * 2)
    return (len(c.keys_mru()), c.get(1999), c.get(0))

expect("2000 inserts stay fast and keep newest 100 pages", test_large_o1, (100, 3998, None))
```

## Solution

```python
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self._od = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key not in self._od:
            self.misses += 1
            return None
        self.hits += 1
        self._od.move_to_end(key)
        return self._od[key]

    def put(self, key, value):
        if key in self._od:
            self._od[key] = value
            self._od.move_to_end(key)
            return
        if len(self._od) >= self.capacity:
            self._od.popitem(last=False)
        self._od[key] = value

    def keys_mru(self):
        return list(reversed(self._od))
```

## Restored

Hot index pages stay pinned in RAM in $O(1)$ time while cold pages rotate out cleanly.
