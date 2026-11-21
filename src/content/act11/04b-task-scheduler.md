---
id: task-scheduler
kind: code
title: Build a cooperative task scheduler
system: Event loop
symbol: controller
scene: tests
skills: concurrency
---

## Briefing

In a real backend, one task raising an exception must **never** crash the whole event loop or drop sibling tasks. Build a round-robin `Scheduler` that interleaves generator tasks, collects return values from `StopIteration.value`, and isolates per-task errors cleanly.

## Objective

Write a class `Scheduler`:

- `__init__(self)` initializes a FIFO queue (`collections.deque`) and a results dict.
- `spawn(self, name, gen)` adds `(name, gen)` to the back of the queue.
- `run(self)` runs tasks round-robin until the queue is empty:
  - Pop `(name, gen)` from the left.
  - Call `next(gen)`:
    - If it yields normally, re-append `(name, gen)` to the right of the queue.
    - If `StopIteration as done` is raised, record `results[name] = ("ok", done.value)`.
    - If any other `Exception as exc` is raised, record `results[name] = ("error", str(exc))` and do **not** re-enqueue that task (sibling tasks continue running!).
  - Return `results`.

## Concept

When a generator finishes with `return 42`, Python raises `StopIteration(42)` — its `.value` attribute holds the return value! Isolating exceptions per task mirrors `asyncio.gather(..., return_exceptions=True)`, keeping one bad connection from bringing down every healthy peer on the event loop.

## Hints

1. Use `collections.deque()` for O(1) `popleft()` and `append()`.
2. Catch `StopIteration` *before* `Exception` (since `StopIteration` inherits from `Exception`!).

## Starter: guided

```python
from collections import deque


class Scheduler:
    def __init__(self):
        self._queue = deque()

    def spawn(self, name, gen):
        self._queue.append((name, gen))

    def run(self):
        results = {}
        while self._queue:
            name, gen = self._queue.popleft()
            try:
                next(gen)
                # TODO: re-enqueue (name, gen)
            except StopIteration as done:
                # TODO: store ("ok", done.value)
                pass
            except Exception as exc:
                # TODO: store ("error", str(exc))
                pass
        return results
```

## Starter: standard

```python
from collections import deque


class Scheduler:
    def __init__(self):
        pass

    def spawn(self, name, gen):
        pass

    def run(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
S = get("Scheduler")
def test_interleave_and_isolation():
    log = []
    def worker(tag, n):
        for i in range(n):
            log.append(f"{tag}{i}")
            yield
        return f"done-{tag}"
    def broken():
        log.append("X0")
        yield
        raise RuntimeError("sensor offline")
    s = S()
    s.spawn("a", worker("A", 2))
    s.spawn("bad", broken())
    s.spawn("b", worker("B", 2))
    res = s.run()
    return (log, res)

expect(
    "interleaves tasks round-robin and isolates crashes",
    test_interleave_and_isolation,
    (
        ["A0", "X0", "B0", "A1", "B1"],
        {"a": ("ok", "done-A"), "bad": ("error", "sensor offline"), "b": ("ok", "done-B")},
    ),
)
```

## Hidden checks

```python
S = get("Scheduler")
def immediate_return():
    if False:
        yield
    return 99

def run_immediate():
    s = S()
    s.spawn("fast", immediate_return())
    return s.run()

expect("generator returning without yielding records ok value", run_immediate, {"fast": ("ok", 99)})
expect("empty scheduler returns {}", lambda: S().run(), {})
```

## Solution

```python
from collections import deque


class Scheduler:
    def __init__(self):
        self._queue = deque()

    def spawn(self, name, gen):
        self._queue.append((name, gen))

    def run(self):
        results = {}
        while self._queue:
            name, gen = self._queue.popleft()
            try:
                next(gen)
                self._queue.append((name, gen))
            except StopIteration as done:
                results[name] = ("ok", done.value)
            except Exception as exc:
                results[name] = ("error", str(exc))
        return results
```

## Restored

The event loop interleaves concurrent tasks fairly and keeps one crashed sensor from knocking out the rest of the outpost.
