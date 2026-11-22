---
id: maintenance-cidr-host-range
title: Compute IPv4 network and broadcast addresses
system: Subnet rack
symbol: instrument
scene: tests
skills: ip-routing
reviewSkill: ip-routing
prerequisite: nat-table
---

## Briefing

Before assigning static sensor IPs inside a CIDR block, verify the reserved network (lowest) and broadcast (highest) addresses so no host collides with them.

## Objective

Write `subnet_bounds(cidr)` taking an IPv4 CIDR string like `"192.168.10.77/26"` and returning `(network_ip, broadcast_ip)` as dotted IPv4 strings (e.g. `("192.168.10.64", "192.168.10.127")`).

Raise `ValueError` if the IP or prefix length (`0..32`) is invalid.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Pack the IP into a 32-bit unsigned int, compute `mask = 0 if prefix == 0 else ((1 << prefix) - 1) << (32 - prefix)`.
2. `net = ip & mask` and `bcast = net | (~mask & 0xFFFFFFFF)`; unpack each back into 4 octets via `(n >> shift) & 0xFF`.

## Starter

```python
```

## Checks

```python
expect("computes /26 subnet bounds", lambda: get("subnet_bounds")("192.168.10.77/26"), ("192.168.10.64", "192.168.10.127"))
expect("computes /32 host bounds", lambda: get("subnet_bounds")("10.1.2.3/32"), ("10.1.2.3", "10.1.2.3"))
expect("computes /0 full space bounds", lambda: get("subnet_bounds")("1.2.3.4/0"), ("0.0.0.0", "255.255.255.255"))
```

## Hidden checks

```python
def _bad():
    try:
        get("subnet_bounds")("10.0.0.1/33")
        return False
    except ValueError:
        return True
expect("invalid prefix raises ValueError", _bad, True)
```

## Solution

```python
def _to_int(ip):
    parts = ip.split(".")
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


def _to_ip(n):
    return ".".join(str((n >> s) & 0xFF) for s in (24, 16, 8, 0))


def subnet_bounds(cidr):
    if cidr.count("/") != 1:
        raise ValueError("invalid CIDR")
    ip_s, pref_s = cidr.split("/")
    if not pref_s or not pref_s.isascii() or not pref_s.isdigit():
        raise ValueError("invalid prefix")
    pref = int(pref_s)
    if pref < 0 or pref > 32:
        raise ValueError("prefix out of range")
    mask = 0 if pref == 0 else ((1 << pref) - 1) << (32 - pref)
    net = _to_int(ip_s) & mask
    bcast = net | (~mask & 0xFFFFFFFF)
    return (_to_ip(net), _to_ip(bcast))
```

## Restored

Network and broadcast boundaries are verified before any static host IP is assigned.
