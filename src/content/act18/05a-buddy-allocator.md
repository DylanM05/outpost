---
id: buddy-allocator
title: Split and coalesce blocks with a Binary Buddy allocator
system: Buddy slab
symbol: controller
scene: tests
skills: os-filesystems
---

## Briefing

Linux's page-frame allocator manages physical RAM in power-of-two blocks (`1, 2, 4, 8, ...` pages) using the **Binary Buddy system**. Every block of size $S$ at aligned address `addr` has a unique buddy at `addr ^ S` — making coalescing on `free()` an $O(\log N)$ XOR check!

## Concept

Given `total_size` (a positive power of two):
- Maintain `free_lists[size]`: a set of starting addresses of free blocks of power-of-two size `size`. Initially `free_lists[total_size] = {0}`.
- Maintain `allocated`: dict `addr -> block_size`.
- **`alloc(request_size)`**:
  1. Validate `request_size >= 1` (else `ValueError`).
  2. Round up to smallest power of two: `req = 1; while req < request_size: req <<= 1`.
  3. Find the smallest power-of-two `size >= req` (up to `total_size`) whose `free_lists[size]` is non-empty. If none, return `None`.
  4. Pop the **lowest** address `addr = min(free_lists[size])`.
  5. While `size > req`: split in half! `size //= 2`, put the right buddy `addr + size` into `free_lists[size]`, and keep the left half `addr`.
  6. Record `allocated[addr] = req` and return `addr`!
- **`free(addr)`**:
  1. Pop `size = allocated.pop(addr)` (raise `ValueError` if not allocated).
  2. Coalesce loop: while `size < total_size`:
     - Compute `buddy = addr ^ size`.
     - If `buddy in free_lists[size]`: remove `buddy`, set `addr = min(addr, buddy)`, `size *= 2`, and keep coalescing!
     - Otherwise `break`!
  3. Add `addr` to `free_lists[size]`.

## Objective

Implement `BuddyAllocator(total_size)` (validate `total_size >= 1` and power of two, else `ValueError`) with `alloc(size)`, `free(addr)`, and `free_blocks()` returning `{size: sorted(addrs)}` for all non-empty free lists.

## Hints

1. Check power of two with `total_size >= 1 and (total_size & (total_size - 1)) == 0`.
2. Watch how XOR finds buddies automatically: for size `16`, `0 ^ 16 == 16` and `16 ^ 16 == 0`; `32 ^ 16 == 48` and `48 ^ 16 == 32`!

## Starter: guided

```python
class BuddyAllocator:
    def __init__(self, total_size):
        if total_size < 1 or (total_size & (total_size - 1)) != 0:
            raise ValueError("total_size must be a positive power of two")
        self.total_size = total_size
        self.free_lists = {}
        s = 1
        while s <= total_size:
            self.free_lists[s] = set()
            s <<= 1
        self.free_lists[total_size].add(0)
        self.allocated = {}

    def alloc(self, size):
        if size < 1:
            raise ValueError("size must be >= 1")
        # Round size up to power of two, find smallest available block, split down, return addr (or None)
        return None

    def free(self, addr):
        # Pop allocated block, coalesce with XOR buddies while buddy is free, insert into free_lists
        pass

    def free_blocks(self):
        return {s: sorted(addrs) for s, addrs in self.free_lists.items() if addrs}
```

## Starter: standard

```python
class BuddyAllocator:
    def __init__(self, total_size):
        pass

    def alloc(self, size):
        pass

    def free(self, addr):
        pass

    def free_blocks(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _split_and_merge():
    b = get("BuddyAllocator")(64)
    a1 = b.alloc(10)  # rounds to 16 -> splits 64 -> 32+32 -> 16+16+32 -> returns 0
    a2 = b.alloc(12)  # gets 16
    after_alloc = b.free_blocks()
    b.free(a1)
    b.free(a2)        # 0 and 16 coalesce -> 32, then 0 and 32 coalesce -> 64!
    after_free = b.free_blocks()
    return (a1, a2, after_alloc, after_free)
expect("splits down to power-of-two and coalesces XOR buddies back to full block", _split_and_merge, (
    0,
    16,
    {32: [32]},
    {64: [0]},
))
```

## Hidden checks

```python
def _oom_and_bad():
    b = get("BuddyAllocator")(32)
    a = b.alloc(20)  # rounds to 32 -> takes all
    oom = b.alloc(1)
    b.free(a)
    try:
        b.free(a)
        double_free_caught = False
    except ValueError:
        double_free_caught = True
    return (a, oom, double_free_caught)
expect("returns None when out of memory and rejects double free", _oom_and_bad, (0, None, True))
```

## Solution

```python
class BuddyAllocator:
    def __init__(self, total_size):
        if total_size < 1 or (total_size & (total_size - 1)) != 0:
            raise ValueError("total_size must be a positive power of two")
        self.total_size = total_size
        self.free_lists = {}
        s = 1
        while s <= total_size:
            self.free_lists[s] = set()
            s <<= 1
        self.free_lists[total_size].add(0)
        self.allocated = {}

    def alloc(self, size):
        if size < 1:
            raise ValueError("size must be >= 1")
        req = 1
        while req < size:
            req <<= 1
        if req > self.total_size:
            return None
        cur = req
        while cur <= self.total_size and not self.free_lists[cur]:
            cur <<= 1
        if cur > self.total_size:
            return None
        addr = min(self.free_lists[cur])
        self.free_lists[cur].remove(addr)
        while cur > req:
            cur >>= 1
            self.free_lists[cur].add(addr + cur)
        self.allocated[addr] = req
        return addr

    def free(self, addr):
        if addr not in self.allocated:
            raise ValueError(f"address not allocated: {addr}")
        size = self.allocated.pop(addr)
        while size < self.total_size:
            buddy = addr ^ size
            if buddy in self.free_lists[size]:
                self.free_lists[size].remove(buddy)
                addr = min(addr, buddy)
                size <<= 1
            else:
                break
        self.free_lists[size].add(addr)

    def free_blocks(self):
        return {s: sorted(addrs) for s, addrs in self.free_lists.items() if addrs}
```

## Restored

The binary buddy allocator splits power-of-two blocks cleanly and merges freed XOR buddies in $O(\log N)$ steps.
