---
id: cdn-ttl-cache
title: Build an LRU edge cache with TTL and stale-while-revalidate
system: Edge cache
symbol: equipment
scene: tests
skills: cdn-caching
---

## Briefing

A CDN point-of-presence (PoP) keeps hot media in bounded memory using **LRU eviction**, respects each object's **TTL** (`max_age`), and can serve slightly expired items during a `swr` grace window while flagging that a background refresh is needed.

## Concept

Implement `EdgeCache(capacity)`:
- `put(key, value, now, max_age, swr=0)`:
  - Stores `(value, stored_at=now, max_age=max_age, swr=swr)` (moving `key` to most-recently-used).
  - If `max_age <= 0` and `swr <= 0`, do not store (and remove any existing entry for `key`).
  - If inserting exceeds `capacity`, evict the least-recently-used key.
- `get(key, now)` -> returns `(status, value)`:
  - If `key` is absent -> `("MISS", None)`.
  - Let `age = now - stored_at`.
  - If `age < max_age`: mark `key` as most-recently-used and return `("HIT", value)`.
  - Else if `age < max_age + swr`: mark `key` as most-recently-used and return `("STALE", value)`.
  - Else: evict expired `key` and return `("MISS", None)`.

## Objective

Implement `EdgeCache(capacity)` with `put(key, value, now, max_age, swr=0)` and `get(key, now)` (raising `ValueError` if `capacity < 1`).

## Hints

1. `collections.OrderedDict` gives $O(1)$ `move_to_end(key)` and `popitem(last=False)` for LRU eviction!
2. Delete an entry on hard expiry (`age >= max_age + swr`) so expired keys don't occupy capacity.

## Starter: guided

```python
from collections import OrderedDict


class EdgeCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self._store = OrderedDict()

    def put(self, key, value, now, max_age, swr=0):
        pass

    def get(self, key, now):
        pass
```

## Starter: standard

```python
from collections import OrderedDict


class EdgeCache:
    def __init__(self, capacity):
        pass

    def put(self, key, value, now, max_age, swr=0):
        pass

    def get(self, key, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _edge_flow():
    c = get("EdgeCache")(2)
    c.put("/a.js", b"A", now=100, max_age=60, swr=20)
    c.put("/b.js", b"B", now=100, max_age=60, swr=0)
    h1 = c.get("/a.js", now=150)  # HIT (also marks /a.js MRU!)
    c.put("/c.js", b"C", now=155, max_age=60)  # Evicts /b.js (LRU)
    b_evicted = c.get("/b.js", now=156)
    a_stale = c.get("/a.js", now=170)  # age 70 in [60, 80) -> STALE
    a_expired = c.get("/a.js", now=180)  # age 80 >= 80 -> MISS
    return (h1, b_evicted, a_stale, a_expired)
expect("tracks LRU order, fresh hits, SWR grace windows, and hard expiry", _edge_flow, (
    ("HIT", b"A"),
    ("MISS", None),
    ("STALE", b"A"),
    ("MISS", None),
))
```

## Hidden checks

```python
def _zero_ttl():
    c = get("EdgeCache")(2)
    c.put("/x", b"1", now=0, max_age=10)
    c.put("/x", b"2", now=1, max_age=0, swr=0)  # non-cacheable removes old entry
    return c.get("/x", now=2)
expect("zero max_age and swr removes existing cached copy", _zero_ttl, ("MISS", None))

def _bad_cap():
    try:
        get("EdgeCache")(0)
        return False
    except ValueError:
        return True
expect("rejects capacity < 1", _bad_cap, True)
```

## Solution

```python
from collections import OrderedDict


class EdgeCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self._store = OrderedDict()

    def put(self, key, value, now, max_age, swr=0):
        if max_age <= 0 and swr <= 0:
            self._store.pop(key, None)
            return
        self._store[key] = (value, now, max_age, swr)
        self._store.move_to_end(key)
        while len(self._store) > self.capacity:
            self._store.popitem(last=False)

    def get(self, key, now):
        entry = self._store.get(key)
        if entry is None:
            return ("MISS", None)
        value, stored_at, max_age, swr = entry
        age = now - stored_at
        if age < max_age:
            self._store.move_to_end(key)
            return ("HIT", value)
        if age < max_age + swr:
            self._store.move_to_end(key)
            return ("STALE", value)
        del self._store[key]
        return ("MISS", None)
```

## Restored

The edge cache now serves hot assets within bounded memory while honoring freshness and SWR grace windows.
