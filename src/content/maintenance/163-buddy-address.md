---
id: maintenance-buddy-address
title: Compute a binary buddy block's XOR partner
system: Buddy slab
symbol: controller
scene: tests
skills: os-filesystems
reviewSkill: os-filesystems
prerequisite: symlink-resolve
---

## Briefing

In a binary buddy allocator, every aligned block of power-of-two size `block_size` has exactly one merge partner — computed by flipping a single bit with XOR!

## Objective

Write `buddy_address(addr, block_size)`:
- Validate `block_size >= 1` and `block_size` is a power of two (`(block_size & (block_size - 1)) == 0`).
- Validate `addr >= 0` and `addr` is aligned to `block_size` (`addr % block_size == 0`).
- Raise `ValueError` if any validation fails; otherwise return `addr ^ block_size`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `block_size >= 1 and (block_size & (block_size - 1)) == 0`, and `addr >= 0 and addr % block_size == 0`.
2. Return `addr ^ block_size` (notice `buddy_address(buddy_address(a, s), s) == a`!).

## Starter

```python
```

## Checks

```python
expect("pairs 0 with 16 and 16 with 0 for size 16", lambda: (get("buddy_address")(0, 16), get("buddy_address")(16, 16)), (16, 0))
expect("pairs 32 with 48 for size 16", lambda: get("buddy_address")(32, 16), 48)
```

## Hidden checks

```python
def _bad():
    for args in [(12, 16), (0, 12), (-16, 16), (0, 0)]:
        try:
            get("buddy_address")(*args)
            return False
        except ValueError:
            pass
    return True
expect("unaligned addr or non-power-of-two size raises ValueError", _bad, True)
```

## Solution

```python
def buddy_address(addr, block_size):
    if block_size < 1 or (block_size & (block_size - 1)) != 0:
        raise ValueError("block_size must be a positive power of two")
    if addr < 0 or addr % block_size != 0:
        raise ValueError("addr must be non-negative and aligned to block_size")
    return addr ^ block_size
```

## Restored

Buddy address validation and XOR pairing now guarantee aligned coalescing.
