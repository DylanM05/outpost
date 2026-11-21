---
id: maintenance-fifo-page-faults
title: Count FIFO page faults for a memory trace
system: Page vault
symbol: equipment
scene: tests
skills: virtual-memory
reviewSkill: virtual-memory
prerequisite: cow-fork
---

## Briefing

To benchmark whether Clock or LRU beats naive FIFO replacement (and spot Belady's anomaly!), implement a fast FIFO page-fault counter.

## Objective

Write `count_fifo_faults(pages, capacity)`:
- Validate `capacity >= 1` (else `ValueError`).
- Simulate a FIFO page cache of size `capacity` over `pages`, evicting the oldest loaded page on a miss when full (hits do NOT change queue order!).
- Return the integer count of page faults.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Pair a `collections.deque` (load order) with a `set` (O(1) membership test).
2. On a miss: increment `faults`, if `len(q) == capacity`, `loaded.remove(q.popleft())`, then push `page` to both.

## Starter

```python
```

## Checks

```python
expect("exhibits Belady's anomaly: 3 frames has 9 faults, 4 frames has 10!", lambda: (
    get("count_fifo_faults")([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 3),
    get("count_fifo_faults")([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 4),
), (9, 10))
expect("empty trace has 0 faults", lambda: get("count_fifo_faults")([], 3), 0)
```

## Hidden checks

```python
def _bad():
    try:
        get("count_fifo_faults")([1], 0)
        return False
    except ValueError:
        return True
expect("capacity < 1 raises ValueError", _bad, True)
```

## Solution

```python
from collections import deque


def count_fifo_faults(pages, capacity):
    if capacity < 1:
        raise ValueError("capacity must be >= 1")
    order = deque()
    loaded = set()
    faults = 0
    for page in pages:
        if page in loaded:
            continue
        faults += 1
        if len(order) == capacity:
            loaded.remove(order.popleft())
        order.append(page)
        loaded.add(page)
    return faults
```

## Restored

FIFO page-fault counts now run in $O(n)$ time — even reproducing Belady's anomaly cleanly.
