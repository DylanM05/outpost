---
id: maintenance-bitmap-free-runs
title: Measure fragmentation via largest contiguous free extent
system: Inode rack
symbol: equipment
scene: tests
skills: os-filesystems
reviewSkill: os-filesystems
prerequisite: symlink-resolve
---

## Briefing

A disk can be 50% free and still fail to allocate a 4-block contiguous file if every free block is isolated! Measure the largest contiguous run of free (`0`) blocks in a bitmap.

## Objective

Write `largest_free_extent(bits)` where `bits` is a sequence of `0` (free) and `1` (used) integers, returning the length of the longest contiguous run of `0`s (`0` if empty or all `1`s).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track `cur = 0` and `best = 0`: increment `cur` on `0` and update `best = max(best, cur)`; reset `cur = 0` on `1`.

## Starter

```python
```

## Checks

```python
expect("finds longest contiguous run of zeros", lambda: get("largest_free_extent")([1, 0, 0, 1, 0, 0, 0, 1, 0]), 3)
expect("all used returns 0", lambda: get("largest_free_extent")([1, 1, 1]), 0)
```

## Hidden checks

```python
expect("handles empty bitmap and trailing free run", lambda: (get("largest_free_extent")([]), get("largest_free_extent")([1, 0, 0, 0, 0])), (0, 4))
```

## Solution

```python
def largest_free_extent(bits):
    cur = 0
    best = 0
    for b in bits:
        if b == 0:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0
    return best
```

## Restored

Disk fragmentation metrics report the exact largest contiguous free extent in one pass.
