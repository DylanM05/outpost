---
id: iac-dependency-graph
title: Compute deterministic IaC apply and destroy waves
system: Plan bench
symbol: instrument
scene: tests
skills: infra-as-code
---

## Briefing

Terraform and OpenTofu cannot create an RDS database before its VPC subnet exists — nor delete a VPC while subnets still live inside it! An IaC engine builds a dependency DAG and groups independent resources into parallel **execution waves**.

## Concept

Given `deps: dict[str, list[str]]` mapping each `resource_id` to the list of resource IDs it depends on (every dependency must exist as a key in `deps`, else raise `ValueError`):
- **`plan_apply_waves(deps)`:**
  - Group resources into parallel topological waves (Kahn's algorithm by levels):
    - Wave 0 contains all resources with `0` unsatisfied dependencies, **sorted alphabetically**.
    - Remove Wave 0 from remaining dependencies; Wave 1 contains all newly unblocked resources, **sorted alphabetically**, and so on!
  - If any resources remain when no wave can progress, there is a cycle — raise `ValueError("dependency cycle detected")`!
- **`plan_destroy_waves(deps)`:**
  - Resources must be destroyed in **reverse** dependency order: Wave 0 destroys leaf resources that *nothing else depends on*, and the VPC is destroyed last!
  - Specifically, reverse the edges (so `A` must be destroyed before `B` whenever `A` depends on `B`) and compute the same lexicographically sorted parallel waves!

## Objective

Implement `plan_apply_waves(deps)` and `plan_destroy_waves(deps)` returning `list[list[str]]`.

## Hints

1. Note that `plan_destroy_waves(deps)` is NOT always simply `list(reversed(plan_apply_waves(deps)))`! For example, if `B -> A` and `C` has no dependencies, `apply` puts `["A", "C"]` in Wave 0 and `["B"]` in Wave 1 — whereas `destroy` can immediately destroy BOTH `"B"` and `"C"` in Wave 0, then `"A"` in Wave 1! Building the reversed dependency graph handles this accurately.

## Starter: guided

```python
def _waves(graph):
    for node, reqs in graph.items():
        for r in reqs:
            if r not in graph:
                raise ValueError(f"unknown dependency: {r}")
    in_deg = {n: len(set(reqs)) for n, reqs in graph.items()}
    dependents = {n: [] for n in graph}
    for n, reqs in graph.items():
        for r in set(reqs):
            dependents[r].append(n)
    # Run level-by-level Kahn's algorithm, sorting each wave alphabetically.
    pass


def plan_apply_waves(deps):
    return _waves(deps)


def plan_destroy_waves(deps):
    pass
```

## Starter: standard

```python
def plan_apply_waves(deps):
    pass


def plan_destroy_waves(deps):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_DEPS = {
    "vpc": [],
    "subnet": ["vpc"],
    "sg": ["vpc"],
    "db": ["subnet", "sg"],
    "bucket": [],
}
expect("groups independent resources into parallel apply waves", lambda: get("plan_apply_waves")(_DEPS), [
    ["bucket", "vpc"],
    ["sg", "subnet"],
    ["db"],
])
expect("destroys leaf resources first in parallel destroy waves", lambda: get("plan_destroy_waves")(_DEPS), [
    ["bucket", "db"],
    ["sg", "subnet"],
    ["vpc"],
])
```

## Hidden checks

```python
def _cycle():
    try:
        get("plan_apply_waves")({"a": ["b"], "b": ["a"]})
        return False
    except ValueError:
        return True
expect("detects circular dependencies", _cycle, True)

def _unknown():
    try:
        get("plan_apply_waves")({"subnet": ["missing_vpc"]})
        return False
    except ValueError:
        return True
expect("rejects missing dependency reference", _unknown, True)
```

## Solution

```python
def _waves(graph):
    for node, reqs in graph.items():
        for r in reqs:
            if r not in graph:
                raise ValueError(f"unknown dependency: {r}")
    in_deg = {n: len(set(reqs)) for n, reqs in graph.items()}
    dependents = {n: [] for n in graph}
    for n, reqs in graph.items():
        for r in set(reqs):
            dependents[r].append(n)

    waves = []
    ready = sorted(n for n, d in in_deg.items() if d == 0)
    visited = 0
    while ready:
        waves.append(ready)
        visited += len(ready)
        next_ready = []
        for node in ready:
            for dep in dependents[node]:
                in_deg[dep] -= 1
                if in_deg[dep] == 0:
                    next_ready.append(dep)
        ready = sorted(next_ready)

    if visited != len(graph):
        raise ValueError("dependency cycle detected")
    return waves


def plan_apply_waves(deps):
    return _waves(deps)


def plan_destroy_waves(deps):
    for node, reqs in deps.items():
        for r in reqs:
            if r not in deps:
                raise ValueError(f"unknown dependency: {r}")
    rev = {n: [] for n in deps}
    for node, reqs in deps.items():
        for r in set(reqs):
            rev[r].append(node)
    return _waves(rev)
```

## Restored

The plan bench now schedules parallel IaC apply and destroy waves safely with cycle detection.
