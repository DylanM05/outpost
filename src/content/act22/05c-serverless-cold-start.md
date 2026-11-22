---
id: serverless-cold-start
title: Route serverless invocations across warm and cold sandboxes
system: Scale deck
symbol: controller
scene: tests
skills: cloud-runtime
---

## Briefing

Serverless platforms (AWS Lambda / Cloud Run) run one request per sandbox instance at a time, keep idle sandboxes **warm** for an `idle_ttl` before reaping them, incur extra `cold_start_ms` when spawning a new sandbox, and throttle requests with `429` if `max_concurrency` is already busy!

## Concept

Implement `ServerlessPool(max_concurrency, cold_start_ms, idle_ttl_ms)`:
- Each sandbox tracks `busy_until` (ms) and `last_free_at` (ms).
- **`invoke(now_ms, exec_ms)`:**
  1. First reap any idle sandbox (`busy_until <= now_ms`) that has been idle too long: `now_ms - busy_until > idle_ttl_ms`!
  2. Look for an idle warm sandbox (`busy_until <= now_ms`):
     - If one exists (pick the one with the largest `busy_until`, i.e., most-recently-used warm sandbox!):
       - Reuse it! Set its `busy_until = now_ms + exec_ms`.
       - Return `{"status": 200, "cold_start": False, "latency_ms": exec_ms}`.
  3. Otherwise all existing sandboxes are currently busy (`busy_until > now_ms`):
     - If `len(sandboxes) < max_concurrency`:
       - Spawn a new sandbox with `busy_until = now_ms + cold_start_ms + exec_ms`.
       - Return `{"status": 200, "cold_start": True, "latency_ms": cold_start_ms + exec_ms}`.
     - Else:
       - At concurrency cap! Return `{"status": 429, "cold_start": False, "latency_ms": 0}`.

## Objective

Implement `ServerlessPool(max_concurrency, cold_start_ms, idle_ttl_ms)` with `invoke(now_ms, exec_ms)`.

## Hints

1. Note that a sandbox spawned at `now_ms` stays busy for `cold_start_ms + exec_ms` (`busy_until = now_ms + cold_start_ms + exec_ms`), so another request arriving while it is booting or executing must either pick another warm sandbox or spin up a second sandbox!

## Starter: guided

```python
class ServerlessPool:
    def __init__(self, max_concurrency, cold_start_ms, idle_ttl_ms):
        if max_concurrency < 1 or cold_start_ms < 0 or idle_ttl_ms < 0:
            raise ValueError("invalid pool config")
        self.max_concurrency = max_concurrency
        self.cold_start_ms = cold_start_ms
        self.idle_ttl_ms = idle_ttl_ms
        self.sandboxes = []  # list of busy_until timestamps

    def invoke(self, now_ms, exec_ms):
        pass
```

## Starter: standard

```python
class ServerlessPool:
    def __init__(self, max_concurrency, cold_start_ms, idle_ttl_ms):
        pass

    def invoke(self, now_ms, exec_ms):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _serverless():
    p = get("ServerlessPool")(max_concurrency=2, cold_start_ms=100, idle_ttl_ms=500)
    r1 = p.invoke(now_ms=0, exec_ms=50)     # cold start -> busy until 150
    r2 = p.invoke(now_ms=20, exec_ms=50)    # 2nd cold start -> busy until 170
    r3 = p.invoke(now_ms=30, exec_ms=50)    # both busy -> 429 throttled!
    r4 = p.invoke(now_ms=200, exec_ms=40)   # warm reuse! busy until 240
    r5 = p.invoke(now_ms=900, exec_ms=40)   # all idle > 500ms -> reaped -> cold start!
    return [r1, r2, r3, r4, r5]
expect("reuses warm sandboxes, throttles at max_concurrency, and reaps expired idle sandboxes", _serverless, [
    {"status": 200, "cold_start": True, "latency_ms": 150},
    {"status": 200, "cold_start": True, "latency_ms": 150},
    {"status": 429, "cold_start": False, "latency_ms": 0},
    {"status": 200, "cold_start": False, "latency_ms": 40},
    {"status": 200, "cold_start": True, "latency_ms": 140},
])
```

## Hidden checks

```python
def _exact_ttl():
    p = get("ServerlessPool")(max_concurrency=1, cold_start_ms=80, idle_ttl_ms=100)
    p.invoke(0, 20)  # busy until 100
    warm = p.invoke(200, 10)  # idle exactly 100ms (not > 100) -> still warm!
    cold = p.invoke(311, 10)  # busy_until was 210; idle 101 > 100 -> cold!
    return (warm["cold_start"], cold["cold_start"])
expect("keeps sandbox warm at exact idle_ttl boundary and reaps strictly after", _exact_ttl, (False, True))
```

## Solution

```python
class ServerlessPool:
    def __init__(self, max_concurrency, cold_start_ms, idle_ttl_ms):
        if max_concurrency < 1 or cold_start_ms < 0 or idle_ttl_ms < 0:
            raise ValueError("invalid pool config")
        self.max_concurrency = max_concurrency
        self.cold_start_ms = cold_start_ms
        self.idle_ttl_ms = idle_ttl_ms
        self.sandboxes = []

    def invoke(self, now_ms, exec_ms):
        # Reap sandboxes idle longer than idle_ttl_ms
        self.sandboxes = [
            bu for bu in self.sandboxes
            if bu > now_ms or (now_ms - bu) <= self.idle_ttl_ms
        ]
        # Find most-recently-used warm sandbox (largest busy_until <= now_ms)
        warm_idx = None
        for i, bu in enumerate(self.sandboxes):
            if bu <= now_ms:
                if warm_idx is None or bu > self.sandboxes[warm_idx]:
                    warm_idx = i
        if warm_idx is not None:
            self.sandboxes[warm_idx] = now_ms + exec_ms
            return {"status": 200, "cold_start": False, "latency_ms": exec_ms}
        if len(self.sandboxes) < self.max_concurrency:
            self.sandboxes.append(now_ms + self.cold_start_ms + exec_ms)
            return {"status": 200, "cold_start": True, "latency_ms": self.cold_start_ms + exec_ms}
        return {"status": 429, "cold_start": False, "latency_ms": 0}
```

## Restored

The scale deck now balances warm sandbox reuse, idle reaping, and concurrency caps cleanly.
