---
id: maintenance-fix-rr-quantum
title: Fix overshoot bugs in a Round-Robin simulator
system: Scheduler bay
symbol: instrument
scene: tests
skills: cpu-scheduling
reviewSkill: cpu-scheduling
prerequisite: priority-inheritance
---

## Briefing

The Round-Robin simulator in the editor always charges a full `quantum` to the clock even when a job only had `1` tick left — inflating completion times for every job behind it! Fix it!

## Objective

Fix `rr_completion_times(jobs, quantum)` in the editor where `jobs` is a list of `(pid, burst)` tuples (all arriving at `t = 0`) and `quantum >= 1` (raise `ValueError` if `quantum < 1`).

Return `{pid: completion_time}` using exact `ran = min(quantum, rem)` time slices.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `if quantum < 1: raise ValueError(...)`.
2. Replace `now += quantum; rem -= quantum` with `ran = min(quantum, rem); now += ran; rem -= ran`.

## Starter

```python
from collections import deque


def rr_completion_times(jobs, quantum):
    if quantum < 1:
        raise ValueError("quantum must be >= 1")
    q = deque([pid, burst] for pid, burst in jobs)
    now = 0
    done = {}
    while q:
        pid, rem = q.popleft()
        now += quantum
        rem -= quantum
        if rem > 0:
            q.append([pid, rem])
        else:
            done[pid] = now
    return done
```

## Checks

```python
expect("computes exact completion times without quantum overshoot", lambda: get("rr_completion_times")([("a", 5), ("b", 1), ("c", 3)], quantum=2), {"a": 9, "b": 3, "c": 8})
expect("handles burst smaller than quantum cleanly", lambda: get("rr_completion_times")([("x", 1)], quantum=5), {"x": 1})
```

## Hidden checks

```python
def _bad():
    try:
        get("rr_completion_times")([("a", 2)], 0)
        return False
    except ValueError:
        return True
expect("quantum < 1 raises ValueError", _bad, True)
```

## Solution

```python
from collections import deque


def rr_completion_times(jobs, quantum):
    if quantum < 1:
        raise ValueError("quantum must be >= 1")
    q = deque([pid, burst] for pid, burst in jobs)
    now = 0
    done = {}
    while q:
        pid, rem = q.popleft()
        ran = min(quantum, rem)
        now += ran
        rem -= ran
        if rem > 0:
            q.append([pid, rem])
        else:
            done[pid] = now
    return done
```

## Restored

Round-Robin slices now yield the CPU the exact tick a short job finishes.
