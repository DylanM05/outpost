---
id: maintenance-fix-insertion
title: Fix the straggler sort
system: Sample sorter
symbol: equipment
scene: sort
skills: sorting
reviewSkill: sorting
prerequisite: loading-order
---

## Briefing

Someone broke the rack's in-place insertion sort: it leaves the smallest straggler stuck in the wrong slot and drops an item when sorting descending lists. Fix it in place without using `sorted()` or `.sort()`.

## Objective

Fix `insertion_sort(items)` so it sorts `items` **in place** in ascending order, without calling `sorted()` or `.sort()`. On a nearly sorted 1,000-item rack (10 out-of-place stragglers), stay within 6,000 reads.

```python
rack = [5, 2, 4, 1, 3]
insertion_sort(rack)  # rack becomes [1, 2, 3, 4, 5]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check the `while` condition: `j` must be allowed to reach `0` (`j >= 0`), not stop at `j > 0`!
2. Shift `items[j + 1] = items[j]` before decrementing `j`, and drop `key` into `items[j + 1]`.

## Starter

```python
def insertion_sort(items):
    for i in range(1, len(items)):
        key = items[i]
        j = i - 1
        while j > 0 and items[j] > key:
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = key
```

## Checks

```python
check("Sorts by hand without sorted() or .sort()", lambda: not uses("sorted", "sort"))
small = tracked([5, 2, 4, 1, 3], record=True)
expect_sorted("insertion_sort([5, 2, 4, 1, 3])", lambda: get("insertion_sort")(small), small, [1, 2, 3, 4, 5])
```

## Hidden checks

```python
empty = tracked([])
expect_sorted("empty list", lambda: get("insertion_sort")(empty), empty, [])
rev = tracked([4, 3, 2, 1])
expect_sorted("reverse list", lambda: get("insertion_sort")(rev), rev, [1, 2, 3, 4])
nearly = list(range(1000))
for k in range(50, 1000, 100):
    nearly[k], nearly[k - 1] = nearly[k - 1], nearly[k]
t_nearly = tracked(nearly)
expect_sorted("nearly sorted 1,000 items", lambda: get("insertion_sort")(t_nearly), t_nearly, list(range(1000)), budget=6000)
```

## Solution

```python
def insertion_sort(items):
    for i in range(1, len(items)):
        key = items[i]
        j = i - 1
        while j >= 0 and items[j] > key:
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = key
```

## Restored

Stragglers slide cleanly into slot `0` again, and nearly sorted racks finish in a single quick sweep.
