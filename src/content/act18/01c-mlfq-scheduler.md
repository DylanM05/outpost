---
id: mlfq-scheduler
title: Build a Multi-Level Feedback Queue with boost
system: Scheduler bay
symbol: instrument
scene: tests
skills: cpu-scheduling
---

## Briefing

Real kernels don't know a job's future burst length ahead of time! A **Multi-Level Feedback Queue (MLFQ)** learns from behavior: every new job starts at top priority (`level 0`), demotes one level whenever it burns its full time allotment, and gets boosted back to `level 0` periodically so long jobs never starve.

## Concept

`quanta` gives the per-level time slice (e.g. `[2, 4, 8]` for 3 priority levels `0, 1, 2`; `0` is highest priority!).
Rules for `MlfqScheduler(quanta, boost_interval=None)`:
- `add(pid)`: enqueue `pid` at the back of level `0` (highest priority).
- `step()`: run the single next scheduled slice:
  1. If all queues are empty, return `None`.
  2. Pick the highest-priority (smallest `level`) non-empty queue, pop `pid` from its front, and let `slice_len = quanta[level]`.
  3. Record `self.time += slice_len` (or caller passes remaining work — even cleaner: `add(pid, burst)` so `MlfqScheduler` tracks exact remaining ticks!).
  - Let's make `add(pid, burst)` take remaining burst ticks!
  - Run `ran = min(quanta[level], rem[pid])`, advance `self.time += ran`, `rem[pid] -= ran`.
  - If `rem[pid] > 0`:
    - If `ran == quanta[level]` (used its full quantum!), demote to `min(level + 1, len(quanta) - 1)` and append to that queue.
    - Otherwise re-append to the same `level`.
  - After running, if `boost_interval` is set and `self.time - self.last_boost >= boost_interval`: **priority boost!** Move all remaining queued jobs from every level `> 0` (in order `level 1, 2, ...`, preserving FIFO order within each level) to the back of `level 0`, and set `self.last_boost = self.time`!
  - Return `(pid, level, ran, self.time)` (the `level` at which it ran).

## Objective

Implement `MlfqScheduler(quanta, boost_interval=None)` with `add(pid, burst)` and `step()` returning `(pid, level, ran, end_time)` (or `None` when no jobs remain).

## Hints

1. Store `self.queues = [deque() for _ in quanta]` and `self.rem = {}`.
2. When boosting, iterate `for lvl in range(1, len(self.queues)):` and move `while self.queues[lvl]: self.queues[0].append(self.queues[lvl].popleft())`.

## Starter: guided

```python
from collections import deque


class MlfqScheduler:
    def __init__(self, quanta, boost_interval=None):
        if not quanta or any(q < 1 for q in quanta):
            raise ValueError("quanta must be non-empty positive ints")
        self.quanta = list(quanta)
        self.boost_interval = boost_interval
        self.queues = [deque() for _ in self.quanta]
        self.rem = {}
        self.time = 0
        self.last_boost = 0

    def add(self, pid, burst):
        if burst < 1:
            raise ValueError("burst must be >= 1")
        self.rem[pid] = burst
        self.queues[0].append(pid)

    def step(self):
        # Find highest-priority non-empty queue, run min(quantum, rem), demote if full quantum used, apply boost if due
        return None
```

## Starter: standard

```python
from collections import deque


class MlfqScheduler:
    def __init__(self, quanta, boost_interval=None):
        pass

    def add(self, pid, burst):
        pass

    def step(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _demote():
    s = get("MlfqScheduler")([2, 4])
    s.add("long", 7)
    s.add("short", 1)
    trace = []
    while True:
        ev = s.step()
        if ev is None:
            break
        trace.append(ev)
    return trace
expect("demotes CPU-bound job while letting short job finish at level 0", _demote, [
    ("long", 0, 2, 2),
    ("short", 0, 1, 3),
    ("long", 1, 4, 7),
    ("long", 1, 1, 8),
])

def _boost():
    s = get("MlfqScheduler")([2, 4], boost_interval=4)
    s.add("bg", 6)
    e1 = s.step()  # bg runs at level 0 (t=2), demotes to level 1
    s.add("fg", 2)
    e2 = s.step()  # fg finishes at level 0 (t=4) -> triggers boost! bg moves back to level 0
    e3 = s.step()  # bg runs at level 0!
    return (e1, e2, e3)
expect("priority boost lifts demoted jobs back to level 0", _boost, (("bg", 0, 2, 2), ("fg", 0, 2, 4), ("bg", 0, 2, 6)))
```

## Hidden checks

```python
def _empty():
    s = get("MlfqScheduler")([2, 4])
    return s.step()
expect("step on empty scheduler returns None", _empty, None)
```

## Solution

```python
from collections import deque


class MlfqScheduler:
    def __init__(self, quanta, boost_interval=None):
        if not quanta or any(q < 1 for q in quanta):
            raise ValueError("quanta must be non-empty positive ints")
        self.quanta = list(quanta)
        self.boost_interval = boost_interval
        self.queues = [deque() for _ in self.quanta]
        self.rem = {}
        self.time = 0
        self.last_boost = 0

    def add(self, pid, burst):
        if burst < 1:
            raise ValueError("burst must be >= 1")
        self.rem[pid] = burst
        self.queues[0].append(pid)

    def _boost(self):
        for lvl in range(1, len(self.queues)):
            while self.queues[lvl]:
                self.queues[0].append(self.queues[lvl].popleft())
        self.last_boost = self.time

    def step(self):
        level = None
        for idx, q in enumerate(self.queues):
            if q:
                level = idx
                break
        if level is None:
            return None
        pid = self.queues[level].popleft()
        quantum = self.quanta[level]
        ran = min(quantum, self.rem[pid])
        self.time += ran
        self.rem[pid] -= ran
        if self.rem[pid] > 0:
            next_lvl = min(level + 1, len(self.quanta) - 1) if ran == quantum else level
            self.queues[next_lvl].append(pid)
        if self.boost_interval is not None and self.time - self.last_boost >= self.boost_interval:
            self._boost()
        return (pid, level, ran, self.time)
```

## Restored

The MLFQ scheduler balances snappy interactive latency with anti-starvation priority boosts.
