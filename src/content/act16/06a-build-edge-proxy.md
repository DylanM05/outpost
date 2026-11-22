---
id: build-edge-proxy
title: Build an L4/L7 edge proxy with routing, shaping, and breakers
system: Packet audit
symbol: controller
scene: tests
assessment: true
skills: ip-routing, transport-protocols, traffic-engineering
---

## Briefing

Every network layer in the packet floor comes together at the outpost's perimeter. Build `EdgeProxy` combining CIDR deny rules, longest-prefix-match routing to backend pools, per-client token-bucket rate limiting, and circuit-breaker-guarded smooth weighted round-robin selection!

## Concept

When `proxy.handle(client_ip, dest_ip, now)` runs:
1. **CIDR Firewall:** If `client_ip` matches any CIDR in `blocked_cidrs`, immediately return `{"status": 403, "backend": None, "reason": "blocked"}`.
2. **Per-client Token Bucket:** Each `client_ip` gets its own token bucket (`capacity=rate_capacity`, `rate=rate_per_sec`, starting full at the timestamp of its first seen request — or `0.0`, wait: starting full at its first seen request `now` is super clean and works regardless of starting timestamp!). Consume `1.0` token; if denied, return `{"status": 429, "backend": None, "reason": "rate_limited"}`.
3. **Longest-Prefix Route Lookup:** Match `dest_ip` against `routes` (`[(cidr, pool_name), ...]`) by longest prefix length. If no route matches, return `{"status": 404, "backend": None, "reason": "no_route"}`.
4. **Circuit-Breaker-Protected Weighted Pool:** Look up `pool_name` in `pools` (`{pool_name: [(backend_name, weight), ...]}`). Consider only backends in that pool whose circuit breaker `allow_request(now)` would allow a call (check eligibility cleanly WITHOUT consuming probes of unchosen backends: a backend is eligible if `state == "closed"` or `(state == "half_open" and not probe_in_flight)`!). Run smooth weighted round-robin across eligible backends; if none are eligible, return `{"status": 503, "backend": None, "reason": "no_healthy_backend"}`. Mark the chosen backend's probe in-flight if it was `"half_open"`, and return `{"status": 200, "backend": chosen, "reason": "ok"}`.

Also expose `record_result(backend, ok: bool, now)` to update that backend's circuit breaker!

## Objective

Implement `EdgeProxy(blocked_cidrs, routes, pools, rate_capacity=5, rate_per_sec=1.0, failure_threshold=2, recovery_timeout=30.0)` with:
- `handle(self, client_ip, dest_ip, now)` -> `{"status": int, "backend": str | None, "reason": str}`
- `record_result(self, backend, ok, now)` -> updates that backend's circuit breaker (`record_success` if `ok` else `record_failure`).

## Hints

1. Check firewall -> rate limit -> LPM route -> eligible pool backends in that exact order so blocked clients don't waste backend probes and rate-limited clients fail at 429 before routing.
2. In smooth weighted round-robin, only add weights for the currently eligible backends in that pool, pick `max` by current weight, subtract `sum(eligible weights)`, and call `breaker.allow_request(now)` on the chosen backend so only the chosen backend marks a half-open probe in-flight!

## Starter: guided

```python
def _parse_ip(addr):
    parts = addr.split(".")
    if len(parts) != 4:
        raise ValueError("invalid IPv4")
    out = 0
    for p in parts:
        n = int(p)
        if n < 0 or n > 255:
            raise ValueError("invalid octet")
        out = (out << 8) | n
    return out


def _parse_cidr(cidr):
    net_s, pref_s = cidr.split("/")
    pref = int(pref_s)
    mask = 0 if pref == 0 else ((1 << pref) - 1) << (32 - pref)
    return (_parse_ip(net_s) & mask, mask, pref)


class EdgeProxy:
    def __init__(self, blocked_cidrs, routes, pools, rate_capacity=5, rate_per_sec=1.0, failure_threshold=2, recovery_timeout=30.0):
        self.blocked = [_parse_cidr(c) for c in blocked_cidrs]
        self.routes = [(_parse_cidr(c), pool) for c, pool in routes]
        self.pools = {name: list(items) for name, items in pools.items()}
        self.rate_capacity = float(rate_capacity)
        self.rate_per_sec = float(rate_per_sec)
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.buckets = {}
        self.current_weights = {}
        self.breakers = {}

    def record_result(self, backend, ok, now):
        pass

    def handle(self, client_ip, dest_ip, now):
        return {"status": 503, "backend": None, "reason": "not_implemented"}
```

