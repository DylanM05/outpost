---
id: maintenance-k-smallest
title: K lightest crates
system: Priority board
symbol: equipment
scene: work
skills: heaps
reviewSkill: heaps
prerequisite: urgent-repairs
---

## Briefing

A light drone only needs the `k` lightest weights out of thousands of crates on the manifest. Use a heap so you don't sort the entire manifest unnecessarily.

## Objective

Write `k_lightest(weights, k)`. Return the `k` smallest values from `weights` in ascending order (`[]` if `k <= 0`). Use `heapq` (for example, `heapq.nsmallest` or a bounded max-heap of size `k` using negated values). On 2,000 crates with `k = 5`, make at most 6,000 comparisons.

```python
k_lightest([40, 12, 85, 7, 19, 3], 3)  # [3, 7, 12]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `import heapq` and call `heapq.nsmallest(k, weights)` (handling `k <= 0` cleanly).
2. Or maintain a bounded heap of size `k` in `O(n log k)` comparisons.

## Starter

```python
```

## Checks

```python
expect("k_lightest([40, 12, 85, 7, 19, 3], 3)", lambda: get("k_lightest")([40, 12, 85, 7, 19, 3], 3), [3, 7, 12])
expect("k <= 0 returns []", lambda: get("k_lightest")([5, 1], 0), [])
```

## Hidden checks

```python
expect("k larger than list returns all sorted", lambda: get("k_lightest")([9, 2], 5), [2, 9])
plain = [(i * 7919) % 50000 for i in range(2000)]
comp = compared(plain)
expect_comparisons("k_lightest(2,000 crates, k=5)", lambda: get("k_lightest")(comp, 5), sorted(plain)[:5], 2000, 6000, "Use heapq.nsmallest or a bounded heap instead of sorting all 2,000 items.")
```

## Solution

```python
import heapq


def k_lightest(weights, k):
    if k <= 0:
        return []
    return heapq.nsmallest(k, weights)
```

## Restored

The loading script picks the `k` lightest crates in one linear pass over the manifest.
