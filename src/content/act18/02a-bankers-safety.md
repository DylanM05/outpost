---
id: bankers-safety
title: Verify safe resource states with Banker's algorithm
system: Deadlock bench
symbol: controller
scene: tests
skills: cpu-scheduling
---

## Briefing

Before granting a process extra tape drives or GPU slots, the kernel can simulate whether there is still at least one **safe execution sequence** where every process finishes and releases its resources. If no safe sequence exists, granting the request risks deadlock!

## Concept

Given:
- `available`: list of currently free counts per resource type (length `m`)
- `allocation`: dict `pid -> list[int]` of resources currently held by each process
- `maximum`: dict `pid -> list[int]` of maximum resources each process may ever need

Compute `need[pid] = [maximum[pid][r] - allocation[pid][r] for r in range(m)]`.
Start with `work = list(available)` and `finished = set()`:
- Repeatedly pick the lexicographically smallest unfinished `pid` whose `need[pid][r] <= work[r]` for ALL resources `r`.
- When found, simulate it finishing: add its held resources back (`work[r] += allocation[pid][r]`), mark it finished, and append `pid` to `sequence`!
- If every process finishes (`len(sequence) == len(allocation)`), the state is **SAFE** — return `sequence`!
- If no remaining process can satisfy its `need`, the state is **UNSAFE** — return `None`.

## Objective

Write `find_safe_sequence(available, allocation, maximum)` returning the deterministic safe execution list of `pid`s (picking the lexicographically smallest eligible `pid` at each step), or `None` if unsafe.

## Hints

1. Sort `pids = sorted(allocation.keys())` once and loop: scan `pids` in order for the first unfinished `pid` with `all(maximum[pid][r] - allocation[pid][r] <= work[r] for r in range(m))`.
2. If a full scan finds no eligible `pid` while unfinished processes remain, return `None`!

## Starter: guided

```python
def find_safe_sequence(available, allocation, maximum):
    m = len(available)
    work = list(available)
    pids = sorted(allocation.keys())
    finished = set()
    sequence = []
    while len(finished) < len(pids):
        picked = None
        for pid in pids:
            if pid in finished:
                continue
            # Check if every resource need <= work
            pass
        if picked is None:
            return None
        # Add allocation[picked] to work, mark finished, append to sequence
        break
    return sequence
```

## Starter: standard

```python
def find_safe_sequence(available, allocation, maximum):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _safe():
    avail = [3, 3, 2]
    alloc = {"p0": [0, 1, 0], "p1": [2, 0, 0], "p2": [3, 0, 2], "p3": [2, 1, 1], "p4": [0, 0, 2]}
    mx = {"p0": [7, 5, 3], "p1": [3, 2, 2], "p2": [9, 0, 2], "p3": [2, 2, 2], "p4": [4, 3, 3]}
    return get("find_safe_sequence")(avail, alloc, mx)
expect("finds deterministic safe sequence on classic Banker example", _safe, ["p1", "p3", "p0", "p2", "p4"])

def _unsafe():
    avail = [1, 0]
    alloc = {"a": [1, 0], "b": [0, 1]}
    mx = {"a": [1, 2], "b": [2, 1]}
    return get("find_safe_sequence")(avail, alloc, mx)
expect("returns None for unsafe circular wait state", _unsafe, None)
```

## Hidden checks

```python
expect("empty process set is trivially safe", lambda: get("find_safe_sequence")([1, 1], {}, {}), [])
```

## Solution

```python
def find_safe_sequence(available, allocation, maximum):
    m = len(available)
    work = list(available)
    pids = sorted(allocation.keys())
    finished = set()
    sequence = []
    while len(finished) < len(pids):
        picked = None
        for pid in pids:
            if pid in finished:
                continue
            if all(maximum[pid][r] - allocation[pid][r] <= work[r] for r in range(m)):
                picked = pid
                break
        if picked is None:
            return None
        for r in range(m):
            work[r] += allocation[picked][r]
        finished.add(picked)
        sequence.append(picked)
    return sequence
```

## Restored

Banker's safety check proves deadlock freedom before the kernel commits scarce resources.
