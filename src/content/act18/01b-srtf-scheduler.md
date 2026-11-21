---
id: srtf-scheduler
title: Preempt tasks with Shortest Remaining Time First
system: Scheduler bay
symbol: instrument
scene: tests
skills: cpu-scheduling
---

## Briefing

Among all scheduling policies, **Shortest Remaining Time First (SRTF)** achieves the provably lowest average waiting time by always running whichever arrived job has the smallest remaining burst.

## Concept

Each process dict has `{"pid": str, "arrival": int, "burst": int}` (integer ticks, `burst >= 1`).
Simulate tick by tick (or jump between arrival/completion events):
- At tick `t`, consider all unfinished processes with `arrival <= t`.
- Pick the one with smallest `(remaining_time, arrival, pid)`!
- Run it for `1` tick (`remaining -= 1`, `t += 1`). If no process has arrived yet, jump `t` directly to the next `arrival`!
- When `remaining` hits `0`, record `completion = t`, `turnaround = completion - arrival`, and `waiting = turnaround - burst`.

## Objective

Write `schedule_srtf(processes)` returning a dict mapping each `"pid"` to:
`{"completion": int, "turnaround": int, "waiting": int}`.

## Hints

1. Copy `rem = {p["pid"]: p["burst"] for p in processes}` and start `t = 0`.
2. While any process has `rem[pid] > 0`: find ready processes (`arrival <= t` and `rem > 0`); if empty, advance `t = min(p["arrival"] for p in processes if rem[p["pid"]] > 0)`. Otherwise pick `min(ready, key=lambda p: (rem[p["pid"]], p["arrival"], p["pid"]))` and run `1` tick!

## Starter: guided

```python
def schedule_srtf(processes):
    if not processes:
        return {}
    rem = {p["pid"]: p["burst"] for p in processes}
    by_pid = {p["pid"]: p for p in processes}
    done = {}
    t = 0
    while len(done) < len(processes):
        ready = [p for p in processes if p["arrival"] <= t and rem[p["pid"]] > 0]
        if not ready:
            t = min(p["arrival"] for p in processes if rem[p["pid"]] > 0)
            continue
        # Pick min by (rem[pid], arrival, pid), run 1 tick, record stats when rem == 0
        break
    return done
```

## Starter: standard

```python
def schedule_srtf(processes):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _preempt():
    procs = [
        {"pid": "p1", "arrival": 0, "burst": 7},
        {"pid": "p2", "arrival": 2, "burst": 4},
        {"pid": "p3", "arrival": 4, "burst": 1},
        {"pid": "p4", "arrival": 5, "burst": 4},
    ]
    return get("schedule_srtf")(procs)
expect("preempts longer running jobs for shorter arrivals", _preempt, {
    "p1": {"completion": 16, "turnaround": 16, "waiting": 9},
    "p2": {"completion": 7, "turnaround": 5, "waiting": 1},
    "p3": {"completion": 5, "turnaround": 1, "waiting": 0},
    "p4": {"completion": 11, "turnaround": 6, "waiting": 2},
})
```

## Hidden checks

```python
def _idle_gap():
    procs = [
        {"pid": "a", "arrival": 5, "burst": 2},
        {"pid": "b", "arrival": 10, "burst": 3},
    ]
    return get("schedule_srtf")(procs)
expect("handles idle CPU gaps cleanly", _idle_gap, {
    "a": {"completion": 7, "turnaround": 2, "waiting": 0},
    "b": {"completion": 13, "turnaround": 3, "waiting": 0},
})
expect("empty list returns empty dict", lambda: get("schedule_srtf")([]), {})
```

## Solution

```python
def schedule_srtf(processes):
    if not processes:
        return {}
    rem = {p["pid"]: p["burst"] for p in processes}
    done = {}
    t = 0
    while len(done) < len(processes):
        ready = [p for p in processes if p["arrival"] <= t and rem[p["pid"]] > 0]
        if not ready:
            t = min(p["arrival"] for p in processes if rem[p["pid"]] > 0)
            continue
        chosen = min(ready, key=lambda p: (rem[p["pid"]], p["arrival"], p["pid"]))
        pid = chosen["pid"]
        rem[pid] -= 1
        t += 1
        if rem[pid] == 0:
            turnaround = t - chosen["arrival"]
            done[pid] = {
                "completion": t,
                "turnaround": turnaround,
                "waiting": turnaround - chosen["burst"],
            }
    return done
```

## Restored

Preemptive SRTF scheduling minimizes waiting times across overlapping arrivals and idle gaps.
