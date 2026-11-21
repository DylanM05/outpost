---
id: cheapest-fuel-route
title: Cheapest fuel route
system: Waystation network
symbol: controller
scene: tests
skills: shortest-paths, heaps
---

## Briefing

Breadth-first search finds the route with the fewest **hops**, assuming every hop costs the same. Across the deep ridge, that assumption breaks down: a direct hop over a steep glacier can burn 15 units of fuel, while three sheltered passes around it burn only 6. To find the lowest-cost route on a **weighted graph**, you need **Dijkstra's algorithm** — BFS upgraded with a min-heap.

## Objective

Write `cheapest_route(graph, start, goal)`.

- `graph` is a dictionary mapping each station to a list of `(neighbor, fuel_cost)` tuples (all costs are positive numbers).
- Return `(total_cost, path)` where `total_cost` is the minimum fuel required to fly from `start` to `goal` and `path` is the list of station names from `start` to `goal`.
- If `goal` cannot be reached from `start`, return `(-1, [])`.

```python
network = {
    "A": [("B", 15), ("C", 2)],
    "C": [("D", 2)],
    "D": [("B", 2)],
    "B": [],
}
cheapest_route(network, "A", "B")  # (6, ["A", "C", "D", "B"])
```

## Concept

**Dijkstra's algorithm** replaces BFS's queue with a **min-heap** (`heapq`) ordered by total fuel spent so far:

1. Start with `best = {start: 0}`, `came_from = {start: None}`, and `heap = [(0, start)]`.
2. Pop `(cost, node)` with the smallest cost from `heap`.
3. **Skip stale entries:** if `cost > best[node]`, we already found a cheaper way to `node`, so `continue`.
4. If `node == goal`, stop and rebuild the path by walking `came_from` backwards!
5. For each `(neighbor, edge_cost)` in `graph.get(node, [])`:
   - `new_cost = cost + edge_cost`
   - If `neighbor not in best or new_cost < best[neighbor]`:
     - Save `best[neighbor] = new_cost` and `came_from[neighbor] = node`.
     - Push `(new_cost, neighbor)` onto `heap`.

Because every edge cost is positive, the first time a node is popped with its current best cost, no future path through other nodes can ever be cheaper!

## Hints

1. Import `heapq`. Start with `best = {start: 0}`, `came_from = {start: None}`, and `heap = [(0, start)]`.
2. Always check `if cost > best[node]: continue` right after `heapq.heappop(heap)`.
3. When `node == goal`, rebuild `path` by following `came_from` until `None`, reverse it, and return `(cost, path)`.
4. If the heap empties without reaching `goal`, return `(-1, [])`.

## Starter: guided

```python
import heapq


def cheapest_route(graph, start, goal):
    best = {start: 0}
    came_from = {start: None}
    heap = [(0, start)]

    while heap:
        cost, node = heapq.heappop(heap)
        if cost > best[node]:
            continue
        if node == goal:
            # Rebuild the path from came_from and return (cost, path).
            return (cost, [])
        for neighbor, edge_cost in graph.get(node, []):
            new_cost = cost + edge_cost
            # If this is cheaper than best.get(neighbor), record it and heappush.
            pass

    return (-1, [])
```

## Starter: standard

```python
import heapq


def cheapest_route(graph, start, goal):
    return (-1, [])
```

## Starter: challenge

```python
```

## Checks

```python
net = {
    "A": [("B", 15), ("C", 2)],
    "C": [("D", 2)],
    "D": [("B", 2)],
    "B": [],
}
expect("cheapest_route prefers 3 cheap hops over 1 expensive hop", lambda: get("cheapest_route")(net, "A", "B"), (6, ["A", "C", "D", "B"]))

ridge = {
    "Base": [("North", 4), ("East", 1)],
    "East": [("North", 2), ("Peak", 9)],
    "North": [("Peak", 3)],
    "Peak": [],
}
expect("cheapest_route updates an already-seen node when a cheaper path arrives", lambda: get("cheapest_route")(ridge, "Base", "Peak"), (6, ["Base", "East", "North", "Peak"]))
expect("unreachable goal returns (-1, [])", lambda: get("cheapest_route")(ridge, "Peak", "Base"), (-1, []))
```

## Hidden checks

```python
expect("start equals goal", lambda: get("cheapest_route")(ridge, "Base", "Base"), (0, ["Base"]))

# Cycle with shortcut
cyclic = {
    "S": [("A", 1), ("B", 10)],
    "A": [("S", 1), ("B", 2)],
    "B": [("A", 2), ("G", 3)],
    "G": [("B", 3)],
}
expect("handles cycles cleanly", lambda: get("cheapest_route")(cyclic, "S", "G"), (6, ["S", "A", "B", "G"]))

# Larger 100-node layered graph
big = {}
for i in range(100):
    edges = []
    if i + 1 < 100:
        edges.append((f"n{i+1}", 2))
    if i + 2 < 100:
        edges.append((f"n{i+2}", 3))
    if i + 5 < 100:
        edges.append((f"n{i+5}", 12))
    big[f"n{i}"] = edges
cost, path = get("cheapest_route")(big, "n0", "n99")
expect("100-node weighted graph minimum cost", lambda: cost, 149)
check(
    "100-node path is valid and sums to 149",
    lambda: (
        path[0] == "n0"
        and path[-1] == "n99"
        and sum(dict(big[u])[v] for u, v in zip(path, path[1:])) == 149
    ),
    "Rebuild the path cleanly from came_from.",
)
```

## Solution

```python
import heapq


def cheapest_route(graph, start, goal):
    best = {start: 0}
    came_from = {start: None}
    heap = [(0, start)]

    while heap:
        cost, node = heapq.heappop(heap)
        if cost > best[node]:
            continue
        if node == goal:
            path = []
            cur = goal
            while cur is not None:
                path.append(cur)
                cur = came_from[cur]
            path.reverse()
            return (cost, path)
        for neighbor, edge_cost in graph.get(node, []):
            new_cost = cost + edge_cost
            if neighbor not in best or new_cost < best[neighbor]:
                best[neighbor] = new_cost
                came_from[neighbor] = node
                heapq.heappush(heap, (new_cost, neighbor))

    return (-1, [])
```

## Restored

Dijkstra's algorithm steers every drone around the fuel-guzzling glaciers, saving fuel on every leg across the network.
