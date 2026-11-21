---
id: connected-outposts
title: Connected outposts
system: Waystation network
symbol: controller
scene: tests
skills: shortest-paths, graphs
---

## Briefing

Winter avalanches can sever mountain passes and split the waystation network into isolated pockets. Build an adjacency-list `Graph` class that records two-way links, finds every station reachable from a starting point, and counts how many disconnected clusters exist.

## Objective

Write a `Graph` class with:

- `__init__(self)`: stores an adjacency dictionary `self.adj = {}` mapping each station name to a `set` of its neighbors.
- `add_station(self, name)`: ensures `name` exists as a key in `self.adj` (with an empty set if new).
- `add_link(self, a, b)`: adds an **undirected** (two-way) link between `a` and `b`, creating either station if needed.
- `reachable_from(self, start)`: returns a **sorted** list of all stations reachable from `start` (including `start` itself), or `[]` if `start` is not in the graph.
- `count_clusters(self)`: returns the number of separate connected components across all stations in the graph.

```python
g = Graph()
g.add_link("Base", "North")
g.add_link("North", "Pass")
g.add_station("South")
g.reachable_from("Base")  # ["Base", "North", "Pass"]
g.count_clusters()        # 2
```

## Concept

Representing an undirected graph with `{node: set_of_neighbors}` gives `O(1)` edge checks and naturally ignores duplicate links.

To count connected components (`count_clusters`):

1. Keep one `visited = set()` shared across the whole graph.
2. Loop over every station in `self.adj`.
3. Whenever you see a station that isn't in `visited`, increment `clusters` by 1 and explore its whole component (with DFS or BFS), adding every reached station to `visited`.

Notice it's the exact same idea as counting ice sheets on a grid in the survey office — just generalized to any graph!

## Hints

1. In `add_link(a, b)`: call `self.add_station(a)` and `self.add_station(b)`, then add `b` to `self.adj[a]` and `a` to `self.adj[b]`.
2. Write an iterative DFS using a stack (`stack = [start]`) so even long chains can't hit Python's recursion limit.
3. In `count_clusters()`: loop through `self.adj`; each unvisited node starts a new DFS that marks its entire cluster visited.

## Starter: guided

```python
class Graph:
    def __init__(self):
        self.adj = {}

    def add_station(self, name):
        if name not in self.adj:
            self.adj[name] = set()

    def add_link(self, a, b):
        self.add_station(a)
        self.add_station(b)
        # Add both directions: a -> b and b -> a.

    def reachable_from(self, start):
        if start not in self.adj:
            return []
        visited = set()
        stack = [start]
        # Explore with DFS, then return sorted(visited).
        return []

    def count_clusters(self):
        visited = set()
        clusters = 0
        # For each unvisited station in self.adj, explore its cluster and count it.
        return clusters
```

## Starter: standard

```python
class Graph:
    def __init__(self):
        self.adj = {}

    def add_station(self, name):
        pass

    def add_link(self, a, b):
        pass

    def reachable_from(self, start):
        return []

    def count_clusters(self):
        return 0
```

## Starter: challenge

```python
```

## Checks

```python
g = get("Graph")()
g.add_link("Base", "North")
g.add_link("North", "Pass")
g.add_station("South")
expect('reachable_from("Base")', lambda: g.reachable_from("Base"), ["Base", "North", "Pass"])
expect('reachable_from("South")', lambda: g.reachable_from("South"), ["South"])
expect('reachable_from("Unknown")', lambda: g.reachable_from("Unknown"), [])
expect("count_clusters()", lambda: g.count_clusters(), 2)
```

## Hidden checks

```python
empty = get("Graph")()
expect("empty graph has 0 clusters", lambda: empty.count_clusters(), 0)

cyc = get("Graph")()
cyc.add_link("A", "B")
cyc.add_link("B", "C")
cyc.add_link("C", "A")
cyc.add_link("D", "E")
cyc.add_station("F")
expect("handles cycles and multiple clusters", lambda: (cyc.reachable_from("C"), cyc.count_clusters()), (["A", "B", "C"], 3))

# Deep chain shouldn't blow recursion limit if iterative, or works for 400 nodes.
chain = get("Graph")()
for i in range(400):
    chain.add_link(f"s{i}", f"s{i + 1}")
expect("401-node chain is 1 cluster", lambda: (len(chain.reachable_from("s0")), chain.count_clusters()), (401, 1))
```

## Solution

```python
class Graph:
    def __init__(self):
        self.adj = {}

    def add_station(self, name):
        if name not in self.adj:
            self.adj[name] = set()

    def add_link(self, a, b):
        self.add_station(a)
        self.add_station(b)
        self.adj[a].add(b)
        self.adj[b].add(a)

    def reachable_from(self, start):
        if start not in self.adj:
            return []
        visited = set()
        stack = [start]
        while stack:
            node = stack.pop()
            if node in visited:
                continue
            visited.add(node)
            for neighbor in self.adj[node]:
                if neighbor not in visited:
                    stack.append(neighbor)
        return sorted(visited)

    def count_clusters(self):
        visited = set()
        clusters = 0
        for station in self.adj:
            if station in visited:
                continue
            clusters += 1
            stack = [station]
            while stack:
                node = stack.pop()
                if node in visited:
                    continue
                visited.add(node)
                for neighbor in self.adj[node]:
                    if neighbor not in visited:
                        stack.append(neighbor)
        return clusters
```

## Restored

The waystation network maps every two-way pass and immediately reports when an avalanche splits off an isolated cluster.
