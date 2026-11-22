---
id: timeout-and-cancel
kind: code
title: Timeouts and clean cancellation
system: Event loop
symbol: controller
scene: tests
skills: concurrency
---

## Briefing

A stalled network peer can hold a file handle or lock open forever if you don't enforce a timeout. When cancelling a paused coroutine or generator, you must also trigger its `finally` block so it releases its resources cleanly!

## Objective

Write `run_with_budget(gen, max_steps)`:

- Step `gen` up to `max_steps` times (`next(gen)`):
  - If `gen` finishes (`StopIteration as done`) on or before step `max_steps`, return `("ok", done.value)`.
  - If `gen` still hasn't finished after `max_steps` steps (so it yielded `max_steps` times without returning), call `gen.close()` to raise `GeneratorExit` inside the task (running its `finally:` cleanup!) and return `("timeout", None)`.

*(Note: if `max_steps == 0`, close `gen` immediately without calling `next(gen)` and return `("timeout", None)`.)*

## Concept

Calling `gen.close()` is how Python's runtime cancels paused generators — and it's the exact mechanism behind `asyncio.Task.cancel()`! When `gen.close()` runs while `gen` is paused at `yield`, Python injects `GeneratorExit` at that `yield` point, unwinding every active `try ... finally` and `with` block so locks and sockets never leak.

## Hints

1. Loop `for _ in range(max_steps):` calling `next(gen)` inside `try ... except StopIteration as done: return ("ok", done.value)`.
2. After the loop completes without returning, call `gen.close()` and return `("timeout", None)`.

## Starter: guided

```python
def run_with_budget(gen, max_steps):
    for _ in range(max_steps):
        try:
            next(gen)
        except StopIteration as done:
            return ("ok", done.value)
    # TODO: close gen so its finally block runs, then return ("timeout", None)
    pass
```

## Starter: standard

```python
def run_with_budget(gen, max_steps):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def test_timeout_runs_finally():
    events = []
    def slow_fetch():
        events.append("open")
        try:
            for i in range(10):
                events.append(f"wait-{i}")
                yield
            return "data"
        finally:
            events.append("closed")
    res = get("run_with_budget")(slow_fetch(), 3)
    return (res, events)

expect(
    "cancels slow task after budget and runs finally cleanup",
    test_timeout_runs_finally,
    (("timeout", None), ["open", "wait-0", "wait-1", "wait-2", "closed"]),
)

def test_fast_ok():
    def fast():
        yield
        yield
        return "ready"
    return get("run_with_budget")(fast(), 3)

expect("task finishing within budget returns ('ok', value)", test_fast_ok, ("ok", "ready"))
```

## Hidden checks

```python
def test_exact_boundary():
    def exact():
        yield
        return 7
    return (
        get("run_with_budget")(exact(), 1),
        get("run_with_budget")(exact(), 2),
        get("run_with_budget")(exact(), 0),
    )

expect(
    "exact step boundary: 1 yield needs 2 next() calls to hit return",
    test_exact_boundary,
    (("timeout", None), ("ok", 7), ("timeout", None)),
)
```

## Solution

```python
def run_with_budget(gen, max_steps):
    for _ in range(max_steps):
        try:
            next(gen)
        except StopIteration as done:
            return ("ok", done.value)
    gen.close()
    return ("timeout", None)
```

## Restored

Stalled tasks now time out cleanly and unwind every open socket and lock via `finally`.
