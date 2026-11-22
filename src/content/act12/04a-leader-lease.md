---
id: leader-lease
kind: code
title: Leader leases and fencing tokens
system: Quorum vault
symbol: controller
scene: tests
skills: distributed-systems
---

## Briefing

Only one controller replica should modify the cluster's routing table at a time. A **leader lease** grants leadership for `ttl` seconds — and hands the new leader a monotonically increasing **fencing token** (`1, 2, 3, ...`)! If an old leader pauses (GC pause or network partition) and wakes up thinking it's still in charge, its stale fencing token (`1 < 2`) is rejected immediately by storage!

## Objective

Write a class `LeaseManager`:

- `__init__(self, ttl)` — validates `ttl > 0` (raise `ValueError` otherwise). Starts with no leader (`holder = None`, `token = 0`, `expires_at = 0`).
- `acquire(self, candidate, now)`:
  - If there is currently an active lease (`self.holder is not None and now < self.expires_at`):
    - If `candidate == self.holder`, return `self.token` (idempotent) or `None`? Specifically: return `None` if **another** node holds an unexpired lease; if `candidate == self.holder`, renew `self.expires_at = now + self.ttl` and return `self.token`.
  - If no lease is active (or `now >= self.expires_at`), increment `self.token += 1`, set `self.holder = candidate`, `self.expires_at = now + self.ttl`, and return `self.token`!
- `renew(self, holder, token, now)` — returns `True` and sets `self.expires_at = now + self.ttl` iff `holder == self.holder and token == self.token and now < self.expires_at`; otherwise returns `False`.
- `is_valid(self, holder, token, now)` — returns `True` iff `holder == self.holder and token == self.token and now < self.expires_at`.

## Concept

Why aren't timeouts alone enough to prevent split-brain writes?

Suppose Leader A gets a lease expiring at `t=10`, pauses for 15 seconds while Leader B acquires a new lease at `t=11`, and then Leader A's delayed write packet finally arrives at storage at `t=15`! Because storage rejects any write whose fencing token is smaller than the highest token it has seen (`1 < 2`), **fencing tokens** eliminate split-brain corruption completely.

## Hints

1. Notice expiry is strictly `now < self.expires_at` (so at exact `now == self.expires_at`, the lease has expired and a new candidate may acquire it with `token + 1`).
2. `renew` must never extend an already-expired lease (`now >= self.expires_at`).

## Starter: guided

```python
class LeaseManager:
    def __init__(self, ttl):
        if ttl <= 0:
            raise ValueError("ttl must be positive")
        self.ttl = ttl
        self.holder = None
        self.token = 0
        self.expires_at = 0

    def acquire(self, candidate, now):
        # TODO: handle unexpired lease vs expired/empty lease (increment token!)
        pass

    def renew(self, holder, token, now):
        # TODO: extend expires_at only if active, holder matches, and token matches
        pass

    def is_valid(self, holder, token, now):
        return self.holder == holder and self.token == token and now < self.expires_at
```

## Starter: standard

```python
class LeaseManager:
    def __init__(self, ttl):
        pass

    def acquire(self, candidate, now):
        pass

    def renew(self, holder, token, now):
        pass

    def is_valid(self, holder, token, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
LM = get("LeaseManager")
def test_lease_and_fencing():
    lm = LM(ttl=10)
    t1 = lm.acquire("node-a", now=0)         # token 1, expires at 10
    blocked = lm.acquire("node-b", now=5)    # None (node-a active)
    renewed = lm.renew("node-a", t1, now=8)  # True, now expires at 18
    t2 = lm.acquire("node-b", now=18)        # expired at 18 -> token 2!
    stale_ok = lm.is_valid("node-a", t1, now=19)
    new_ok = lm.is_valid("node-b", t2, now=19)
    return (t1, blocked, renewed, t2, stale_ok, new_ok)

expect(
    "grants monotonic fencing tokens and invalidates expired leaders",
    test_lease_and_fencing,
    (1, None, True, 2, False, True),
)
```

## Hidden checks

```python
LM = get("LeaseManager")
def test_cannot_renew_after_expiry():
    lm = LM(ttl=5)
    t1 = lm.acquire("a", now=10)
    return (lm.renew("a", t1, now=15), lm.acquire("a", now=15))

expect("renew fails at exact expiry; re-acquire bumps token to 2", test_cannot_renew_after_expiry, (False, 2))
```

## Solution

```python
class LeaseManager:
    def __init__(self, ttl):
        if ttl <= 0:
            raise ValueError("ttl must be positive")
        self.ttl = ttl
        self.holder = None
        self.token = 0
        self.expires_at = 0

    def acquire(self, candidate, now):
        if self.holder is not None and now < self.expires_at:
            if candidate == self.holder:
                self.expires_at = now + self.ttl
                return self.token
            return None
        self.token += 1
        self.holder = candidate
        self.expires_at = now + self.ttl
        return self.token

    def renew(self, holder, token, now):
        if self.is_valid(holder, token, now):
            self.expires_at = now + self.ttl
            return True
        return False

    def is_valid(self, holder, token, now):
        return self.holder == holder and self.token == token and now < self.expires_at
```

## Restored

Split-brain zombies can no longer overwrite state once their lease expires and the fencing token advances.
