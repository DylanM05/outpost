---
id: split-around-the-pivot
kind: predict
title: Split around the pivot
system: Pivot rack
symbol: equipment
scene: console
skills: sorting, reading-code
---

## Briefing

In the survey office, merge sort needed extra memory to hold copied halves. **Quicksort** sorts in place by picking one item as a **pivot** and rearranging the list so smaller items sit to its left and larger items sit to its right. Before you write quicksort, trace one pass of partitioning around the last item.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

**Lomuto partitioning** picks `pivot = items[high]` and keeps a divider index `i = low`:

- Everything to the left of `i` is `<= pivot`.
- As `j` walks from `low` to `high - 1`, whenever `items[j] <= pivot`, swap `items[i]` and `items[j]`, then advance `i`.
- Finally, swap the pivot at `high` into slot `i`. Now the pivot sits in its exact sorted position!

## Hints

1. `pivot` is `4` (`items[4]`). `i` starts at `0`.
2. Check each `j` from `0` to `3`: whenever `items[j] <= 4`, swap `items[i]` and `items[j]` and add 1 to `i`.
3. After the loop, swap `items[i]` and `items[4]`. Print `i` first, then the rearranged list.

## Program

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


rack = [7, 2, 9, 1, 4]
p = partition(rack, 0, len(rack) - 1)
print(p)
print(rack)
```

## Output

```text
2
[2, 1, 4, 7, 9]
```

## Restored

You traced the divider moving across the rack until `4` landed in slot 2, with smaller values on the left and larger ones on the right.
