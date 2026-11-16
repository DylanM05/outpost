---
id: look-around
kind: predict
title: Look around
system: Ridge map
symbol: controller
scene: console
skills: graphs, reading-code
---

## Briefing

The ridge map is a grid of squares, each one open ice or a crevasse. Every route the drones fly, and every search the planners run, is built from one small question: from this square, where can I go next? Trace the map's answer.

## Objective

Predict exactly what this program prints.

## Concept

A map like this is stored as a list of strings, one per row, as the solar array was. `grid[r][c]` is the square in row `r`, column `c`, and `#` marks a crevasse.

From any square, a drone can move up, down, left, or right. Each move is a change in row and column, so the four moves fit in a list of pairs, and a `for` loop can unpack each pair into two names:

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]   # up, down, left, right
for dr, dc in STEPS:
    print(dr, dc)
```

A neighbor might be off the edge of the map, so check that it's in bounds **before** reading it. Python lets you chain comparisons: `0 <= nr < len(grid)` means `0 <= nr and nr < len(grid)`. Skip the check, and a step off the left edge reads `grid[r][-1]`, the far right of the row, with no error at all.

## Hints

1. Try the four steps in order: up, down, left, right. A neighbor is listed only if it's on the map **and** isn't `#`.
2. From the top-left corner, up and left are off the map.
3. Square `(1, 1)` is a crevasse, so it never appears in any list.

## Program

```python
grid = [
    "..#",
    ".#.",
    "...",
]
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def open_neighbors(grid, r, c):
    found = []
    for dr, dc in STEPS:
        nr = r + dr
        nc = c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
            if grid[nr][nc] != "#":
                found.append((nr, nc))
    return found


print(open_neighbors(grid, 0, 0))
print(open_neighbors(grid, 1, 2))
print(open_neighbors(grid, 2, 1))
```

## Output

```text
[(1, 0), (0, 1)]
[(2, 2)]
[(2, 0), (2, 2)]
```

## Restored

Every square on the map knows its neighbors now. The planners can start asking bigger questions.
