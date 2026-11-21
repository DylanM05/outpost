---
id: bloom-filter
kind: code
title: Space-efficient Bloom filter
system: Memtable rack
symbol: equipment
scene: tests
skills: storage-engines
---

## Briefing

An LSM-tree database like RocksDB or Cassandra may have dozens of SSTable files on disk. Searching every single file on disk for a key that doesn't exist would be painfully slow!

A **Bloom filter** sits in RAM in front of each SSTable as a tiny bit array:
- If `might_contain(key)` returns **`False`**, the key is **100% guaranteed NOT** in that SSTable (skip the disk read completely!).
- If it returns **`True`**, the key is *probably* there (with a small, tunable false-positive rate).

## Objective

Write a class `BloomFilter`:

- `__init__(self, num_bits, num_hashes)`:
  - Validate `num_bits >= 1` and `num_hashes >= 1` (raise `ValueError` otherwise).
  - Store bit storage (e.g. a Python `int` bitmask `self._bits = 0` or `bytearray`).
- `_positions(self, key)` — computes `num_hashes` deterministic bit indices in `0 .. num_bits - 1`, using e.g. `int.from_bytes(hashlib.sha256(f"{i}:{key}".encode("utf-8")).digest()[:8], "big") % self.num_bits` for `i in range(self.num_hashes)`.
- `add(self, key)` — sets all `num_hashes` bit positions for `key` to `1`.
- `might_contain(self, key)` — returns `True` iff **every** one of `key`'s `num_hashes` bit positions is `1` (else `False`).

## Concept

Because a Bloom filter only stores bits (never the actual keys!), 10 bits per key with 7 hashes gives a **< 1% false-positive rate** and **0% false negatives** — cutting wasted disk reads on absent keys by 99%+!

## Hints

1. A single Python `int` works great as a compact bitset: set bit `pos` with `self._bits |= (1 << pos)`, and test bit `pos` with `(self._bits >> pos) & 1`.
2. Make sure `might_contain` returns a `bool` (`all((self._bits >> p) & 1 for p in self._positions(key))`).

## Starter: guided

```python
import hashlib


class BloomFilter:
    def __init__(self, num_bits, num_hashes):
        if num_bits < 1 or num_hashes < 1:
            raise ValueError("num_bits and num_hashes must be >= 1")
        self.num_bits = num_bits
        self.num_hashes = num_hashes
        self._bits = 0

    def _positions(self, key):
        return [
            int.from_bytes(hashlib.sha256(f"{i}:{key}".encode("utf-8")).digest()[:8], "big") % self.num_bits
            for i in range(self.num_hashes)
        ]

    def add(self, key):
        # TODO: set every bit in self._positions(key)
        pass

    def might_contain(self, key):
        # TODO: return True iff all bits in self._positions(key) are set
        pass
```

## Starter: standard

```python
import hashlib


class BloomFilter:
    def __init__(self, num_bits, num_hashes):
        pass

    def add(self, key):
        pass

    def might_contain(self, key):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
BF = get("BloomFilter")
def test_zero_false_negatives_and_low_fp():
    bf = BF(num_bits=1024, num_hashes=5)
    inserted = [f"station-{i}" for i in range(100)]
    for k in inserted:
        bf.add(k)
    no_fn = all(bf.might_contain(k) for k in inserted)
    fps = sum(1 for i in range(100, 300) if bf.might_contain(f"station-{i}"))
    return (no_fn, fps < 15)

expect("zero false negatives and low false-positive rate on 200 absent keys", test_zero_false_negatives_and_low_fp, (True, True))
expect("empty Bloom filter returns False", lambda: BF(64, 3).might_contain("anything"), False)
```

## Hidden checks

```python
BF = get("BloomFilter")
def bad_init():
    try:
        BF(0, 3)
        return False
    except ValueError:
        return True
check("num_bits < 1 raises ValueError", bad_init)
```

## Solution

```python
import hashlib


class BloomFilter:
    def __init__(self, num_bits, num_hashes):
        if num_bits < 1 or num_hashes < 1:
            raise ValueError("num_bits and num_hashes must be >= 1")
        self.num_bits = num_bits
        self.num_hashes = num_hashes
        self._bits = 0

    def _positions(self, key):
        return [
            int.from_bytes(hashlib.sha256(f"{i}:{key}".encode("utf-8")).digest()[:8], "big") % self.num_bits
            for i in range(self.num_hashes)
        ]

    def add(self, key):
        for pos in self._positions(key):
            self._bits |= 1 << pos

    def might_contain(self, key):
        return all((self._bits >> pos) & 1 for pos in self._positions(key))
```

## Restored

Absent-key lookups now short-circuit in RAM without wasting a single disk read on empty SSTables.
