---
id: bubble-up
kind: predict
title: Bubble up
system: Priority board
symbol: equipment
scene: console
skills: heaps, reading-code
---

## Briefing

Not every repair ticket should wait in FIFO order: a dying beacon heater jumps ahead of a squeaky hinge. A **binary min-heap** keeps the smallest (most urgent) number at index `0` of a plain Python list, without needing to keep the whole list sorted. Trace how a new urgent item bubbles up to its place.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

A **binary min-heap** is a complete binary tree packed tightly into a flat list. No `Node` objects needed — index arithmetic finds parents and children in `O(1)`:

- Parent of index `i`: `(i - 1) // 2`
- Left child of index `i`: `2 * i + 1`
- Right child of index `i`: `2 * i + 2`

The **heap property** says every parent is `<=` its children. That means `heap[0]` is always the minimum, even though the rest of the list isn't sorted! When you append a new item at the end, swap it with its parent until its parent is smaller (or it reaches index `0`). That takes at most `log₂ n` swaps.

## Hints

1. Start with `heap = [5, 10, 8, 14]`. Appending `3` puts it at index `4`.
2. Parent of index `4` is `(4 - 1) // 2 = 1` (value `10`). Since `3 < 10`, swap them: `3` is now at index `1`.
3. Parent of index `1` is `(1 - 1) // 2 = 0` (value `5`). Swap again! Print the final list and `heap[0]`.

## Program

```python
heap = [5, 10, 8, 14]
heap.append(3)

i = len(heap) - 1
while i > 0:
    parent = (i - 1) // 2
    if heap[i] < heap[parent]:
        heap[i], heap[parent] = heap[parent], heap[i]
        i = parent
    else:
        break

print(heap)
print(heap[0])
```

## Output

```text
[3, 5, 8, 14, 10]
3
```

## Restored

You traced `3` climbing from the bottom of the list to index `0` in just two swaps, leaving the rest of the heap property intact.
