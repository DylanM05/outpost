---
id: ipv4-cidr-match
title: Parse IPv4 addresses and test CIDR membership
system: Subnet rack
symbol: instrument
scene: tests
skills: ip-routing
---

## Briefing

Firewall rules express allowed networks in CIDR notation like `192.168.50.0/24` or `10.0.0.0/8`. Build strict IPv4 parsing and CIDR membership checks from scratch without relying on `ipaddress`.

## Concept

A valid IPv4 string has **exactly 4** dot-separated decimal octets, each an integer `0..255` with no leading sign or whitespace (e.g. `"192.168.1.1"`). Packing into a 32-bit integer:
`(a << 24) | (b << 16) | (c << 8) | d`.

For CIDR `"ip/prefix"` (`0 <= prefix <= 32`):
- If `prefix == 0`, `mask = 0` (matches every IPv4 address!).
- Otherwise `mask = ((1 << prefix) - 1) << (32 - prefix)`.
- `ip_in_cidr(ip, cidr)` is True iff `(parse_ipv4(ip) & mask) == (parse_ipv4(net_ip) & mask)`.

## Objective

Implement two functions (without importing `ipaddress`):
1. `parse_ipv4(addr)` — parses a dotted IPv4 string into its 32-bit unsigned `int`, raising `ValueError` on malformed input (wrong part count, non-digits, or octet outside `0..255`).
2. `ip_in_cidr(addr, cidr)` — parses `cidr` (`"a.b.c.d/prefix"`, `0 <= prefix <= 32`, raising `ValueError` if invalid) and returns `True` iff `addr` belongs to that subnet.

## Hints

1. Check `part.isdigit()` (note: also ensure ASCII digits `0-9` and `0 <= int(part) <= 255`!) and reject leading zeros like `"01"`? No need to reject unless specified — just ensure `len(parts) == 4` and every part is ASCII digits in `0..255`.
2. Don't forget `prefix == 0`! `((1 << 0) - 1) << 32` is `0`, which works automatically in Python!

## Starter: guided

```python
def parse_ipv4(addr):
    if not isinstance(addr, str):
        raise ValueError("address must be a string")
    parts = addr.split(".")
    if len(parts) != 4:
        raise ValueError("expected 4 octets")
    value = 0
    for part in parts:
        # Validate digits and 0 <= octet <= 255, then shift into value
        pass
    return value


def ip_in_cidr(addr, cidr):
    if "/" not in cidr:
        raise ValueError("missing prefix length")
    # Split cidr into net_ip and prefix, validate 0 <= prefix <= 32, compare masked ints
    return False
```

## Starter: standard

```python
def parse_ipv4(addr):
    pass


def ip_in_cidr(addr, cidr):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("packs 192.168.1.1 into 32-bit int", lambda: get("parse_ipv4")("192.168.1.1"), (192 << 24) | (168 << 16) | (1 << 8) | 1)
expect("matches IP inside /24 subnet", lambda: get("ip_in_cidr")("192.168.50.99", "192.168.50.0/24"), True)
expect("rejects IP outside /26 subnet", lambda: get("ip_in_cidr")("10.0.4.192", "10.0.4.128/26"), False)
expect("0.0.0.0/0 matches any IPv4 address", lambda: get("ip_in_cidr")("8.8.8.8", "0.0.0.0/0"), True)
```

## Hidden checks

```python
expect("/32 matches only the exact host", lambda: (get("ip_in_cidr")("10.1.2.3", "10.1.2.3/32"), get("ip_in_cidr")("10.1.2.4", "10.1.2.3/32")), (True, False))
def _bad():
    for fn, args in [
        ("parse_ipv4", ("256.0.0.1",)),
        ("parse_ipv4", ("1.2.3",)),
        ("parse_ipv4", ("1.2.-3.4",)),
        ("ip_in_cidr", ("1.2.3.4", "1.2.3.4/33")),
    ]:
        try:
            get(fn)(*args)
            return False
        except ValueError:
            pass
    return True
expect("malformed IPs and invalid prefixes raise ValueError", _bad, True)
```

## Solution

```python
def parse_ipv4(addr):
    if not isinstance(addr, str):
        raise ValueError("IPv4 address must be a string")
    parts = addr.split(".")
    if len(parts) != 4:
        raise ValueError("IPv4 address must have 4 octets")
    out = 0
    for part in parts:
        if not part or not part.isascii() or not part.isdigit():
            raise ValueError(f"invalid octet: {part}")
        n = int(part)
        if n > 255:
            raise ValueError(f"octet out of range: {n}")
        out = (out << 8) | n
    return out


def ip_in_cidr(addr, cidr):
    if not isinstance(cidr, str) or cidr.count("/") != 1:
        raise ValueError("invalid CIDR")
    net_str, prefix_str = cidr.split("/")
    if not prefix_str or not prefix_str.isascii() or not prefix_str.isdigit():
        raise ValueError("invalid prefix length")
    prefix = int(prefix_str)
    if prefix < 0 or prefix > 32:
        raise ValueError("prefix must be between 0 and 32")
    ip_int = parse_ipv4(addr)
    net_int = parse_ipv4(net_str)
    mask = 0 if prefix == 0 else ((1 << prefix) - 1) << (32 - prefix)
    return (ip_int & mask) == (net_int & mask)
```

## Restored

IPv4 parsing and CIDR subnet matching now run directly on 32-bit bitmasks with strict validation.
