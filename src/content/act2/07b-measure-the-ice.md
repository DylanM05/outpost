---
id: measure-the-ice
title: Measure the ice
system: Ridge map
symbol: controller
scene: grid
skills: graphs, hashing
---

## Briefing

Patches of thin ice, marked `~` on the ridge map, are too weak to land on. A drone has reported thin ice under one square, and the planners need to know how big that patch is: every thin-ice square you can reach from it by stepping up, down, left, or right across thin ice.

## Objective

Write `patch_size(grid, r, c)`. Return how many `~` squares are connected to square `(r, c)`, counting `(r, c)` itself. If `(r, c)` isn't `~`, return 0.

```python
grid = [
    "~~.",
    ".~.",
    "..~",
]
patch_size(grid, 0, 0)  # 3: the corner square isn't connected
```

The biggest test is a 50 by 50 map, with a budget of 5 cell reads per square.

## Concept

This is a **flood fill**: spread out from one square to everything connected to it, like water filling a basin. It needs two things:

- A **set** of squares already found, so nothing is counted twice and the search never goes round in circles. Checking it is constant time, thanks to hashing.
- A **list of squares still to explore.** Take one off the end, look at its four neighbors, and add any new thin-ice neighbor to both the set and the list.

When the list is empty, everything connected has been found, and the answer is the size of the set.

```python
found = {(r, c)}
to_explore = [(r, c)]
while to_explore:
    r, c = to_explore.pop()
    # for each neighbor (nr, nc) on the map, thin ice, and not in found:
    #     add it to found and to_explore
```

Add a square to `found` when you first add it to the list, not when you take it off. Otherwise the same square can be added many times before it's explored.

A recursive flood fill also works on small maps. But a big patch can go thousands of calls deep, past Python's limit of about a thousand, while a list of squares to explore can grow as long as it needs to. `while to_explore:` keeps going as long as the list isn't empty.

The ridge map beside the board lights up each square in the order your code reads it.

## Hints

1. If `grid[r][c]` isn't `"~"`, return 0. Otherwise start with `found = {(r, c)}` and `to_explore = [(r, c)]`.
2. In the loop, pop a square, then try each of the four steps. Check the neighbor is on the map, is `"~"`, and isn't in `found`.
3. Add each new neighbor to `found` and to `to_explore`. After the loop, return `len(found)`.

## Starter: guided

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def patch_size(grid, r, c):
    if grid[r][c] != "~":
        return 0
    found = {(r, c)}
    to_explore = [(r, c)]
    while to_explore:
        r, c = to_explore.pop()
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                # If this neighbor is thin ice and not found yet,
                # add it to found and to to_explore.
                print("neighbor", nr, nc)
    return len(found)


print(patch_size(["~~.", ".~.", "..~"], 0, 0))
```

## Starter: standard

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def patch_size(grid, r, c):
    # This works on small patches. A big patch goes thousands of calls deep,
    # past Python's recursion limit. Rewrite it with a set of squares found
    # and a list of squares to explore.
    return fill(grid, r, c, set())


def fill(grid, r, c, found):
    if not (0 <= r < len(grid) and 0 <= c < len(grid[r])):
        return 0
    if grid[r][c] != "~" or (r, c) in found:
        return 0
    found.add((r, c))
    total = 1
    for dr, dc in STEPS:
        total += fill(grid, r + dr, c + dc, found)
    return total
```

## Starter: challenge

```python
```

## Checks

```python
small = tracked_grid(["~~.", ".~.", "..~"])
expect_grid("patch_size(3 by 3 map, 0, 0)", lambda: get("patch_size")(small, 0, 0), 3, small)
pond = tracked_grid([
    "~~~..~~",
    "~.~..~.",
    "~~~#.~~",
    "...#...",
    "~~#~~~~",
])
expect_grid("patch_size(5 by 7 map, 0, 0)", lambda: get("patch_size")(pond, 0, 0), 8, pond, budget=5 * 35)
rows = []
for r in range(50):
    if r % 4 == 1:
        rows.append("~" * 49 + "#")
    elif r % 4 == 3:
        rows.append("#" + "~" * 49)
    else:
        rows.append("~" * 50)
snake = tracked_grid(rows)
expect_grid(
    "patch_size(50 by 50 map, 0, 0)",
    lambda: get("patch_size")(snake, 0, 0),
    sum(row.count("~") for row in rows),
    snake,
    budget=5 * 2500,
    hint="Use a list of squares to explore instead of recursion.",
)
```

## Hidden checks

```python
expect_grid("patch_size(3 by 3 map, 2, 2)", lambda: get("patch_size")(small, 2, 2), 1, small)
expect_grid("patch_size(3 by 3 map, 0, 2)", lambda: get("patch_size")(small, 0, 2), 0, small)
expect_grid("patch_size(5 by 7 map, 4, 6)", lambda: get("patch_size")(pond, 4, 6), 4, pond)
expect_grid("patch_size(5 by 7 map, 0, 5)", lambda: get("patch_size")(pond, 0, 5), 5, pond)
field_rows = ["~" * 50 for _ in range(50)]
field = tracked_grid(field_rows)
expect_grid(
    "patch_size(50 by 50 sheet, 25, 25)",
    lambda: get("patch_size")(field, 25, 25),
    2500,
    field,
    budget=5 * 2500,
    hint="Use a list of squares to explore instead of recursion.",
)
```

## Solution

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def patch_size(grid, r, c):
    if grid[r][c] != "~":
        return 0
    found = {(r, c)}
    to_explore = [(r, c)]
    while to_explore:
        r, c = to_explore.pop()
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] == "~" and (nr, nc) not in found:
                    found.add((nr, nc))
                    to_explore.append((nr, nc))
    return len(found)
```

## Restored

The patch is fenced off on the map, square by square. Drones land well clear of it.
