---
id: min-heap
title: Min-heap
system: Priority board
symbol: equipment
scene: tests
skills: heaps, classes
---

## Briefing

Build the priority board's engine from scratch: a `MinHeap` class that pushes new urgency numbers and pops the smallest one in `O(log n)` time.

## Objective

Write a `MinHeap` class (without using `heapq`, `sorted`, or `.sort`) with:

- `push(self, val)`: appends `val` and bubbles it up until the min-heap property holds.
- `pop(self)`: removes and returns the smallest item (`self._data[0]`), or returns `None` if empty. Moves the last item to index `0` and sifts it down past its smaller child until the heap property holds.
- `peek(self)`: returns the smallest item without removing it, or `None` if empty.
- `__len__(self)`: returns the number of items in the heap.

```python
h = MinHeap()
for x in [9, 4, 7, 1, 6]:
    h.push(x)
h.peek()  # 1
h.pop()   # 1
h.pop()   # 4
```

The hidden test pushes and pops 500 items with a comparison budget of 12,000.

## Concept

`push` bubbles **up** from the back; `pop` sifts **down** from the top:

1. Save `top = self._data[0]`, and move the last element `self._data.pop()` into `self._data[0]` (if anything remains).
2. Starting at `i = 0`:
   - Look at `left = 2 * i + 1` and `right = 2 * i + 2`.
   - Find `smallest`, the index among `i`, `left` (if in bounds), and `right` (if in bounds) with the smallest value.
   - If `smallest == i`, stop — the heap property is restored.
   - Otherwise swap `self._data[i]` and `self._data[smallest]`, set `i = smallest`, and repeat.

Because the tree is always completely filled level by level, its height is `log₂ n`, so both `push` and `pop` do `O(log n)` work.

## Hints

1. In `pop()`: handle empty (`return None`) and single-item (`return self._data.pop()`) cleanly before moving the last item to index `0`.
2. In `_sift_down(i)`: compare `left < n` and `right < n` carefully so you always swap with the *smaller* of the two children.
3. Implementing `__len__(self)` returning `len(self._data)` makes `len(heap)` work naturally.

## Starter: guided

```python
class MinHeap:
    def __init__(self):
        self._data = []

    def __len__(self):
        return len(self._data)

    def peek(self):
        return None if not self._data else self._data[0]

    def push(self, val):
        self._data.append(val)
        i = len(self._data) - 1
        while i > 0:
            parent = (i - 1) // 2
            if self._data[i] < self._data[parent]:
                self._data[i], self._data[parent] = self._data[parent], self._data[i]
                i = parent
            else:
                break

    def pop(self):
        if not self._data:
            return None
        if len(self._data) == 1:
            return self._data.pop()
        top = self._data[0]
        self._data[0] = self._data.pop()
        # Sift index 0 down until it is <= both children.
        return top
```

## Starter: standard

```python
class MinHeap:
    def __init__(self):
        self._data = []

    def __len__(self):
        return len(self._data)

    def peek(self):
        return None

    def push(self, val):
        pass

    def pop(self):
        return None
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Implements the heap by hand without heapq or sort",
    lambda: not uses("heapq", "heappush", "heappop", "sorted", "sort"),
    "Use parent/child index math to bubble up and sift down.",
)
h = get("MinHeap")()
expect("empty pop()", lambda: h.pop(), None)
expect("empty peek()", lambda: h.peek(), None)
for x in [9, 4, 7, 1, 6, 3]:
    h.push(x)
expect("len(h) is 6", lambda: len(h), 6)
expect("peek() is 1", lambda: h.peek(), 1)
expect("popping all items yields sorted order", lambda: [h.pop() for _ in range(6)], [1, 3, 4, 6, 7, 9])
expect("pop after empty is None", lambda: h.pop(), None)
```

## Hidden checks

```python
h2 = get("MinHeap")()
for x in [5, 5, 2, 2, 8, 0]:
    h2.push(x)
expect("handles duplicates and 0", lambda: [h2.pop() for _ in range(6)], [0, 2, 2, 5, 5, 8])

plain = [(i * 7919) % 10000 for i in range(500)]
def _heap_roundtrip(vals):
    heap = get("MinHeap")()
    for v in vals:
        heap.push(v)
    return [heap.pop() for _ in range(len(vals))]

comp = compared(plain)
expect_comparisons(
    "MinHeap push & pop 500 items",
    lambda: _heap_roundtrip(comp),
    sorted(plain),
    500,
    12000,
    "Bubble up on push and sift down on pop for O(log n) work per operation.",
)
```

## Solution

```python
class MinHeap:
    def __init__(self):
        self._data = []

    def __len__(self):
        return len(self._data)

    def peek(self):
        if not self._data:
            return None
        return self._data[0]

    def push(self, val):
        self._data.append(val)
        i = len(self._data) - 1
        while i > 0:
            parent = (i - 1) // 2
            if self._data[i] < self._data[parent]:
                self._data[i], self._data[parent] = self._data[parent], self._data[i]
                i = parent
            else:
                break

    def pop(self):
        if not self._data:
            return None
        if len(self._data) == 1:
            return self._data.pop()
        top = self._data[0]
        self._data[0] = self._data.pop()
        i = 0
        n = len(self._data)
        while True:
            left = 2 * i + 1
            right = 2 * i + 2
            smallest = i
            if left < n and self._data[left] < self._data[smallest]:
                smallest = left
            if right < n and self._data[right] < self._data[smallest]:
                smallest = right
            if smallest == i:
                break
            self._data[i], self._data[smallest] = self._data[smallest], self._data[i]
            i = smallest
        return top
```

## Restored

Your min-heap keeps the highest-priority repair at index `0` in logarithmic time per update.
