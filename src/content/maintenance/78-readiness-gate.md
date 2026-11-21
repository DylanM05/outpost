---
id: maintenance-readiness-gate
title: Aggregate readiness checks
system: Container bay
symbol: equipment
scene: tests
skills: containers
reviewSkill: containers
prerequisite: compose-topology
---

## Briefing

A container's `/readyz` endpoint runs a set of dependency checks (database, cache, disk) and tells the load balancer whether this instance can take traffic right now.

## Objective

Write `readiness_response(checks)` where `checks` is a dict mapping dependency names to zero-argument callables (each returns `True` if healthy, `False` if unhealthy, or may raise an exception if the dependency is down!):

- Call every check (catching any `Exception` as unhealthy, without crashing `/readyz`).
- If all checks pass, return `(200, {"status": "ready", "failed": []})`.
- If one or more fail or raise, return `(503, {"status": "not_ready", "failed": sorted_failed_names})`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Loop over `sorted(checks)` and wrap each `checks[name]()` call in `try ... except Exception:`.
2. Any check that returns a falsy value or raises goes into `failed`.

## Starter

```python
```

## Checks

```python
expect(
    "all healthy returns 200",
    lambda: get("readiness_response")({"db": lambda: True, "cache": lambda: True}),
    (200, {"status": "ready", "failed": []}),
)
def boom():
    raise RuntimeError("connection refused")
expect(
    "failing and raising checks both reported sorted with 503",
    lambda: get("readiness_response")({"disk": lambda: False, "db": boom, "cache": lambda: True}),
    (503, {"status": "not_ready", "failed": ["db", "disk"]}),
)
```

## Hidden checks

```python
expect("empty checks dict is ready", lambda: get("readiness_response")({}), (200, {"status": "ready", "failed": []}))
```

## Solution

```python
def readiness_response(checks):
    failed = []
    for name in sorted(checks):
        try:
            ok = bool(checks[name]())
        except Exception:
            ok = False
        if not ok:
            failed.append(name)
    if failed:
        return 503, {"status": "not_ready", "failed": failed}
    return 200, {"status": "ready", "failed": []}
```

## Restored

A crashed database check now returns a clean `503` naming the broken dependency instead of crashing the health endpoint.
