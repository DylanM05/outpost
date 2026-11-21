---
id: maintenance-lock-order-check
title: Detect potential lock-order deadlocks
system: Channel rack
symbol: equipment
scene: tests
skills: concurrency
reviewSkill: concurrency
prerequisite: worker-pool
---

## Briefing

If Task 1 acquires lock `A` while holding `B` and Task 2 acquires `B` while holding `A`, a deadlock is waiting to happen! Build a static lock-inversion detector.

## Objective

Write `has_lock_inversion(orders)` where `orders` is a list of lock-acquisition sequences (each a `list[str]`, e.g. `[["A", "B"], ["B", "C"], ["C", "A"]]` meaning task 1 locks `A` then `B`, task 2 locks `B` then `C`, task 3 locks `C` then `A`).

Build the directed wait-for graph of edges `seq[i] -> seq[i + 1]` and return `True` if there is any **cycle** (possible deadlock!), or `False` if a consistent global lock order exists.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Build a directed graph with an edge `seq[i] -> seq[i + 1]` for every consecutive pair in each acquisition sequence.
2. Run Kahn's algorithm (or 3-color DFS): if a cycle exists, return `True`, else `False`.

## Starter

```python
```

## Checks

```python
expect("direct A->B vs B->A inversion detected", lambda: get("has_lock_inversion")([["A", "B"], ["B", "A"]]), True)
expect("3-way cycle A->B->C->A detected", lambda: get("has_lock_inversion")([["A", "B"], ["B", "C"], ["C", "A"]]), True)
expect("consistent global order returns False", lambda: get("has_lock_inversion")([["A", "B", "C"], ["A", "C"], ["B", "C"]]), False)
```

## Hidden checks

```python
expect("empty list returns False", lambda: get("has_lock_inversion")([]), False)
expect("single lock per task never deadlocks", lambda: get("has_lock_inversion")([["A"], ["B"]]), False)
```

## Solution

```python
from collections import deque


def has_lock_inversion(orders):
    nodes = set()
    adj = {}
    indeg = {}
    for seq in orders:
        for lock in seq:
            nodes.add(lock)
            adj.setdefault(lock, set())
            indeg.setdefault(lock, 0)
        for i in range(len(seq) - 1):
            u, v = seq[i], seq[i + 1]
            if v not in adj[u]:
                adj[u].add(v)
                indeg[v] = indeg.get(v, 0) + 1
    q = deque(n for n in nodes if indeg[n] == 0)
    visited = 0
    while q:
        u = q.popleft()
        visited += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return visited < len(nodes)
```

## Restored

Lock-order inversions are flagged statically before two tasks ever freeze in production.
