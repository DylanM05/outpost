---
id: aabb-circle-hit
title: Detect AABB and circle-vs-box collisions
system: Collision bay
symbol: equipment
scene: tests
skills: spatial-geometry
---

## Briefing

Collision engines start with fast primitive intersection tests: axis-aligned bounding boxes (AABBs) against each other, and circular drone hulls against rectangular walls and pads.

## Concept

An AABB is represented as `(x, y, w, h)` covering `[x, x + w]` horizontally and `[y, y + h]` vertically (with `w >= 0`, `h >= 0`):
- **AABB vs. AABB (`aabb_overlap(a, b)`):** Two boxes overlap (including touching edges) iff their X intervals overlap **and** their Y intervals overlap:
  `ax <= bx + bw and bx <= ax + aw and ay <= by + bh and by <= ay + ah`.
- **Circle vs. AABB (`circle_aabb_hit(cx, cy, r, box)`):**
  - Clamp the circle center `(cx, cy)` to the box's intervals:
    `qx = max(x, min(cx, x + w))`, `qy = max(y, min(cy, y + h))`.
  - `(qx, qy)` is the closest point on/in the box to the circle center!
  - The circle hits the box iff `(cx - qx)**2 + (cy - qy)**2 <= r**2` (avoiding square roots and handling corners cleanly!).

## Objective

Implement:
1. `aabb_overlap(a, b)` returning `True` if boxes `a = (x, y, w, h)` and `b = (x, y, w, h)` overlap or touch edges, else `False`.
2. `circle_aabb_hit(cx, cy, r, box)` returning `True` if the circle centered at `(cx, cy)` with radius `r` intersects or touches `box = (x, y, w, h)`, else `False` (raise `ValueError` if `r < 0`).

## Hints

1. For `aabb_overlap`, unpack `ax, ay, aw, ah = a` and `bx, by, bw, bh = b`, and check both axes' interval overlap.
2. For `circle_aabb_hit`, clamp `cx` to `[x, x + w]` and `cy` to `[y, y + h]`, then compare `dx*dx + dy*dy <= r*r`.

## Starter: guided

```python
def aabb_overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    pass


def circle_aabb_hit(cx, cy, r, box):
    if r < 0:
        raise ValueError("radius must be non-negative")
    x, y, w, h = box
    qx = max(x, min(cx, x + w))
    qy = max(y, min(cy, y + h))
    pass
```

## Starter: standard

```python
def aabb_overlap(a, b):
    pass


def circle_aabb_hit(cx, cy, r, box):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("overlapping AABBs", lambda: get("aabb_overlap")((0, 0, 10, 10), (5, 5, 10, 10)), True)
expect("separated AABBs", lambda: get("aabb_overlap")((0, 0, 4, 4), (5, 0, 4, 4)), False)
expect("circle misses corner outside radius", lambda: get("circle_aabb_hit")(11, 11, 1.0, (0, 0, 10, 10)), False)
expect("circle hits corner inside radius", lambda: get("circle_aabb_hit")(11, 11, 1.5, (0, 0, 10, 10)), True)
```

## Hidden checks

```python
expect("touching AABB edges count as overlap", lambda: get("aabb_overlap")((0, 0, 5, 5), (5, 5, 3, 3)), True)
expect("circle completely inside box hits", lambda: get("circle_aabb_hit")(5, 5, 0.5, (0, 0, 10, 10)), True)
expect("circle touching box edge hits", lambda: get("circle_aabb_hit")(12, 5, 2.0, (0, 0, 10, 10)), True)
def _neg_r():
    try:
        get("circle_aabb_hit")(0, 0, -1, (0, 0, 5, 5))
        return False
    except ValueError:
        return True
expect("negative radius raises ValueError", _neg_r, True)
```

## Solution

```python
def aabb_overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax <= bx + bw and bx <= ax + aw and ay <= by + bh and by <= ay + ah


def circle_aabb_hit(cx, cy, r, box):
    if r < 0:
        raise ValueError("radius must be non-negative")
    x, y, w, h = box
    qx = max(x, min(cx, x + w))
    qy = max(y, min(cy, y + h))
    dx = cx - qx
    dy = cy - qy
    return dx * dx + dy * dy <= r * r
```

## Restored

The collision bay now separates clean corner misses from true box and hull impacts.
