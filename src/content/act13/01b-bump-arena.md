---
id: bump-arena
kind: code
title: Aligned bump-pointer arena allocator
system: Heap bay
symbol: equipment
scene: tests
skills: memory-management
---

## Briefing

Calling `malloc` and `free` thousands of times per HTTP request fragments the heap and wastes CPU. High-performance servers and compilers use a **bump-pointer arena**: reserve one big slab of bytes up front, advance a single `offset` pointer on every allocation (aligned to CPU word boundaries like 4 or 8 bytes), and free the *entire* request's allocations in **one instruction** (`offset = 0`)!

## Objective

Write a class `Arena`:

- `__init__(self, capacity)` — validates `capacity >= 1` (raise `ValueError` otherwise). Initializes `self.capacity = capacity` and `self.offset = 0`.
- `alloc(self, size, align=1)`:
  - Validate `size >= 1` and `align >= 1` and `align` is a power of two (`(align & (align - 1)) == 0`); raise `ValueError` otherwise.
  - Round `self.offset` **up** to the next multiple of `align`:
    ```python
    aligned = (self.offset + align - 1) & ~(align - 1)
    ```
  - If `aligned + size > self.capacity`: raise `MemoryError("arena exhausted")` without modifying `self.offset`!
  - Otherwise set `self.offset = aligned + size` and return `aligned` (the starting byte address).
- `used(self)` — returns `self.offset`.
- `reset(self)` — resets `self.offset = 0`.

## Concept

Why align allocations to 4- or 8-byte boundaries? Modern CPUs fetch 64-bit integers and pointers fastest when their address is a multiple of 8 (`addr % 8 == 0`). And notice the power-of-two bitmask trick: `(x + align - 1) & ~(align - 1)` rounds `x` up to the next multiple of `align` with zero division!

## Hints

1. Check power of two with `align >= 1 and (align & (align - 1)) == 0`.
2. Verify `aligned + size <= self.capacity` *before* updating `self.offset` so a failed allocation leaves the arena intact.

## Starter: guided

```python
class Arena:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self.offset = 0

    def alloc(self, size, align=1):
        if size < 1 or align < 1 or (align & (align - 1)) != 0:
            raise ValueError("invalid size or alignment")
        # TODO: compute aligned offset, check capacity, advance self.offset, return aligned
        pass

    def used(self):
        return self.offset

    def reset(self):
        self.offset = 0
```

## Starter: standard

```python
class Arena:
    def __init__(self, capacity):
        pass

    def alloc(self, size, align=1):
        pass

    def used(self):
        pass

    def reset(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
Arena = get("Arena")
def test_alignment_and_reset():
    a = Arena(32)
    p1 = a.alloc(3, align=1)   # 0..3
    p2 = a.alloc(8, align=8)   # aligned up from 3 -> 8..16
    p3 = a.alloc(4, align=4)   # already aligned -> 16..20
    u1 = a.used()
    a.reset()
    p4 = a.alloc(16, align=8)  # back at 0!
    return (p1, p2, p3, u1, p4, a.used())

expect("aligns addresses to word boundaries and resets in O(1)", test_alignment_and_reset, (0, 8, 16, 20, 0, 16))

def test_oom():
    a = Arena(16)
    a.alloc(10, align=1)
    try:
        a.alloc(8, align=8)  # aligned=16, 16+8=24 > 16!
        return False
    except MemoryError:
        return a.used() == 10
check("OOM raises MemoryError without moving offset", test_oom)
```

## Hidden checks

```python
Arena = get("Arena")
def bad_align():
    try:
        Arena(64).alloc(4, align=3)
        return False
    except ValueError:
        return True
check("non-power-of-two alignment raises ValueError", bad_align)
expect("exact capacity fit succeeds", lambda: Arena(16).alloc(16, align=8), 0)
```

## Solution

```python
class Arena:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self.offset = 0

    def alloc(self, size, align=1):
        if size < 1 or align < 1 or (align & (align - 1)) != 0:
            raise ValueError("invalid size or alignment")
        aligned = (self.offset + align - 1) & ~(align - 1)
        if aligned + size > self.capacity:
            raise MemoryError("arena exhausted")
        self.offset = aligned + size
        return aligned

    def used(self):
        return self.offset

    def reset(self):
        self.offset = 0
```

## Restored

Aligned bump allocations run in constant time and bulk-reset cleanly at the end of every request.
