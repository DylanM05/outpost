---
id: rr-schedule-trace
kind: predict
title: Trace Round-Robin CPU time slicing
system: Scheduler bay
symbol: instrument
scene: console
skills: cpu-scheduling, reading-code
---

## Briefing

Without preemption, a long compute job hogs the CPU while interactive tasks freeze. **Round-Robin scheduling** gives each runnable process at most one `quantum` of CPU time before moving it to the back of the ready queue.

## Objective

Trace the Round-Robin scheduler below (`quantum = 2`) and predict **every line it prints**.

## Concept

Three jobs start in the ready queue at `t = 0`:
- `A` needs `5` ticks, `B` needs `2`, `C` needs `3`.
- Tick `0..2`: `A` runs `2` (3 left -> requeued).
- Tick `2..4`: `B` runs `2` (0 left -> **done at t=4!**).
- Tick `4..6`: `C` runs `2` (1 left -> requeued).
- Tick `6..8`: `A` runs `2` (1 left -> requeued).
- Tick `8..9`: `C` runs `1` (0 left -> **done at t=9!**).
- Tick `9..10`: `A` runs `1` (0 left -> **done at t=10!**).

## Hints

1. Notice `slices` records the sequence of `(job, duration)` slices executed.
2. `done` records each job's completion timestamp when its remaining work reaches `0`.

## Program

```python
from collections import deque

q = deque([["A", 5], ["B", 2], ["C", 3]])
quantum = 2
now = 0
slices = []
done = {}

while q:
    job, rem = q.popleft()
    run = min(quantum, rem)
    now += run
    rem -= run
    slices.append((job, run))
    if rem > 0:
        q.append([job, rem])
    else:
        done[job] = now

print(slices)
print(sorted(done.items()))
```

## Output

```text
[('A', 2), ('B', 2), ('C', 2), ('A', 2), ('C', 1), ('A', 1)]
[('A', 10), ('B', 4), ('C', 9)]
```

## Restored

You can trace preemptive Round-Robin time slices and exact process completion times by hand.
