---
id: maintenance-iac-destroy-order
title: Compute a safe sequential destroy order for dependent resources
system: Plan bench
symbol: instrument
scene: tests
skills: infra-as-code
reviewSkill: infra-as-code
prerequisite: state-locking
---

## Briefing

Tearing down a stack requires deleting dependent resources (like databases and subnets) before the foundations (like VPCs) they rely on.

## Objective

Write `destroy_order(deps)` where `deps` maps `resource -> list_of_dependencies`, returning a single list of resource IDs in safe tear-down order (using a min-heap / alphabetical tie-breaking among currently removable leaf resources, and raising `ValueError` on cycles).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Count how many active resources depend ON each node (`dependents_count[dep] += 1`). Any resource with `dependents_count == 0` can be destroyed right now!

## Starter

```python
```

## Checks

```python
expect("tears down leaf resources before foundations", lambda: get("destroy_order")({"vpc": [], "subnet": ["vpc"], "db": ["subnet"]}), ["db", "subnet", "vpc"])
expect("breaks ties alphabetically among ready leaves", lambda: get("destroy_order")({"vpc": [], "sg": ["vpc"], "alb": ["vpc"]}), ["alb", "sg", "vpc"])
```

## Hidden checks

```python
def _cycle():
    try:
        get("destroy_order")({"a": ["b"], "b": ["a"]})
        return False
    except ValueError:
        return True
expect("raises ValueError on dependency cycle", _cycle, True)
```

## Solution

```python
import heapq


def destroy_order(deps):
    dependents_count = {r: 0 for r in deps}
    for r, reqs in deps.items():
        for req in set(reqs):
            if req not in deps:
                raise ValueError(f"unknown dependency: {req}")
            dependents_count[req] += 1
    heap = [r for r, cnt in dependents_count.items() if cnt == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        node = heapq.heappop(heap)
        order.append(node)
        for req in set(deps[node]):
            dependents_count[req] -= 1
            if dependents_count[req] == 0:
                heapq.heappush(heap, req)
    if len(order) != len(deps):
        raise ValueError("dependency cycle detected")
    return order
```

## Restored

Stack teardown now destroys dependent leaves first in a deterministic, cycle-safe order.
