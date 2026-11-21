---
id: count-min-sketch
title: Estimate heavy hitters with a Count-Min Sketch
system: Sketch rack
symbol: instrument
scene: tests
skills: analytical-storage
---

## Briefing

Tracking exact request counts for 50 million unique IPs takes gigabytes of RAM. A **Count-Min Sketch** uses a tiny fixed 2D table of `depth x width` counters to estimate frequencies in constant space — with a mathematical guarantee that it **never underestimates** the true count!

## Concept

A Count-Min Sketch has `depth` rows, each with `width` integer counters (initialized to `0`):
- For row `r` (`0 .. depth - 1`), hash `(r, item)` deterministically into `0 .. width - 1`, e.g. using `hashlib.blake2b(f"{r}:{item}".encode(), digest_size=8)` modulo `width`.
- `add(item, count=1)`: increment `table[r][col_r] += count` across all `depth` rows.
- `estimate(item)`: return `min(table[r][col_r] for r in range(depth))`.

Why `min`? Hash collisions can only **add** noise from other keys, never subtract! Taking the minimum across independent hash rows discards collided rows and yields the tightest upper bound on the true count.

## Objective

Implement `CountMinSketch(width, depth)` (validate `width >= 1`, `depth >= 1`, else `ValueError`):
- `add(self, item, count=1)` — validates `count >= 0` (else `ValueError`) and increments all `depth` hashed buckets by `count`.
- `estimate(self, item)` — returns the minimum counter across all `depth` hashed buckets for `item`.

## Hints

1. Use `int.from_bytes(hashlib.blake2b(f"{r}:{item}".encode("utf-8"), digest_size=8).digest(), "big") % self.width` for deterministic hashing across runs.
2. Check `estimate(item) >= true_count(item)` always holds!

## Starter: guided

```python
import hashlib


class CountMinSketch:
    def __init__(self, width, depth):
        if width < 1 or depth < 1:
            raise ValueError("width and depth must be >= 1")
        self.width = width
        self.depth = depth
        self.table = [[0] * width for _ in range(depth)]

    def _col(self, row, item):
        digest = hashlib.blake2b(f"{row}:{item}".encode("utf-8"), digest_size=8).digest()
        return int.from_bytes(digest, "big") % self.width

    def add(self, item, count=1):
        if count < 0:
            raise ValueError("count must be >= 0")
        # Increment self.table[r][self._col(r, item)] for each row
        pass

    def estimate(self, item):
        # Return minimum count across all rows
        return 0
```

## Starter: standard

```python
import hashlib


class CountMinSketch:
    def __init__(self, width, depth):
        pass

    def add(self, item, count=1):
        pass

    def estimate(self, item):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _heavy():
    cms = get("CountMinSketch")(width=64, depth=4)
    for i in range(100):
        cms.add(f"noise-{i}", 1)
    cms.add("hot-ip", 500)
    est_hot = cms.estimate("hot-ip")
    est_noise = cms.estimate("noise-0")
    return (est_hot >= 500, est_hot <= 510, est_noise >= 1, est_noise < 20)
expect("estimates heavy hitters tightly and never underestimates", _heavy, (True, True, True, True))

def _exact_uncollided():
    cms = get("CountMinSketch")(width=32, depth=3)
    cms.add("alpha", 7)
    cms.add("alpha", 3)
    return (cms.estimate("alpha"), cms.estimate("never-seen") >= 0)
expect("accumulates counts accurately", _exact_uncollided, (10, True))
```

## Hidden checks

```python
def _no_underestimate():
    cms = get("CountMinSketch")(width=8, depth=3)
    truth = {"a": 12, "b": 4, "c": 25, "d": 1, "e": 9}
    for k, v in truth.items():
        cms.add(k, v)
    return all(cms.estimate(k) >= v for k, v in truth.items())
expect("never underestimates even under heavy hash collisions", _no_underestimate, True)
```

## Solution

```python
import hashlib


class CountMinSketch:
    def __init__(self, width, depth):
        if width < 1 or depth < 1:
            raise ValueError("width and depth must be >= 1")
        self.width = width
        self.depth = depth
        self.table = [[0] * width for _ in range(depth)]

    def _col(self, row, item):
        digest = hashlib.blake2b(f"{row}:{item}".encode("utf-8"), digest_size=8).digest()
        return int.from_bytes(digest, "big") % self.width

    def add(self, item, count=1):
        if count < 0:
            raise ValueError("count must be >= 0")
        for r in range(self.depth):
            self.table[r][self._col(r, item)] += count

    def estimate(self, item):
        return min(self.table[r][self._col(r, item)] for r in range(self.depth))
```

## Restored

Heavy-hitter telemetry now runs in constant memory with guaranteed upper-bound frequency estimates.
