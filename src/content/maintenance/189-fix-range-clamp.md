---
id: maintenance-fix-range-clamp
title: Fix a byte-range slicer that drops the last byte of inclusive ranges
system: Range deck
symbol: instrument
scene: tests
skills: http-streaming
reviewSkill: http-streaming
prerequisite: mime-sniffing
---

## Briefing

A file server is cutting every video chunk 1 byte short because it slices `payload[start:end]` instead of inclusive `payload[start:end + 1]`, and forgets to clamp `end` to `len(payload) - 1`!

## Objective

Fix `slice_inclusive_range(payload, start, end)` so it returns `payload[start : min(end, len(payload) - 1) + 1]`, or `None` if `len(payload) == 0`, `start < 0`, `start >= len(payload)`, or `end < start`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. HTTP byte ranges are inclusive on `end`, so Python slicing needs `end + 1`, after clamping `end = min(end, len(payload) - 1)`.

## Starter

```python
def slice_inclusive_range(payload, start, end):
    if not payload or start < 0 or start >= len(payload) or end < start:
        return None
    return payload[start:end]
```

## Checks

```python
expect("includes the end byte in slice", lambda: get("slice_inclusive_range")(b"abcdef", 1, 3), b"bcd")
expect("clamps end beyond EOF", lambda: get("slice_inclusive_range")(b"abcdef", 4, 100), b"ef")
```

## Hidden checks

```python
expect("single byte range start==end works", lambda: get("slice_inclusive_range")(b"abcdef", 2, 2), b"c")
expect("out-of-bounds start returns None", lambda: get("slice_inclusive_range")(b"abc", 3, 5), None)
```

## Solution

```python
def slice_inclusive_range(payload, start, end):
    if not payload or start < 0 or start >= len(payload) or end < start:
        return None
    clamped_end = min(end, len(payload) - 1)
    return payload[start : clamped_end + 1]
```

## Restored

Byte-range slices now return exact inclusive windows without off-by-one truncation.
