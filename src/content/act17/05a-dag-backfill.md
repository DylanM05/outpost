---
id: dag-backfill
title: Plan minimal downstream DAG backfills
system: Pipeline deck
symbol: equipment
scene: tests
skills: data-pipelines
---

## Briefing

When an upstream raw table is fixed, you don't want to recompute every dataset in the warehouse — ONLY the changed table and its **transitive downstream dependents**, executed in strict dependency order!

## Concept

`deps` maps each dataset name to the list of upstream datasets it depends on (e.g. `{"raw": [], "clean": ["raw"], "metrics": ["clean"], "unrelated": []}`).

Given a set/list of `changed` datasets:
1. Build the reverse adjacency graph (`upstream -> downstreams`) and find every dataset reachable from `changed` (including `changed` itself). That is the minimal `impacted` set!
2. Topologically sort ONLY the `impacted` subgraph (using a min-heap / lexicographic tie-breaking on ready nodes so the schedule is 100% deterministic!).
3. If the impacted subgraph contains a cycle, raise `ValueError`.

## Objective

Write `plan_backfill(deps, changed)` returning the deterministic topological execution list of impacted datasets (lexicographically smallest ready node first). Raise `ValueError` if any name in `changed` is not in `deps` or if the impacted subgraph has a cycle.

## Hints

1. Validate every `c in deps`, collect `impacted` via BFS/DFS over reverse edges `u -> v` (where `u in deps[v]`).
2. Run Kahn's algorithm with `heapq` over `impacted` (counting only in-edges from other nodes inside `impacted`!). If `len(order) < len(impacted)`, raise `ValueError`.

## Starter: guided

```python
import heapq


def plan_backfill(deps, changed):
    for c in changed:
        if c not in deps:
            raise ValueError(f"unknown dataset: {c}")
    children = {node: [] for node in deps}
    for node, upstreams in deps.items():
        for u in upstreams:
            if u in children:
                children[u].append(node)
    # 1. BFS/DFS from changed using `children` to build `impacted`
    # 2. Kahn's topological sort with heapq over `impacted`
    return []
```

## Starter: standard

```python
import heapq


def plan_backfill(deps, changed):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _backfill():
    deps = {
        "raw_temp": [],
        "raw_wind": [],
        "hourly_temp": ["raw_temp"],
        "hourly_wind": ["raw_wind"],
        "station_summary": ["hourly_temp", "hourly_wind"],
        "alerts": ["hourly_temp"],
    }
    return get("plan_backfill")(deps, ["raw_temp"])
expect("computes minimal downstream topological backfill order", _backfill, ["raw_temp", "hourly_temp", "alerts", "station_summary"])

def _cycle():
    try:
        get("plan_backfill")({"a": ["b"], "b": ["a"]}, ["a"])
        return False
    except ValueError:
        return True
expect("detects cycle in impacted subgraph", _cycle, True)
```

## Hidden checks

```python
expect("empty changed list returns empty backfill", lambda: get("plan_backfill")({"a": [], "b": ["a"]}, []), [])
def _diamond():
    deps = {"a": [], "b": ["a"], "c": ["a"], "d": ["b", "c"], "other": []}
    return get("plan_backfill")(deps, ["a"])
expect("breaks ready ties lexicographically in diamond DAG", _diamond, ["a", "b", "c", "d"])
```

## Solution

```python
import heapq


def plan_backfill(deps, changed):
    for c in changed:
        if c not in deps:
            raise ValueError(f"unknown dataset: {c}")
    children = {node: [] for node in deps}
    for node, upstreams in deps.items():
        for u in upstreams:
            if u in children:
                children[u].append(node)

    impacted = set()
    stack = list(changed)
    while stack:
        node = stack.pop()
        if node in impacted:
            continue
        impacted.add(node)
        for child in children[node]:
            if child not in impacted:
                stack.append(child)

    indeg = {node: 0 for node in impacted}
    for node in impacted:
        for u in deps[node]:
            if u in impacted:
                indeg[node] += 1

    heap = [node for node, deg in indeg.items() if deg == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        node = heapq.heappop(heap)
        order.append(node)
        for child in children[node]:
            if child in impacted:
                indeg[child] -= 1
                if indeg[child] == 0:
                    heapq.heappush(heap, child)

    if len(order) != len(impacted):
        raise ValueError("cycle detected in backfill DAG")
    return order
```

## Restored

Backfills now touch only affected downstream datasets in deterministic topological order.
