---
id: bresenham-line
title: Rasterize grid lines with Bresenham's integer algorithm
system: Collision bay
symbol: equipment
scene: tests
skills: spatial-geometry
---

## Briefing

When plotting a radar beam or surveying cells across a discrete grid, floating-point stepping accumulates drift and can skip cells or overshoot endpoints. **Bresenham's line algorithm** traces exact integer grid coordinates across all eight octants using only integer addition and comparison.

## Concept

To trace from `(x0, y0)` to `(x1, y1)` in any direction:
- `dx = abs(x1 - x0)` and `dy = -abs(y1 - y0)`
- Step signs: `sx = 1 if x0 < x1 else -1`, `sy = 1 if y0 < y1 else -1`
- Error accumulator: `err = dx + dy`
- Loop:
  1. Append `(x, y)`.
  2. If `x == x1 and y == y1`: stop.
  3. Let `e2 = 2 * err`.
  4. If `e2 >= dy`: `err += dy`; `x += sx`.
  5. If `e2 <= dx`: `err += dx`; `y += sy`.

This unified formulation works seamlessly for horizontal, vertical, diagonal, shallow, steep, and reversed lines — and returns `[(x0, y0)]` when start equals end.

## Objective

Write `bresenham_line(x0, y0, x1, y1)` returning a list of `(x, y)` integer tuples tracing the line from `(x0, y0)` to `(x1, y1)` inclusive.

## Hints

1. Initialize `x, y = x0, y0`, `dx = abs(x1 - x0)`, `dy = -abs(y1 - y0)`, `sx = 1 if x0 < x1 else -1`, `sy = 1 if y0 < y1 else -1`, and `err = dx + dy`.
2. Notice both `if e2 >= dy:` and `if e2 <= dx:` are independent `if` statements (not `elif`!) so diagonal steps update both `x` and `y` in the same iteration.

## Starter: guided

```python
def bresenham_line(x0, y0, x1, y1):
    points = []
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        points.append((x, y))
        if x == x1 and y == y1:
            break
        # Compute e2 = 2 * err and advance x and/or y.
        break
    return points
```

## Starter: standard

```python
def bresenham_line(x0, y0, x1, y1):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("shallow positive slope", lambda: get("bresenham_line")(0, 0, 3, 1), [(0, 0), (1, 0), (2, 1), (3, 1)])
expect("45-degree diagonal", lambda: get("bresenham_line")(0, 0, 3, 3), [(0, 0), (1, 1), (2, 2), (3, 3)])
expect("reversed horizontal line", lambda: get("bresenham_line")(3, 2, 0, 2), [(3, 2), (2, 2), (1, 2), (0, 2)])
```

## Hidden checks

```python
expect("vertical line going down", lambda: get("bresenham_line")(2, 4, 2, 1), [(2, 4), (2, 3), (2, 2), (2, 1)])
expect("single point", lambda: get("bresenham_line")(5, 5, 5, 5), [(5, 5)])
expect("steep negative slope", lambda: get("bresenham_line")(1, 3, 0, 0), [(1, 3), (1, 2), (0, 1), (0, 0)])
def _octant_properties():
    pts = get("bresenham_line")(-2, 5, 5, 2)
    ok_ends = pts[0] == (-2, 5) and pts[-1] == (5, 2)
    ok_len = len(pts) == 8
    ok_steps = all(abs(pts[i+1][0] - pts[i][0]) <= 1 and abs(pts[i+1][1] - pts[i][1]) <= 1 for i in range(len(pts) - 1))
    return (ok_ends, ok_len, ok_steps)
expect("satisfies endpoints, Chebyshev length, and unit steps across negative octant", _octant_properties, (True, True, True))
```

## Solution

```python
def bresenham_line(x0, y0, x1, y1):
    points = []
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        points.append((x, y))
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy
    return points
```

## Restored

The collision bay rasterizes clean, drift-free grid lines in every direction using pure integer math.
