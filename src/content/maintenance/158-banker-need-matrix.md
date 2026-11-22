---
id: maintenance-banker-need-matrix
title: Find processes runnable under current available resources
system: Deadlock bench
symbol: controller
scene: tests
skills: cpu-scheduling
reviewSkill: cpu-scheduling
prerequisite: priority-inheritance
---

## Briefing

Each step of Banker's safety check scans waiting processes to find which ones can finish immediately with the resources currently available.

## Objective

Write `runnable_pids(available, needs)` where `available` is a list of free resource counts (`list[int]`) and `needs` is a dict mapping `pid -> list[int]` of remaining resource needs.

Return a **sorted** list of all `pid`s where `need[i] <= available[i]` for every resource index `i`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `all(n <= a for n, a in zip(need, available))` for each process.
2. Sort the matching `pid`s before returning.

## Starter

```python
```

## Checks

```python
expect("finds all processes whose need vectors fit available", lambda: get("runnable_pids")([3, 2, 1], {"p3": [1, 2, 1], "p1": [4, 0, 0], "p2": [0, 0, 1]}), ["p2", "p3"])
expect("returns empty when none fit", lambda: get("runnable_pids")([0, 1], {"a": [1, 0], "b": [0, 2]}), [])
```

## Hidden checks

```python
expect("zero-need process is always runnable", lambda: get("runnable_pids")([0, 0], {"idle": [0, 0]}), ["idle"])
```

## Solution

```python
def runnable_pids(available, needs):
    return sorted(
        pid
        for pid, need in needs.items()
        if all(n <= a for n, a in zip(need, available))
    )
```

## Restored

Runnable processes are identified cleanly across all resource dimensions.
