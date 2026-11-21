---
id: maintenance-climb-steps
title: Climbing the radio mast
system: Supply ledger
symbol: controller
scene: tests
skills: dynamic-programming
reviewSkill: dynamic-programming
prerequisite: cheapest-supply-plan
---

## Briefing

A climber ascending the radio mast can step up 1, 2, or 3 rungs at a time. Count how many distinct ways they can reach rung `n` — fast enough for tall masts.

## Objective

Write `count_ways(n)` returning the number of distinct sequences of steps of size `1`, `2`, or `3` that sum to `n` (`count_ways(0) == 1`).

```python
count_ways(3)  # 4: (1+1+1), (1+2), (2+1), (3)
count_ways(4)  # 7
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Base cases: `ways[0] = 1`, `ways[1] = 1`, `ways[2] = 2`.
2. For each `i >= 3`, `ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3]`. Build it bottom-up (or memoize) so `n = 45` finishes instantly.

## Starter

```python
```

## Checks

```python
expect("count_ways(0)", lambda: get("count_ways")(0), 1)
expect("count_ways(3)", lambda: get("count_ways")(3), 4)
expect("count_ways(4)", lambda: get("count_ways")(4), 7)
expect("count_ways(10)", lambda: get("count_ways")(10), 274)
```

## Hidden checks

```python
expect("count_ways(1)", lambda: get("count_ways")(1), 1)
expect("count_ways(2)", lambda: get("count_ways")(2), 2)
expect("count_ways(35) finishes quickly", lambda: get("count_ways")(35), 1132436852)
```

## Solution

```python
def count_ways(n):
    if n < 0:
        return 0
    dp = [1, 1, 2]
    for i in range(3, n + 1):
        dp.append(dp[i - 1] + dp[i - 2] + dp[i - 3])
    return dp[n]
```

## Restored

The bottom-up recurrence counts mast climbs up to 35 rungs in microseconds instead of billions of recursive calls.
