---
id: maintenance-cidr-overlap-check
title: Detect overlapping IPv4 CIDR blocks before VPC peering
system: Firewall rack
symbol: equipment
scene: tests
skills: cloud-iam-vpc
reviewSkill: cloud-iam-vpc
prerequisite: subnet-carver
---

## Briefing

Two VPCs cannot be peered if their IPv4 CIDR ranges overlap. Check whether any pair of CIDR blocks collides before opening a peering link.

## Objective

Write `has_cidr_overlap(cidrs)` taking a list of IPv4 CIDR strings and returning `True` if any two distinct entries in the list overlap (including identical CIDRs or one subnet contained inside another), else `False`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Parse with `ipaddress.IPv4Network(c, strict=False)` and use `net_a.overlaps(net_b)` across pairs `(i, j)` with `i < j`.

## Starter

```python
```

## Checks

```python
expect("detects nested subnet overlap", lambda: get("has_cidr_overlap")(["10.0.0.0/16", "10.0.5.0/24"]), True)
expect("disjoint CIDRs return False", lambda: get("has_cidr_overlap")(["10.0.0.0/24", "10.0.1.0/24", "172.16.0.0/16"]), False)
```

## Hidden checks

```python
expect("duplicate identical CIDRs overlap", lambda: get("has_cidr_overlap")(["192.168.1.0/24", "192.168.1.0/24"]), True)
expect("single CIDR returns False", lambda: get("has_cidr_overlap")(["10.0.0.0/8"]), False)
```

## Solution

```python
import ipaddress


def has_cidr_overlap(cidrs):
    nets = [ipaddress.IPv4Network(c, strict=False) for c in cidrs]
    for i in range(len(nets)):
        for j in range(i + 1, len(nets)):
            if nets[i].overlaps(nets[j]):
                return True
    return False
```

## Restored

VPC peering preflight checks now catch every overlapping CIDR range immediately.
