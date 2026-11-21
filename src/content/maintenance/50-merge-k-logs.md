---
id: maintenance-merge-k-logs
title: Merge k sorted logs
system: Priority board
symbol: equipment
scene: work
skills: heaps
reviewSkill: heaps
prerequisite: urgent-repairs
---

## Briefing

Twenty remote weather stations each deliver a sorted list of integer timestamps. Merge all `k` sorted lists into one sorted list using a min-heap instead of concatenating and sorting from scratch.

## Objective

Write `merge_k_sorted(lists)`. Each sublist is sorted ascending (some may be empty). Return one sorted list containing all items using `heapq` (without `sorted()` or `.sort()`). On 20 lists of 100 items each (2,000 total), stay within 15,000 comparisons.

```python
merge_k_sorted([[1, 5], [], [2, 3, 9], [4]])  # [1, 2, 3, 4, 5, 9]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Push `(sublist[0], list_idx, 0)` onto a min-heap for every non-empty sublist.
2. Repeatedly `heappop` the smallest `(val, list_idx, item_idx)`, append `val`, and if `item_idx + 1 < len(lists[list_idx])`, push the next item from that same sublist!

## Starter

```python
```

## Checks

```python
check("Uses heapq without sorted() or .sort()", lambda: not uses("sorted", "sort"))
expect("merge_k_sorted example", lambda: get("merge_k_sorted")([[1, 5], [], [2, 3, 9], [4]]), [1, 2, 3, 4, 5, 9])
```

## Hidden checks

```python
expect("all empty lists", lambda: get("merge_k_sorted")([[], []]), [])
plain_lists = [[k + i * 20 for i in range(100)] for k in range(20)]
comp_lists = [compared(lst) for lst in plain_lists]
expect_comparisons("merge 20 sorted logs (2,000 items)", lambda: get("merge_k_sorted")(comp_lists), list(range(2000)), 2000, 15000, "Keep one heap entry per active list with heapq.")
```

## Solution

```python
import heapq


def merge_k_sorted(lists):
    heap = []
    for idx, seq in enumerate(lists):
        if seq:
            heapq.heappush(heap, (seq[0], idx, 0))
    out = []
    while heap:
        val, idx, pos = heapq.heappop(heap)
        out.append(val)
        nxt = pos + 1
        if nxt < len(lists[idx]):
            heapq.heappush(heap, (lists[idx][nxt], idx, nxt))
    return out
```

## Restored

All twenty station logs stream into one sorted timeline in `O(n log k)` comparisons.
