---
id: maintenance-coalesce-spans
title: Coalesce adjacent free-list spans
system: Heap bay
symbol: equipment
scene: tests
skills: memory-management
reviewSkill: memory-management
prerequisite: copying-gc
---

## Briefing

When objects are freed out of order, the free list fragments into tiny adjacent blocks. Coalesce touching or overlapping spans into maximal contiguous free regions.

## Objective

Write `coalesce_spans(spans)` where `spans` is a list of `(start, size)` integer tuples representing free memory intervals `[start, start + size)`.

- Ignore any span with `size <= 0`.
- Sort remaining spans by `start` and merge any two spans that touch (`next_start <= cur_end`) into a single combined `(start, merged_size)` span.
- Return the sorted list of merged `(start, size)` tuples.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter out `size <= 0`, sort by `start`, and track `(cur_start, cur_end)` for the active interval.
2. If `start <= cur_end`, extend `cur_end = max(cur_end, start + size)`; otherwise emit `(cur_start, cur_end - cur_start)` and start a new span.

## Starter

```python
```

## Checks

```python
expect("merges touching out-of-order spans", lambda: get("coalesce_spans")([(32, 16), (0, 16), (16, 16)]), [(0, 48)])
expect("keeps disjoint spans separate", lambda: get("coalesce_spans")([(0, 8), (16, 8), (24, 16)]), [(0, 8), (16, 24)])
expect("ignores zero-size spans", lambda: get("coalesce_spans")([(0, 0), (8, 8)]), [(8, 8)])
```

## Hidden checks

```python
expect("merges overlapping spans cleanly", lambda: get("coalesce_spans")([(0, 20), (10, 15)]), [(0, 25)])
expect("empty list returns empty", lambda: get("coalesce_spans")([]), [])
```

## Solution

```python
def coalesce_spans(spans):
    intervals = sorted((s, s + sz) for s, sz in spans if sz > 0)
    if not intervals:
        return []
    merged = []
    cur_start, cur_end = intervals[0]
    for start, end in intervals[1:]:
        if start <= cur_end:
            cur_end = max(cur_end, end)
        else:
            merged.append((cur_start, cur_end - cur_start))
            cur_start, cur_end = start, end
    merged.append((cur_start, cur_end - cur_start))
    return merged
```

## Restored

Fragmented free spans merge back into large contiguous blocks ready for allocation.