## Starter: standard

```python
class EdgeProxy:
    def __init__(self, blocked_cidrs, routes, pools, rate_capacity=5, rate_per_sec=1.0, failure_threshold=2, recovery_timeout=30.0):
        pass

    def record_result(self, backend, ok, now):
        pass

    def handle(self, client_ip, dest_ip, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _e2e():
    p = get("EdgeProxy")(
        blocked_cidrs=["198.51.100.0/24"],
        routes=[("10.0.0.0/8", "general"), ("10.2.0.0/16", "api")],
        pools={"general": [("g1", 1)], "api": [("a1", 2), ("a2", 1)]},
        rate_capacity=4,
        rate_per_sec=1.0,
        failure_threshold=2,
        recovery_timeout=10.0,
    )
    r_block = p.handle("198.51.100.42", "10.2.1.5", now=0.0)
    r_404 = p.handle("192.168.1.5", "8.8.8.8", now=0.0)
    r1 = p.handle("192.168.1.5", "10.2.1.5", now=0.0)
    r2 = p.handle("192.168.1.5", "10.2.1.5", now=0.0)
    r3 = p.handle("192.168.1.5", "10.2.1.5", now=0.0)
    r_429 = p.handle("192.168.1.5", "10.2.1.5", now=0.0)
    return (r_block["status"], r_404["status"], [r1["backend"], r2["backend"], r3["backend"]], r_429["status"])
expect("enforces firewall, LPM routing, smooth weighting, and per-client rate limits", _e2e, (403, 404, ["a1", "a2", "a1"], 429))

def _breakers():
    p = get("EdgeProxy")(
        blocked_cidrs=[],
        routes=[("10.0.0.0/8", "api")],
        pools={"api": [("a1", 3), ("a2", 1)]},
        rate_capacity=20,
        rate_per_sec=10.0,
        failure_threshold=2,
        recovery_timeout=15.0,
    )
    p.record_result("a1", False, now=1.0)
    p.record_result("a1", False, now=2.0)
    # a1 is open; traffic routes to a2
    b1 = p.handle("1.1.1.1", "10.0.0.1", now=5.0)["backend"]
    p.record_result("a2", False, now=5.0)
    p.record_result("a2", False, now=6.0)
    # Both open -> 503
    down = p.handle("1.1.1.1", "10.0.0.1", now=8.0)["status"]
    # At t=17.0, a1 cooldown (2+15) expires -> half_open allows 1 probe
    probe = p.handle("1.1.1.1", "10.0.0.1", now=17.0)
    second = p.handle("1.1.1.1", "10.0.0.1", now=17.0)["status"]
    p.record_result("a1", True, now=18.0)
    recovered = p.handle("1.1.1.1", "10.0.0.1", now=18.0)["backend"]
    return (b1, down, probe["backend"], second, recovered)
expect("routes around open breakers, returns 503 when all open, and recovers via half-open probe", _breakers, ("a2", 503, "a1", 503, "a1"))
```

## Hidden checks

```python
def _refill_and_lpm():
    p = get("EdgeProxy")(
        blocked_cidrs=[],
        routes=[("0.0.0.0/0", "default"), ("10.5.5.5/32", "vip")],
        pools={"default": [("d1", 1)], "vip": [("v1", 1)]},
        rate_capacity=1,
        rate_per_sec=0.5,
    )
    ok1 = p.handle("9.9.9.9", "10.5.5.5", now=0.0)
    lim = p.handle("9.9.9.9", "10.5.5.5", now=1.0)
    ok2 = p.handle("9.9.9.9", "1.2.3.4", now=2.0)
    return (ok1["backend"], lim["status"], ok2["backend"])
expect("refills bucket over time and matches /32 before /0", _refill_and_lpm, ("v1", 429, "d1"))
```

## Solution

