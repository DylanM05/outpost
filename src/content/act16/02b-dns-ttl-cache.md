---
id: dns-ttl-cache
title: Build a TTL-expiring DNS cache
system: Name resolver
symbol: equipment
scene: tests
skills: transport-protocols
---

## Briefing

Without local DNS caching, every request stalls waiting on upstream lookups. With naive caching that ignores TTLs, stale IP addresses linger after failover. Build a DNS cache that respects per-record TTLs, normalizes hostnames case-insensitively, and supports negative caching (`NXDOMAIN`).

## Concept

Store each `(name.lower(), rtype.upper())` key mapped to `(value, expires_at)`:
- On `put(name, rtype, value, ttl, now)`:
  - If `ttl <= 0`, do NOT cache (and evict any existing entry for that key!).
  - Otherwise store `expires_at = now + ttl`.
- On `get(name, rtype, now)`:
  - Look up key; if absent or `now >= expires_at`, delete if expired and return `(False, None)` (cache miss!).
  - If valid (`now < expires_at`), return `(True, value)` — notice `value` can be `None` for a cached negative (`NXDOMAIN`) hit, which is why returning `(hit_bool, value)` distinguishes a cache miss `(False, None)` from a cached negative response `(True, None)`!
- `remaining_ttl(name, rtype, now)` returns `max(0, expires_at - now)` on a live entry, or `0` on a miss.

## Objective

Implement `DnsCache` with `put(name, rtype, value, ttl, now)`, `get(name, rtype, now)`, and `remaining_ttl(name, rtype, now)`.

## Hints

1. Normalize every lookup key with `(name.rstrip(".").lower(), rtype.upper())`.
2. Expire strictly at `now >= expires_at`: an entry inserted at `now=100` with `ttl=60` is valid at `now=159` (`remaining_ttl == 1`) and expired at `now=160` (`remaining_ttl == 0`).

## Starter: guided

```python
class DnsCache:
    def __init__(self):
        self.entries = {}

    def _key(self, name, rtype):
        return (name.rstrip(".").lower(), rtype.upper())

    def put(self, name, rtype, value, ttl, now):
        key = self._key(name, rtype)
        # If ttl <= 0 remove key; otherwise store (value, now + ttl)
        pass

    def get(self, name, rtype, now):
        # Return (True, value) if live, else evict & return (False, None)
        return (False, None)

    def remaining_ttl(self, name, rtype, now):
        return 0
```

## Starter: standard

```python
class DnsCache:
    def __init__(self):
        pass

    def put(self, name, rtype, value, ttl, now):
        pass

    def get(self, name, rtype, now):
        pass

    def remaining_ttl(self, name, rtype, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _basic():
    c = get("DnsCache")()
    c.put("Relay.Local.", "a", "10.0.1.5", ttl=60, now=100)
    hit1 = c.get("relay.local", "A", now=140)
    rem1 = c.remaining_ttl("relay.local", "A", now=140)
    hit2 = c.get("relay.local", "A", now=160)
    rem2 = c.remaining_ttl("relay.local", "A", now=160)
    return (hit1, rem1, hit2, rem2)
expect("serves cached records until TTL expires", _basic, ((True, "10.0.1.5"), 20, (False, None), 0))

def _negative():
    c = get("DnsCache")()
    c.put("ghost.local", "A", None, ttl=30, now=10)
    return (c.get("ghost.local", "A", now=25), c.get("missing.local", "A", now=25))
expect("distinguishes negative NXDOMAIN cache hit from cache miss", _negative, ((True, None), (False, None)))
```

## Hidden checks

```python
def _zero_ttl():
    c = get("DnsCache")()
    c.put("api.local", "A", "10.0.0.1", ttl=60, now=0)
    c.put("api.local", "A", "10.0.0.2", ttl=0, now=10)
    return c.get("api.local", "A", now=10)
expect("zero TTL evicts existing entry instead of caching", _zero_ttl, (False, None))
```

## Solution

```python
class DnsCache:
    def __init__(self):
        self.entries = {}

    def _key(self, name, rtype):
        return (name.rstrip(".").lower(), rtype.upper())

    def put(self, name, rtype, value, ttl, now):
        key = self._key(name, rtype)
        if ttl <= 0:
            self.entries.pop(key, None)
            return
        self.entries[key] = (value, now + ttl)

    def get(self, name, rtype, now):
        key = self._key(name, rtype)
        entry = self.entries.get(key)
        if entry is None:
            return (False, None)
        value, expires_at = entry
        if now >= expires_at:
            del self.entries[key]
            return (False, None)
        return (True, value)

    def remaining_ttl(self, name, rtype, now):
        key = self._key(name, rtype)
        entry = self.entries.get(key)
        if entry is None:
            return 0
        _, expires_at = entry
        if now >= expires_at:
            del self.entries[key]
            return 0
        return expires_at - now
```

## Restored

DNS lookups now serve fresh positive and negative answers locally and expire cleanly on TTL boundaries.
