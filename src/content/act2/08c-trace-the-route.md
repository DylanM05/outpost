---
id: trace-the-route
title: Trace the route
system: Drone routes
symbol: equipment
scene: grid
skills: graphs, dictionaries
---

## Briefing

Knowing how long the route is isn't enough: the drone needs the route itself, square by square. Breadth-first search already finds it on the way. It just doesn't remember how it got anywhere.

## Objective

Write `route(grid, start, goal)`. Return a shortest route as a list of `(row, column)` squares, from `start` to `goal`, including both. Each step moves up, down, left, or right, never onto a `#`. Any shortest route is accepted. If the goal can't be reached, return an empty list.

```python
route(["S.#", "..#", "#.G"], (0, 0), (2, 2))
# [(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)], or another route of 4 moves
```

## Concept

Every square breadth-first search finds, it finds **from** some other square, one step closer to the start. Record that in a dictionary, often called `came_from`, at the same moment you'd record a distance:

```python
came_from[(nr, nc)] = (r, c)
```

When the search reaches the goal, follow `came_from` backwards: from the goal to the square it was found from, then to the square **that** was found from, and so on until you reach the start. That's the route, back to front. `path.reverse()` turns a list around in place.

The start has no square it came from, so either stop the walk when you reach it, or record `came_from[start] = None` and stop at `None`.

`came_from` also does the job the distance dictionary did: a square is in it exactly when it's been found.

## Hints

1. Use `came_from = {start: None}` instead of `distance`, and set `came_from[(nr, nc)] = (r, c)` when you find a new square.
2. When you take the goal off the queue, build the route: start a list at the goal, and keep appending `came_from[...]` of the last square until you reach `None`.
3. Reverse the list, and return it. Return `[]` if the queue runs out first.

## Starter: guided

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def route(grid, start, goal):
    came_from = {start: None}
    queue = deque([start])
    while queue:
        square = queue.popleft()
        if square == goal:
            path = []
            # Walk back from the goal: append square, then move to
            # came_from[square], until square is None. Then reverse path.
            return path
        r, c = square
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] != "#" and (nr, nc) not in came_from:
                    came_from[(nr, nc)] = square
                    queue.append((nr, nc))
    return []


print(route(["S.#", "..#", "#.G"], (0, 0), (2, 2)))
```

## Starter: standard

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def route(grid, start, goal):
    # Breadth-first search that measures distances. Make it remember where
    # each square was found from, and return the route instead.
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
    return []
```

## Starter: challenge

```python
```

## Checks

```python
def is_route(rows, start, goal, moves):
    def accept(path):
        if not isinstance(path, list) or len(path) != moves + 1:
            return False
        if not path or path[0] != start or path[-1] != goal:
            return False
        for square in path:
            if not (isinstance(square, tuple) and len(square) == 2):
                return False
            r, c = square
            if not (0 <= r < len(rows) and 0 <= c < len(rows[r])) or rows[r][c] == "#":
                return False
        return all(abs(a[0] - b[0]) + abs(a[1] - b[1]) == 1 for a, b in zip(path, path[1:]))
    return accept

first_rows = ["S.#", "..#", "#.G"]
first = tracked_grid(first_rows)
expect_grid(
    "route(3 by 3 map)",
    lambda: get("route")(first, (0, 0), (2, 2)),
    "a route of 4 moves from (0, 0) to (2, 2)",
    first,
    accept=is_route(first_rows, (0, 0), (2, 2), 4),
)
yard_rows = [
    "S...#...",
    ".##.#.#.",
    ".#..#.#.",
    ".#.##.#.",
    "...#..#G",
    ".#...##.",
]
yard = tracked_grid(yard_rows)
expect_grid(
    "route(6 by 8 map)",
    lambda: get("route")(yard, (0, 0), (4, 7)),
    "a route of 21 moves from (0, 0) to (4, 7)",
    yard,
    accept=is_route(yard_rows, (0, 0), (4, 7), 21),
)
```

## Hidden checks

```python
alone = tracked_grid(["S"])
expect_grid("route(start is the goal)", lambda: get("route")(alone, (0, 0), (0, 0)), [(0, 0)], alone)
walled = tracked_grid(["S.#.", "..#G"])
expect_grid("route(goal walled off)", lambda: get("route")(walled, (0, 0), (1, 3)), [], walled)
open_rows = ["......", "......", "......"]
plain = tracked_grid(open_rows)
expect_grid(
    "route(open 3 by 6 map)",
    lambda: get("route")(plain, (2, 5), (0, 0)),
    "a route of 7 moves from (2, 5) to (0, 0)",
    plain,
    accept=is_route(open_rows, (2, 5), (0, 0), 7),
)
```

## Solution

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def route(grid, start, goal):
    came_from = {start: None}
    queue = deque([start])
    while queue:
        square = queue.popleft()
        if square == goal:
            path = []
            while square is not None:
                path.append(square)
                square = came_from[square]
            path.reverse()
            return path
        r, c = square
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] != "#" and (nr, nc) not in came_from:
                    came_from[(nr, nc)] = square
                    queue.append((nr, nc))
    return []
```

## Restored

The drone flies the route square by square and lands on the far marker without touching a crevasse.
