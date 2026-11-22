---
id: dataloader-batcher
title: Eliminate GraphQL N+1 queries with a DataLoader batcher
system: Graph rail
symbol: controller
scene: tests
skills: graphql-batching
---

## Briefing

Fetching 50 posts and then resolving each post's `author` individually fires **51 database queries** (the notorious **N+1 problem**)! Facebook's **DataLoader** pattern solves this with two simple ideas: **batch** all keys queued during a tick into a single `batch_fn(unique_keys)` call, and **memoize** loaded keys for the lifetime of the request!

## Concept

Implement `DataLoader(batch_fn)`:
- `batch_fn(keys)` receives a list of **unique** keys in first-requested order and returns a list of values of the **exact same length** aligned 1-to-1 with `keys` (if `len(values) != len(keys)`, raise `ValueError`).
- **`load_many(keys)`:**
  - Look up each key in `self.cache`.
  - Collect all uncached keys, **deduplicated** in first-seen order (`missing`).
  - If `missing` is non-empty, call `batch_fn(missing)` **once**, verify its length matches `len(missing)`, and store every `(k, v)` into `self.cache`!
  - Return `[self.cache[k] for k in keys]` (in the caller's exact input order, including duplicates!).
- **`load(key)`:** Convenience method calling `load_many([key])[0]`.
- **`prime(key, value)`:** Pre-populates `self.cache[key] = value` (without calling `batch_fn`) if `key` is not already cached.
- **`clear(key=None)`:** Evicts one `key` from `self.cache` (or clears the whole cache if `key is None`).

## Objective

Implement `DataLoader(batch_fn)` with `load`, `load_many`, `prime`, and `clear`.

## Hints

1. Deduplicating `missing` while preserving order is just:
   ```python
   missing = []
   seen = set()
   for k in keys:
       if k not in self.cache and k not in seen:
           seen.add(k)
           missing.append(k)
   ```
2. If all requested keys are already cached, do NOT invoke `batch_fn([])` at all!

## Starter: guided

```python
class DataLoader:
    def __init__(self, batch_fn):
        self.batch_fn = batch_fn
        self.cache = {}

    def load_many(self, keys):
        pass

    def load(self, key):
        return self.load_many([key])[0]

    def prime(self, key, value):
        if key not in self.cache:
            self.cache[key] = value

    def clear(self, key=None):
        if key is None:
            self.cache.clear()
        else:
            self.cache.pop(key, None)
```

## Starter: standard

```python
class DataLoader:
    def __init__(self, batch_fn):
        pass

    def load_many(self, keys):
        pass

    def load(self, key):
        pass

    def prime(self, key, value):
        pass

    def clear(self, key=None):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _batch_dedup():
    calls = []
    db = {1: "Ada", 2: "Lin", 3: "Sam"}
    def batch(keys):
        calls.append(list(keys))
        return [db.get(k) for k in keys]
    dl = get("DataLoader")(batch)
    dl.prime(3, "Sam-primed")
    r1 = dl.load_many([2, 1, 2, 3, 1])  # only [2, 1] hit batch_fn once!
    r2 = dl.load(1)                     # cache hit -> 0 extra batch calls!
    dl.clear(1)
    r3 = dl.load(1)                     # cache miss after clear -> 1 call for [1]
    return (r1, r2, r3, calls)
expect("deduplicates keys, batches into one call, caches across loads, and honors prime/clear", _batch_dedup, (
    ["Lin", "Ada", "Lin", "Sam-primed", "Ada"],
    "Ada",
    "Ada",
    [[2, 1], [1]],
))
```

## Hidden checks

```python
def _bad_batch_len():
    dl = get("DataLoader")(lambda keys: [])
    try:
        dl.load_many([1, 2])
        return False
    except ValueError:
        return True
expect("raises ValueError when batch_fn returns wrong number of results", _bad_batch_len, True)
expect("empty load_many skips batch_fn", lambda: get("DataLoader")(lambda k: 1 / 0).load_many([]), [])
```

## Solution

```python
class DataLoader:
    def __init__(self, batch_fn):
        self.batch_fn = batch_fn
        self.cache = {}

    def load_many(self, keys):
        missing = []
        seen = set()
        for k in keys:
            if k not in self.cache and k not in seen:
                seen.add(k)
                missing.append(k)
        if missing:
            values = self.batch_fn(missing)
            if len(values) != len(missing):
                raise ValueError("batch_fn returned mismatched length")
            for k, v in zip(missing, values):
                self.cache[k] = v
        return [self.cache[k] for k in keys]

    def load(self, key):
        return self.load_many([key])[0]

    def prime(self, key, value):
        if key not in self.cache:
            self.cache[key] = value

    def clear(self, key=None):
        if key is None:
            self.cache.clear()
        else:
            self.cache.pop(key, None)
```

## Restored

The graph rail's DataLoader collapses N+1 fan-out storms into single deduplicated batch queries.
