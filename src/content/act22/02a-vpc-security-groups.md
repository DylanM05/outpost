---
id: vpc-security-groups
title: Enforce stateful VPC security-group firewall rules
system: Firewall rack
symbol: equipment
scene: tests
skills: cloud-iam-vpc
---

## Briefing

VPC **Security Groups** are *allow-only* and *stateful*: if an inbound rule allows a client at `10.0.1.5:51234` to reach your web server on TCP port `443`, the return outbound packet back to `10.0.1.5:51234` is automatically allowed via connection tracking — even if no outbound rule permits port `51234`!

## Concept

Implement `SecurityGroup(ingress_rules, egress_rules)`:
- Each rule is a dict `{"protocol": "tcp"|"udp"|"any", "port_range": (lo, hi), "cidr": "a.b.c.d/prefix"}`.
- A rule matches a packet `(protocol, peer_ip, dst_port)` iff:
  - `rule["protocol"] in ("any", protocol)`
  - `lo <= dst_port <= hi`
  - `peer_ip` belongs to `rule["cidr"]` (use Python's standard `ipaddress.ip_address(ip) in ipaddress.ip_network(cidr, strict=False)`!).
- **`allow_packet(direction, protocol, peer_ip, peer_port, local_port)`:**
  - `direction` is `"ingress"` (from peer to local) or `"egress"` (from local to peer).
  - Connection key is `(protocol, peer_ip, peer_port, local_port)`:
    - If this connection key is ALREADY tracked in `self.conntrack` (opened in the opposite direction!), return `True` immediately!
  - Otherwise check the matching rule list:
    - For `"ingress"`, match `(protocol, peer_ip, local_port)` against `ingress_rules`.
    - For `"egress"`, match `(protocol, peer_ip, peer_port)` against `egress_rules`.
    - If any rule matches, record `self.conntrack.add((protocol, peer_ip, peer_port, local_port))` and return `True`; else return `False`.

## Objective

Implement `SecurityGroup(ingress_rules, egress_rules)` with `allow_packet(direction, protocol, peer_ip, peer_port, local_port)`.

## Hints

1. Python's built-in `ipaddress` module handles CIDR matching cleanly: `ipaddress.IPv4Address(peer_ip) in ipaddress.IPv4Network(rule["cidr"], strict=False)`.
2. Notice the destination port differs by direction: for `"ingress"`, the service port is `local_port`; for `"egress"`, the remote destination port is `peer_port`!

## Starter: guided

```python
import ipaddress


class SecurityGroup:
    def __init__(self, ingress_rules, egress_rules):
        self.ingress_rules = list(ingress_rules)
        self.egress_rules = list(egress_rules)
        self.conntrack = set()

    def _matches(self, rules, protocol, peer_ip, dst_port):
        addr = ipaddress.IPv4Address(peer_ip)
        for r in rules:
            lo, hi = r["port_range"]
            if r["protocol"] in ("any", protocol) and lo <= dst_port <= hi:
                if addr in ipaddress.IPv4Network(r["cidr"], strict=False):
                    return True
        return False

    def allow_packet(self, direction, protocol, peer_ip, peer_port, local_port):
        pass
```

## Starter: standard

```python
import ipaddress


class SecurityGroup:
    def __init__(self, ingress_rules, egress_rules):
        pass

    def allow_packet(self, direction, protocol, peer_ip, peer_port, local_port):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _stateful():
    sg = get("SecurityGroup")(
        ingress_rules=[{"protocol": "tcp", "port_range": (443, 443), "cidr": "10.0.0.0/16"}],
        egress_rules=[],  # zero explicit egress rules!
    )
    in_ok = sg.allow_packet("ingress", "tcp", "10.0.2.9", 54321, 443)
    # Return traffic on tracked flow is allowed automatically!
    ret_ok = sg.allow_packet("egress", "tcp", "10.0.2.9", 54321, 443)
    # Unrelated egress to another host or port is blocked!
    untracked_blocked = sg.allow_packet("egress", "tcp", "10.0.2.9", 9999, 443)
    outside_cidr = sg.allow_packet("ingress", "tcp", "192.168.1.5", 50000, 443)
    return (in_ok, ret_ok, untracked_blocked, outside_cidr)
expect("allows stateful return traffic while blocking untracked egress and foreign CIDRs", _stateful, (True, True, False, False))
```

## Hidden checks

```python
def _egress_first():
    sg = get("SecurityGroup")(
        ingress_rules=[],
        egress_rules=[{"protocol": "udp", "port_range": (53, 53), "cidr": "0.0.0.0/0"}],
    )
    out_dns = sg.allow_packet("egress", "udp", "1.1.1.1", 53, 40123)
    in_reply = sg.allow_packet("ingress", "udp", "1.1.1.1", 53, 40123)
    wrong_proto = sg.allow_packet("egress", "tcp", "1.1.1.1", 53, 40124)
    return (out_dns, in_reply, wrong_proto)
expect("tracks outbound UDP DNS request and admits return reply", _egress_first, (True, True, False))
```

## Solution

```python
import ipaddress


class SecurityGroup:
    def __init__(self, ingress_rules, egress_rules):
        self.ingress_rules = list(ingress_rules)
        self.egress_rules = list(egress_rules)
        self.conntrack = set()

    def _matches(self, rules, protocol, peer_ip, dst_port):
        addr = ipaddress.IPv4Address(peer_ip)
        for r in rules:
            lo, hi = r["port_range"]
            if r["protocol"] in ("any", protocol) and lo <= dst_port <= hi:
                if addr in ipaddress.IPv4Network(r["cidr"], strict=False):
                    return True
        return False

    def allow_packet(self, direction, protocol, peer_ip, peer_port, local_port):
        if direction not in ("ingress", "egress"):
            raise ValueError("direction must be 'ingress' or 'egress'")
        flow = (protocol, peer_ip, peer_port, local_port)
        if flow in self.conntrack:
            return True
        if direction == "ingress":
            ok = self._matches(self.ingress_rules, protocol, peer_ip, local_port)
        else:
            ok = self._matches(self.egress_rules, protocol, peer_ip, peer_port)
        if ok:
            self.conntrack.add(flow)
        return ok
```

## Restored

The firewall rack now enforces stateful VPC security groups with automatic return-flow tracking.
