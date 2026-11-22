---
id: astar-pathfinder
title: Route drones around terrain with A* search
system: Navigation core
symbol: controller
scene: tests
skills: simulation-pathfinding
---

## Briefing

Dijkstra's algorithm expands outward equally in every direction, even directly away from the destination. **A\* search** guides the priority queue with an **admissible heuristic** $h(n)$ — Manhattan distance on a 4-way grid — finding the exact optimal path while exploring far fewer cells.

## Concept

On a 4-directional grid (`list[str]`):
- `'.'` costs `1` to enter, `'~'` (rough snowdrift) costs `3` to enter, and `'#'` is impassable.
- Heuristic $h((r, c)) = |r - g_r| + |c - g_c|$. Because the cheapest move costs `1`, Manhattan distance never overestimates remaining cost, guaranteeing A\* returns a strictly optimal path!
- Priority queue entries: `(f_score, g_score, (r, c))` where `f_score = g_score + h((r, c))`.
- Skip stale popped entries where `g > best_g[node]`. Count `expanded += 1` each time a non-stale cell is popped from the heap!
- When `goal` is popped, reconstruct the path from `start` to `goal` and return `{"cost": g, "path": path, "expanded": expanded}`.
- Return `None` if `start` or `goal` is out of bounds, is `'#'`, or no path exists.

## Objective

Write `astar_path(grid, start, goal)` returning `{"cost": int, "path": list[tuple[int, int]], "expanded": int}` or `None` if unreachable.

## Hints

1. Use `heapq.heappush(pq, (h(start), 0, start))` with `best_g = {start: 0}` and `came_from = {}`.
2. When popping `(f, g, node)`, skip if `g > best_g.get(node, float("inf"))`; otherwise increment `expanded += 1` and check `if node == goal:`.
3. Only push a neighbor `(nr, nc)` when `new_g < best_g.get((nr, nc), float("inf"))`.

## Starter: guided

```python
import heapq


def astar_path(grid, start, goal):
    if not grid or not grid[0]:
        return None
    rows, cols = len(grid), len(grid[0])
    sr, sc = start
    gr, gc = goal
    if not (0 <= sr < rows and 0 <= sc < cols and 0 <= gr < rows and 0 <= gc < cols):
        return None
    if grid[sr][sc] == "#" or grid[gr][gc] == "#":
        return None

    def h(cell):
        return abs(cell[0] - gr) + abs(cell[1] - gc)

    pq = [(h(start), 0, start)]
    best_g = {start: 0}
    came_from = {}
    expanded = 0
    # Pop lowest f-score, expand 4-way neighbors ('.'=1, '~'=3), return dict or None.
    return None
```

## Starter: standard

```python
import heapq


def astar_path(grid, start, goal):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_SNOW = [
    ".~~~.",
    ".#.#.",
    ".....",
]
def _weighted():
    res = get("astar_path")(_SNOW, (0, 0), (0, 4))
    # Going across top costs 3+3+3+1 = 10; going around bottom costs 1+1+1+1+1+1+1+1 = 8!
    return (res["cost"], res["path"][0], res["path"][-1], len(res["path"]))
expect("detours around expensive snowdrifts for lower total cost", _weighted, (8, (0, 0), (0, 4), 9))

def _heuristic_prunes():
    open_grid = ["." * 12 for _ in range(12)]
    res = get("astar_path")(open_grid, (6, 1), (6, 10))
    # Straight line is 9 steps; A* should expand far fewer than 40 of the 144 cells!
    return (res["cost"], res["expanded"] <= 20)
expect("Manhattan heuristic focuses search toward goal", _heuristic_prunes, (9, True))
```

## Hidden checks

```python
_BLOCKED = [
    ".#.",
    ".#.",
    ".#.",
]
expect("unreachable goal returns None", lambda: get("astar_path")(_BLOCKED, (0, 0), (0, 2)), None)
expect("start == goal returns zero-cost single-cell path", lambda: get("astar_path")(["..."], (0, 1), (0, 1))["cost"], 0)
expect("wall start returns None", lambda: get("astar_path")(["#.."], (0, 0), (0, 2)), None)
```

## Solution

```python
import heapq


def astar_path(grid, start, goal):
    if not grid or not grid[0]:
        return None
    rows, cols = len(grid), len(grid[0])
    sr, sc = start
    gr, gc = goal
    if not (0 <= sr < rows and 0 <= sc < cols and 0 <= gr < rows and 0 <= gc < cols):
        return None
    if grid[sr][sc] == "#" or grid[gr][gc] == "#":
        return None

    def h(cell):
        return abs(cell[0] - gr) + abs(cell[1] - gc)

    pq = [(h(start), 0, start)]
    best_g = {start: 0}
    came_from = {}
    expanded = 0

    while pq:
        _, g, node = heapq.heappop(pq)
        if g > best_g.get(node, float("inf")):
            continue
        expanded += 1
        if node == goal:
            path = [node]
            while node in came_from:
                node = came_from[node]
                path.append(node)
            path.reverse()
            return {"cost": g, "path": path, "expanded": expanded}
        r, c = node
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                ch = grid[nr][nc]
                if ch == "#":
                    continue
                step_cost = 3 if ch == "~" else 1
                ng = g + step_cost
                nxt = (nr, nc)
                if ng < best_g.get(nxt, float("inf")):
                    best_g[nxt] = ng
                    came_from[nxt] = node
                    heapq.heappush(pq, (ng + h(nxt), ng, nxt))
    return None
```

## Restored

The navigation core now computes cost-optimal paths across snowdrifts and walls using admissible A\* search.
