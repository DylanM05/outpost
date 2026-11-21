---
id: fuel-aware-planner
title: Fuel-aware planner
system: Waystation network
symbol: controller
scene: grid
skills: shortest-paths, heaps, graphs
---

## Briefing

Time to put Dijkstra's algorithm on the real ridge map. The deep survey's terrain maps label every open square with a digit `1` through `9` showing how much fuel a drone burns to fly into that square (headwinds, updrafts, and climbs). `#` is a crevasse, `S` is the launch pad, and `G` is the destination (cost `1` to land on). Build the guided fuel-aware route planner and watch it skirt the high-cost wind walls on the map.

## Objective

Write `fuel_route(grid)`. `grid` is a list of strings containing `S`, `G`, `#`, and digits `'1'`–`'9'`. Moving up, down, left, or right into a digit square costs `int(cell)` fuel; moving onto `G` costs `1` fuel; moving onto `S` costs `0` (and you start at `S` with cost `0`). Never enter `#`.

Return the lowest-fuel path as a list of `(row, col)` coordinates starting at `S` and ending at `G`. If `G` cannot be reached, return `[]`.

```python
fuel_route([
    "S99G",
    "1111",
])  # [(0, 0), (1, 0), (1, 1), (1, 2), (1, 3), (0, 3)]  -> total fuel 5, vs 19 straight across
```

The hidden test uses a 30 by 30 terrain grid with a budget of 6 cell reads per square.

## Concept

A terrain grid is just a weighted graph where each cell `(r, c)` has up to four neighbors!

