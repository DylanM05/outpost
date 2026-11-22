---
id: origin-shield
title: Collapse thundering-herd misses with a singleflight origin shield
system: Media rail
symbol: controller
scene: tests
skills: cdn-caching
---

## Briefing

When a popular video's cache entry expires, 500 edge nodes can miss at the exact same millisecond and stampede the origin server! An **origin shield** uses **request coalescing (singleflight)**: while one fetch for a key is in flight, concurrent requests for the same key share that single origin call instead of issuing duplicate fetches.

## Concept

Model an asynchronous-style batch of incoming requests arriving at a CDN shield:
Implement `OriginShield(fetcher, ttl)` where `fetcher(key)` returns the payload from origin (and may be expensive):
- `fetch_batch(requests, now)`:
  - `requests` is a list of `(req_id, key)` tuples arriving simultaneously at timestamp `now`.
  - If `key` is already fresh in the shield cache (`now - stored_at < ttl`), serve from cache without calling `fetcher` (`source = "CACHE"`).
  - If `key` is missing or expired, call `fetcher(key)` **at most once per unique missed key in the batch**:
    - The first request for that missed key receives `source = "ORIGIN"`.
    - Every subsequent request for the **same** missed key in that batch coalesces onto the in-flight result and receives `source = "COALESCED"`!
    - Store the fetched payload in the shield cache with `stored_at = now`.
  - Return a list of `{"req_id": req_id, "key": key, "value": value, "source": source}` in the original request order.
- Also track `self.origin_calls` (total number of times `fetcher` was actually invoked!).

## Objective

Implement `OriginShield(fetcher, ttl)` with `fetch_batch(requests, now)` and `origin_calls`.

## Hints

1. Inside `fetch_batch`, keep a per-batch `in_flight = {}` dict mapping `key -> value`: if `key in in_flight`, return `source = "COALESCED"` without calling `fetcher` again!
2. Check fresh cache BEFORE `in_flight`? Wait — if you store into `self.cache` at the end of the batch (or check `in_flight` first before `self.cache`!), then subsequent requests in the *same* batch report `"COALESCED"` while requests in a *later* batch report `"CACHE"`! Checking `in_flight` first makes that super clean.

## Starter: guided

```python
class OriginShield:
    def __init__(self, fetcher, ttl):
        if ttl < 0:
            raise ValueError("ttl must be non-negative")
        self.fetcher = fetcher
        self.ttl = ttl
        self.cache = {}       # key -> (value, stored_at)
        self.origin_calls = 0

    def fetch_batch(self, requests, now):
        in_flight = {}
        results = []
        # For each (req_id, key): check in_flight -> COALESCED, else fresh cache -> CACHE, else fetch once -> ORIGIN.
        return results
```

## Starter: standard

```python
class OriginShield:
    def __init__(self, fetcher, ttl):
        pass

    def fetch_batch(self, requests, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _coalesce():
    calls = []
    def origin(k):
        calls.append(k)
        return f"data:{k}"
    shield = get("OriginShield")(origin, ttl=30)
    b1 = shield.fetch_batch([("r1", "/vid"), ("r2", "/vid"), ("r3", "/vid"), ("r4", "/img")], now=100)
    b2 = shield.fetch_batch([("r5", "/vid")], now=120)
    b3 = shield.fetch_batch([("r6", "/vid")], now=130)  # expired (age 30 >= ttl 30)
    return (
        [(x["req_id"], x["source"]) for x in b1],
        [(x["req_id"], x["source"]) for x in b2],
        [(x["req_id"], x["source"]) for x in b3],
        shield.origin_calls,
        calls,
    )
expect("coalesces simultaneous misses, caches within TTL, and refreshes after expiry", _coalesce, (
    [("r1", "ORIGIN"), ("r2", "COALESCED"), ("r3", "COALESCED"), ("r4", "ORIGIN")],
    [("r5", "CACHE")],
    [("r6", "ORIGIN")],
    3,
    ["/vid", "/img", "/vid"],
))
```

## Hidden checks

```python
def _zero_ttl():
    shield = get("OriginShield")(lambda k: k.upper(), ttl=0)
    b1 = shield.fetch_batch([("a", "x"), ("b", "x")], now=10)
    b2 = shield.fetch_batch([("c", "x")], now=10)
    return (
        [r["source"] for r in b1],
        [r["source"] for r in b2],
        shield.origin_calls,
    )
expect("ttl=0 still coalesces within a batch but does not cache across batches", _zero_ttl, (
    ["ORIGIN", "COALESCED"],
    ["ORIGIN"],
    2,
))
```

## Solution

```python
class OriginShield:
    def __init__(self, fetcher, ttl):
        if ttl < 0:
            raise ValueError("ttl must be non-negative")
        self.fetcher = fetcher
        self.ttl = ttl
        self.cache = {}
        self.origin_calls = 0

    def fetch_batch(self, requests, now):
        in_flight = {}
        results = []
        for req_id, key in requests:
            if key in in_flight:
                val = in_flight[key]
                source = "COALESCED"
            else:
                cached = self.cache.get(key)
                if cached is not None and (now - cached[1]) < self.ttl:
                    val = cached[0]
                    source = "CACHE"
                else:
                    val = self.fetcher(key)
                    self.origin_calls += 1
                    in_flight[key] = val
                    if self.ttl > 0:
                        self.cache[key] = (val, now)
                    source = "ORIGIN"
            results.append({"req_id": req_id, "key": key, "value": val, "source": source})
        return results
```

## Restored

The media rail's origin shield now collapses thundering-herd misses into single origin fetches.
