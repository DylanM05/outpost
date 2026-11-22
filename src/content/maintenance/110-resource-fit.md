---
id: maintenance-resource-fit
title: Check multi-dimensional node fit
system: Desired state
symbol: equipment
scene: tests
skills: orchestration
reviewSkill: orchestration
prerequisite: cluster-reconciler
---

## Briefing

A pod can request CPU, memory, and GPU slots at once. If any requested dimension exceeds what a node has free — or isn't offered by the node at all — the pod cannot land there.

## Objective

Write `can_fit(node_free, requests)` where both arguments are dicts mapping resource name (`str`) to non-negative integer capacity/demand.

Return `True` if for every resource `res, need` in `requests`, `need <= node_free.get(res, 0)`; otherwise return `False`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `all(node_free.get(res, 0) >= need for res, need in requests.items())`.
2. Double-check missing resources: if a pod asks for `{"gpu": 1}` on a CPU-only node, `node_free.get("gpu", 0)` is `0 < 1` so it returns `False`.

## Starter

```python
```

## Checks

```python
expect("fits when all resources suffice", lambda: get("can_fit")({"cpu": 4, "mem": 8192}, {"cpu": 2, "mem": 4096}), True)
expect("rejects when one dimension is short", lambda: get("can_fit")({"cpu": 4, "mem": 2048}, {"cpu": 2, "mem": 4096}), False)
expect("rejects missing resource with non-zero demand", lambda: get("can_fit")({"cpu": 4}, {"cpu": 1, "gpu": 1}), False)
```

## Hidden checks

```python
expect("zero demand for missing resource fits", lambda: get("can_fit")({"cpu": 4}, {"gpu": 0}), True)
expect("exact fit returns True", lambda: get("can_fit")({"cpu": 2, "mem": 512}, {"cpu": 2, "mem": 512}), True)
```

## Solution

```python
def can_fit(node_free, requests):
    return all(node_free.get(res, 0) >= need for res, need in requests.items())
```

## Restored

The scheduler checks every requested resource dimension before placing a workload.
