---
id: race-and-lock
kind: code
title: Ordered locks and deadlock freedom
system: Channel rack
symbol: equipment
scene: tests
skills: concurrency
---

## Briefing

When two concurrent transfers touch the same two fuel accounts in opposite directions:
- Task 1 locks `"A"`, yields, then waits for `"B"`.
- Task 2 locks `"B"`, yields, then waits for `"A"`.

**Deadlock!** Neither task can ever proceed. The classic, rock-solid fix is **lock ordering**: always acquire locks in a single global canonical order (`sorted([src, dst])`), breaking the circular wait forever!

## Objective

Write a `LockTable` class and a cooperative transfer generator `safe_transfer(locks, balances, src, dst, amount)`:

1. `LockTable`:
   - `acquire(self, key)` — returns `True` if `key` was free (marking it locked), or `False` if already held.
   - `release(self, key)` — frees `key` (no-op if not held).
2. `safe_transfer(locks, balances, src, dst, amount)` — a cooperative generator function:
   - If `src == dst`, simply `return True` without locking anything.
   - Determine the two lock keys in **canonical sorted order**: `first, second = sorted([src, dst])`.
   - Loop `while not locks.acquire(first): yield` to wait cooperatively for `first`.
   - Inside a `try ... finally` block (so locks are **always** released even on cancellation/error!):
     - Yield once (`yield`) after acquiring `first` (to prove deadlock freedom even under worst-case interleaving!).
     - Loop `while not locks.acquire(second): yield` to wait for `second`.
     - Inside an inner `try ... finally` releasing `second`:
       - If `balances[src] < amount`: return `False`.
       - Read `src_bal = balances[src]`, `yield`, write `balances[src] = src_bal - amount`, `balances[dst] += amount`, and return `True`.

## Concept

Coffman's four conditions for deadlock are: mutual exclusion, hold-and-wait, no preemption, and **circular wait**. Enforcing a strict total order on lock acquisition (`"A"` before `"B"`) makes circular wait mathematically impossible — Task 1 and Task 2 both request `"A"` first, so one wins both locks while the other waits cleanly!

## Hints

1. `LockTable` just needs `self._held = set()`.
2. Always release `second` in the inner `finally` and `first` in the outer `finally` so no lock is ever leaked.

## Starter: guided

```python
class LockTable:
    def __init__(self):
        self._held = set()

    def acquire(self, key):
        if key in self._held:
            return False
        self._held.add(key)
        return True

    def release(self, key):
        self._held.discard(key)


def safe_transfer(locks, balances, src, dst, amount):
    if src == dst:
        return True
    first, second = sorted([src, dst])
    while not locks.acquire(first):
        yield
    try:
        yield
        # TODO: acquire second cooperatively, transfer atomically inside try/finally
        pass
    finally:
        locks.release(first)
```

## Starter: standard

```python
class LockTable:
    def __init__(self):
        pass

    def acquire(self, key):
        pass

    def release(self, key):
        pass


def safe_transfer(locks, balances, src, dst, amount):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
from collections import deque

LockTable = get("LockTable")
safe_transfer = get("safe_transfer")

def run_opposite_transfers():
    locks = LockTable()
    balances = {"ridge": 100, "valley": 100}
    q = deque([
        ("t1", safe_transfer(locks, balances, "ridge", "valley", 30)),
        ("t2", safe_transfer(locks, balances, "valley", "ridge", 10)),
        ("t3", safe_transfer(locks, balances, "ridge", "valley", 25)),
    ])
    results = {}
    steps = 0
    while q and steps < 500:
        steps += 1
        name, gen = q.popleft()
        try:
            next(gen)
            q.append((name, gen))
        except StopIteration as done:
            results[name] = done.value
    return (not q, balances, results, locks.acquire("ridge") and locks.acquire("valley"))

expect(
    "opposite concurrent transfers finish without deadlock, lost updates, or leaked locks",
    run_opposite_transfers,
    (True, {"ridge": 55, "valley": 145}, {"t1": True, "t2": True, "t3": True}, True),
)
```

## Hidden checks

```python
from collections import deque
LockTable = get("LockTable")
safe_transfer = get("safe_transfer")

def insufficient_funds():
    locks = LockTable()
    balances = {"a": 10, "b": 50}
    q = deque([
        ("t1", safe_transfer(locks, balances, "a", "b", 8)),
        ("t2", safe_transfer(locks, balances, "a", "b", 8)),
    ])
    out = []
    for _ in range(200):
        if not q:
            break
        name, gen = q.popleft()
        try:
            next(gen)
            q.append((name, gen))
        except StopIteration as done:
            out.append(done.value)
    return (sorted(out), balances, locks.acquire("a") and locks.acquire("b"))

expect(
    "only one of two racing withdrawals succeeds, never overdrafting",
    insufficient_funds,
    ([False, True], {"a": 2, "b": 58}, True),
)
```

## Solution

```python
class LockTable:
    def __init__(self):
        self._held = set()

    def acquire(self, key):
        if key in self._held:
            return False
        self._held.add(key)
        return True

    def release(self, key):
        self._held.discard(key)


def safe_transfer(locks, balances, src, dst, amount):
    if src == dst:
        return True
    first, second = sorted([src, dst])
    while not locks.acquire(first):
        yield
    try:
        yield
        while not locks.acquire(second):
            yield
        try:
            if balances[src] < amount:
                return False
            src_bal = balances[src]
            yield
            balances[src] = src_bal - amount
            balances[dst] += amount
            return True
        finally:
            locks.release(second)
    finally:
        locks.release(first)
```

## Restored

Opposite-direction transfers interleave safely with zero deadlocks, zero lost updates, and zero leaked locks.
