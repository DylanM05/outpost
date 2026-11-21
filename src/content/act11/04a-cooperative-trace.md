---
id: cooperative-trace
kind: predict
title: Cooperative multitasking with generators
system: Event loop
symbol: controller
scene: console
skills: concurrency, reading-code
---

## Briefing

How does a single-threaded event loop (like Python's `asyncio` or Node.js) juggle thousands of open connections at once without threads? Every task runs until it hits an `await` / `yield`, hands control back to a scheduler queue, and waits its turn!

## Objective

Trace this tiny 8-line round-robin event loop and predict **every line it prints**.

## Concept

A Python generator function pauses whenever it hits `yield` and resumes right after that line on the next `next(task)` call. Putting generators in a `deque` gives you a working cooperative event loop:

1. Pop the task at the front of the queue.
2. Step it once with `next(task)`.
3. If it yields (still running), push it to the back of the queue.
4. If it raises `StopIteration`, it's finished!

## Hints

1. Both `poll("A", 2)` and `poll("B", 1)` enter the queue (`[A, B]`).
2. `A` prints `A:0` and yields -> queue becomes `[B, A]`.
3. `B` prints `B:0` and yields -> queue becomes `[A, B]`.
4. `A` prints `A:1` and yields -> queue becomes `[B, A]`.
5. `B` has no more iterations, prints `B:done`, and raises `StopIteration` -> queue becomes `[A]`.
6. `A` prints `A:done` and finishes!

## Program

```python
from collections import deque


def poll(name, steps):
    for i in range(steps):
        print(f"{name}:{i}")
        yield
    print(f"{name}:done")


queue = deque([poll("A", 2), poll("B", 1)])
while queue:
    task = queue.popleft()
    try:
        next(task)
        queue.append(task)
    except StopIteration:
        pass
```

## Output

```text
A:0
B:0
A:1
B:done
A:done
```

## Restored

You just traced a real cooperative event loop — the exact interleaving model underneath `asyncio` and async servers.
