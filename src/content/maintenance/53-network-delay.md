---
id: maintenance-network-delay
title: Broadcast arrival time
system: Waystation network
symbol: controller
scene: tests
skills: shortest-paths
reviewSkill: shortest-paths
prerequisite: cheapest-fuel-route
---

## Briefing

A radio broadcast starts at `source` and travels along weighted relay hops (in milliseconds). How long until **every** station in the network has received it?

## Objective

Write `broadcast_time(graph, source)`. `graph` has every station in the network as a key, mapping to a list of `(neighbor, delay_ms)` tuples. Return the time when the **last** station receives the broadcast (the maximum of all shortest-path delays from `source`), or `-1` if any station in `graph` cannot be reached.

```python
net = {"A": [("B", 2), ("C", 9)], "B": [("C", 3)], "C": []}
broadcast_time(net, "A")  # 5  (B at 2ms, C at 5ms via B)
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Run Dijkstra from `source` until the heap empties, recording `best[node]` for every reachable node.
2. If `len(best) < len(graph)`, at least one station wasn't reached -> return `-1`; otherwise return `max(best.values())`.

## Starter

```python
```

## Checks

```python
net = {"A": [("B", 2), ("C", 9)], "B": [("C", 3)], "C": []}
expect("broadcast_time reaches all in 5ms", lambda: get("broadcast_time")(net, "A"), 5)
split = {"A": [("B", 1)], "B": [], "C": []}
expect("unreachable station returns -1", lambda: get("broadcast_time")(split, "A"), -1)
```

## Hidden checks

```python
expect("single station network takes 0ms", lambda: get("broadcast_time")({"A": []}, "A"), 0)
```

## Solution

```python
import heapq


def broadcast_time(graph, source):
    best = {source: 0}
    heap = [(0, source)]
    while heap:
        cost, node = heapq.heappop(heap)
        if cost > best[node]:
            continue
        for neighbor, delay in graph.get(node, []):
            new_cost = cost + delay
            if neighbor not in best or new_cost < best[neighbor]:
                best[neighbor] = new_cost
                heapq.heappush(heap, (new_cost, neighbor))
    if len(best) < len(graph):
        return -1
    return max(best.values())
```

## Restored

The relay desk measures full-network broadcast delay in one Dijkstra pass.
