---
id: worker-pool
kind: code
title: Bounded worker pool (semaphore)
system: Channel rack
symbol: equipment
scene: tests
skills: concurrency
---

## Briefing

Spawning 10,000 concurrent requests at once overwhelms downstream relays and exhausts file descriptors. A **bounded worker pool** (or **semaphore**) keeps at most `max_concurrent` tasks active at any moment, launching the next waiting task the instant a slot frees up.

## Objective

Write `run_pool(task_specs, max_concurrent)`:

- Validate `max_concurrent >= 1` (raise `ValueError` otherwise).
- `task_specs` is a list of `(name, factory)` pairs where calling `factory()` creates a cooperative generator task (do **not** call `factory()` until a concurrency slot is available!).
- Run all tasks round-robin so that at most `max_concurrent` tasks are active at the same time:
  - Whenever `len(active) < max_concurrent` and waiting tasks remain, pull the next `(name, factory)`, instantiate `gen = factory()`, and append `(name, gen)` to the active queue.
  - Record `peak_active = max(peak_active, len(active))`.
  - Step one active task with `next(gen)`:
    - If it yields, re-enqueue it at the back of `active`.
    - If it raises `StopIteration as done`, record `results[name] = ("ok", done.value)` (freeing a slot!).
    - If it raises another `Exception as exc`, record `results[name] = ("error", str(exc))` (freeing a slot!).
- Return `{"results": results, "peak_active": peak_active}`.

## Concept

Why pass `factory` functions instead of pre-started generators? So tasks don't allocate connections or buffers until the semaphore grants them a slot! Every real bounded pool (`asyncio.Semaphore`, Go's buffered-channel semaphore `sem <- struct{}{}`) enforces this exact invariant: `in_flight <= max_concurrent` at all times.

## Hints

1. Keep `pending = deque(task_specs)` and `active = deque()`.
2. At the top of every iteration of `while active or pending:`, refill `active` while `len(active) < max_concurrent and pending`, updating `peak_active = max(peak_active, len(active))`.

## Starter: guided

```python
from collections import deque


def run_pool(task_specs, max_concurrent):
    if max_concurrent < 1:
        raise ValueError("max_concurrent must be >= 1")
    pending = deque(task_specs)
    active = deque()
    results = {}
    peak_active = 0

    while active or pending:
        while len(active) < max_concurrent and pending:
            name, factory = pending.popleft()
            active.append((name, factory()))
        peak_active = max(peak_active, len(active))
        # TODO: popleft from active, step next(gen), handle yield / StopIteration / Exception
        break

    return {"results": results, "peak_active": peak_active}
```

## Starter: standard

```python
from collections import deque


def run_pool(task_specs, max_concurrent):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def test_pool_cap():
    in_flight = [0]
    observed_peak = [0]
    def make_task(i):
        def gen():
            in_flight[0] += 1
            observed_peak[0] = max(observed_peak[0], in_flight[0])
            try:
                yield
                yield
                return i * 10
            finally:
                in_flight[0] -= 1
        return gen

    specs = [(f"t{i}", make_task(i)) for i in range(8)]
    out = get("run_pool")(specs, max_concurrent=3)
    return (
        out["peak_active"],
        observed_peak[0],
        out["results"]["t0"],
        out["results"]["t7"],
        len(out["results"]),
    )

expect("caps concurrency at 3 and completes all 8 tasks", test_pool_cap, (3, 3, ("ok", 0), ("ok", 70), 8))
```

## Hidden checks

```python
def test_error_frees_slot():
    def bad():
        yield
        raise RuntimeError("boom")
    def good():
        yield
        return "ok!"
    out = get("run_pool")([("a", bad), ("b", good), ("c", good)], max_concurrent=1)
    return (out["peak_active"], out["results"])

expect(
    "crashed task frees its slot so remaining tasks finish",
    test_error_frees_slot,
    (1, {"a": ("error", "boom"), "b": ("ok", "ok!"), "c": ("ok", "ok!")}),
)
expect("empty task list has peak_active 0", lambda: get("run_pool")([], 4), {"results": {}, "peak_active": 0})
```

## Solution

```python
from collections import deque


def run_pool(task_specs, max_concurrent):
    if max_concurrent < 1:
        raise ValueError("max_concurrent must be >= 1")
    pending = deque(task_specs)
    active = deque()
    results = {}
    peak_active = 0

    while active or pending:
        while len(active) < max_concurrent and pending:
            name, factory = pending.popleft()
            active.append((name, factory()))
        peak_active = max(peak_active, len(active))
        name, gen = active.popleft()
        try:
            next(gen)
            active.append((name, gen))
        except StopIteration as done:
            results[name] = ("ok", done.value)
        except Exception as exc:
            results[name] = ("error", str(exc))

    return {"results": results, "peak_active": peak_active}
```

## Restored

Hundreds of pending jobs now flow smoothly through a capped pool without ever swamping the relay.
