---
id: maintenance-fan-in-channels
title: Fairly fan in multiple queues
system: Channel rack
symbol: equipment
scene: tests
skills: concurrency
reviewSkill: concurrency
prerequisite: worker-pool
---

## Briefing

Three sensor queues feed one aggregator. If you drain queue 0 completely before touching queue 1, noisy sensors starve quiet ones. Write a fair round-robin fan-in drain.

## Objective

Write `drain_round_robin(queues)` where `queues` is a list of lists (each inner list is a FIFO queue, front at index `0`).

Pop one item at a time from each non-empty queue in order (`0, 1, ..., n-1`, then repeat from `0`) until every queue is empty, and return the combined list of items in drained order. Do not mutate the caller's inner lists.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Copy each inner queue into a `collections.deque` (or track per-queue read indices) so you don't mutate the caller's input lists.
2. Keep a queue of active `deque`s (or loop over indices): pop one element from each non-empty `deque`, append it to `out`, and stop once all are empty.

## Starter

```python
```

## Checks

```python
expect("interleaves queues fairly", lambda: get("drain_round_robin")([["a1", "a2", "a3"], ["b1"], ["c1", "c2"]]), ["a1", "b1", "c1", "a2", "c2", "a3"])
expect("handles empty queues in input", lambda: get("drain_round_robin")([[], [1, 2], []]), [1, 2])
def _no_mutation():
    qs = [[1, 2], [3]]
    out = get("drain_round_robin")(qs)
    return (out, qs)
expect("does not mutate input lists", _no_mutation, ([1, 3, 2], [[1, 2], [3]]))
```

## Hidden checks

```python
expect("empty list of queues returns empty", lambda: get("drain_round_robin")([]), [])
expect("all empty queues returns empty", lambda: get("drain_round_robin")([[], []]), [])
```

## Solution

```python
from collections import deque


def drain_round_robin(queues):
    active = deque(deque(q) for q in queues if q)
    out = []
    while active:
        q = active.popleft()
        out.append(q.popleft())
        if q:
            active.append(q)
    return out
```

## Restored

Every sensor queue gets an equal turn at the aggregator without starvation.
