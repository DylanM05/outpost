---
id: stragglers
title: Stragglers
system: Sample sorter
symbol: instrument
scene: sort
skills: sorting, loops
---

## Briefing

New ice cores arrive at the end of the rack. The rack is almost always in order already, apart from a few late cores from shallow drill sites that belong near the front. Bubble sort handles them badly: each one crawls left a single step per pass.

## Objective

Write `insert_samples(samples)`. Sort the list **in place**, smallest first, using insertion sort, without `sorted()` or `.sort()`.

```python
rack = [12, 30, 41, 55, 6]
insert_samples(rack)
print(rack)  # [6, 12, 30, 41, 55]
```

The hidden tests use a rack of 500 sorted samples with 3 stragglers at the end, and allow 10,000 reads. Bubble sort needs about 250,000.

## Concept

**Insertion sort** works the way most people sort a hand of cards. The left part of the list is kept sorted. Take the next item, slide it left past every item bigger than it, and drop it into the gap.

For each position `i` from 1 to the end:

1. Pick up `item = samples[i]`. The items before position `i` are already sorted.
2. Start at `j = i - 1`. While `j >= 0` and `samples[j]` is bigger than `item`, shift `samples[j]` one place right, into `samples[j + 1]`, and move `j` one step left.
3. When the loop stops, `samples[j + 1]` is the gap. Put `item` there.

Step 2 is a `while` loop with a moving position, like the one that walked the pipeline. Check `j >= 0` first, so the loop never reads before the start of the list.

On a shuffled list, insertion sort is still quadratic. But an item that's already in place costs **one** comparison: the item before it isn't bigger, so the `while` loop stops straight away. A nearly sorted list costs little more than one read per item, plus the distance each straggler travels, and a straggler travels the whole way in one go, not one step per pass.

That makes insertion sort the usual choice for small or nearly sorted lists. Python's own `sorted()` uses it for short runs inside bigger sorts.

## Hints

1. Loop `for i in range(1, len(samples)):`, and start each pass with `item = samples[i]` and `j = i - 1`.
2. `while j >= 0 and samples[j] > item:`, then `samples[j + 1] = samples[j]` and `j -= 1`.
3. After the `while` loop, `samples[j + 1] = item`.

## Starter: guided

```python
def insert_samples(samples):
    for i in range(1, len(samples)):
        item = samples[i]
        j = i - 1
        while j >= 0 and samples[j] > item:
            # Shift samples[j] one place right, then move j one step left.
            j -= 1
        samples[j + 1] = item


rack = [12, 30, 41, 55, 6]
insert_samples(rack)
print(rack)
```

## Starter: standard

```python
def insert_samples(samples):
    # This is bubble sort from the last repair. It sorts correctly, but each
    # straggler moves one step per pass. Replace it with insertion sort.
    swapped = True
    while swapped:
        swapped = False
        for i in range(len(samples) - 1):
            if samples[i] > samples[i + 1]:
                samples[i], samples[i + 1] = samples[i + 1], samples[i]
                swapped = True
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Sorts by hand, without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "This mission is about writing the sort yourself.",
)
rack = tracked([41, 7, 23, 88, 15, 62, 3, 54, 30, 76], record=True)
expect_sorted("insert_samples(10 samples)", lambda: get("insert_samples")(rack), rack, [3, 7, 15, 23, 30, 41, 54, 62, 76, 88])
late = [12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 6, 50, 9]
arrivals = tracked(late)
expect_sorted(
    "insert_samples(20 sorted, then 3 stragglers)",
    lambda: get("insert_samples")(arrivals),
    arrivals,
    sorted(late),
    300,
    "Slide each straggler left in one go, instead of one step per pass.",
)
```

## Hidden checks

```python
for items in ([], [5], [2, 1], [3, 1, 3, 2, 1], [-4, 10, -20, 0], [9, 8, 7, 6, 5]):
    data = tracked(items)
    expect_sorted(f"insert_samples({items!r})", lambda: get("insert_samples")(data), data, sorted(items))
plain = list(range(10, 1004, 2)) + [5, 1, 3]
big = tracked(plain)
expect_sorted(
    "insert_samples(497 sorted, then 3 stragglers)",
    lambda: get("insert_samples")(big),
    big,
    sorted(plain),
    10000,
    "Slide each straggler left in one go, instead of one step per pass.",
)
```

## Solution

```python
def insert_samples(samples):
    for i in range(1, len(samples)):
        item = samples[i]
        j = i - 1
        while j >= 0 and samples[j] > item:
            samples[j + 1] = samples[j]
            j -= 1
        samples[j + 1] = item
```

## Restored

Late cores slot straight into place as they arrive. The rack stays in order all day, and the sorter barely has to think about it.
