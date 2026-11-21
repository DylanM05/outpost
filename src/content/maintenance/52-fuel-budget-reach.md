---
id: maintenance-fuel-budget-reach
title: Stations within fuel range
system: Waystation network
symbol: controller
scene: tests
skills: shortest-paths
reviewSkill: shortest-paths
prerequisite: cheapest-fuel-route
---

## Briefing

Given a weighted waystation graph and a drone's fuel tank `max_fuel`, find every station the drone can reach from `start` without exceeding `max_fuel`.

## Objective

Write `reachable_within(graph, start, max_fuel)`. `graph` maps each station to a list of `(neighbor, fuel_cost)` tuples (positive costs). Return a **sorted** list of all stations reachable from `start` with total fuel cost `<= max_fuel` (including `start` itself at cost `0`).

```python
net = {"A": [("B", 4), ("C", 10)], "B": [("C", 3), ("D", 5)], "C": [], "D": []}
reachable_within(net, "A", 7)  # ["A", "B", "C"]  (A->B->C costs 7; D costs 9)
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Run Dijkstra's algorithm with `heapq` starting at `(0, start)`.
2. Only relax/push neighbors whose `new_cost <= max_fuel`, then return `sorted(best.keys())`.

## Starter

```python
```

## Checks

```python
net = {"A": [("B", 4), ("C", 10)], "B": [("C", 3), ("D", 5)], "C": [], "D": []}
expect("reachable_within(net, 'A', 7)", lambda: get("reachable_within")(net, "A", 7), ["A", "B", "C"])
expect("reachable_within(net, 'A', 3)", lambda: get("reachable_within")(net, "A", 3), ["A"])
```

## Hidden checks

```python
expect("exact boundary cost 9 includes D", lambda: get("reachable_within")(net, "A", 9), ["A", "B", "C", "D"])
expect("0 fuel returns only start", lambda: get("reachable_within")(net, "A", 0), ["A"])
```

## Solution

```python
import heapq


def reachable_within(graph, start, max_fuel):
    best = {start: 0}
    heap = [(0, start)]
    while heap:
        cost, node = heapq.heappop(heap)
        if cost > best[node]:
            continue
        for neighbor, weight in graph.get(node, []):
            new_cost = cost + weight
            if new_cost <= max_fuel and new_cost < best.get(neighbor, max_fuel + 1):
                best[neighbor] = new_cost
                heapq.heappush(heap, (new_cost, neighbor))
    return sorted(best)
```

## Restored

Dispatch knows every reachable waystation on a single tank before the drone lifts off.
