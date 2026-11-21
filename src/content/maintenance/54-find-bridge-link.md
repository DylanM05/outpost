---
id: maintenance-find-bridge-link
title: Check a severed link
system: Waystation network
symbol: controller
scene: tests
skills: shortest-paths
reviewSkill: shortest-paths
prerequisite: cheapest-fuel-route
---

## Briefing

Before taking a radio link `(u, v)` down for maintenance, check whether the two stations `u` and `v` can still reach each other through an alternate path in the undirected network.

## Objective

Write `has_alternate_route(graph, u, v)`. `graph` is an undirected adjacency dict `{node: [neighbors...]}` containing the edge `(u, v)`. Return `True` if `u` can still reach `v` when the direct edge between `u` and `v` is ignored, or `False` if `(u, v)` is the only bridge connecting them.

```python
ring = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B"]}
has_alternate_route(ring, "A", "B")  # True (via C)
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Run DFS or BFS from `u`, skipping the direct step `(u -> v)` (and `(v -> u)`).
2. Return `True` if you reach `v`, `False` if the search finishes without seeing `v`.

## Starter

```python
```

## Checks

```python
ring = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B"]}
line = {"A": ["B"], "B": ["A", "C"], "C": ["B"]}
expect("ring has alternate route", lambda: get("has_alternate_route")(ring, "A", "B"), True)
expect("line has no alternate route", lambda: get("has_alternate_route")(line, "A", "B"), False)
```

## Hidden checks

```python
bow = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B", "D"], "D": ["C", "E"], "E": ["D"]}
expect("bridge edge C-D has no alternate", lambda: get("has_alternate_route")(bow, "C", "D"), False)
expect("cycle edge A-C has alternate via B", lambda: get("has_alternate_route")(bow, "A", "C"), True)
```

## Solution

```python
def has_alternate_route(graph, u, v):
    seen = {u}
    stack = [u]
    while stack:
        node = stack.pop()
        for nxt in graph.get(node, []):
            if (node == u and nxt == v) or (node == v and nxt == u):
                continue
            if nxt == v:
                return True
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return False
```

## Restored

Maintenance crews now know before disconnecting any cable whether an alternate route keeps the ridge online.
