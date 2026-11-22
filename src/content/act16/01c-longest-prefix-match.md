---
id: longest-prefix-match
title: Route packets by longest-prefix match
system: Subnet rack
symbol: instrument
scene: tests
skills: ip-routing
---

## Briefing

A router's forwarding table often has overlapping routes: a default route `0.0.0.0/0`, a regional route `10.0.0.0/8`, and a specific host route `10.2.3.4/32`. Every IP router picks the matching route with the **longest prefix length** — regardless of the order routes were inserted!

## Concept

**Longest-Prefix Match (LPM)** checks which routes in the table match `dest_ip` and selects the match with the **largest `prefix`** (`0..32`).
- If two routes have the exact same prefix length and match (e.g. duplicate CIDR with different costs), break ties by lowest `metric` (`int`), then lexicographically smallest `next_hop` (`str`).
- If no route matches (no default route), return `None`.

## Objective

Write `route_lookup(table, dest_ip)` where `table` is a list of `(cidr, next_hop, metric)` tuples (e.g. `[("0.0.0.0/0", "gw-main", 100), ("10.0.0.0/8", "gw-west", 10)]`) and `dest_ip` is an IPv4 string.

Return the winning `next_hop` string, or `None` if no route matches `dest_ip`.

## Hints

1. Parse `dest_ip` once into a 32-bit integer, then check each `(cidr, next_hop, metric)` entry.
2. Track the best match using comparison key `(-prefix, metric, next_hop)` (smallest key wins!).

## Starter: guided

```python
def _parse_ipv4(addr):
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


def route_lookup(table, dest_ip):
    dest = _parse_ipv4(dest_ip)
    best_key = None
    best_hop = None
    for cidr, next_hop, metric in table:
        # Parse cidr, test (dest & mask) == (net & mask), pick smallest (-prefix, metric, next_hop)
        pass
    return best_hop
```

## Starter: standard

```python
def route_lookup(table, dest_ip):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _lpm():
    table = [
        ("0.0.0.0/0", "uplink", 100),
        ("10.0.0.0/8", "ridge-core", 20),
        ("10.4.0.0/16", "relay-east", 50),
        ("10.4.2.9/32", "sensor-host", 10),
    ]
    fn = get("route_lookup")
    return [fn(table, ip) for ip in ("10.4.2.9", "10.4.99.1", "10.9.1.1", "8.8.8.8")]
expect("selects most specific prefix regardless of metric", _lpm, ["sensor-host", "relay-east", "ridge-core", "uplink"])

def _tie():
    table = [
        ("192.168.1.0/24", "gw-b", 20),
        ("192.168.1.0/24", "gw-a", 10),
    ]
    return get("route_lookup")(table, "192.168.1.42")
expect("breaks equal-prefix ties by lowest metric", _tie, "gw-a")
```

## Hidden checks

```python
expect("returns None when no route matches", lambda: get("route_lookup")([("10.0.0.0/8", "internal", 1)], "192.168.1.1"), None)
expect("breaks equal prefix and metric by next_hop ascending", lambda: get("route_lookup")([("10.0.0.0/8", "gw-b", 5), ("10.0.0.0/8", "gw-a", 5)], "10.1.1.1"), "gw-a")
```

## Solution

```python
def _parse_ipv4(addr):
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


def route_lookup(table, dest_ip):
    dest = _parse_ipv4(dest_ip)
    best_key = None
    best_hop = None
    for cidr, next_hop, metric in table:
        net_str, prefix_str = cidr.split("/")
        prefix = int(prefix_str)
        if prefix < 0 or prefix > 32:
            raise ValueError("invalid prefix")
        net = _parse_ipv4(net_str)
        mask = 0 if prefix == 0 else ((1 << prefix) - 1) << (32 - prefix)
        if (dest & mask) == (net & mask):
            key = (-prefix, metric, next_hop)
            if best_key is None or key < best_key:
                best_key = key
                best_hop = next_hop
    return best_hop
```

## Restored

The subnet rack forwards every packet via deterministic longest-prefix matching with metric tie-breaking.
