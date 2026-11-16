---
id: merge-sort
title: Merge sort
system: Merge yard
symbol: equipment
scene: calls
skills: sorting, recursion
---

## Briefing

The yard's archive holds years of readings in no order at all. Insertion sort takes all night on it, and the yard's old engineer left a note: "Merging is cheap. Sorting is just merging, if you're patient about it."

## Objective

Write `merge_sort(items)`. Return a **new** list of the items, sorted smallest first, using merge sort: split the list in half, sort each half with `merge_sort`, and merge the sorted halves. Don't use `sorted()` or `.sort()`. Your `merge` from the last repair is included.

```python
merge_sort([38, 27, 43, 3, 9, 82, 10])  # [3, 9, 10, 27, 38, 43, 82]
```

The hidden test sorts 1,200 readings and allows 30,000 comparisons. Insertion sort needs about 360,000.

## Concept

Merge sort is recursion and merging together:

- **Base case:** a list of 0 or 1 items is already sorted. Return a copy of it.
- **Recursive case:** split the list in half with slices, `items[:mid]` and `items[mid:]`, where `mid = len(items) // 2`. Sort each half by calling `merge_sort` on it, then merge the two sorted halves.

It feels like cheating, since sorting each half is the very problem you started with. But each call works on half as much, and the halves keep halving until they reach the base case. Run it and read the call tree: 8 items split into 4 and 4, then 2s, then 1s.

Why it's fast: the splitting goes about `log₂ n` levels deep, about 10 levels for 1,000 items. On each level, the merges handle every item once, `n` comparisons at most. So merge sort makes about `n × log₂ n` comparisons, written `O(n log n)`. For 1,000 items that's about 10,000, where insertion sort on shuffled data makes about 250,000.

`n log n` is as good as a sort that compares items can do, and Python's `sorted()` is in the same class.

## Hints

1. Base case first: `if len(items) <= 1: return items[:]`.
2. `mid = len(items) // 2`, then sort `items[:mid]` and `items[mid:]`, each with a call to `merge_sort`.
3. `return merge(sorted_left, sorted_right)`.

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


def merge_sort(items):
    if len(items) <= 1:
        return items[:]
    mid = len(items) // 2
    left = items[:mid]
    right = items[mid:]
    # The halves aren't sorted yet. Sort each one with merge_sort
    # before merging them.
    return merge(left, right)


print(merge_sort([38, 27, 43, 3, 9, 82, 10]))
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


def merge_sort(items):
    # This is insertion sort on a copy. It's correct, but quadratic.
    # Replace it with merge sort: split, sort each half, merge.
    result = items[:]
    for i in range(1, len(result)):
        item = result[i]
        j = i - 1
        while j >= 0 and result[j] > item:
            result[j + 1] = result[j]
            j -= 1
        result[j + 1] = item
    return result
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


def merge_sort(items):
    return items
```

## Checks

```python
check(
    "Sorts by merging, without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "Split, sort each half with merge_sort, and merge.",
)
expect_recursive("merge_sort([38, 27, 43, 3, 9, 82, 10, 5])", "merge_sort", ([38, 27, 43, 3, 9, 82, 10, 5],), [3, 5, 9, 10, 27, 38, 43, 82])
readings = compared([(i * 37) % 200 for i in range(200)])
expect_comparisons(
    "merge_sort(200 readings)",
    lambda: get("merge_sort")(readings),
    sorted(readings),
    200,
    3000,
    "Split the list in half and sort each half with merge_sort.",
)
```

## Hidden checks

```python
expect_recursive("merge_sort([])", "merge_sort", ([],), [], recurse=False)
expect_recursive("merge_sort([4])", "merge_sort", ([4],), [4], recurse=False)
expect_recursive("merge_sort([2, 1])", "merge_sort", ([2, 1],), [1, 2])
expect_recursive("merge_sort([5, 1, 5, 1, 3])", "merge_sort", ([5, 1, 5, 1, 3],), [1, 1, 3, 5, 5])
original = [3, 1, 2]
check(
    "Leaves the original list unchanged",
    lambda: (get("merge_sort")(original), original)[1] == [3, 1, 2],
    "Return a new list. Slices are already copies.",
)
plain = [(i * 7919) % 100000 for i in range(1200)]
archive = compared(plain)
expect_comparisons(
    "merge_sort(1,200 readings)",
    lambda: get("merge_sort")(archive),
    sorted(plain),
    1200,
    30000,
    "Split the list in half and sort each half with merge_sort.",
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


def merge_sort(items):
    if len(items) <= 1:
        return items[:]
    mid = len(items) // 2
    left = merge_sort(items[:mid])
    right = merge_sort(items[mid:])
    return merge(left, right)
```

## Restored

The archive sorts in moments. The old engineer's note goes up on the wall beside the terminal.
