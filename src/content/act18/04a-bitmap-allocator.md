---
id: bitmap-allocator
title: Allocate contiguous disk extents from a block bitmap
system: Inode rack
symbol: equipment
scene: tests
skills: os-filesystems
---

## Briefing

Filesystems track which disk blocks are free or in use with a compact **block bitmap** (`0` = free, `1` = allocated). Finding contiguous runs (extents) keeps sequential file reads fast and prevents fragmentation.

## Concept

Store `self.bits = [0] * num_blocks`:
- `alloc(count)`: validate `count >= 1` (else `ValueError`). Scan left to right for the lowest index `start` where `bits[start : start + count]` are ALL `0`. If found, mark them `1` and return `start`; if no contiguous run of length `count` exists, return `None`.
- `free(start, count)`: validate `count >= 1`, `start >= 0`, and `start + count <= num_blocks`, AND verify every block in `[start, start + count)` is currently `1` (raising `ValueError` on double-free or out-of-bounds!). Then set them back to `0`.
- `free_count()`: return total number of `0` bits currently free.

## Objective

Implement `BlockBitmap(num_blocks)` (validate `num_blocks >= 1`, else `ValueError`) with `alloc(count)`, `free(start, count)`, and `free_count()`.

## Hints

1. Track a running free-streak length `run = 0`: when `bits[i] == 0`, increment `run`; if `run == count`, your start index is `i - count + 1`! When `bits[i] == 1`, reset `run = 0`.
2. In `free(start, count)`, check bounds and `all(self.bits[i] == 1 ...)` BEFORE clearing any bits so a failed `free()` leaves the bitmap untouched!

## Starter: guided

```python
class BlockBitmap:
    def __init__(self, num_blocks):
        if num_blocks < 1:
            raise ValueError("num_blocks must be >= 1")
        self.bits = [0] * num_blocks

    def alloc(self, count):
        if count < 1:
            raise ValueError("count must be >= 1")
        # Find lowest contiguous run of `count` zeros, mark them 1, and return start (or None)
        return None

    def free(self, start, count):
        # Validate bounds and that every block is currently allocated (1), then clear to 0
        pass

    def free_count(self):
        return self.bits.count(0)
```

## Starter: standard

```python
class BlockBitmap:
    def __init__(self, num_blocks):
        pass

    def alloc(self, count):
        pass

    def free(self, start, count):
        pass

    def free_count(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _extents():
    bm = get("BlockBitmap")(8)
    a = bm.alloc(3)
    b = bm.alloc(2)
    c = bm.alloc(4)  # only 3 left -> None
    bm.free(0, 3)
    d = bm.alloc(3)  # reuses 0..2
    return (a, b, c, d, bm.free_count())
expect("allocates lowest contiguous extents and reuses freed space", _extents, (0, 3, None, 0, 3))

def _double_free():
    bm = get("BlockBitmap")(4)
    bm.alloc(2)
    bm.free(0, 2)
    try:
        bm.free(0, 1)
        return False
    except ValueError:
        return True
expect("double-free raises ValueError", _double_free, True)
```

## Hidden checks

```python
def _fragmented():
    bm = get("BlockBitmap")(6)
    bm.alloc(2)  # 0,1
    bm.alloc(2)  # 2,3
    bm.alloc(2)  # 4,5
    bm.free(0, 2)
    bm.free(4, 2)
    # 4 free blocks total, but max contiguous run is 2!
    return (bm.free_count(), bm.alloc(3), bm.alloc(2))
expect("rejects extent larger than largest contiguous hole", _fragmented, (4, None, 0))
```

## Solution

```python
class BlockBitmap:
    def __init__(self, num_blocks):
        if num_blocks < 1:
            raise ValueError("num_blocks must be >= 1")
        self.bits = [0] * num_blocks

    def alloc(self, count):
        if count < 1:
            raise ValueError("count must be >= 1")
        run = 0
        for i, bit in enumerate(self.bits):
            if bit == 0:
                run += 1
                if run == count:
                    start = i - count + 1
                    for j in range(start, start + count):
                        self.bits[j] = 1
                    return start
            else:
                run = 0
        return None

    def free(self, start, count):
        if count < 1 or start < 0 or start + count > len(self.bits):
            raise ValueError("extent out of range")
        if any(self.bits[i] == 0 for i in range(start, start + count)):
            raise ValueError("block already free")
        for i in range(start, start + count):
            self.bits[i] = 0

    def free_count(self):
        return self.bits.count(0)
```

## Restored

The block bitmap allocates lowest-fit contiguous extents and catches double-free corruption cleanly.
