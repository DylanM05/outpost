---
id: cheapest-supply-plan
title: Cheapest supply plan
system: Supply ledger
symbol: equipment
scene: tests
skills: dynamic-programming
---

## Briefing

When packing fuel canisters for a deep survey run, the depot stocks fixed canister sizes (for example, `1`, `3`, and `4` liters) and wants the **fewest** canisters that add up to an exact `target` volume. A greedy packer always grabs the largest canister that fits — which fails on `target = 6` with `[1, 3, 4]` (greedy takes `4 + 1 + 1 = 3` canisters, while `3 + 3 = 2` is better). Replace the greedy rule with **bottom-up dynamic programming**.

## Objective

Write `min_canisters(target, sizes)`.

- `target` is a non-negative integer volume.
- `sizes` is a list of positive integer canister volumes (each size can be used as many times as needed).
- Return the **minimum** number of canisters that sum exactly to `target`, or `-1` if `target` cannot be formed.

```python
min_canisters(6, [1, 3, 4])   # 2  (3 + 3, not 4 + 1 + 1)
min_canisters(11, [1, 2, 5])  # 3  (5 + 5 + 1)
min_canisters(3, [2, 4])      # -1 (impossible)
```

## Concept

**Bottom-up dynamic programming (tabulation)** builds a table `best[0..target]` from smallest subproblem up to `target`, with no recursion at all:

- `best[0] = 0` (zero canisters to make 0 liters).
- Initialize `best[1..target]` to a sentinel larger than any valid answer, like `target + 1` (or `float("inf")`).
- For each volume `v` from `1` to `target`:
  - Try every `size` in `sizes` with `size <= v`:
    `best[v] = min(best[v], best[v - size] + 1)`
- If `best[target]` is still unreachable, return `-1`; otherwise return `best[target]`.

Each volume `v` checks each canister size once, so total work is `O(target × len(sizes))` — fast and exact even when greedy fails!

## Hints

1. Start with `INF = target + 1` and `best = [INF] * (target + 1)`, with `best[0] = 0`.
2. Loop `for v in range(1, target + 1):`, and inside it `for size in sizes: if size <= v: best[v] = min(best[v], best[v - size] + 1)`.
3. Return `-1` if `best[target] == INF`, else `best[target]`.

## Starter: guided

```python
def min_canisters(target, sizes):
    INF = target + 1
    best = [INF] * (target + 1)
    best[0] = 0
    for v in range(1, target + 1):
        for size in sizes:
            if size <= v:
                # Update best[v] if using this canister improves on it.
                pass
    return -1 if best[target] == INF else best[target]


print(min_canisters(6, [1, 3, 4]))
```

## Starter: standard

```python
def min_canisters(target, sizes):
    # Greedy approach: always takes the largest canister that fits.
    # Fails when a slightly smaller canister leads to fewer total canisters!
    remaining = target
    count = 0
    for size in sorted(sizes, reverse=True):
        if remaining >= size:
            take = remaining // size
            count += take
            remaining -= take * size
    return count if remaining == 0 else -1
```

## Starter: challenge

```python
```

## Checks

```python
expect("min_canisters(6, [1, 3, 4]) beats greedy", lambda: get("min_canisters")(6, [1, 3, 4]), 2, "Greedy gives 4+1+1 (3), but 3+3 uses only 2.")
expect("min_canisters(11, [1, 2, 5])", lambda: get("min_canisters")(11, [1, 2, 5]), 3)
expect("min_canisters(3, [2, 4]) is impossible", lambda: get("min_canisters")(3, [2, 4]), -1)
expect("min_canisters(0, [1, 5])", lambda: get("min_canisters")(0, [1, 5]), 0)
```

## Hidden checks

```python
expect("min_canisters(14, [1, 7, 10])", lambda: get("min_canisters")(14, [1, 7, 10]), 2)
expect("min_canisters(0, [])", lambda: get("min_canisters")(0, []), 0)
expect("min_canisters(5, [])", lambda: get("min_canisters")(5, []), -1)
expect("min_canisters(63, [1, 5, 10, 21, 25])", lambda: get("min_canisters")(63, [1, 5, 10, 21, 25]), 3)
expect("min_canisters(500, [3, 7, 19])", lambda: get("min_canisters")(500, [3, 7, 19]), 28)
```

## Solution

```python
def min_canisters(target, sizes):
    INF = target + 1
    best = [INF] * (target + 1)
    best[0] = 0
    for v in range(1, target + 1):
        for size in sizes:
            if size <= v and best[v - size] + 1 < best[v]:
                best[v] = best[v - size] + 1
    return -1 if best[target] == INF else best[target]
```

## Restored

The depot packs the minimum number of canisters for every run, never wasting weight on a greedy shortcut again.
