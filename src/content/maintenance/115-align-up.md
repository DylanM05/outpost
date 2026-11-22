---
id: maintenance-align-up
title: Round offsets to power-of-two alignment
system: Heap bay
symbol: equipment
scene: tests
skills: memory-management
reviewSkill: memory-management
prerequisite: copying-gc
---

## Briefing

Hardware allocators require addresses to sit on power-of-two boundaries (8, 16, 64 bytes). Implement the classic bitmask round-up helper with input validation.

## Objective

Write `align_up(offset, align)` returning the smallest multiple of `align` that is `>= offset`.

Validate inputs:
- Raise `ValueError` if `offset < 0`.
- Raise `ValueError` if `align < 1` or `align` is not a power of two (`align & (align - 1) != 0`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. A positive integer `align` is a power of two iff `(align & (align - 1)) == 0`.
2. Once validated, `(offset + align - 1) & ~(align - 1)` rounds `offset` up to the next multiple of `align` in one step.

## Starter

```python
```

## Checks

```python
expect("already aligned stays unchanged", lambda: get("align_up")(16, 8), 16)
expect("rounds up unaligned offset", lambda: get("align_up")(17, 8), 24)
expect("zero stays zero", lambda: get("align_up")(0, 16), 0)
```

## Hidden checks

```python
def _bad():
    for args in [(10, 6), (10, 0), (-1, 8), (5, -4)]:
        try:
            get("align_up")(*args)
            return False
        except ValueError:
            pass
    return True
expect("invalid offset or non-power-of-two align raises ValueError", _bad, True)
expect("align=1 leaves any non-negative offset unchanged", lambda: get("align_up")(13, 1), 13)
```

## Solution

```python
def align_up(offset, align):
    if offset < 0 or align < 1 or (align & (align - 1)) != 0:
        raise ValueError("offset must be >= 0 and align must be a positive power of two")
    return (offset + align - 1) & ~(align - 1)
```

## Restored

Every arena allocation lands cleanly on a validated power-of-two boundary.
