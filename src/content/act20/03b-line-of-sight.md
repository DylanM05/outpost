---
id: line-of-sight
title: Check grid line-of-sight without diagonal corner leaks
system: Ray deck
symbol: instrument
scene: tests
skills: spatial-geometry
---

## Briefing

On a tile map, two walls meeting diagonally at a corner (`#.` over `.#`) form a solid barrier — a naive Bresenham trace can squeeze diagonally right between them! Radar visibility checks must inspect both the traced cells and any diagonal wall pinches.

## Concept

Given a rectangular `grid` (list of equal-length strings where `'#'` is a wall and `'.'` is open) and two cells `start = (r0, c0)` and `end = (r1, c1)`:
1. If `start` or `end` is out of bounds, or either cell is `'#'`, return `False`.
2. Trace integer grid cells from `(r0, c0)` to `(r1, c1)` using Bresenham's algorithm.
3. For every stepped cell `(r, c)`:
   - If `grid[r][c] == '#'`, sight is blocked (`False`).
   - If the step moved **diagonally** from `(pr, pc)` to `(r, c)` (both `r != pr` and `c != pc`), check the two shared corner neighbors `(pr, c)` and `(r, pc)`: if **both** are `'#'`, the beam is pinched off by touching corners — return `False`!
4. If the beam reaches `end` unobstructed, return `True`.

## Objective

Write `has_line_of_sight(grid, start, end)` returning `True` if there is an unobstructed line of sight between `start = (r0, c0)` and `end = (r1, c1)` on `grid`, else `False`.

## Hints

1. Check bounds `0 <= r < len(grid)` and `0 <= c < len(grid[0])` first (and handle empty `grid` safely by returning `False`).
2. Keep track of the previous cell `(pr, pc)` during the Bresenham loop; whenever `r != pr and c != pc`, check `grid[pr][c] == '#' and grid[r][pc] == '#'`.

## Starter: guided

```python
def has_line_of_sight(grid, start, end):
    if not grid or not grid[0]:
        return False
    rows, cols = len(grid), len(grid[0])
    r0, c0 = start
    r1, c1 = end
    if not (0 <= r0 < rows and 0 <= c0 < cols and 0 <= r1 < rows and 0 <= c1 < cols):
        return False
    if grid[r0][c0] == "#" or grid[r1][c1] == "#":
        return False
    # Trace Bresenham cells from (r0, c0) to (r1, c1), blocking on walls or diagonal pinches.
    pass
```

## Starter: standard

```python
def has_line_of_sight(grid, start, end):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_MAP = [
    ".....",
    "..#..",
    ".#...",
    ".....",
]
expect("clear horizontal sightline", lambda: get("has_line_of_sight")(_MAP, (0, 0), (0, 4)), True)
expect("wall blocks sightline", lambda: get("has_line_of_sight")(_MAP, (1, 0), (1, 4)), False)
expect("diagonal wall pinch blocks beam", lambda: get("has_line_of_sight")(_MAP, (1, 1), (2, 2)), False)
expect("diagonal around single wall is clear", lambda: get("has_line_of_sight")(_MAP, (0, 1), (1, 2)), False)
```

## Hidden checks

```python
_OPEN_DIAG = [
    ".#.",
    "...",
    "...",
]
expect("diagonal next to only one wall stays clear", lambda: get("has_line_of_sight")(_OPEN_DIAG, (0, 0), (1, 1)), True)
expect("same open cell has line of sight", lambda: get("has_line_of_sight")(_OPEN_DIAG, (1, 1), (1, 1)), True)
expect("out-of-bounds endpoint returns False", lambda: get("has_line_of_sight")(_OPEN_DIAG, (0, 0), (5, 5)), False)
expect("starting on wall returns False", lambda: get("has_line_of_sight")(_OPEN_DIAG, (0, 1), (2, 1)), False)
```

## Solution

```python
def has_line_of_sight(grid, start, end):
    if not grid or not grid[0]:
        return False
    rows, cols = len(grid), len(grid[0])
    r0, c0 = start
    r1, c1 = end
    if not (0 <= r0 < rows and 0 <= c0 < cols and 0 <= r1 < rows and 0 <= c1 < cols):
        return False
    if grid[r0][c0] == "#" or grid[r1][c1] == "#":
        return False

    dr = abs(r1 - r0)
    dc = -abs(c1 - c0)
    sr = 1 if r0 < r1 else -1
    sc = 1 if c0 < c1 else -1
    err = dr + dc
    r, c = r0, c0

    while True:
        if r == r1 and c == c1:
            return True
        pr, pc = r, c
        e2 = 2 * err
        if e2 >= dc:
            err += dc
            r += sr
        if e2 <= dr:
            err += dr
            c += sc
        if grid[r][c] == "#":
            return False
        if r != pr and c != pc:
            if grid[pr][c] == "#" and grid[r][pc] == "#":
                return False
```

## Restored

The ray deck now checks tile visibility cleanly without letting beams leak through diagonal wall corners.
