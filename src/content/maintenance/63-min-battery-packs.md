---
id: maintenance-min-battery-packs
title: Fewest battery packs
system: Supply ledger
symbol: controller
scene: tests
skills: dynamic-programming
reviewSkill: dynamic-programming
prerequisite: cheapest-supply-plan
---

## Briefing

Battery packs come in fixed capacities (for example `[1, 3, 4]`), with unlimited stock of each size. Greedy selection fails (`[1, 3, 4]` for target `6` needs two `3`s, not `4 + 1 + 1`). Find the true minimum number of packs.

## Objective

Write `min_packs(sizes, target)` returning the smallest number of packs from `sizes` that sum to `target`, or `-1` if no combination reaches `target` (`0` when `target == 0`).

```python
min_packs([1, 3, 4], 6)  # 2 (3 + 3)
min_packs([2], 3)        # -1
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Create `dp = [float("inf")] * (target + 1)` with `dp[0] = 0`.
2. For every `amt` from `1` to `target` and every `size` in `sizes`, if `size <= amt`, update `dp[amt] = min(dp[amt], dp[amt - size] + 1)`.

## Starter

```python
```

## Checks

```python
expect("min_packs([1, 3, 4], 6) beats greedy", lambda: get("min_packs")([1, 3, 4], 6), 2)
expect("min_packs([1, 5, 10], 12)", lambda: get("min_packs")([1, 5, 10], 12), 3)
expect("impossible target returns -1", lambda: get("min_packs")([2, 4], 7), -1)
```

## Hidden checks

```python
expect("target 0 needs 0 packs", lambda: get("min_packs")([3, 5], 0), 0)
expect("larger target finishes quickly", lambda: get("min_packs")([1, 7, 10], 14), 2)
expect("target 99 with [2, 5, 11]", lambda: get("min_packs")([2, 5, 11], 99), 9)
```

## Solution

```python
def min_packs(sizes, target):
    if target == 0:
        return 0
    inf = target + 1
    dp = [inf] * (target + 1)
    dp[0] = 0
    for amt in range(1, target + 1):
        for s in sizes:
            if s <= amt and dp[amt - s] + 1 < dp[amt]:
                dp[amt] = dp[amt - s] + 1
    return -1 if dp[target] > target else dp[target]
```

## Restored

The depot packs the lightest possible sled load even when greedy picks would overshoot.
