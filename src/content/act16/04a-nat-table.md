---
id: nat-table
title: Track stateful NAT port translations
system: Gateway router
symbol: equipment
scene: tests
skills: ip-routing
---

## Briefing

Dozens of private outpost sensors (`10.0.x.y`) share a single public IP (`203.0.113.10`). A **stateful NAT table** maps each outbound `(internal_ip, internal_port)` to a unique external port, rewrites return packets back to the original sensor, and expires idle mappings.

## Concept

Maintain two synced dicts:
- `outbound`: `(internal_ip, internal_port) -> (ext_port, last_seen)`
- `inbound`: `ext_port -> (internal_ip, internal_port, last_seen)`

On `translate_outbound(internal_ip, internal_port, now)`:
1. First expire any entry with `now - last_seen >= idle_timeout`.
2. If `(internal_ip, internal_port)` already has a live mapping, refresh its `last_seen = now` and return `(public_ip, ext_port)`.
3. Otherwise allocate the next unused port starting from `self.next_port` (incrementing `self.next_port`), store both directions with `last_seen = now`, and return `(public_ip, ext_port)`.

On `translate_inbound(ext_port, now)`:
1. Expire idle entries (`now - last_seen >= idle_timeout`).
2. Look up `ext_port`; if found, refresh `last_seen = now` and return `(internal_ip, internal_port)`, else return `None` (drop unsolicited inbound packet!).

## Objective

Implement `NatTable(public_ip, start_port=40000, idle_timeout=60)` with `translate_outbound(internal_ip, internal_port, now)` and `translate_inbound(ext_port, now)`.

## Hints

1. Write a helper `_evict(now)` that removes all expired entries from both `outbound` and `inbound`.
2. Refresh `last_seen = now` on BOTH outbound and inbound hits so active connections never time out!

## Starter: guided

```python
class NatTable:
    def __init__(self, public_ip, start_port=40000, idle_timeout=60):
        self.public_ip = public_ip
        self.next_port = start_port
        self.idle_timeout = idle_timeout
        self.outbound = {}
        self.inbound = {}

    def _evict(self, now):
        expired = [k for k, (_, ts) in self.outbound.items() if now - ts >= self.idle_timeout]
        for k in expired:
            ext_port, _ = self.outbound.pop(k)
            self.inbound.pop(ext_port, None)

    def translate_outbound(self, internal_ip, internal_port, now):
        self._evict(now)
        # Reuse existing mapping or allocate self.next_port
        return (self.public_ip, 0)

    def translate_inbound(self, ext_port, now):
        self._evict(now)
        # Return (internal_ip, internal_port) if present (refreshing last_seen), else None
        return None
```

## Starter: standard

```python
class NatTable:
    def __init__(self, public_ip, start_port=40000, idle_timeout=60):
        pass

    def translate_outbound(self, internal_ip, internal_port, now):
        pass

    def translate_inbound(self, ext_port, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _flow():
    nat = get("NatTable")("203.0.113.10", start_port=50000, idle_timeout=30)
    e1 = nat.translate_outbound("10.0.0.2", 1234, now=0)
    e2 = nat.translate_outbound("10.0.0.3", 1234, now=5)
    e1_again = nat.translate_outbound("10.0.0.2", 1234, now=10)
    back = nat.translate_inbound(50000, now=25)
    unsolicited = nat.translate_inbound(59999, now=25)
    return (e1, e2, e1_again, back, unsolicited)
expect("allocates, reuses, and reverses stateful NAT mappings", _flow, (
    ("203.0.113.10", 50000),
    ("203.0.113.10", 50001),
    ("203.0.113.10", 50000),
    ("10.0.0.2", 1234),
    None,
))

def _expire():
    nat = get("NatTable")("203.0.113.10", start_port=50000, idle_timeout=20)
    nat.translate_outbound("10.0.0.2", 1111, now=0)
    alive = nat.translate_inbound(50000, now=15)
    still_alive = nat.translate_inbound(50000, now=34)
    expired = nat.translate_inbound(50000, now=54)
    return (alive, still_alive, expired)
expect("refreshes idle timeout on traffic and drops after idle expiry", _expire, (("10.0.0.2", 1111), ("10.0.0.2", 1111), None))
```

## Hidden checks

```python
def _realloc():
    nat = get("NatTable")("198.51.100.1", start_port=40000, idle_timeout=10)
    p1 = nat.translate_outbound("10.0.0.1", 8000, now=0)[1]
    p2 = nat.translate_outbound("10.0.0.1", 8000, now=15)[1]
    return p2 != p1 and nat.translate_inbound(p1, now=15) is None
expect("expired outbound session allocates a fresh port", _realloc, True)
```

## Solution

```python
class NatTable:
    def __init__(self, public_ip, start_port=40000, idle_timeout=60):
        self.public_ip = public_ip
        self.next_port = start_port
        self.idle_timeout = idle_timeout
        self.outbound = {}
        self.inbound = {}

    def _evict(self, now):
        expired = [k for k, (_, ts) in self.outbound.items() if now - ts >= self.idle_timeout]
        for k in expired:
            ext_port, _ = self.outbound.pop(k)
            self.inbound.pop(ext_port, None)

    def translate_outbound(self, internal_ip, internal_port, now):
        self._evict(now)
        key = (internal_ip, internal_port)
        if key in self.outbound:
            ext_port, _ = self.outbound[key]
        else:
            ext_port = self.next_port
            self.next_port += 1
        self.outbound[key] = (ext_port, now)
        self.inbound[ext_port] = (internal_ip, internal_port, now)
        return (self.public_ip, ext_port)

    def translate_inbound(self, ext_port, now):
        self._evict(now)
        entry = self.inbound.get(ext_port)
        if entry is None:
            return None
        ip, port, _ = entry
        self.outbound[(ip, port)] = (ext_port, now)
        self.inbound[ext_port] = (ip, port, now)
        return (ip, port)
```

## Restored

Private outpost nodes share one public IP cleanly with idle-expiring stateful NAT bindings.
