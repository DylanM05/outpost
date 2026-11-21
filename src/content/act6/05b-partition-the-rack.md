---
id: partition-the-rack
title: Partition the rack
system: Pivot rack
symbol: equipment
scene: sort
skills: sorting
---

## Briefing

The deep survey racks sort elevation samples in place because the field units have almost no spare memory. The first piece of quicksort is the partition step: take a slice of the rack from `low` to `high`, use `items[high]` as the pivot, and move every item `<= pivot` to the left of the pivot's final slot.

## Objective

Write `partition(items, low, high)` that rearranges `items[low : high + 1]` **in place** using `items[high]` as the pivot and returns the pivot's final index `p`:

- Every item in `items[low : p]` is `<= pivot`.
- `items[p]` is the pivot.
- Every item in `items[p + 1 : high + 1]` is `> pivot`.
- Items outside `low..high` must not be touched.

```python
rack = [7, 2, 9, 1, 4]
p = partition(rack, 0, 4)
# p == 2, rack[:2] has items <= 4, rack[2] == 4, rack[3:] has items > 4
```

Don't use `sorted()` or `.sort()`.

## Concept

Partitioning only scans the range `low..high` once (`O(n)` work for that slice):

1. Save `pivot = items[high]` and start `i = low`.
2. For `j` in `range(low, high)`:
   - If `items[j] <= pivot`, swap `items[i]` and `items[j]`, then increment `i`.
3. After the loop, swap `items[i]` and `items[high]`, and return `i`.

Notice why the `low` and `high` bounds matter: quicksort will call `partition` on smaller and smaller sub-ranges of the same list without slicing copies.

## Hints

1. Loop `for j in range(low, high):` — stop before `high` because `items[high]` is the pivot.
2. Swap with `items[i], items[j] = items[j], items[i]` whenever `items[j] <= pivot`, then `i += 1`.
3. After the loop, swap `items[i], items[high] = items[high], items[i]` and `return i`.

## Starter: guided

```python
def partition(items, low, high):
    pivot = items[high]
    i = low
    for j in range(low, high):
        if items[j] <= pivot:
            # Swap items[i] and items[j], then advance i.
            pass
    # Put the pivot in slot i and return i.
    return low


rack = [7, 2, 9, 1, 4]
print(partition(rack, 0, 4), rack)
```

## Starter: standard

```python
def partition(items, low, high):
    return low
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Partitions by hand without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "Move items around the pivot with swaps instead of calling sort.",
)

def valid_partition(before, after, low, high, p):
    if not isinstance(p, int) or not (low <= p <= high):
        return False
    pivot = before[high]
    if after[:low] != before[:low] or after[high + 1:] != before[high + 1:]:
        return False
    if sorted(after[low:high + 1]) != sorted(before[low:high + 1]):
        return False
    return after[p] == pivot and all(x <= pivot for x in after[low:p]) and all(x > pivot for x in after[p + 1:high + 1])

sample = [14, 3, 18, 7, 11, 2, 16, 5, 9]
rec = tracked(sample, record=True)
outcome = safe(lambda: get("partition")(rec, 0, len(sample) - 1))
ok = outcome.error is None and valid_partition(sample, list(rec), 0, len(sample) - 1, outcome.value)
check(
    "partition([14, 3, 18, 7, 11, 2, 16, 5, 9], 0, 8)",
    lambda: ok if outcome.error is None else (_ for _ in ()).throw(RuntimeError(outcome.error)),
    f"Pivot 9 should separate <= 9 on the left from > 9 on the right (got index {outcome.value}, list {list(rec)}).",
)
emit("sort", label="partition(9 items)", size=len(sample), looks=rec.looks, budget=None, passed=ok, error=outcome.error, frames=rec.frames)
```

## Hidden checks

```python
def _run_part(arr, lo, hi):
    copy = arr[:]
    p = get("partition")(copy, lo, hi)
    return valid_partition(arr, copy, lo, hi, p)

check(
    "partition on a sub-range leaves outer items untouched",
    lambda: _run_part([100, 8, 3, 9, 2, 5, 200], 1, 5),
    "Only touch indices from low through high inclusive.",
)

check(
    "partition handles all equal items",
    lambda: _run_part([4, 4, 4, 4], 0, 3),
)

def _run_single():
    single = [42]
    p = get("partition")(single, 0, 0)
    return (p, single)

expect("partition single item returns 0", _run_single, (0, [42]))
```

## Solution

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
```

## Restored

The rack splits any sub-range around its pivot in one pass, with zero extra lists allocated.
