---
id: subnet-carver
title: Carve aligned, non-overlapping VPC subnets from a CIDR block
system: Firewall rack
symbol: equipment
scene: tests
skills: cloud-iam-vpc
---

## Briefing

Every cloud VPC starts with one supernet like `10.0.0.0/16` and must carve out public, private, and database subnets of different sizes (`/24`, `/22`, `/26`) without overlaps and strictly aligned to each subnet's power-of-two boundary!

## Concept

Write `allocate_subnets(vpc_cidr, requests)` where:
- `vpc_cidr` is an IPv4 CIDR string like `"10.0.0.0/20"`.
- `requests` is a list of `(name, prefix_len)` tuples (e.g. `[("web", 22), ("db", 24)]`).
- Allocate subnets in the order requested using **lowest aligned free address** inside `vpc_cidr`:
  - A subnet of length `/p` has size `block_size = 1 << (32 - p)` and its base address must be divisible by `block_size` (`addr % block_size == 0`)!
  - Starting from `vpc_start`, advance `cursor` to the next multiple of `block_size` (`((cursor + block_size - 1) // block_size) * block_size`).
  - If `aligned + block_size > vpc_end + 1` (or `prefix_len < vpc_prefix` or `prefix_len > 32`), raise `ValueError("insufficient address space")`.
  - Assign `f"{IPv4Address(aligned)}/{prefix_len}"` to `name` and advance `cursor = aligned + block_size`!
- Return a dict `{name: cidr_str}`.

## Objective

Implement `allocate_subnets(vpc_cidr, requests)` returning `{name: cidr_str}` with strict power-of-two alignment and overflow checking.

## Hints

1. `net = ipaddress.IPv4Network(vpc_cidr, strict=True)` gives `int(net.network_address)`, `int(net.broadcast_address)`, and `net.prefixlen`.
2. Notice: requesting a `/25` (`10.0.0.0/25`) followed by a `/24` must skip `10.0.0.128..255` and align the `/24` to `10.0.1.0/24`!

## Starter: guided

```python
import ipaddress


def allocate_subnets(vpc_cidr, requests):
    vpc = ipaddress.IPv4Network(vpc_cidr, strict=True)
    cursor = int(vpc.network_address)
    vpc_end = int(vpc.broadcast_address) + 1
    out = {}
    for name, prefix in requests:
        if prefix < vpc.prefixlen or prefix > 32:
            raise ValueError("invalid prefix")
        size = 1 << (32 - prefix)
        # Align cursor up to a multiple of size, verify fit inside vpc_end, record CIDR.
        pass
    return out
```

## Starter: standard

```python
import ipaddress


def allocate_subnets(vpc_cidr, requests):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("carves aligned sequential subnets", lambda: get("allocate_subnets")("10.0.0.0/22", [("pub", 25), ("app", 24), ("db", 26)]), {
    "pub": "10.0.0.0/25",
    "app": "10.0.1.0/24",
    "db": "10.0.2.0/26",
})
```

## Hidden checks

```python
expect("fills exact VPC capacity cleanly", lambda: get("allocate_subnets")("192.168.0.0/24", [("a", 25), ("b", 25)]), {
    "a": "192.168.0.0/25",
    "b": "192.168.0.128/25",
})

def _overflow():
    try:
        get("allocate_subnets")("10.0.0.0/24", [("a", 25), ("b", 24)])
        return False
    except ValueError:
        return True
expect("raises ValueError when VPC runs out of aligned space", _overflow, True)
```

## Solution

```python
import ipaddress


def allocate_subnets(vpc_cidr, requests):
    vpc = ipaddress.IPv4Network(vpc_cidr, strict=True)
    cursor = int(vpc.network_address)
    vpc_end = int(vpc.broadcast_address) + 1
    out = {}
    for name, prefix in requests:
        if prefix < vpc.prefixlen or prefix > 32:
            raise ValueError("invalid subnet prefix")
        size = 1 << (32 - prefix)
        aligned = ((cursor + size - 1) // size) * size
        if aligned + size > vpc_end:
            raise ValueError("insufficient address space")
        out[name] = f"{ipaddress.IPv4Address(aligned)}/{prefix}"
        cursor = aligned + size
    return out
```

## Restored

The firewall rack now carves power-of-two aligned VPC subnets without address overlaps.
