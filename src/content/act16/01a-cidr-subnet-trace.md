---
id: cidr-subnet-trace
kind: predict
title: Mask an IPv4 address into a CIDR subnet
system: Subnet rack
symbol: instrument
scene: console
skills: ip-routing, reading-code
---

## Briefing

Routers don't compare dotted IP strings character by character — they pack each IPv4 address into a single 32-bit unsigned integer and apply a bitmask to find its network prefix and broadcast address.

## Objective

Trace the IPv4 CIDR calculation below and predict **every line it prints**.

## Concept

A `/24` prefix keeps the top `24` bits (`mask = 0xFFFFFF00`) and leaves the bottom `8` bits for hosts:
- `network = ip & mask`
- `broadcast = network | (~mask & 0xFFFFFFFF)`
- A `/26` prefix leaves `6` host bits (`2^6 = 64` addresses per subnet: `.0–.63`, `.64–.127`, `.128–.191`, `.192–.255`).

## Hints

1. `10.0.4.130` falls in the third `/26` block of `10.0.4.0/24`: `128` (`0b10000000`) through `191` (`0b10111111`).
2. `host_count` for `/26` is `64 - 2 = 62` usable host addresses (excluding network and broadcast).

## Program

```python
def to_int(ip):
    out = 0
    for octet in ip.split("."):
        out = (out << 8) | int(octet)
    return out

def to_ip(n):
    return ".".join(str((n >> shift) & 0xFF) for shift in (24, 16, 8, 0))

ip = to_int("10.0.4.130")
prefix = 26
mask = ((1 << prefix) - 1) << (32 - prefix)
net = ip & mask
bcast = net | (~mask & 0xFFFFFFFF)

print(to_ip(net))
print(to_ip(bcast))
print(bcast - net - 1)
```

## Output

```text
10.0.4.128
10.0.4.191
62
```

## Restored

You can compute IPv4 network prefixes, broadcast bounds, and host capacity directly in 32-bit binary.
