---
id: depth-first-trace
kind: predict
title: Depth-first trace
system: Waystation network
symbol: controller
scene: console
skills: shortest-paths, graphs, reading-code
---

## Briefing

Not every map is a rectangular grid. Beyond the inner ridge, waystations are linked by arbitrary mountain passes stored in an **adjacency list**: a dictionary mapping each station to the list of stations directly connected to it. **Depth-first search (DFS)** follows one path as far as it goes before backtracking. Trace the exact order DFS visits these waystations.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

A **graph** is a set of **nodes** (vertices) connected by **edges**. The most common way to store one in Python is an **adjacency list**:

```python
network = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A"],
    "D": ["B"],
}
```

In **DFS**, you mark a node visited, then immediately recurse into its first unvisited neighbor before ever touching its second neighbor. Keeping a `visited` set stops DFS from looping forever around cycles.

## Hints

1. Start at `"A"`, append `"A"`, then look at `"A"`'s neighbors: `["B", "C"]`.
2. Visit `"B"` first, then `"B"`'s unvisited neighbor `"D"`, then `"D"`'s unvisited neighbor `"C"`.
3. When recursion unwinds back to `"A"`, `"C"` is already in `visited`, so it isn't visited twice!

## Program

```python
network = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D"],
    "D": ["B", "C", "E"],
    "E": ["D"],
}


def dfs(graph, node, visited, order):
    visited.add(node)
    order.append(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited, order)


seen = set()
order = []
dfs(network, "A", seen, order)
print(order)
```

## Output

```text
['A', 'B', 'D', 'C', 'E']
```

## Restored

You traced depth-first search diving from `A` to `B` to `D`, looping into `C` before backing out to `E`.
