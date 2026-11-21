---
id: quicksort
title: Quicksort
system: Pivot rack
symbol: equipment
scene: sort
skills: sorting, recursion
---

## Briefing

Now wire the partition step into full **quicksort**. There is one trap waiting on the ridge: many elevation logs arrive *already sorted* from earlier runs. If quicksort always picks the very last item as its pivot, an already-sorted list splits into `n - 1` and `0` every single time — turning an `O(n log n)` sort into an `O(n²)` disaster that can even blow Python's recursion limit.

## Objective

Write `quick_sort(items)` that sorts `items` **in place** (smallest first) using quicksort.

- Don't use `sorted()` or `.sort()`.
- Pick a pivot that stays fast on **both** shuffled data and already-sorted data (for example, swap the middle element `items[(low + high) // 2]` into `items[high]` before partitioning).

```python
rack = [14, 3, 18, 7, 11, 2, 16, 5, 9]
quick_sort(rack)
# rack is now [2, 3, 5, 7, 9, 11, 14, 16, 18]
```

The hidden tests sort 1,200 shuffled readings and 1,200 already-sorted readings, each with a budget of 30,000 comparisons.

## Concept

Quicksort is divide-and-conquer in place:

1. **Base case:** if `low >= high`, the sub-range has 0 or 1 items and is already sorted.
2. **Choose a good pivot:** swap `items[(low + high) // 2]` with `items[high]` so that on sorted or reverse-sorted inputs the pivot lands near the middle instead of at an extreme.
3. **Partition:** `p = partition(items, low, high)` puts the pivot in its final slot.
4. **Recurse:** sort `low..p - 1` and `p + 1..high` (skipping `p`, which is already in place).

On balanced splits, the recursion is only `log₂ n` levels deep and each level does `O(n)` work, giving `O(n log n)` average time and `O(log n)` stack space — no copied lists like merge sort.

## Hints

1. Write a helper `_sort(items, low, high)` and call `_sort(items, 0, len(items) - 1)` from `quick_sort(items)`.
2. Before calling `partition(items, low, high)`, swap the middle element into `high`: `mid = (low + high) // 2; items[mid], items[high] = items[high], items[mid]`.
3. After `p = partition(items, low, high)`, recurse on `(low, p - 1)` and `(p + 1, high)`.

## Starter: guided

```python
def partition(items, low, high):
    mid = (low + high) // 2
    items[mid], items[high] = items[high], items[mid]
    pivot = items[high]
    i = low
    for j in range(low, high):
        if items[j] <= pivot:
            items[i], items[j] = items[j], items[i]
            i += 1
    items[i], items[high] = items[high], items[i]
    return i


def _sort(items, low, high):
    if low >= high:
        return
    p = partition(items, low, high)
    # Sort the left side (low .. p - 1) and the right side (p + 1 .. high).


def quick_sort(items):
    _sort(items, 0, len(items) - 1)
```

## Starter: standard

```python
def partition(items, low, high):
    pivot = items[high]
    i = low
    for j in range(low, high):
        if items[j] <= pivot:
            items[i], items[j] = items[j], items[i]
            i += 1
    items[i], items[high] = items[high], items[i]
    return i


def quick_sort(items):
    # Replace this insertion sort with quicksort using a middle pivot.
    for i in range(1, len(items)):
        item = items[i]
        j = i - 1
        while j >= 0 and items[j] > item:
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = item
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Sorts by hand without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "Use partition and recursive quicksort instead of sorted() or .sort().",
)
small = [14, 3, 18, 7, 11, 2, 16, 5, 9]
rec = tracked(small, record=True)
expect_sorted("quick_sort(9 readings)", lambda: get("quick_sort")(rec), rec, sorted(small))

plain200 = [(i * 73) % 200 for i in range(200)]
comp200 = compared(plain200)
expect_comparisons(
    "quick_sort(200 shuffled readings)",
    lambda: (get("quick_sort")(comp200), comp200)[1],
    sorted(plain200),
    200,
    3500,
    "Partition around a pivot and sort both sides recursively.",
)
```

## Hidden checks

```python
def _sorted_copy(vals):
    arr = vals[:]
    get("quick_sort")(arr)
    return arr

expect("quick_sort([])", lambda: _sorted_copy([]), [])
expect("quick_sort([7])", lambda: _sorted_copy([7]), [7])
expect("quick_sort with duplicates", lambda: _sorted_copy([5, 1, 5, 2, 1, 3, 5]), [1, 1, 2, 3, 5, 5, 5])

plain = [(i * 7919) % 100000 for i in range(1200)]
shuffled = compared(plain)
expect_comparisons(
    "quick_sort(1,200 shuffled readings)",
    lambda: (get("quick_sort")(shuffled), shuffled)[1],
    sorted(plain),
    1200,
    30000,
    "Partition around a middle pivot and recurse on both halves.",
)

ordered_plain = list(range(1200))
ordered = compared(ordered_plain)
expect_comparisons(
    "quick_sort(1,200 already-sorted readings)",
    lambda: (get("quick_sort")(ordered), ordered)[1],
    ordered_plain,
    1200,
    30000,
    "Swap the middle item into high before partitioning so sorted input doesn't degrade to O(n^2).",
)
```

## Solution

```python
def partition(items, low, high):
    mid = (low + high) // 2
    items[mid], items[high] = items[high], items[mid]
    pivot = items[high]
    i = low
    for j in range(low, high):
        if items[j] <= pivot:
            items[i], items[j] = items[j], items[i]
            i += 1
    items[i], items[high] = items[high], items[i]
    return i


def _sort(items, low, high):
    if low >= high:
        return
    p = partition(items, low, high)
    _sort(items, low, p - 1)
    _sort(items, p + 1, high)


def quick_sort(items):
    _sort(items, 0, len(items) - 1)
```

## Restored

The pivot rack sorts shuffled and pre-sorted archives alike in place, staying fast without copying a single slice.
