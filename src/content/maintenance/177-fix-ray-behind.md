---
id: maintenance-fix-ray-behind
title: Fix a ray-segment check that accepts hits behind the origin
system: Ray deck
symbol: instrument
scene: tests
skills: spatial-geometry
reviewSkill: spatial-geometry
prerequisite: line-of-sight
---

## Briefing

A sensor raycaster is reporting phantom wall hits directly **behind** the drone because it forgot to enforce $t \ge 0$ along the ray direction.

## Objective

Fix `ray_hits_segment(origin, direction, a, b)` so it returns `True` only when the ray hits segment `(a, b)` at `t >= 0` and `0 <= u <= 1` (and `False` for parallel rays or hits behind the origin).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `t >= -1e-12` alongside `-1e-12 <= u <= 1.0 + 1e-12` instead of ignoring the sign of `t`!

## Starter

```python
def ray_hits_segment(origin, direction, a, b):
    ox, oy = origin
    rx, ry = direction
    ax, ay = a
    bx, by = b
    sx, sy = bx - ax, by - ay
    denom = rx * sy - ry * sx
    if abs(denom) < 1e-12:
        return False
    qpx, qpy = ax - ox, ay - oy
    t = (qpx * sy - qpy * sx) / denom
    u = (qpx * ry - qpy * rx) / denom
    return -1e-12 <= u <= 1.0 + 1e-12
```

## Checks

```python
expect("wall ahead of ray returns True", lambda: get("ray_hits_segment")((0, 0), (1, 0), (4, -2), (4, 2)), True)
expect("wall behind ray origin returns False", lambda: get("ray_hits_segment")((0, 0), (1, 0), (-4, -2), (-4, 2)), False)
```

## Hidden checks

```python
expect("segment starting right at origin (t=0) returns True", lambda: get("ray_hits_segment")((0, 0), (1, 0), (0, -1), (0, 1)), True)
expect("parallel segment returns False", lambda: get("ray_hits_segment")((0, 0), (1, 0), (0, 3), (5, 3)), False)
```

## Solution

```python
def ray_hits_segment(origin, direction, a, b):
    ox, oy = origin
    rx, ry = direction
    ax, ay = a
    bx, by = b
    sx, sy = bx - ax, by - ay
    denom = rx * sy - ry * sx
    if abs(denom) < 1e-12:
        return False
    qpx, qpy = ax - ox, ay - oy
    t = (qpx * sy - qpy * sx) / denom
    u = (qpx * ry - qpy * rx) / denom
    return t >= -1e-12 and -1e-12 <= u <= 1.0 + 1e-12
```

## Restored

The raycaster no longer fires backward phantom hits behind the sensor origin.
