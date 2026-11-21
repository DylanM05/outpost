---
id: maintenance-nearest-beacon
title: Nearest beacon
system: Drone routes
symbol: equipment
scene: grid
skills: graphs
reviewSkill: graphs
prerequisite: trace-the-route
---

## Briefing

A drone low on battery needs the distance to the **closest** emergency beacon `B` from its launch square `S`, flying around crevasses `#`.

## Objective

Write `nearest_beacon(grid)`. `grid` is a list of strings with one `S`, zero or more `B` beacons, open `.` squares, and `#` crevasses. Return the fewest up/down/left/right moves from `S` to any reachable `B`, or `-1` if no beacon can be reached.

```python
nearest_beacon([
    "S.#B",
    "..#.",
    ".B..",
])  # 3
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Scan `grid` to find `S`, then run breadth-first search with `collections.deque`.
2. Return `dist[(r, c)]` the moment you pop a square whose character is `"B"`.

## Starter

```python
```

## Checks

```python
g = tracked_grid(["S.#B", "..#.", ".B.."])
expect_grid("nearest_beacon finds closer reachable B", lambda: get("nearest_beacon")(g), 3, g)
```

## Hidden checks

```python
g_cut = tracked_grid(["S#B", "###", "B.."])
expect_grid("no reachable beacon returns -1", lambda: get("nearest_beacon")(g_cut), -1, g_cut)
g_adj = tracked_grid(["SB"])
expect_grid("adjacent beacon is 1 move", lambda: get("nearest_beacon")(g_adj), 1, g_adj)
```

## Solution

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def nearest_beacon(grid):
    start = None
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if grid[r][c] == "S":
                start = (r, c)
    dist = {start: 0}
    q = deque([start])
    while q:
        r, c = q.popleft()
        for dr, dc in STEPS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]) and (nr, nc) not in dist:
                ch = grid[nr][nc]
                if ch == "#":
                    continue
                if ch == "B":
                    return dist[(r, c)] + 1
                dist[(nr, nc)] = dist[(r, c)] + 1
                q.append((nr, nc))
    return -1
```

## Restored

Low-battery drones now lock onto the closest reachable beacon in one BFS pass.
