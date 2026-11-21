---
id: maintenance-escape-the-drift
title: Escape the snowdrift
system: Drone routes
symbol: equipment
scene: grid
skills: graphs
reviewSkill: graphs
prerequisite: trace-the-route
---

## Briefing

Find whether a rover at `S` can reach **any** open square on the outer edge of the map (`row == 0`, `row == len(grid) - 1`, `col == 0`, or `col == len(grid[row]) - 1`) without crossing `#` snowdrifts, and return the fewest moves needed.

## Objective

Write `moves_to_edge(grid)`. `S` is somewhere inside `grid` (if `S` is already on the outer edge, return `0`). Return the minimum up/down/left/right moves from `S` to any open edge square, or `-1` if `S` is completely trapped by `#`.

```python
moves_to_edge([
    "#####",
    "#...#",
    "#.S.#",
    "#.#..",
    "#####",
])  # 3  (reaches (3, 4) on the right edge)
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Start BFS from `S` with distance `0`.
2. When popping `(r, c)`, check if `r == 0 or r == rows - 1 or c == 0 or c == cols - 1` — if so, return `dist[(r, c)]`.

## Starter

```python
```

## Checks

```python
g = tracked_grid(["#####", "#...#", "#.S.#", "#.#..", "#####"])
expect_grid("moves_to_edge finds gap in wall", lambda: get("moves_to_edge")(g), 3, g)
```

## Hidden checks

```python
trapped = tracked_grid(["###", "#S#", "###"])
expect_grid("trapped rover returns -1", lambda: get("moves_to_edge")(trapped), -1, trapped)
already = tracked_grid(["S..", "..."])
expect_grid("S on edge returns 0", lambda: get("moves_to_edge")(already), 0, already)
```

## Solution

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def moves_to_edge(grid):
    rows = len(grid)
    cols = len(grid[0])
    start = None
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "S":
                start = (r, c)
    dist = {start: 0}
    q = deque([start])
    while q:
        r, c = q.popleft()
        if r == 0 or r == rows - 1 or c == 0 or c == cols - 1:
            return dist[(r, c)]
        for dr, dc in STEPS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in dist and grid[nr][nc] != "#":
                dist[(nr, nc)] = dist[(r, c)] + 1
                q.append((nr, nc))
    return -1
```

## Restored

The rover spots the quickest exit out of any snowdrift ring.
