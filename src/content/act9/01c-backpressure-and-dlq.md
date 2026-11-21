---
id: backpressure-and-dlq
title: Backpressure and dlq
system: Drafting table
symbol: instrument
scene: tests
skills: architecture, reliability, linear-structures
---

## Briefing

An unbounded queue hides a slow consumer until the server runs out of memory and crashes. Real message brokers enforce **backpressure** (a bounded queue that rejects new jobs when full) and **bounded retries** (re-enqueuing a failed job up to `max_attempts`, then moving poison messages to a dead-letter list so they stop clogging the queue — with a `replay_dead_letters()` method once the bug is fixed).

## Objective

Write a `WorkQueue(max_size, max_attempts)` class backed by a `deque`:

- `self.dead_letters = []`: stores poison jobs `{"job": job, "attempts": int, "error": str}`.
- `enqueue(self, job)`:
  - If the queue currently holds `max_size` pending items, reject with backpressure and return `False`.
  - Otherwise append `(job, 0)` (0 attempts so far) and return `True`.
- `process_next(self, worker)`:
  - If the queue is empty, return `"empty"`.
  - Pop `(job, attempts)` from the front and call `worker(job)` with `attempts += 1`.
  - If `worker(job)` succeeds without raising, return `"ok"`.
  - If `worker(job)` raises an exception:
    - If `attempts < self.max_attempts`, push `(job, attempts)` back onto the **back** of the queue and return `"retried"`.
    - Otherwise append `{"job": job, "attempts": attempts, "error": str(exc)}` to `self.dead_letters` and return `"dead_lettered"`.
- `replay_dead_letters(self)`:
  - Moves dead-lettered jobs back into the queue (resetting their attempt count to `0`) while there is room (`len < max_size`), keeping any that don't fit in `self.dead_letters`, and returns the count replayed.
- `pending(self)`: returns the number of jobs currently in the queue.

```python
wq = WorkQueue(max_size=2, max_attempts=2)
wq.enqueue("a")  # True
wq.enqueue("b")  # True
wq.enqueue("c")  # False (backpressure!)
```

## Concept

Two survival patterns for asynchronous workers:

- **Backpressure (`max_size`):** saying "queue full, slow down" (`False` / `503`) keeps memory bounded instead of letting an outage snowball into an out-of-memory crash.
- **Poison-message handling (`max_attempts` -> DLQ):** without a retry cap, one corrupt message fails forever in an infinite loop, starving healthy messages behind it. Moving it to `dead_letters` after `max_attempts` clears the line while preserving the message for inspection and replay.

## Hints

1. Store `self._queue = deque()` holding `[job, attempts]` or `(job, attempts)` tuples.
2. In `process_next(worker)`: pop from the left (`popleft()`), increment `attempts`, try `worker(job)`. On exception, compare `attempts < self.max_attempts` to decide between `append((job, attempts))` and `self.dead_letters.append(...)`.
3. In `replay_dead_letters(self)`: iterate through `self.dead_letters`, enqueueing while `len(self._queue) < self.max_size`, and keep only the un-replayed remainder in `self.dead_letters`.

## Starter: guided

```python
from collections import deque


class WorkQueue:
    def __init__(self, max_size, max_attempts=3):
        self.max_size = max_size
        self.max_attempts = max_attempts
        self._queue = deque()
        self.dead_letters = []

    def pending(self):
        return len(self._queue)

    def enqueue(self, job):
        # Reject when full (backpressure).
        return False

    def process_next(self, worker):
        # Pop oldest job, run worker(job), retry up to max_attempts, else dead-letter.
        return "empty"

    def replay_dead_letters(self):
        # Move dead letters back to _queue while room remains; return replayed count.
        return 0
```

## Starter: standard

```python
from collections import deque


class WorkQueue:
    def __init__(self, max_size, max_attempts=3):
        self.max_size = max_size
        self.max_attempts = max_attempts
        self.dead_letters = []

    def pending(self):
        return 0

    def enqueue(self, job):
        return False

    def process_next(self, worker):
        return "empty"

    def replay_dead_letters(self):
        return 0
```

## Starter: challenge

```python
```

## Checks

```python
wq = get("WorkQueue")(max_size=2, max_attempts=2)
expect("enqueues up to max_size", lambda: (wq.enqueue("poison"), wq.enqueue("good"), wq.enqueue("overflow")), (True, True, False))

def _worker(job):
    if job == "poison":
        raise ValueError("bad format")

expect("1st fail retries poison to back of queue", lambda: wq.process_next(_worker), "retried")
expect("healthy job runs next and succeeds", lambda: wq.process_next(_worker), "ok")
expect("2nd fail moves poison to dead_letters", lambda: (wq.process_next(_worker), len(wq.dead_letters), wq.dead_letters[0]["job"]), ("dead_lettered", 1, "poison"))
expect("empty queue returns 'empty'", lambda: wq.process_next(_worker), "empty")

expect("replay_dead_letters moves poison back with reset attempts", lambda: (wq.replay_dead_letters(), len(wq.dead_letters), wq.pending()), (1, 0, 1))
expect("fixed worker processes replayed job cleanly", lambda: wq.process_next(lambda j: None), "ok")
```

## Hidden checks

```python
wq2 = get("WorkQueue")(max_size=1, max_attempts=1)
wq2.enqueue("x")
wq2.process_next(lambda j: (_ for _ in ()).throw(RuntimeError("boom")))
wq2.enqueue("y")
wq2.process_next(lambda j: (_ for _ in ()).throw(RuntimeError("boom")))
expect("two dead letters captured", lambda: len(wq2.dead_letters), 2)
expect("replay respects max_size=1 and keeps remaining dead letter", lambda: (wq2.replay_dead_letters(), wq2.pending(), len(wq2.dead_letters), wq2.dead_letters[0]["job"]), (1, 1, 1, "y"))
```

## Solution

```python
from collections import deque


class WorkQueue:
    def __init__(self, max_size, max_attempts=3):
        self.max_size = max_size
        self.max_attempts = max_attempts
        self._queue = deque()
        self.dead_letters = []

    def pending(self):
        return len(self._queue)

    def enqueue(self, job):
        if len(self._queue) >= self.max_size:
            return False
        self._queue.append((job, 0))
        return True

    def process_next(self, worker):
        if not self._queue:
            return "empty"
        job, attempts = self._queue.popleft()
        attempts += 1
        try:
            worker(job)
            return "ok"
        except Exception as exc:
            if attempts < self.max_attempts:
                self._queue.append((job, attempts))
                return "retried"
            self.dead_letters.append({"job": job, "attempts": attempts, "error": str(exc)})
            return "dead_lettered"

    def replay_dead_letters(self):
        replayed = 0
        remaining = []
        for entry in self.dead_letters:
            if len(self._queue) < self.max_size:
                self._queue.append((entry["job"], 0))
                replayed += 1
            else:
                remaining.append(entry)
        self.dead_letters = remaining
        return replayed
```

## Restored

Bounded queues protect memory under load, poison jobs step aside after hitting the retry limit, and dead letters replay cleanly once fixed.
