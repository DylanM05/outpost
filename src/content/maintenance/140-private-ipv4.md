---
id: maintenance-private-ipv4
title: Detect RFC 1918 private IPv4 addresses
system: Subnet rack
symbol: instrument
scene: tests
skills: ip-routing
reviewSkill: ip-routing
prerequisite: nat-table
---

## Briefing

To prevent SSRF and routing leaks, the outbound proxy must identify whether a destination IPv4 address belongs to one of the three RFC 1918 private ranges.

## Objective

Write `is_private_ipv4(addr)` returning `True` iff `addr` falls inside any RFC 1918 private subnet:
- `10.0.0.0/8`
- `172.16.0.0/12` (`172.16.0.0` through `172.31.255.255`)
- `192.168.0.0/16`

Raise `ValueError` if `addr` is not a valid dotted IPv4 address.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Parse the 4 octets `(a, b, c, d)` validating each is `0..255`.
2. Notice the second range is `a == 172 and 16 <= b <= 31` (`172.15.x.x` and `172.32.x.x` are public!).

## Starter

```python
```

## Checks

```python
expect("matches 10/8, 172.16/12, and 192.168/16", lambda: [get("is_private_ipv4")(ip) for ip in ("10.255.0.1", "172.16.0.1", "172.31.255.254", "192.168.50.1")], [True, True, True, True])
expect("rejects public boundaries near 172.16/12", lambda: [get("is_private_ipv4")(ip) for ip in ("172.15.255.255", "172.32.0.0", "8.8.8.8")], [False, False, False])
```

## Hidden checks

```python
def _bad():
    try:
        get("is_private_ipv4")("300.1.1.1")
        return False
    except ValueError:
        return True
expect("malformed IPv4 raises ValueError", _bad, True)
```

## Solution

```python
def is_private_ipv4(addr):
    parts = addr.split(".")
    if len(parts) != 4:
        raise ValueError("invalid IPv4")
    octets = []
    for p in parts:
        if not p or not p.isascii() or not p.isdigit():
            raise ValueError("invalid octet")
        n = int(p)
        if n > 255:
            raise ValueError("octet out of range")
        octets.append(n)
    a, b, _, _ = octets
    return a == 10 or (a == 172 and 16 <= b <= 31) or (a == 192 and b == 168)
```

## Restored

RFC 1918 private addresses are identified cleanly right down to the `172.16`–`172.31` boundary.
