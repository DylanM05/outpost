---
id: maintenance-rate-semaphore
title: Fix a leaky concurrency semaphore
system: Channel rack
symbol: equipment
scene: tests
skills: concurrency
reviewSkill: concurrency
prerequisite: worker-pool
---

## Briefing

A junior engineer wrote a counting `Semaphore` to cap concurrent radio uploads, but two bugs slipped in: it allows one extra slot past `limit`, and calling `release()` when nothing is held inflates `available` above `limit` forever.

## Objective

Fix the `Semaphore` class in the editor so that:
- `Semaphore(limit)` validates `limit >= 1` (raising `ValueError` otherwise) and starts with `available == limit`.
- `acquire()` decrements `available` and returns `True` when a slot is free, or returns `False` without going negative when `available == 0`.
- `release()` increments `available` by `1` when `available < limit`, or raises `ValueError` if already at `limit` (over-release).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check the boundary in `acquire()`: if `available` is `0`, you must NOT acquire a slot (change `>= 0` to `> 0`).
2. In `__init__`, reject `limit < 1` with `ValueError`, and in `release()`, raise `ValueError` if `self.available >= self.limit`.

## Starter

```python
class Semaphore:
    def __init__(self, limit):
        self.limit = limit
        self.available = limit

    def acquire(self):
        if self.available >= 0:
            self.available -= 1
            return True
        return False

    def release(self):
        self.available += 1
```

## Checks

```python
def _basic():
    s = get("Semaphore")(2)
    return (s.acquire(), s.acquire(), s.acquire(), s.available)
expect("enforces exact concurrency limit", _basic, (True, True, False, 0))

def _release():
    s = get("Semaphore")(1)
    s.acquire()
    s.release()
    return (s.available, s.acquire())
expect("release restores a slot", _release, (1, True))

def _over_release():
    s = get("Semaphore")(2)
    try:
        s.release()
        return False
    except ValueError:
        return s.available == 2
expect("over-release raises ValueError without inflating limit", _over_release, True)
```

## Hidden checks

```python
def _bad_limit():
    for bad in (0, -3):
        try:
            get("Semaphore")(bad)
            return False
        except ValueError:
            pass
    return True
expect("non-positive limit raises ValueError", _bad_limit, True)
```

## Solution

```python
class Semaphore:
    def __init__(self, limit):
        if limit < 1:
            raise ValueError("limit must be at least 1")
        self.limit = limit
        self.available = limit

    def acquire(self):
        if self.available > 0:
            self.available -= 1
            return True
        return False

    def release(self):
        if self.available >= self.limit:
            raise ValueError("semaphore over-released")
        self.available += 1
```

## Restored

Upload concurrency stays strictly bounded, and double-release bugs fail loudly instead of leaking permits.
