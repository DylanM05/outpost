---
id: freelist-allocator
kind: code
title: Free-list allocator with coalescing
system: Heap bay
symbol: equipment
scene: tests
skills: memory-management
---

## Briefing

When objects have different lifetimes, a bump arena can't free just one middle block. A general-purpose heap allocator (like C's `malloc`/`free`) tracks a sorted **free list** of `(start, size)` holes — splitting holes on `malloc` and **coalescing** adjacent holes back together on `free` so the heap doesn't shatter into unusable tiny slivers!

## Objective

Write a class `HeapAllocator`:

- `__init__(self, capacity)` — starts with one free span `[(0, capacity)]` and an empty dict of live allocations `{addr: size}`.
- `malloc(self, size)` — validate `size >= 1` (`ValueError` otherwise). Find the **first** (lowest-address) free span `(start, span_size)` with `span_size >= size`:
  - If none exists, raise `MemoryError`.
  - Remove or shrink that span: if `span_size > size`, replace it with `(start + size, span_size - size)`; else remove it.
  - Record `allocated[start] = size` and return `start`.
- `free(self, addr)` — if `addr` is not currently allocated (e.g. invalid pointer or **double-free**!), raise `ValueError`.
  - Remove `addr` from `allocated`, insert `(addr, size)` back into the sorted free list, and **coalesce** any adjacent spans where `prev_start + prev_size == next_start` into one merged span!
- `free_spans(self)` — returns a list of `(start, size)` tuples sorted by ascending `start`.

## Concept

Without coalescing, allocating two 32-byte blocks and freeing both leaves two separate 32-byte holes — so a subsequent `malloc(64)` fails with `MemoryError` even though 64 contiguous bytes are free! Coalescing adjacent spans on `free` cures external fragmentation immediately.

## Hints

1. Keep `self._free = [(0, capacity)]` always sorted by `start`.
2. On `free(addr)`: append `(addr, size)` to `self._free`, sort by `start`, then walk once merging whenever `merged[-1][0] + merged[-1][1] == start`.

## Starter: guided

```python
class HeapAllocator:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self._free = [(0, capacity)]
        self._allocated = {}

    def malloc(self, size):
        if size < 1:
            raise ValueError("size must be >= 1")
        for i, (start, span_size) in enumerate(self._free):
            if span_size >= size:
                # TODO: split or remove span i, record self._allocated[start] = size, return start
                pass
        raise MemoryError("out of heap memory")

    def free(self, addr):
        if addr not in self._allocated:
            raise ValueError("invalid or double free")
        size = self._allocated.pop(addr)
        # TODO: insert (addr, size) into self._free and coalesce adjacent spans
        pass

    def free_spans(self):
        return list(self._free)
```

## Starter: standard

```python
class HeapAllocator:
    def __init__(self, capacity):
        pass

    def malloc(self, size):
        pass

    def free(self, addr):
        pass

    def free_spans(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
HA = get("HeapAllocator")
def test_split_and_coalesce():
    h = HA(100)
    a = h.malloc(30)   # 0..30
    b = h.malloc(30)   # 30..60
    c = h.malloc(40)   # 60..100
    h.free(a)          # free: [(0, 30)]
    h.free(c)          # free: [(0, 30), (60, 40)]
    mid_spans = h.free_spans()
    h.free(b)          # bridges 0..30 and 60..100 -> [(0, 100)]!
    all_coalesced = h.free_spans()
    big = h.malloc(90) # succeeds only because all 3 spans coalesced!
    return (a, b, c, mid_spans, all_coalesced, big)

expect(
    "splits spans on malloc and coalesces left+right neighbors on free",
    test_split_and_coalesce,
    (0, 30, 60, [(0, 30), (60, 40)], [(0, 100)], 0),
)

def test_double_free():
    h = HA(64)
    p = h.malloc(16)
    h.free(p)
    try:
        h.free(p)
        return False
    except ValueError:
        return True
check("double-free raises ValueError", test_double_free)
```

## Hidden checks

```python
HA = get("HeapAllocator")
def test_first_fit_reuse():
    h = HA(64)
    p1 = h.malloc(16)
    p2 = h.malloc(16)
    h.free(p1)
    p3 = h.malloc(8)   # reuses low hole at 0!
    return (p1, p2, p3, h.free_spans())

expect("first-fit reuses freed low hole", test_first_fit_reuse, (0, 16, 0, [(8, 8), (32, 32)]))
```

## Solution

```python
class HeapAllocator:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self._free = [(0, capacity)]
        self._allocated = {}

    def malloc(self, size):
        if size < 1:
            raise ValueError("size must be >= 1")
        for i, (start, span_size) in enumerate(self._free):
            if span_size >= size:
                if span_size == size:
                    self._free.pop(i)
                else:
                    self._free[i] = (start + size, span_size - size)
                self._allocated[start] = size
                return start
        raise MemoryError("out of heap memory")

    def free(self, addr):
        if addr not in self._allocated:
            raise ValueError("invalid or double free")
        size = self._allocated.pop(addr)
        spans = sorted(self._free + [(addr, size)])
        merged = []
        for start, span_size in spans:
            if merged and merged[-1][0] + merged[-1][1] == start:
                merged[-1] = (merged[-1][0], merged[-1][1] + span_size)
            else:
                merged.append((start, span_size))
        self._free = merged

    def free_spans(self):
        return list(self._free)
```

## Restored

Freed neighbors now coalesce smoothly back into contiguous blocks, and double-free bugs are caught on the spot.
