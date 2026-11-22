---
id: state-locking
title: Protect remote IaC state with TTL locks and fencing tokens
system: Drift vault
symbol: equipment
scene: tests
skills: infra-as-code
---

## Briefing

If two engineers run `terraform apply` simultaneously against the same state bucket, they will corrupt the state file and duplicate cloud resources! Remote backends (like S3 + DynamoDB) enforce **TTL state locks** paired with **monotonic lock tokens** so a stale holder whose lock expired can never overwrite newer state.

## Concept

Implement `StateBackend()`:
- `acquire_lock(owner, now, ttl)`:
  - Requires `ttl > 0` (else `ValueError`).
  - If no active lock exists OR the existing lock has expired (`now >= lock_expires`), grants a new lock to `owner` with `expires = now + ttl` and a new strictly increasing integer `token` (`1, 2, 3, ...`), returning `token`.
  - If another (or even the same) lock is still active (`now < lock_expires`), returns `None`!
- `write_state(token, new_state, now)`:
  - Succeeds ONLY if a lock is currently held, `token == active_token`, AND `now < lock_expires`!
  - Otherwise raises `PermissionError("lock invalid or expired")`.
  - On success, saves a shallow copy of `new_state` and increments `self.version`.
- `release_lock(token)`:
  - Releases the lock iff `token == active_token` (returning `True`), else returns `False`.
- `read_state()` -> returns `(self.version, dict(self.state))`.

## Objective

Implement `StateBackend` with `acquire_lock`, `write_state`, `release_lock`, and `read_state`.

## Hints

1. Check `now < self._lock["expires"]` in `write_state` so a paused process whose lock already expired cannot write even if nobody else has acquired a new lock yet!

## Starter: guided

```python
class StateBackend:
    def __init__(self):
        self.state = {}
        self.version = 0
        self._next_token = 0
        self._lock = None  # None or {"owner": str, "token": int, "expires": int}

    def acquire_lock(self, owner, now, ttl):
        pass

    def write_state(self, token, new_state, now):
        pass

    def release_lock(self, token):
        pass

    def read_state(self):
        return (self.version, dict(self.state))
```

## Starter: standard

```python
class StateBackend:
    def __init__(self):
        pass

    def acquire_lock(self, owner, now, ttl):
        pass

    def write_state(self, token, new_state, now):
        pass

    def release_lock(self, token):
        pass

    def read_state(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _lock_flow():
    b = get("StateBackend")()
    t1 = b.acquire_lock("alice", now=100, ttl=30)
    blocked = b.acquire_lock("bob", now=110, ttl=30)
    b.write_state(t1, {"vpc": "v1"}, now=115)
    # Lock expires at 130 -> bob takes over with token 2!
    t2 = b.acquire_lock("bob", now=130, ttl=30)
    # Alice's stale token must be rejected!
    stale_blocked = False
    try:
        b.write_state(t1, {"vpc": "corrupt"}, now=135)
    except PermissionError:
        stale_blocked = True
    b.write_state(t2, {"vpc": "v2"}, now=135)
    rel = b.release_lock(t2)
    return (t1, blocked, t2, stale_blocked, rel, b.read_state())
expect("enforces mutual exclusion, TTL expiration, and monotonic write fencing", _lock_flow, (
    1,
    None,
    2,
    True,
    True,
    (2, {"vpc": "v2"}),
))
```

## Hidden checks

```python
def _expired_self_write():
    b = get("StateBackend")()
    t1 = b.acquire_lock("alice", now=10, ttl=5)
    try:
        b.write_state(t1, {"a": 1}, now=15)  # exact expiry!
        return False
    except PermissionError:
        return b.release_lock(999) is False
expect("rejects writes after lock TTL even before another client acquires", _expired_self_write, True)
```

## Solution

```python
class StateBackend:
    def __init__(self):
        self.state = {}
        self.version = 0
        self._next_token = 0
        self._lock = None

    def acquire_lock(self, owner, now, ttl):
        if ttl <= 0:
            raise ValueError("ttl must be positive")
        if self._lock is not None and now < self._lock["expires"]:
            return None
        self._next_token += 1
        self._lock = {"owner": owner, "token": self._next_token, "expires": now + ttl}
        return self._next_token

    def write_state(self, token, new_state, now):
        if self._lock is None or self._lock["token"] != token or now >= self._lock["expires"]:
            raise PermissionError("lock invalid or expired")
        self.state = dict(new_state)
        self.version += 1

    def release_lock(self, token):
        if self._lock is not None and self._lock["token"] == token:
            self._lock = None
            return True
        return False

    def read_state(self):
        return (self.version, dict(self.state))
```

## Restored

The drift vault now guards shared infrastructure state with TTL leases and strict write-token fencing.
