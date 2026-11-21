---
id: bounded-channel
kind: code
title: Go-style bounded channels
system: Channel rack
symbol: equipment
scene: tests
skills: concurrency
---

## Briefing

*"Don't communicate by sharing memory; share memory by communicating."*

Go's signature concurrency primitive — and Python's `asyncio.Queue` — is the **bounded channel**: producers push items into a fixed-capacity FIFO buffer, consumers pull items out, and closing the channel lets consumers cleanly drain every remaining buffered item before stopping.

## Objective

Write a class `Channel`:

- `__init__(self, capacity)` — validate `capacity >= 1` (raise `ValueError` otherwise). Initializes an empty FIFO buffer (`deque`) and `self.closed = False`.
- `try_send(self, item)`:
  - If `self.closed`, raise `ValueError("cannot send on closed channel")`.
  - If the buffer is at capacity (`len == capacity`), return `False` (backpressure!).
  - Otherwise enqueue `item` and return `True`.
- `try_recv(self)`:
  - If the buffer has an item, pop and return `("item", value)` (even if `self.closed` is `True` — buffered items must still drain!).
  - If the buffer is empty and `self.closed`, return `("closed", None)`.
  - If the buffer is empty and open, return `("empty", None)`.
- `close(self)` — sets `self.closed = True` (calling `close()` again is a safe no-op).

## Concept

Notice the exact three-state receive contract (`"item"`, `"empty"`, `"closed"`):
- Producers stop when `try_send` returns `False` and yield until space opens up.
- Consumers drain every item sent before `close()`, and only exit their loop when `try_recv()` returns `("closed", None)`.
- Sending after `close()` raises an error immediately (just like Go panicking on send-to-closed-channel) so protocol bugs surface right away.

## Hints

1. Use `collections.deque()` for `self._buf`.
2. In `try_recv`, check `if self._buf:` **before** checking `if self.closed:` so items already buffered before `close()` are never lost!

## Starter: guided

```python
from collections import deque


class Channel:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self._buf = deque()
        self.closed = False

    def try_send(self, item):
        if self.closed:
            raise ValueError("cannot send on closed channel")
        # TODO: return False if full, else append and return True
        pass

    def try_recv(self):
        # TODO: drain buffer first, then check closed vs empty
        pass

    def close(self):
        self.closed = True
```

## Starter: standard

```python
from collections import deque


class Channel:
    def __init__(self, capacity):
        pass

    def try_send(self, item):
        pass

    def try_recv(self):
        pass

    def close(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
Ch = get("Channel")
def flow():
    ch = Ch(2)
    s1 = ch.try_send("a")
    s2 = ch.try_send("b")
    s3 = ch.try_send("c")  # full -> False
    ch.close()
    r1 = ch.try_recv()
    r2 = ch.try_recv()
    r3 = ch.try_recv()
    return (s1, s2, s3, r1, r2, r3)

expect(
    "enforces capacity, drains after close, then reports closed",
    flow,
    (True, True, False, ("item", "a"), ("item", "b"), ("closed", None)),
)

def send_after_close():
    ch = Ch(1)
    ch.close()
    try:
        ch.try_send("x")
        return False
    except ValueError:
        return True
check("sending on a closed channel raises ValueError", send_after_close)
```

## Hidden checks

```python
Ch = get("Channel")
expect("open empty channel returns ('empty', None)", lambda: Ch(1).try_recv(), ("empty", None))
def bad_cap():
    try:
        Ch(0)
        return False
    except ValueError:
        return True
check("capacity < 1 raises ValueError", bad_cap)
```

## Solution

```python
from collections import deque


class Channel:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        self.capacity = capacity
        self._buf = deque()
        self.closed = False

    def try_send(self, item):
        if self.closed:
            raise ValueError("cannot send on closed channel")
        if len(self._buf) >= self.capacity:
            return False
        self._buf.append(item)
        return True

    def try_recv(self):
        if self._buf:
            return ("item", self._buf.popleft())
        if self.closed:
            return ("closed", None)
        return ("empty", None)

    def close(self):
        self.closed = True
```

## Restored

Producers and consumers now coordinate cleanly through bounded channels with backpressure and graceful shutdown draining.
