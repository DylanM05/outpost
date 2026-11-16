---
id: find-the-snow-line
title: Find the snow line
system: Map archive
symbol: equipment
scene: work
skills: searching
---

## Briefing

Every marker above a certain height is in snow country, and the drones need different settings there. The planners don't want one particular marker. They want the boundary: the position of the first marker at or above a given height.

## Objective

Write `first_at_least(heights, limit)`. `heights` is sorted from lowest to highest, and may repeat. Return the position of the first height that is **at least** `limit`. If every height is below it, return `len(heights)`.

```python
first_at_least([200, 900, 1500, 1500, 2100], 1500)  # 2
first_at_least([200, 900], 1500)                     # 2
```

The hidden tests use 1,000,000 heights and allow 25 reads per search.

## Concept

Finding a boundary, rather than an exact value, takes a small change to binary search. Instead of stopping at a match, keep narrowing the range until only one position is left:

- Start with `low = 0` and `high = len(heights)`. `high` starts one past the end, because "no height qualifies" is a possible answer.
- Loop `while low < high`, and look at `mid`.
- If the height at `mid` is below the limit, the answer is somewhere after `mid`.
- If it's at or above the limit, the answer is `mid` or somewhere before it. So move `high` **to** `mid`, not past it: `mid` might be the answer.
- When `low` and `high` meet, that's the answer.

This version reads one item per step, which is why the budget is tighter than in exact search.

## Hints

1. `low = 0`, `high = len(heights)`, and loop `while low < high:`.
2. If `heights[mid] < limit`, set `low = mid + 1`. Otherwise, set `high = mid`.
3. Return `low` after the loop. Read `heights[mid]` only once per step.

## Starter: guided

```python
def first_at_least(heights, limit):
    low = 0
    high = len(heights)
    while low < high:
        mid = (low + high) // 2
        if heights[mid] < limit:
            low = mid + 1
        else:
            # mid qualifies, but an earlier height might too.
            # Replace this line: move high to mid instead of stopping.
            return mid
    return low


print(first_at_least([1400, 1500, 1500, 1600, 1700], 1500))
```

## Starter: standard

```python
def first_at_least(heights, limit):
    for i in range(len(heights)):
        if heights[i] >= limit:
            return i
    return len(heights)
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "first_at_least([200, 900, 1500, 1500, 2100], 1500)",
    lambda: get("first_at_least")([200, 900, 1500, 1500, 2100], 1500),
    2,
)
expect(
    "first_at_least([1400, 1500, 1500, 1600, 1700], 1500)",
    lambda: get("first_at_least")([1400, 1500, 1500, 1600, 1700], 1500),
    1,
)
expect("first_at_least([200, 900], 1500)", lambda: get("first_at_least")([200, 900], 1500), 2)
ridge = tracked([i // 3 for i in range(1000)])
expect_within(
    "first_at_least(1,000 heights, 200)",
    lambda: get("first_at_least")(ridge, 200),
    600,
    ridge,
    12,
    "Narrow the range by half on every step, reading one height per step.",
)
```

## Hidden checks

```python
expect("first_at_least([], 10)", lambda: get("first_at_least")([], 10), 0)
expect("first_at_least([10, 20], 5)", lambda: get("first_at_least")([10, 20], 5), 0)
expect("first_at_least([10, 20], 20)", lambda: get("first_at_least")([10, 20], 20), 1)
expect("first_at_least([10, 20], 21)", lambda: get("first_at_least")([10, 20], 21), 2)
expect("first_at_least([7, 7, 7, 7], 7)", lambda: get("first_at_least")([7, 7, 7, 7], 7), 0)
ridge = tracked([i // 2 for i in range(1_000_000)])
expect_within(
    "first_at_least(1,000,000 heights, 250000)",
    lambda: get("first_at_least")(ridge, 250_000),
    500_000,
    ridge,
    25,
    "Narrow the range by half on every step, reading one height per step.",
)
expect_within(
    "first_at_least(1,000,000 heights, 600000)",
    lambda: get("first_at_least")(ridge, 600_000),
    1_000_000,
    ridge,
    25,
    "Narrow the range by half on every step, reading one height per step.",
)
```

## Solution

```python
def first_at_least(heights, limit):
    low = 0
    high = len(heights)
    while low < high:
        mid = (low + high) // 2
        if heights[mid] < limit:
            low = mid + 1
        else:
            high = mid
    return low
```

## Restored

The snow line is drawn on every map, and the drones switch to cold-weather settings the moment they cross it.
