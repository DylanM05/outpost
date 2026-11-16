---
id: search-the-archive
title: Search the archive
system: Map archive
symbol: equipment
scene: work
skills: searching
---

## Briefing

The archive's index holds a million marker codes, sorted from smallest to largest. The old lookup reads them one at a time from the start, and the drones time out waiting for an answer.

## Objective

Write `find_marker(codes, target)`. `codes` is a list of numbers sorted from smallest to largest. Return the position of `target`, or `-1` if it isn't there.

```python
find_marker([3, 8, 15, 21, 40], 21)  # 3
find_marker([3, 8, 15, 21, 40], 9)   # -1
```

The hidden tests use 1,000,000 codes and allow 40 reads per search.

## Concept

This is the archivist's binary search, written as a function:

```python
low = 0
high = len(items) - 1
while low <= high:
    mid = (low + high) // 2
    ...
```

Compare the item at `mid` with the target. If they match, return `mid`. If the item is smaller, the target can only be to the right, so set `low = mid + 1`. If it's larger, set `high = mid - 1`. If `low` passes `high`, the range is empty and the target isn't in the list.

Every read counts toward the budget, so read the middle item once and store it in a variable.

Python's `bisect` module does this for you, and it's what you'd use in real code. Writing binary search once yourself is how you learn where its off-by-one mistakes hide.

## Hints

1. Start with `low = 0` and `high = len(codes) - 1`, and loop `while low <= high:`.
2. Read the middle once with `value = codes[mid]`, and return `mid` if it equals the target.
3. If `value < target`, set `low = mid + 1`, otherwise `high = mid - 1`. Return `-1` after the loop.

## Starter: guided

```python
def find_marker(codes, target):
    low = 0
    high = len(codes) - 1
    while low <= high:
        mid = (low + high) // 2
        value = codes[mid]
        if value == target:
            return mid
        elif value < target:
            low = mid + 1
        else:
            # Replace this line: the target can only be in the left half.
            return -1
    return -1


print(find_marker([3, 8, 15, 21, 40], 8))
```

## Starter: standard

```python
def find_marker(codes, target):
    for i in range(len(codes)):
        if codes[i] == target:
            return i
    return -1
```

## Starter: challenge

```python
```

## Checks

```python
expect("find_marker([3, 8, 15, 21, 40], 21)", lambda: get("find_marker")([3, 8, 15, 21, 40], 21), 3)
expect("find_marker([3, 8, 15, 21, 40], 8)", lambda: get("find_marker")([3, 8, 15, 21, 40], 8), 1)
expect("find_marker([3, 8, 15, 21, 40], 9)", lambda: get("find_marker")([3, 8, 15, 21, 40], 9), -1)
index = tracked(list(range(0, 3000, 3)))
expect_within(
    "find_marker(1,000 codes, 2997)",
    lambda: get("find_marker")(index, 2997),
    999,
    index,
    20,
    "Halve the range on every step instead of checking codes one by one.",
)
```

## Hidden checks

```python
expect("find_marker([], 5)", lambda: get("find_marker")([], 5), -1)
expect("find_marker([5], 5)", lambda: get("find_marker")([5], 5), 0)
expect("find_marker([5], 4)", lambda: get("find_marker")([5], 4), -1)
expect("find_marker([3, 8, 15, 21, 40], 3)", lambda: get("find_marker")([3, 8, 15, 21, 40], 3), 0)
expect("find_marker([3, 8, 15, 21, 40], 40)", lambda: get("find_marker")([3, 8, 15, 21, 40], 40), 4)
archive = tracked(list(range(0, 3_000_000, 3)))
expect_within(
    "find_marker(1,000,000 codes, 1500000)",
    lambda: get("find_marker")(archive, 1_500_000),
    500_000,
    archive,
    40,
    "Halve the range on every step instead of checking codes one by one.",
)
expect_within(
    "find_marker(1,000,000 codes, 1500001)",
    lambda: get("find_marker")(archive, 1_500_001),
    -1,
    archive,
    40,
    "Halve the range on every step instead of checking codes one by one.",
)
```

## Solution

```python
def find_marker(codes, target):
    low = 0
    high = len(codes) - 1
    while low <= high:
        mid = (low + high) // 2
        value = codes[mid]
        if value == target:
            return mid
        elif value < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

## Restored

A lookup in a million codes now takes about twenty reads instead of a million. The drones stop timing out.
