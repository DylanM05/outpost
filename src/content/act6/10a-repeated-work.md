---
id: repeated-work
kind: predict
title: Repeated work
system: Supply ledger
symbol: equipment
scene: console
skills: dynamic-programming, recursion, reading-code
---

## Briefing

A drone climbing a stepped ridge can hop up either `1` or `2` ledges at a time. Counting how many distinct ways it can climb `n` ledges is a short recursive function: `ways(n) = ways(n - 1) + ways(n - 2)`. Yet when you ask for `ways(40)`, the program freezes. Trace `ways(4)` and count how many times it solves the exact same subproblem over and over.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

When a recursive function branches into two recursive calls whose inputs overlap, the number of calls grows **exponentially** — roughly `O(2ⁿ)`:

- `ways(4)` calls `ways(3)` and `ways(2)`.
- `ways(3)` calls `ways(2)` and `ways(1)`.
- Both branches solve `ways(2)` from scratch!

At `n = 4` that's only a few extra calls. At `n = 40` it's over 300 million calls — even though there are only 41 distinct values of `n` (`0` through `40`)! Recognizing **overlapping subproblems** is the first step to **dynamic programming**.

## Hints

1. Trace `ways(4)` -> `ways(3)` + `ways(2)`.
2. Every call to `ways(n)` increments `calls[0]` by 1, including base cases `n <= 1`.
3. Count the base-case calls too: `ways(2)` makes 3 calls total (`2`, `1`, `0`), `ways(3)` makes `1 + 3 + 1 = 5`, and `ways(4)` makes `1 + 5 + 3 = 9`.

## Program

```python
calls = [0]
ones = [0]


def ways(n):
    calls[0] += 1
    if n == 1:
        ones[0] += 1
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)


print(ways(4))
print(calls[0])
print(ones[0])
```

## Output

```text
5
9
3
```

## Restored

You watched `ways(1)` get solved three separate times inside a climb of only four ledges — the root cause of exponential slowdown.
