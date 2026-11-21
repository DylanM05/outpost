---
id: rate-limiter
title: Rate limiter
system: Shield wall
symbol: controller
scene: tests
skills: security, linear-structures
---

## Briefing

Without rate limiting, a single misbehaving client (or password brute-forcer) can hammer `/login` thousands of times a second and starve the exchange for everyone else. Reuse the sliding-window `deque` pattern from the deep survey to build a per-client rate limiter that blocks bursts and reports how many seconds the client must wait (`Retry-After`).

## Objective

Write a `RateLimiter(limit, window_seconds)` class with `allow(self, client_id, now)`:

- Allows at most `limit` requests per `client_id` within any sliding window of `window_seconds` (timestamps strictly older than or equal to `now - window_seconds` have expired: keep timestamps `t` with `t > now - window_seconds`).
- If the client currently has fewer than `limit` active timestamps:
  - Record `now` in that client's window and return `(True, 0)`.
- If the client is already at `limit`:
  - **Do not** record `now` (rejected requests don't extend the block!).
  - Compute `retry_after = math.ceil((oldest + window_seconds) - now)` (at least `1` second) and return `(False, retry_after)`.

```python
rl = RateLimiter(limit=2, window_seconds=60)
rl.allow("ip-1", now=100)  # (True, 0)
rl.allow("ip-1", now=110)  # (True, 0)
rl.allow("ip-1", now=120)  # (False, 40)  -> oldest was 100, expires at 160 -> wait 40s
rl.allow("ip-1", now=160)  # (True, 0)    -> 100 expired (100 <= 160 - 60)
```

## Concept

A sliding-window log per `client_id` uses a `deque`:

1. Evict expired timestamps from the front: `while q and q[0] <= now - self.window: q.popleft()`.
2. If `len(q) < self.limit`: `q.append(now)` and allow `(True, 0)`.
3. Otherwise deny with `retry_after = max(1, math.ceil((q[0] + self.window) - now))`.

Because clients are tracked independently in `self._windows[client_id]`, one abusive IP gets throttled with `429 Too Many Requests` without affecting other stations on the ridge.

## Hints

1. Store `self._windows = {}` mapping each `client_id` to a `deque()`.
2. Evict with `while q and q[0] <= now - self.window_seconds: q.popleft()`.
3. Remember not to append `now` when the request is rejected!

## Starter: guided

```python
from collections import deque
import math


class RateLimiter:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window_seconds = window_seconds
        self._windows = {}

    def allow(self, client_id, now):
        q = self._windows.setdefault(client_id, deque())
        # Evict timestamps <= now - self.window_seconds, check limit, return (bool, retry_after).
        return (True, 0)
```

## Starter: standard

```python
from collections import deque
import math


class RateLimiter:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window_seconds = window_seconds

    def allow(self, client_id, now):
        return (True, 0)
```

## Starter: challenge

```python
```

## Checks

```python
rl = get("RateLimiter")(limit=2, window_seconds=60)
expect("1st request allowed", lambda: rl.allow("ip-1", 100), (True, 0))
expect("2nd request allowed", lambda: rl.allow("ip-1", 110), (True, 0))
expect("3rd request blocked with retry_after=40", lambda: rl.allow("ip-1", 120), (False, 40))
expect("different client unaffected", lambda: rl.allow("ip-2", 120), (True, 0))
expect("allowed again once oldest expires at 160", lambda: rl.allow("ip-1", 160), (True, 0))
```

## Hidden checks

```python
rl2 = get("RateLimiter")(limit=1, window_seconds=10)
expect("allow at t=0", lambda: rl2.allow("c", 0), (True, 0))
expect("blocked at t=5 -> wait 5", lambda: rl2.allow("c", 5), (False, 5))
expect("blocked again at t=9 -> rejected attempts don't extend block -> wait 1", lambda: rl2.allow("c", 9), (False, 1), "Do not append rejected timestamps to the deque.")
expect("allowed at t=10", lambda: rl2.allow("c", 10), (True, 0))
```

## Solution

```python
from collections import deque
import math


class RateLimiter:
    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window_seconds = window_seconds
        self._windows = {}

    def allow(self, client_id, now):
        q = self._windows.setdefault(client_id, deque())
        cutoff = now - self.window_seconds
        while q and q[0] <= cutoff:
            q.popleft()
        if len(q) < self.limit:
            q.append(now)
            return (True, 0)
        retry_after = max(1, math.ceil((q[0] + self.window_seconds) - now))
        return (False, retry_after)
```

## Restored

Brute-force floods now hit a clean sliding-window `429` wall while honest stations keep flying smoothly.
