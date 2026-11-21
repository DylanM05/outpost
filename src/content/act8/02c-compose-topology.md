---
id: compose-topology
title: Compose topology
system: Container bay
symbol: equipment
scene: tests
skills: containers, shortest-paths
---

## Briefing

Production apps rarely run as one container: Kestrel Ridge runs an `api` container, a `db` container, and a reverse-proxy `nginx` container wired together in a Compose file. Containers are **ephemeral** (a database without a volume loses all data on restart!), two services can't bind the same host port, and `depends_on` can't reference missing services or form a cycle. Write a topology validator that catches all of those before deployment.

## Objective

Write `validate_compose(services)`. `services` is a dict mapping each service name to a config dict:
```python
{
    "db": {"ports": [5432], "volumes": ["pgdata:/var/lib/postgresql"], "depends_on": [], "stateful": True},
    "api": {"ports": [8080], "volumes": [], "depends_on": ["db"], "stateful": False},
}
```
(Missing keys default to empty lists / `False`.)

Return a sorted list of error strings (empty `[]` if valid):

1. For any host port bound by more than one service: `"port conflict: <port>"`.
2. For any `dep` in `depends_on` that isn't a key in `services`: `"missing dependency: <service> -> <dep>"`.
3. For any service with `stateful: True` and no `volumes`: `"missing volume: <service>"`.
4. If the `depends_on` graph contains a cycle (including self-dependency): include `"dependency cycle"` (once).

## Concept

Docker Compose connects services on a shared **bridge network** so `api` reaches `db` by service name (`db:5432`), mounts **named volumes** so databases survive container recreation, and starts containers in `depends_on` topological order.

Detecting a cycle in a directed graph uses three-color DFS:

- `0` (unvisited), `1` (currently on the recursion stack / `"visiting"`), `2` (finished / `"visited"`).
- If you ever follow an edge to a node currently marked `1`, you found a cycle!

## Hints

1. Track `port_owners = {}` mapping each host port to the set of services claiming it; any port with `len(owners) > 1` adds `f"port conflict: {port}"`.
2. Check every `dep` in `svc.get("depends_on", [])` for `dep not in services`.
3. Check `svc.get("stateful") and not svc.get("volumes")` for `"missing volume: ..."`.
4. Run 3-state DFS (`state = {}` with `1 = visiting`, `2 = done`) over existing service dependencies to detect any cycle.

## Starter: guided

```python
def validate_compose(services):
    errors = set()
    port_owners = {}

    for name, cfg in services.items():
        for port in cfg.get("ports", []):
            port_owners.setdefault(port, set()).add(name)
        for dep in cfg.get("depends_on", []):
            if dep not in services:
                errors.add(f"missing dependency: {name} -> {dep}")
        if cfg.get("stateful") and not cfg.get("volumes"):
            errors.add(f"missing volume: {name}")

    for port, owners in port_owners.items():
        if len(owners) > 1:
            errors.add(f"port conflict: {port}")

    # Detect any cycle in depends_on with 3-state DFS and add "dependency cycle" if found.
    return sorted(errors)
```

## Starter: standard

```python
def validate_compose(services):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
valid = {
    "db": {"ports": [5432], "volumes": ["pgdata:/data"], "depends_on": [], "stateful": True},
    "api": {"ports": [8080], "volumes": [], "depends_on": ["db"], "stateful": False},
    "proxy": {"ports": [80, 443], "volumes": [], "depends_on": ["api"], "stateful": False},
}
expect("valid topology passes", lambda: get("validate_compose")(valid), [])

broken = {
    "db": {"ports": [8080], "volumes": [], "depends_on": [], "stateful": True},
    "api": {"ports": [8080], "depends_on": ["db", "cache"]},
}
expect(
    "catches port conflict, missing volume, and missing dependency",
    lambda: get("validate_compose")(broken),
    ["missing dependency: api -> cache", "missing volume: db", "port conflict: 8080"],
)

cyclic = {
    "a": {"depends_on": ["b"]},
    "b": {"depends_on": ["c"]},
    "c": {"depends_on": ["a"]},
}
expect("catches dependency cycle", lambda: get("validate_compose")(cyclic), ["dependency cycle"])
```

## Hidden checks

```python
diamond = {
    "a": {"depends_on": ["b", "c"]},
    "b": {"depends_on": ["d"]},
    "c": {"depends_on": ["d"]},
    "d": {"depends_on": []},
}
expect("diamond DAG is NOT a cycle", lambda: get("validate_compose")(diamond), [], "Use 3-state DFS (visiting vs done) so shared dependencies aren't mistaken for cycles.")

self_loop = {"a": {"depends_on": ["a"]}}
expect("self-dependency is a cycle", lambda: get("validate_compose")(self_loop), ["dependency cycle"])
```

## Solution

```python
def validate_compose(services):
    errors = set()
    port_owners = {}

    for name, cfg in services.items():
        for port in cfg.get("ports", []):
            port_owners.setdefault(port, set()).add(name)
        for dep in cfg.get("depends_on", []):
            if dep not in services:
                errors.add(f"missing dependency: {name} -> {dep}")
        if cfg.get("stateful") and not cfg.get("volumes"):
            errors.add(f"missing volume: {name}")

    for port, owners in port_owners.items():
        if len(owners) > 1:
            errors.add(f"port conflict: {port}")

    state = {}  # 1 = visiting, 2 = done

    def has_cycle(node):
        state[node] = 1
        for dep in services[node].get("depends_on", []):
            if dep not in services:
                continue
            if state.get(dep) == 1:
                return True
            if state.get(dep, 0) == 0 and has_cycle(dep):
                return True
        state[node] = 2
        return False

    for name in services:
        if state.get(name, 0) == 0 and has_cycle(name):
            errors.add("dependency cycle")
            break

    return sorted(errors)
```

## Restored

The container bay checks every port, volume, and dependency graph before bringing a stack online.
