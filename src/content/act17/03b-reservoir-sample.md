---
id: reservoir-sample
title: Sample unknown-length streams with Algorithm R
system: Sketch rack
symbol: instrument
scene: tests
skills: analytical-storage
---

## Briefing

How do you pick a perfectly uniform random sample of `k = 5` log lines from a stream whose total length `N` you don't know ahead of time — and can't fit in RAM? Vitter's **Algorithm R (Reservoir Sampling)** does it in one pass using $O(k)$ memory!

## Concept

Maintain a list `reservoir` of size at most `k`:
For each item at 0-based stream index `i = 0, 1, 2, ...`:
- If `i < k`: append `item` directly into `reservoir`.
- If `i >= k`: pick a random integer `j = randint_fn(0, i)` (inclusive `0..i`).
  - If `j < k`: replace `reservoir[j] = item`!
  - Otherwise discard `item`.

By induction, after seeing `i + 1` items, EVERY item seen so far has exact probability `k / (i + 1)` of sitting in `reservoir`!

## Objective

Write `reservoir_sample(stream, k, randint_fn)` where `stream` is any iterable, `k >= 0` (raise `ValueError` if `k < 0`), and `randint_fn(lo, hi)` returns an integer in `[lo, hi]` inclusive.

If `k == 0`, return `[]` without calling `randint_fn`. Otherwise follow Algorithm R exactly and return the `reservoir` list.

## Hints

1. For `i < k`, do NOT call `randint_fn` — just fill the initial reservoir directly.
2. For `i >= k`, call `j = randint_fn(0, i)` and assign `reservoir[j] = item` iff `j < k`.

## Starter: guided

```python
def reservoir_sample(stream, k, randint_fn):
    if k < 0:
        raise ValueError("k must be >= 0")
    if k == 0:
        return []
    reservoir = []
    for i, item in enumerate(stream):
        if i < k:
            reservoir.append(item)
        else:
            # Call randint_fn(0, i) and replace reservoir[j] if j < k
            pass
    return reservoir
```

## Starter: standard

```python
def reservoir_sample(stream, k, randint_fn):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _deterministic():
    picks = iter([1, 4, 0])
    calls = []
    def rng(lo, hi):
        calls.append((lo, hi))
        return next(picks)
    res = get("reservoir_sample")(["a", "b", "c", "d", "e", "f"], 3, rng)
    return (res, calls)
expect("follows Algorithm R replacement indices and bounds", _deterministic, (["f", "d", "c"], [(0, 3), (0, 4), (0, 5)]))

expect("stream shorter than k returns all items without calling rng", lambda: get("reservoir_sample")([10, 20], 5, lambda a, b: 1/0), [10, 20])
```

## Hidden checks

```python
expect("k=0 returns empty list", lambda: get("reservoir_sample")([1, 2, 3], 0, lambda a, b: 1/0), [])
def _neg():
    try:
        get("reservoir_sample")([], -1, lambda a, b: 0)
        return False
    except ValueError:
        return True
expect("negative k raises ValueError", _neg, True)
```

## Solution

```python
def reservoir_sample(stream, k, randint_fn):
    if k < 0:
        raise ValueError("k must be >= 0")
    if k == 0:
        return []
    reservoir = []
    for i, item in enumerate(stream):
        if i < k:
            reservoir.append(item)
        else:
            j = randint_fn(0, i)
            if j < k:
                reservoir[j] = item
    return reservoir
```

## Restored

One-pass reservoir sampling now captures unbiased snapshots of unbounded streams in $O(k)$ memory.
