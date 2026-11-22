---
id: maintenance-summarize-subnet
title: Find the longest shared IPv4 prefix length
system: Subnet rack
symbol: instrument
scene: tests
skills: ip-routing
reviewSkill: ip-routing
prerequisite: nat-table
---

## Briefing

Route summarization collapses two neighboring IPv4 addresses into the tightest single CIDR prefix that contains both — which equals the number of matching leading bits they share!

## Objective

Write `common_prefix_length(ip_a, ip_b)` taking two dotted IPv4 strings and returning an integer `0..32`: the count of matching leading bits from the most significant bit downward.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Pack both IPs into 32-bit ints `a` and `b`, then compute `diff = a ^ b`.
2. If `diff == 0`, all `32` bits match; otherwise `32 - diff.bit_length()` is the exact count of leading zero bits in `diff`!

## Starter

```python
```

## Checks

```python
expect("identical IPs share all 32 bits", lambda: get("common_prefix_length")("10.0.1.5", "10.0.1.5"), 32)
expect("10.0.4.1 and 10.0.5.9 share /23 prefix", lambda: get("common_prefix_length")("10.0.4.1", "10.0.5.9"), 23)
expect("0.0.0.0 and 128.0.0.0 share 0 bits", lambda: get("common_prefix_length")("0.0.0.0", "128.0.0.0"), 0)
```

## Hidden checks

```python
expect("neighbors differing only in last bit share 31 bits", lambda: get("common_prefix_length")("192.168.1.2", "192.168.1.3"), 31)
```

## Solution

```python
def _to_int(ip):
    parts = ip.split(".")
    if len(parts) != 4:
        raise ValueError("invalid IPv4")
    out = 0
    for p in parts:
        n = int(p)
        if n < 0 or n > 255:
            raise ValueError("octet out of range")
        out = (out << 8) | n
    return out


def common_prefix_length(ip_a, ip_b):
    diff = _to_int(ip_a) ^ _to_int(ip_b)
    return 32 - diff.bit_length()
```

## Restored

Route summarization computes exact shared prefix lengths in one XOR and bit-length check.