1. Scan `grid` once to locate `start` (`S`) and `goal` (`G`).
2. Run Dijkstra's algorithm with `heap = [(0, start)]`, `best = {start: 0}`, and `came_from = {start: None}`.
3. For each in-bounds neighbor `(nr, nc)`:
   - Read `cell = grid[nr][nc]` **once** into a variable (don't index `grid[nr][nc]` twice!).
   - If `cell == "#"`, skip it.
   - Compute `step_cost = 1 if cell == "G" else (0 if cell == "S" else int(cell))`.
   - Update `best`, `came_from`, and push `(cost + step_cost, (nr, nc))` when cheaper.

When you run your code, watch the ridge map panel: instead of expanding in circular rings like BFS, Dijkstra's search flows around the expensive `9` ridges like water flowing downhill.

## Hints

1. Scan `grid` once at the start to find `start` (`S`) and `goal` (`G`).
2. Save `cell = grid[nr][nc]` in a local variable so you only spend one cell read per neighbor check.
3. Push `(new_cost, (nr, nc))` onto `heapq`. When `(r, c) == goal`, walk `came_from` backwards and reverse the list.

## Starter: guided

```python
import heapq

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def fuel_route(grid):
    start = None
    goal = None
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            ch = grid[r][c]
            if ch == "S":
                start = (r, c)
            elif ch == "G":
                goal = (r, c)

    best = {start: 0}
    came_from = {start: None}
    heap = [(0, start)]

    while heap:
        cost, (r, c) = heapq.heappop(heap)
        if cost > best[(r, c)]:
            continue
        if (r, c) == goal:
            # Rebuild and return the path from start to goal.
            return []
        for dr, dc in STEPS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                cell = grid[nr][nc]
                if cell == "#":
                    continue
                # Compute step_cost and relax (nr, nc) in best / came_from / heap.
    return []
```

## Starter: standard

```python
import heapq

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def fuel_route(grid):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
def _ref_cost(rows):
    import heapq as _hq
    s = g = None
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch == "S":
                s = (r, c)
            elif ch == "G":
                g = (r, c)
    best = {s: 0}
    h = [(0, s)]
    while h:
        cost, (r, c) = _hq.heappop(h)
        if cost > best[(r, c)]:
            continue
        if (r, c) == g:
            return cost
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(rows) and 0 <= nc < len(rows[nr]) and rows[nr][nc] != "#":
                ch = rows[nr][nc]
                w = 1 if ch == "G" else (0 if ch == "S" else int(ch))
                ncost = cost + w
                if ncost < best.get((nr, nc), 10**9):
                    best[(nr, nc)] = ncost
                    _hq.heappush(h, (ncost, (nr, nc)))
    return -1

def _valid_fuel_path(rows, expected_cost):
    def _check(path):
        if expected_cost == -1:
            return path == []
        if not isinstance(path, list) or len(path) < 1:
            return False
        s = g = None
        for r, row in enumerate(rows):
            for c, ch in enumerate(row):
                if ch == "S":
                    s = (r, c)
                elif ch == "G":
                    g = (r, c)
        if tuple(path[0]) != s or tuple(path[-1]) != g:
            return False
        total = 0
        for (r1, c1), (r2, c2) in zip(path, path[1:]):
            if abs(r1 - r2) + abs(c1 - c2) != 1:
                return False
            if not (0 <= r2 < len(rows) and 0 <= c2 < len(rows[r2])):
                return False
            ch = rows[r2][c2]
            if ch == "#":
                return False
            total += 1 if ch == "G" else (0 if ch == "S" else int(ch))
        return total == expected_cost
    return _check

tiny_rows = ["S99G", "1111"]
tiny = tracked_grid(tiny_rows)
expect_grid(
    "fuel_route skirts the 9s",
    lambda: get("fuel_route")(tiny),
    "a lowest-fuel route (cost 5)",
    tiny,
    accept=_valid_fuel_path(tiny_rows, 5),
)

ridge_rows = [
    "S1999111",
    "119#9191",
    "199#9191",
    "11111191",
    "9999911G",
]
ridge_grid = tracked_grid(ridge_rows)
ridge_cost = _ref_cost(ridge_rows)
expect_grid(
    "fuel_route(5 by 8 wind map)",
    lambda: get("fuel_route")(ridge_grid),
    f"a lowest-fuel route (cost {ridge_cost})",
    ridge_grid,
    budget=6 * 40,
    accept=_valid_fuel_path(ridge_rows, ridge_cost),
)
```

## Hidden checks

```python
blocked_rows = ["S1#2", "11#G"]
blocked = tracked_grid(blocked_rows)
expect_grid("unreachable goal returns []", lambda: get("fuel_route")(blocked), [], blocked)

big_rows = []
for r in range(30):
    row = []
    for c in range(30):
        if r == 0 and c == 0:
            row.append("S")
        elif r == 29 and c == 29:
            row.append("G")
        elif (r % 5 == 2 and c % 7 != 3):
            row.append("#")
        else:
            row.append(str(1 + ((r * 7 + c * 11) % 9)))
    big_rows.append("".join(row))
big_cost = _ref_cost(big_rows)
big = tracked_grid(big_rows)
expect_grid(
    "fuel_route(30 by 30 terrain map)",
    lambda: get("fuel_route")(big),
    f"a lowest-fuel route (cost {big_cost})",
    big,
    budget=6 * 900,
    hint="Use Dijkstra with heapq and read each neighbor cell once.",
    accept=_valid_fuel_path(big_rows, big_cost),
)
```

## Solution

```python
import heapq

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def fuel_route(grid):
    start = None
    goal = None
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            ch = grid[r][c]
            if ch == "S":
                start = (r, c)
            elif ch == "G":
                goal = (r, c)

    best = {start: 0}
    came_from = {start: None}
    heap = [(0, start)]

    while heap:
        cost, (r, c) = heapq.heappop(heap)
        if cost > best[(r, c)]:
            continue
        if (r, c) == goal:
            path = []
            cur = goal
            while cur is not None:
                path.append(cur)
                cur = came_from[cur]
            path.reverse()
            return path
        for dr, dc in STEPS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                cell = grid[nr][nc]
                if cell == "#":
                    continue
                step_cost = 1 if cell == "G" else (0 if cell == "S" else int(cell))
                new_cost = cost + step_cost
                if (nr, nc) not in best or new_cost < best[(nr, nc)]:
                    best[(nr, nc)] = new_cost
                    came_from[(nr, nc)] = (r, c)
                    heapq.heappush(heap, (new_cost, (nr, nc)))
    return []
```

## Restored

The fuel-aware route planner is online. Every drone now threads the calm valleys instead of burning its battery fighting headwinds across the ridges.
