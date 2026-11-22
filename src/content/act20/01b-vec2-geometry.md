---
id: vec2-geometry
title: Measure point-to-segment distance with 2D vector projection
system: Optics bench
symbol: instrument
scene: tests
skills: spatial-geometry
---

## Briefing

Before a radar sweep or drone autopilot can tell how close a craft came to a ridge boundary, it needs exact 2D vector projection: clamping the projection onto a finite line segment instead of an infinite line.

## Concept

Given point $P = (p_x, p_y)$ and segment from $A = (a_x, a_y)$ to $B = (b_x, b_y)$:
- Let $\vec{AB} = (b_x - a_x, b_y - a_y)$ and $\vec{AP} = (p_x - a_x, p_y - a_y)$.
- If $|\vec{AB}|^2 = 0$ (degenerate zero-length segment), the closest point is $A$ itself.
- Otherwise, the scalar projection parameter along $\vec{AB}$ is:
  $$t = \frac{\vec{AP} \cdot \vec{AB}}{|\vec{AB}|^2}$$
- Clamp $t$ to $[0, 1]$ so the closest point $Q = A + t\,\vec{AB}$ stays **on the segment**.
- Return the Euclidean distance $\sqrt{(p_x - q_x)^2 + (p_y - q_y)^2}$.

## Objective

Write `point_to_segment_distance(px, py, ax, ay, bx, by)` returning the shortest Euclidean distance (as a `float`) from `(px, py)` to the closed line segment from `(ax, ay)` to `(bx, by)`.

## Hints

1. Compute `abx = bx - ax`, `aby = by - ay`, and `len_sq = abx * abx + aby * aby`.
2. If `len_sq == 0`, return `math.hypot(px - ax, py - ay)`.
3. Otherwise compute `t = max(0.0, min(1.0, ((px - ax) * abx + (py - ay) * aby) / len_sq))`, then `qx = ax + t * abx`, `qy = ay + t * aby`, and return `math.hypot(px - qx, py - qy)`.

## Starter: guided

```python
import math


def point_to_segment_distance(px, py, ax, ay, bx, by):
    abx = bx - ax
    aby = by - ay
    len_sq = abx * abx + aby * aby
    if len_sq == 0:
        return math.hypot(px - ax, py - ay)
    # Project AP onto AB, clamp t to [0.0, 1.0], and return distance to closest point.
    pass
```

## Starter: standard

```python
import math


def point_to_segment_distance(px, py, ax, ay, bx, by):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("perpendicular projection onto horizontal segment", lambda: round(get("point_to_segment_distance")(5, 3, 0, 0, 10, 0), 6), 3.0)
expect("clamps past endpoint B", lambda: round(get("point_to_segment_distance")(13, 4, 0, 0, 10, 0), 6), 5.0)
expect("point directly on diagonal segment", lambda: round(get("point_to_segment_distance")(2, 2, 0, 0, 4, 4), 6), 0.0)
```

## Hidden checks

```python
expect("clamps before endpoint A", lambda: round(get("point_to_segment_distance")(-3, -4, 0, 0, 10, 0), 6), 5.0)
expect("handles degenerate zero-length segment", lambda: round(get("point_to_segment_distance")(4, 6, 1, 2, 1, 2), 6), 5.0)
expect("distance to diagonal segment", lambda: round(get("point_to_segment_distance")(0, 2, 0, 0, 2, 2), 6), round(2 ** 0.5, 6))
```

## Solution

```python
import math


def point_to_segment_distance(px, py, ax, ay, bx, by):
    abx = bx - ax
    aby = by - ay
    len_sq = abx * abx + aby * aby
    if len_sq == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * abx + (py - ay) * aby) / len_sq
    t = max(0.0, min(1.0, t))
    qx = ax + t * abx
    qy = ay + t * aby
    return math.hypot(px - qx, py - qy)
```

## Restored

The optics bench now measures exact closest-approach distances to every ridge boundary segment.
