---
id: sort-the-samples
title: Sort the samples
system: Sample sorter
symbol: instrument
scene: sort
skills: sorting, loops
---

## Briefing

One pass isn't enough to sort the rack, so the sorter needs to keep going until the job is done, and then stop. Most mornings the rack is already in order from the day before, and the old program wasted the whole morning checking it again and again.

## Objective

Write `sort_samples(samples)`. Sort the list of sample depths **in place**, smallest first, using bubble sort: make passes, swapping neighbors that are out of order, until a pass makes no swaps at all. Write the sort yourself, without `sorted()` or `.sort()`.

```python
rack = [42, 17, 35, 8]
sort_samples(rack)
print(rack)  # [8, 17, 35, 42]
```

The hidden tests include a rack of 1,500 samples that's already sorted, with a budget of 6,000 reads.

## Concept

Each pass carries the biggest unsorted item to its place at the end, so passes are guaranteed to finish the job eventually. The question is when to stop.

A pass that makes **no swaps** found every neighboring pair already in order, which means the whole list is sorted. So keep a flag that records whether the current pass swapped anything:

```python
swapped = True
while swapped:
    swapped = False
    # one pass, setting swapped = True whenever it swaps
```

The `while` loop runs one more pass whenever the last one swapped something.

That flag decides how bubble sort behaves on easy input. On a list that's already sorted, the first pass swaps nothing and the sort stops after `n - 1` comparisons, which is linear. Without it, the sort would make every pass anyway, about `n × n` comparisons, quadratic, even when there's nothing to do. On a shuffled list, bubble sort is quadratic either way.

The sorting bars beside the board replay each swap your code makes on the first test rack.

## Hints

1. Put the pass from the predict mission inside `while swapped:`, and set `swapped = False` at the start of each pass.
2. Whenever the pass swaps two samples, set `swapped = True`.
3. The function changes `samples` itself, so it doesn't need to return anything.

## Starter: guided

```python
def sort_samples(samples):
    swapped = True
    while swapped:
        swapped = False
        for i in range(len(samples) - 1):
            if samples[i] > samples[i + 1]:
                # Swap the two neighbors, and set swapped = True
                # so the while loop runs another pass.
                print("out of order:", samples[i], samples[i + 1])


rack = [42, 17, 35, 8]
sort_samples(rack)
print(rack)
```

## Starter: standard

```python
def sort_samples(samples):
    # One pass carries the biggest sample to the end. Repeat passes
    # until a pass makes no swaps.
    for i in range(len(samples) - 1):
        if samples[i] > samples[i + 1]:
            samples[i], samples[i + 1] = samples[i + 1], samples[i]
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Sorts by hand, without sorted() or .sort()",
    lambda: not uses("sorted", "sort"),
    "This mission is about writing the sort yourself. In real code, sorted() is the right tool, and you'll use it soon.",
)
rack = tracked([41, 7, 23, 88, 15, 62, 3, 54, 30, 76], record=True)
expect_sorted("sort_samples(10 samples)", lambda: get("sort_samples")(rack), rack, [3, 7, 15, 23, 30, 41, 54, 62, 76, 88])
small = tracked([42, 17, 35, 8])
expect_sorted("sort_samples([42, 17, 35, 8])", lambda: get("sort_samples")(small), small, [8, 17, 35, 42])
```

## Hidden checks

```python
for items in ([], [5], [2, 1], [3, 1, 3, 2, 1], [-4, 10, -20, 0]):
    data = tracked(items)
    expect_sorted(f"sort_samples({items!r})", lambda: get("sort_samples")(data), data, sorted(items))
backwards = tracked(list(range(60, 0, -1)))
expect_sorted("sort_samples(60 samples, deepest first)", lambda: get("sort_samples")(backwards), backwards, list(range(1, 61)))
ready = tracked(list(range(1500)))
expect_sorted(
    "sort_samples(1,500 samples, already sorted)",
    lambda: get("sort_samples")(ready),
    ready,
    list(range(1500)),
    6000,
    "Stop as soon as a pass makes no swaps.",
)
```

## Solution

```python
def sort_samples(samples):
    swapped = True
    while swapped:
        swapped = False
        for i in range(len(samples) - 1):
            if samples[i] > samples[i + 1]:
                samples[i], samples[i + 1] = samples[i + 1], samples[i]
                swapped = True
```

## Restored

The rack sorts itself from shallowest to deepest, and on mornings when it's already in order, the sorter checks it once and lets the surveyors get to work.
