---
id: maintenance-fcfs-waiting
title: Compute FCFS waiting times across idle gaps
system: Scheduler bay
symbol: instrument
scene: tests
skills: cpu-scheduling
reviewSkill: cpu-scheduling
prerequisite: priority-inheritance
---

## Briefing

Under First-Come First-Served (FCFS) scheduling, processes run to completion in arrival order — but if the CPU sits idle before a late arrival, that process starts immediately at its arrival time with `0` waiting time!

## Objective

Write `fcfs_waiting(processes)` where `processes` is a list of `(pid, arrival, burst)` tuples (not guaranteed to be sorted).

Sort by `(arrival, pid)`, simulate non-preemptive FCFS execution, and return a dict `{pid: waiting_time}` where `waiting_time = start_time - arrival`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Sort `processes` by `(arrival, pid)` and initialize `now = 0`.
2. For each `(pid, arrival, burst)`: `start = max(now, arrival)`, `wait[pid] = start - arrival`, and `now = start + burst`.

## Starter

```python
```

## Checks

```python
expect("computes waiting times with overlap and idle gap", lambda: get("fcfs_waiting")([("b", 1, 3), ("a", 0, 4), ("c", 10, 2)]), {"a": 0, "b": 3, "c": 0})
expect("empty list returns empty dict", lambda: get("fcfs_waiting")([]), {})
```

## Hidden checks

```python
expect("breaks identical arrival ties by pid ascending", lambda: get("fcfs_waiting")([("p2", 2, 5), ("p1", 2, 3)]), {"p1": 0, "p2": 3})
```

## Solution

```python
def fcfs_waiting(processes):
    now = 0
    wait = {}
    for pid, arrival, burst in sorted(processes, key=lambda p: (p[1], p[0])):
        start = max(now, arrival)
        wait[pid] = start - arrival
        now = start + burst
    return wait
```

## Restored

FCFS waiting times account for both queued contention and idle CPU intervals accurately.
