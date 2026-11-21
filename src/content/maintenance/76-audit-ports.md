---
id: maintenance-audit-ports
title: Audit exposed Compose ports
system: Container bay
symbol: equipment
scene: tests
skills: containers
reviewSkill: containers
prerequisite: compose-topology
---

## Briefing

In Docker Compose, writing `"5432:5432"` publishes Postgres on `0.0.0.0` (every network interface), whereas `"127.0.0.1:5432:5432"` keeps it strictly local. Audit a Compose services map for ports exposed on all interfaces.

## Objective

Write `exposed_host_ports(services)` where `services` is a dict `{service_name: {"ports": [...]}}` (a service may omit `"ports"`).

Each port entry is a string in one of these forms:
- `"8080:80"` -> exposed on all interfaces (host port `8080`)
- `"0.0.0.0:8080:80"` -> exposed on all interfaces (host port `8080`)
- `"127.0.0.1:5432:5432"` -> localhost-only (NOT exposed)

Return a sorted list of `(service_name, int(host_port))` tuples for every port exposed on all interfaces.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split each port string on `":"`:
   - 2 parts (`host:container`) -> exposed, host port is `int(parts[0])`.
   - 3 parts (`bind_ip:host:container`) -> exposed only if `parts[0] in ("0.0.0.0", "")`, host port is `int(parts[1])`.
2. Return `sorted(found)`.

## Starter

```python
```

## Checks

```python
compose = {
    "web": {"ports": ["0.0.0.0:8080:80"]},
    "db": {"ports": ["127.0.0.1:5432:5432"]},
    "admin": {"ports": ["9000:9000"]},
    "worker": {},
}
expect(
    "finds 0.0.0.0 and bare host:container ports, skips 127.0.0.1",
    lambda: get("exposed_host_ports")(compose),
    [("admin", 9000), ("web", 8080)],
)
```

## Hidden checks

```python
expect("all localhost-bound returns []", lambda: get("exposed_host_ports")({"db": {"ports": ["127.0.0.1:5432:5432"]}}), [])
expect(
    "multiple ports on one service sorted by port",
    lambda: get("exposed_host_ports")({"proxy": {"ports": ["443:443", "80:80"]}}),
    [("proxy", 80), ("proxy", 443)],
)
```

## Solution

```python
def exposed_host_ports(services):
    found = []
    for name, cfg in services.items():
        for spec in cfg.get("ports", []):
            parts = str(spec).split(":")
            if len(parts) == 2:
                found.append((name, int(parts[0])))
            elif len(parts) == 3 and parts[0] in ("0.0.0.0", ""):
                found.append((name, int(parts[1])))
    return sorted(found)
```

## Restored

The audit immediately spots databases accidentally published to the public interface before deployment.
