---
id: maintenance-cow-refcount-check
title: Identify virtual pages requiring Copy-on-Write
system: Page vault
symbol: equipment
scene: tests
skills: virtual-memory
reviewSkill: virtual-memory
prerequisite: cow-fork
---

## Briefing

After several `fork()` calls, only virtual pages mapped to physical frames with `refcount > 1` need write-protection traps — privately owned frames (`refcount == 1`) can stay directly writable!

## Objective

Write `cow_pages(page_table, refcounts)` where `page_table` maps `vpage -> frame_id` and `refcounts` maps `frame_id -> int`.

Return a **sorted** list of `vpage` keys whose mapped `frame_id` has `refcounts.get(frame_id, 0) > 1`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter `vpage` where `refcounts.get(fid, 0) > 1`.
2. Return `sorted(...)`.

## Starter

```python
```

## Checks

```python
expect("returns sorted virtual pages mapped to shared frames", lambda: get("cow_pages")({3: 10, 1: 11, 2: 12}, {10: 2, 11: 1, 12: 3}), [2, 3])
expect("returns empty when all frames are privately owned", lambda: get("cow_pages")({0: 1, 1: 2}, {1: 1, 2: 1}), [])
```

## Hidden checks

```python
expect("handles empty page table", lambda: get("cow_pages")({}, {1: 4}), [])
```

## Solution

```python
def cow_pages(page_table, refcounts):
    return sorted(
        vpage
        for vpage, fid in page_table.items()
        if refcounts.get(fid, 0) > 1
    )
```

## Restored

Write protection now marks only genuinely shared frames for Copy-on-Write trapping.