```python
def _parse_ip(addr):
    parts = addr.split(".")
    if len(parts) != 4:
        raise ValueError("invalid IPv4")
    out = 0
    for p in parts:
        if not p or not p.isascii() or not p.isdigit():
            raise ValueError("invalid octet")
        n = int(p)
        if n > 255:
            raise ValueError("octet out of range")
        out = (out << 8) | n
    return out


def _parse_cidr(cidr):
    net_s, pref_s = cidr.split("/")
    pref = int(pref_s)
    if pref < 0 or pref > 32:
        raise ValueError("invalid prefix")
    mask = 0 if pref == 0 else ((1 << pref) - 1) << (32 - pref)
    return (_parse_ip(net_s) & mask, mask, pref)


class _Breaker:
    def __init__(self, threshold, timeout):
        self.threshold = threshold
        self.timeout = timeout
        self.state = "closed"
        self.failures = 0
        self.opened_at = None
        self.probe_in_flight = False

    def _refresh(self, now):
        if self.state == "open" and self.opened_at is not None and now - self.opened_at >= self.timeout:
            self.state = "half_open"
            self.probe_in_flight = False

    def can_try(self, now):
        self._refresh(now)
        if self.state == "closed":
            return True
        return self.state == "half_open" and not self.probe_in_flight

    def acquire(self, now):
        self._refresh(now)
        if self.state == "half_open":
            self.probe_in_flight = True

    def record_success(self):
        self.state = "closed"
        self.failures = 0
        self.opened_at = None
        self.probe_in_flight = False

    def record_failure(self, now):
        self._refresh(now)
        if self.state == "half_open":
            self.state = "open"
            self.opened_at = now
            self.probe_in_flight = False
        elif self.state == "closed":
            self.failures += 1
            if self.failures >= self.threshold:
                self.state = "open"
                self.opened_at = now


class EdgeProxy:
    def __init__(self, blocked_cidrs, routes, pools, rate_capacity=5, rate_per_sec=1.0, failure_threshold=2, recovery_timeout=30.0):
        self.blocked = [_parse_cidr(c) for c in blocked_cidrs]
        self.routes = [(_parse_cidr(c), pool) for c, pool in routes]
        self.pools = {name: list(items) for name, items in pools.items()}
        self.rate_capacity = float(rate_capacity)
        self.rate_per_sec = float(rate_per_sec)
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.buckets = {}
        self.current_weights = {name: {b: 0 for b, _ in items} for name, items in self.pools.items()}
        self.breakers = {}
        for items in self.pools.values():
            for b, _ in items:
                self.breakers.setdefault(b, _Breaker(failure_threshold, recovery_timeout))

    def _allow_client(self, client_ip, now):
        bucket = self.buckets.get(client_ip)
        if bucket is None:
            tokens, last_ts = self.rate_capacity, float(now)
        else:
            tokens, last_ts = bucket
            elapsed = max(0.0, now - last_ts)
            tokens = min(self.rate_capacity, tokens + elapsed * self.rate_per_sec)
            if now > last_ts:
                last_ts = float(now)
        if tokens >= 1.0:
            self.buckets[client_ip] = (tokens - 1.0, last_ts)
            return True
        self.buckets[client_ip] = (tokens, last_ts)
        return False

    def record_result(self, backend, ok, now):
        breaker = self.breakers.setdefault(backend, _Breaker(self.failure_threshold, self.recovery_timeout))
        if ok:
            breaker.record_success()
        else:
            breaker.record_failure(now)

    def handle(self, client_ip, dest_ip, now):
        src = _parse_ip(client_ip)
        for net, mask, _ in self.blocked:
            if (src & mask) == net:
                return {"status": 403, "backend": None, "reason": "blocked"}

        if not self._allow_client(client_ip, now):
            return {"status": 429, "backend": None, "reason": "rate_limited"}

        dst = _parse_ip(dest_ip)
        best_pref = -1
        pool_name = None
        for (net, mask, pref), pool in self.routes:
            if (dst & mask) == net and pref > best_pref:
                best_pref = pref
                pool_name = pool
        if pool_name is None or pool_name not in self.pools:
            return {"status": 404, "backend": None, "reason": "no_route"}

        pool = self.pools[pool_name]
        eligible = [(b, w) for b, w in pool if self.breakers[b].can_try(now)]
        if not eligible:
            return {"status": 503, "backend": None, "reason": "no_healthy_backend"}

        cw = self.current_weights[pool_name]
        total = sum(w for _, w in eligible)
        for b, w in eligible:
            cw[b] += w
        chosen = max((b for b, _ in eligible), key=lambda b: cw[b])
        cw[chosen] -= total
        self.breakers[chosen].acquire(now)
        return {"status": 200, "backend": chosen, "reason": "ok"}
```

## Restored

The packet floor's edge proxy filters CIDR blocks, shapes bursts per client, routes by longest prefix, and isolates unhealthy backends with circuit breakers.
