---
id: ripples
kind: predict
title: Ripples
system: Drone routes
symbol: equipment
scene: console
skills: graphs, reading-code
---

## Briefing

The drones need the shortest route between any two squares, and the route planner the last engineer left behind finds one by spreading outward from the start, like ripples on a pond. Trace the order it spreads in, and how far it says each square is.

## Objective

Predict exactly what this program prints.

## Concept

The flood fill took squares off the **end** of its list: the most recently found square went next. That dives deep in one direction first, which is fine for finding everything connected, but it says nothing about distance.

**Breadth-first search** takes squares off the **front** instead, so squares are explored in the order they were found: first the start, then everything 1 step away, then everything 2 steps away, in rings. A list used this way is called a **queue**: first in, first out, like a line at a counter.

Taking from the front of a Python list is slow, because every other item shifts along. `deque`, from Python's `collections` module, is a list built for this. `popleft()` takes from the front in constant time:

```python
from collections import deque

line = deque([1, 2])
line.append(3)
line.popleft()  # 1
```

Because squares come off in rings, the first time the search reaches a square is along a shortest route. So it records a square's distance the moment it's found, as one more than the square it was found from, and never changes it.

## Hints

1. The start is at distance 0. Its open neighbors, found in the order up, down, left, right, are at distance 1, and they join the back of the queue.
2. Squares print as they come off the **front** of the queue, so both distance-1 squares print before any distance-2 square.
3. A square already in `distance` is never added again, even when a later square is next to it.

## Program

```python
from collections import deque

grid = [
    "S.#",
    "..#",
    "#..",
]
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

distance = {(0, 0): 0}
queue = deque([(0, 0)])
while queue:
    r, c = queue.popleft()
    print(f"({r}, {c}) at {distance[(r, c)]}")
    for dr, dc in STEPS:
        nr = r + dr
        nc = c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
            if grid[nr][nc] != "#" and (nr, nc) not in distance:
                distance[(nr, nc)] = distance[(r, c)] + 1
                queue.append((nr, nc))
```

## Output

```text
(0, 0) at 0
(1, 0) at 1
(0, 1) at 1
(1, 1) at 2
(2, 1) at 3
(2, 2) at 4
```

## Restored

Ring by ring, nearest first. The planner's method is clear, and the drones can trust its distances.
