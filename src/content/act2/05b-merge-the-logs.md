---
id: merge-the-logs
title: Merge the logs
system: Merge yard
symbol: equipment
scene: work
skills: sorting, loops
---

## Briefing

Every evening, the two survey teams' logs come in, each already in time order. The old merge program glued them together and sorted the whole thing again, and on long days it ran past midnight. Merge them the way the yard does.

## Objective

Write `merge(left, right)`. Both lists are sorted, smallest first. Return a **new** sorted list of all their items, without changing either list, and without `sorted()` or `.sort()`.

```python
merge([3, 9, 14], [5, 6, 20])  # [3, 5, 6, 9, 14, 20]
merge([], [4, 8])              # [4, 8]
```

The tests count comparisons. The hidden test merges two logs of 5,000 entries, and allows 20,000 comparisons.

## Concept

This is the zip you traced, written as a function. Keep a position in each list, take the smaller front item each time, and add whatever's left over at the end.

The tests count comparisons between entries, rather than reads, because sorts copy lists around and comparisons are what they really spend. Every `<`, `<=`, `>`, or `>=` between two entries counts once, wherever it happens.

A good merge makes at most one comparison per item placed. Re-sorting the joined lists, or searching the merged list for where each item goes, does far more.

## Hints

1. Start with an empty list and `i = 0`, `j = 0`, then loop `while i < len(left) and j < len(right):`.
2. If `left[i] <= right[j]`, append `left[i]` and add 1 to `i`. Otherwise, append `right[j]` and add 1 to `j`.
3. After the loop, add `left[i:]` and `right[j:]` to the end. One of them is empty.

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
            # Take from right instead, and move j forward.
            j += 1
    # Add whatever's left in either list.
    return merged


print(merge([3, 9, 14], [5, 6, 20]))
```

## Starter: standard

```python
def merge(left, right):
    # Walk through both lists with a position in each, always taking the
    # smaller front item. Then add whatever's left over.
    return []
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Merges by hand, without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "Both lists are already sorted, so a single pass can merge them.",
)
expect("merge([3, 9, 14], [5, 6, 20])", lambda: get("merge")([3, 9, 14], [5, 6, 20]), [3, 5, 6, 9, 14, 20])
expect("merge([], [4, 8])", lambda: get("merge")([], [4, 8]), [4, 8])
a = compared(range(0, 100, 2))
b = compared(range(1, 100, 2))
expect_comparisons(
    "merge(50 entries, 50 entries)",
    lambda: get("merge")(a, b),
    list(range(100)),
    100,
    200,
    "Take the smaller front item each time, instead of searching or sorting.",
)
```

## Hidden checks

```python
expect("merge([], [])", lambda: get("merge")([], []), [])
expect("merge([7], [])", lambda: get("merge")([7], []), [7])
expect("merge([1, 2, 3], [4, 5])", lambda: get("merge")([1, 2, 3], [4, 5]), [1, 2, 3, 4, 5])
expect("merge([4, 5], [1, 2, 3])", lambda: get("merge")([4, 5], [1, 2, 3]), [1, 2, 3, 4, 5])
expect("merge([2, 2, 5], [2, 3])", lambda: get("merge")([2, 2, 5], [2, 3]), [2, 2, 2, 3, 5])
first = [1, 4]
second = [2, 3]
check(
    "Leaves both lists unchanged",
    lambda: (get("merge")(first, second), first, second)[1:] == ([1, 4], [2, 3]),
    "Read the lists by position instead of removing items from them.",
)
a = compared(range(0, 10000, 2))
b = compared(range(1, 10000, 2))
expect_comparisons(
    "merge(5,000 entries, 5,000 entries)",
    lambda: get("merge")(a, b),
    list(range(10000)),
    10000,
    20000,
    "Take the smaller front item each time, instead of searching or sorting.",
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
```

## Restored

The evening logs merge in a blink, and the night shift goes to bed before midnight for the first time this season.
