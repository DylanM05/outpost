---
id: route-length
title: Route length
system: Drone routes
symbol: equipment
scene: grid
skills: graphs
---

## Briefing

Before each flight, the drones need to know how many squares the trip will take, so they can carry enough charge. The current planner gets an answer every time, and some of its answers are wildly long. On the ridge, an overcautious charge estimate grounds a drone for no reason.

## Objective

`route_length(grid, start, goal)` returns the fewest moves from `start` to `goal`, moving up, down, left, or right and never onto a `#`. Every other square is open, including the ones marked `S` and `G`. `start` and `goal` are `(row, column)` tuples. If the goal can't be reached, return `-1`.

```python
route_length([
    "S...",
    ".##.",
    "...G",
], (0, 0), (2, 3))  # 5
```

The hidden tests use a 40 by 40 map and allow 5 cell reads per square.

## Concept

The current planner is a flood fill that records distances: it takes squares off the **end** of its list. A flood fill reaches every square, but not necessarily by the shortest way, because it chases one direction as far as it goes before trying another. So the distance it records the first time it reaches a square can be far too long.

Breadth-first search fixes that with a single change: take squares from the **front**, with a `deque` and `popleft()`. Then squares are explored in rings of distance, and the first time a square is reached is along a shortest route.

Once the goal has a distance, you can stop: nothing found later will be closer. If the queue runs out first, the goal can't be reached.

Breadth-first search reads each square's neighbors once, so its work is linear in the size of the map, however twisty the route.

## Hints

1. `from collections import deque`, then start with `distance = {start: 0}` and `queue = deque([start])`.
2. Use `queue.popleft()` instead of `pop()`. When the square you take off is the goal, return its distance.
3. If the loop ends without reaching the goal, return `-1`.

## Starter: guided

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def route_length(grid, start, goal):
    distance = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.pop()  # pop() takes the newest square. Take the oldest.
        if (r, c) == goal:
            return distance[(r, c)]
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] != "#" and (nr, nc) not in distance:
                    distance[(nr, nc)] = distance[(r, c)] + 1
                    queue.append((nr, nc))
    return -1


print(route_length(["S...", ".##.", "...G"], (0, 0), (2, 3)))
```

## Starter: standard

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def route_length(grid, start, goal):
    # A flood fill that records distances. It always finds the goal, but
    # not always by the shortest route.
    distance = {start: 0}
    to_explore = [start]
    while to_explore:
        r, c = to_explore.pop()
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] != "#" and (nr, nc) not in distance:
                    distance[(nr, nc)] = distance[(r, c)] + 1
                    to_explore.append((nr, nc))
    if goal in distance:
        return distance[goal]
    return -1
```

## Starter: challenge

```python
```

## Checks

```python
first = tracked_grid(["S...", ".##.", "...G"])
expect_grid("route_length(3 by 4 map)", lambda: get("route_length")(first, (0, 0), (2, 3)), 5, first)
field = tracked_grid([
    "S.......",
    "........",
    "...##...",
    "...#....",
    "......G.",
])
expect_grid(
    "route_length(5 by 8 map)",
    lambda: get("route_length")(field, (0, 0), (4, 6)),
    10,
    field,
    budget=5 * 40,
    hint="Take squares from the front of a queue, so they're explored nearest first.",
)
```

## Hidden checks

```python
alone = tracked_grid(["S"])
expect_grid("route_length(start is the goal)", lambda: get("route_length")(alone, (0, 0), (0, 0)), 0, alone)
walled = tracked_grid(["S.#.", "..#G"])
expect_grid("route_length(goal walled off)", lambda: get("route_length")(walled, (0, 0), (1, 3)), -1, walled)
rows = []
for r in range(40):
    if r % 2 == 0:
        rows.append("." * 40)
    elif r % 4 == 1:
        rows.append("." * 38 + "##")
    else:
        rows.append("##" + "." * 38)
maze = tracked_grid(rows)
def shortest(rows, start, goal):
    from collections import deque as line
    seen = {start: 0}
    todo = line([start])
    while todo:
        a, b = todo.popleft()
        for da, db in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            na, nb = a + da, b + db
            if 0 <= na < len(rows) and 0 <= nb < len(rows[na]) and rows[na][nb] != "#" and (na, nb) not in seen:
                seen[(na, nb)] = seen[(a, b)] + 1
                todo.append((na, nb))
    return seen.get(goal, -1)
expect_grid(
    "route_length(40 by 40 map)",
    lambda: get("route_length")(maze, (0, 0), (39, 39)),
    shortest(rows, (0, 0), (39, 39)),
    maze,
    budget=5 * 1600,
    hint="Take squares from the front of a queue, so they're explored nearest first.",
)
```

## Solution

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def route_length(grid, start, goal):
    distance = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if (r, c) == goal:
            return distance[(r, c)]
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] != "#" and (nr, nc) not in distance:
                    distance[(nr, nc)] = distance[(r, c)] + 1
                    queue.append((nr, nc))
    return -1
```

## Restored

Every charge estimate is the true shortest trip. The drones carry what they need, and no more.
