---
id: merge-every-station
title: Merge every station
system: Merge yard
symbol: equipment
scene: calls
skills: sorting, recursion
---

## Briefing

The weather stations along the ridge each send a sorted log of readings every hour, hundreds of stations at once. The yard merges them all into one sorted timeline. Its current program merges them one at a time onto a growing pile, and it's falling behind.

## Objective

Write `merge_all(logs)`. `logs` is a list of sorted lists. Return one sorted list of every reading, using `merge`, without `sorted()` or `.sort()`. If there are no logs, return an empty list. Your `merge` is included.

```python
merge_all([[4, 9], [1, 7], [3, 8], [2]])  # [1, 2, 3, 4, 7, 8, 9]
```

The hidden test merges 256 logs of 10 readings, and allows 45,000 comparisons.

## Concept

Merging logs one at a time onto a pile looks reasonable, but the pile gets longer with every merge, and each merge walks through the whole pile again. The first readings get compared over and over: with `k` logs, that's about `k` passes over a growing pile, which grows like `k × k`.

Merge sort has a better shape: merge in **pairs**, like a tournament. Split the list of logs in half, merge each half into one log with `merge_all`, then merge the two results. Every reading is merged about `log₂ k` times, not `k` times.

It's the same recursion as merge sort, with logs where merge sort had single items:

- No logs: return `[]`. One log: return a copy of it.
- Otherwise: split `logs` in half, `merge_all` each half, and `merge` the two results.

Spotting that a new problem has the same shape as one you've already solved is most of what makes algorithms useful.

## Hints

1. Two base cases: `len(logs) == 0` returns `[]`, and `len(logs) == 1` returns `logs[0][:]`.
2. `mid = len(logs) // 2`, then `merge_all(logs[:mid])` and `merge_all(logs[mid:])`.
3. Return `merge` of the two results.

## Starter: guided

```python
def merge(left, right):
    merged = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged += left[i:]
    merged += right[j:]
    return merged


def merge_all(logs):
    if len(logs) == 0:
        return []
    if len(logs) == 1:
        return logs[0][:]
    mid = len(logs) // 2
    # Merge each half of the logs into one log with merge_all, then
    # merge those two logs together.
    return merge(logs[0], logs[1])


print(merge_all([[4, 9], [1, 7], [3, 8], [2]]))
```

## Starter: standard

```python
def merge(left, right):
    merged = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged += left[i:]
    merged += right[j:]
    return merged


def merge_all(logs):
    # This merges the logs one at a time onto a growing pile. It's correct,
    # but the pile gets compared again on every merge. Merge in pairs instead.
    pile = []
    for log in logs:
        pile = merge(pile, log)
    return pile
```

## Starter: challenge

```python
def merge(left, right):
    merged = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged += left[i:]
    merged += right[j:]
    return merged


def merge_all(logs):
    return []
```

## Checks

```python
check(
    "Merges by hand, without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "Merge the logs in pairs with merge.",
)
expect_recursive("merge_all([[4, 9], [1, 7], [3, 8], [2]])", "merge_all", ([[4, 9], [1, 7], [3, 8], [2]],), [1, 2, 3, 4, 7, 8, 9])
stations = [compared(sorted((i * 31 + k * 17) % 500 for k in range(10))) for i in range(32)]
expect_comparisons(
    "merge_all(32 logs of 10)",
    lambda: get("merge_all")(stations),
    sorted(reading for log in stations for reading in log),
    320,
    3200,
    "Merge in pairs, splitting the logs in half, instead of onto one growing pile.",
)
```

## Hidden checks

```python
expect_recursive("merge_all([])", "merge_all", ([],), [], recurse=False)
expect_recursive("merge_all([[5, 6]])", "merge_all", ([[5, 6]],), [5, 6], recurse=False)
expect_recursive("merge_all([[], [3], []])", "merge_all", ([[], [3], []],), [3])
expect_recursive("merge_all([[2, 2], [1, 2]])", "merge_all", ([[2, 2], [1, 2]],), [1, 2, 2, 2])
stations = [compared(sorted((i * 131 + k * 977) % 100000 for k in range(10))) for i in range(256)]
expect_comparisons(
    "merge_all(256 logs of 10)",
    lambda: get("merge_all")(stations),
    sorted(reading for log in stations for reading in log),
    2560,
    45000,
    "Merge in pairs, splitting the logs in half, instead of onto one growing pile.",
)
```

## Solution

```python
def merge(left, right):
    merged = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged += left[i:]
    merged += right[j:]
    return merged


def merge_all(logs):
    if len(logs) == 0:
        return []
    if len(logs) == 1:
        return logs[0][:]
    mid = len(logs) // 2
    return merge(merge_all(logs[:mid]), merge_all(logs[mid:]))
```

## Restored

Hundreds of station logs become one timeline before the hour is up. The yard catches up, and stays caught up.
