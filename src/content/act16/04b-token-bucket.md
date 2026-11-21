---
id: token-bucket
title: Shape bursty traffic with a token bucket
system: Gateway router
symbol: equipment
scene: tests
skills: traffic-engineering
---

## Briefing

Fixed-window rate limiters allow 2x spikes across minute boundaries, while rigid spacing rejects harmless short bursts. A **token bucket** refills smoothly at `rate` tokens/second up to `capacity`, permitting controlled bursts while capping sustained throughput.

## Concept

State: `tokens` (starts full at `float(capacity)`), `last_ts` (initialized on first call or `__init__`).
When `allow(now, cost=1.0)` is called:
1. Validate `cost >= 0` (else `ValueError`).
2. Compute `elapsed = max(0.0, now - self.last_ts)` and refill `self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)`.
3. Update `self.last_ts = now`.
4. If `self.tokens >= cost`: subtract `self.tokens -= cost` and return `True`.
5. Otherwise do NOT deduct any tokens and return `False`!

## Objective

Implement `TokenBucket(capacity, rate, start_time=0.0)`:
- Validate `capacity > 0` and `rate > 0` (else `ValueError`).
- Start full (`tokens = float(capacity)`, `last_ts = float(start_time)`).
- `allow(self, now, cost=1.0)` — refills smoothly up to `capacity` and consumes `cost` iff enough tokens are available.
- `available(self, now)` — returns the current refilled token count at timestamp `now` without consuming tokens.

## Hints

1. Write a helper `_refill(now)` shared by both `allow` and `available`, guarding `elapsed = max(0.0, now - self.last_ts)`.
2. Remember: if a request asks for `cost > capacity`, it always returns `False` without modifying `self.tokens`.

## Starter: guided

```python
class TokenBucket:
    def __init__(self, capacity, rate, start_time=0.0):
        if capacity <= 0 or rate <= 0:
            raise ValueError("capacity and rate must be positive")
        self.capacity = float(capacity)
        self.rate = float(rate)
        self.tokens = float(capacity)
        self.last_ts = float(start_time)

    def _refill(self, now):
        elapsed = max(0.0, now - self.last_ts)
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_ts = max(self.last_ts, float(now))

    def allow(self, now, cost=1.0):
        if cost < 0:
            raise ValueError("cost must be >= 0")
        # Refill, then deduct cost and return True iff self.tokens >= cost
        return False

    def available(self, now):
        self._refill(now)
        return self.tokens
```

## Starter: standard

```python
class TokenBucket:
    def __init__(self, capacity, rate, start_time=0.0):
        pass

    def allow(self, now, cost=1.0):
        pass

    def available(self, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _burst_and_refill():
    tb = get("TokenBucket")(capacity=3, rate=1.0, start_time=0.0)
    r = [tb.allow(0.0), tb.allow(0.0), tb.allow(0.0), tb.allow(0.0)]
    after_half = tb.allow(0.5)
    after_one = tb.allow(1.0)
    return (r, after_half, after_one)
expect("allows initial burst then enforces smooth refill rate", _burst_and_refill, ([True, True, True, False], False, True))

def _cap():
    tb = get("TokenBucket")(capacity=5, rate=2.0, start_time=0.0)
    tb.allow(0.0, cost=4.0)
    return round(tb.available(100.0), 4)
expect("caps refilled tokens at capacity", _cap, 5.0)
```

## Hidden checks

```python
def _cost_exceeds_cap():
    tb = get("TokenBucket")(capacity=3, rate=1.0, start_time=0.0)
    denied = tb.allow(0.0, cost=5.0)
    rem = round(tb.available(0.0), 4)
    return (denied, rem)
expect("oversized request is denied without draining tokens", _cost_exceeds_cap, (False, 3.0))
```

## Solution

```python
class TokenBucket:
    def __init__(self, capacity, rate, start_time=0.0):
        if capacity <= 0 or rate <= 0:
            raise ValueError("capacity and rate must be positive")
        self.capacity = float(capacity)
        self.rate = float(rate)
        self.tokens = float(capacity)
        self.last_ts = float(start_time)

    def _refill(self, now):
        elapsed = max(0.0, now - self.last_ts)
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        if now > self.last_ts:
            self.last_ts = float(now)

    def allow(self, now, cost=1.0):
        if cost < 0:
            raise ValueError("cost must be >= 0")
        self._refill(now)
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False

    def available(self, now):
        self._refill(now)
        return self.tokens
```

## Restored

Traffic shaping now absorbs short bursts gracefully while keeping sustained request rates strictly capped.
