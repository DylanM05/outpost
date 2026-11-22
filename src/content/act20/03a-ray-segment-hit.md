---
id: ray-segment-hit
title: Intersect 2D rays with wall segments
system: Ray deck
symbol: instrument
scene: tests
skills: spatial-geometry
---

## Briefing

Lidar and visibility engines cast 2D rays from a sensor origin and find the **nearest** wall segment hit in front of the beam. Using the 2D cross product solves the linear intersection system cleanly without division-by-zero traps on vertical walls.

## Concept

A ray starts at $O = (o_x, o_y)$ with direction $\vec{r} = (r_x, r_y)$: $P(t) = O + t\,\vec{r}$ for $t \ge 0$.
A wall segment runs from $A = (a_x, a_y)$ to $B = (b_x, b_y)$ with vector $\vec{s} = B - A$: $Q(u) = A + u\,\vec{s}$ for $0 \le u \le 1$.

Define the 2D scalar cross product $\vec{v} \times \vec{w} = v_x w_y - v_y w_x$. Solving $O + t\,\vec{r} = A + u\,\vec{s}$ gives:
- $\text{denom} = \vec{r} \times \vec{s}$. If $|\text{denom}| < 10^{-12}$, the ray and segment are parallel — return `None`.
- Let $\vec{q} = A - O$:
  $$t = \frac{\vec{q} \times \vec{s}}{\text{denom}}, \qquad u = \frac{\vec{q} \times \vec{r}}{\text{denom}}$$
- A valid hit exists iff $t \ge 0$ and $0 \le u \le 1$, at hit point $(o_x + t\,r_x, o_y + t\,r_y)$.

## Objective

Implement:
1. `ray_segment_intersect(origin, direction, a, b)` returning `(t, (hx, hy))` if the ray hits segment `(a, b)`, else `None`.
2. `cast_ray(origin, direction, segments)` where `segments` is a list of `(a, b)` pairs, returning `(t, (hx, hy), index)` for the hit with the **smallest** `t >= 0` (ties broken by lowest `index`), or `None` if no segment is hit.

## Hints

1. Write a tiny helper `def cross(ax, ay, bx, by): return ax * by - ay * bx`.
2. Use a small epsilon like `1e-12` when checking `abs(denom) < 1e-12` and when checking `-1e-12 <= u <= 1.0 + 1e-12` and `t >= -1e-12` (clamping tiny negative `t` like `-1e-16` to `0.0`).

## Starter: guided

```python
def _cross(ax, ay, bx, by):
    return ax * by - ay * bx


def ray_segment_intersect(origin, direction, a, b):
    ox, oy = origin
    rx, ry = direction
    ax, ay = a
    bx, by = b
    sx, sy = bx - ax, by - ay
    denom = _cross(rx, ry, sx, sy)
    if abs(denom) < 1e-12:
        return None
    # Solve for t and u; return (t, (hx, hy)) if t >= 0 and 0 <= u <= 1.
    pass


def cast_ray(origin, direction, segments):
    pass
```

## Starter: standard

```python
def ray_segment_intersect(origin, direction, a, b):
    pass


def cast_ray(origin, direction, segments):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _hit_vert():
    res = get("ray_segment_intersect")((0, 0), (1, 0), (5, -2), (5, 2))
    return (round(res[0], 6), (round(res[1][0], 6), round(res[1][1], 6)))
expect("hits vertical wall ahead of ray", _hit_vert, (5.0, (5.0, 0.0)))
expect("misses wall behind ray origin", lambda: get("ray_segment_intersect")((0, 0), (1, 0), (-5, -2), (-5, 2)), None)
expect("parallel ray returns None", lambda: get("ray_segment_intersect")((0, 0), (1, 0), (0, 2), (10, 2)), None)

def _nearest():
    segs = [((10, -5), (10, 5)), ((4, -5), (4, 5)), ((7, 2), (7, 5))]
    t, pt, idx = get("cast_ray")((0, 0), (1, 0), segs)
    return (round(t, 6), (round(pt[0], 6), round(pt[1], 6)), idx)
expect("cast_ray picks nearest intersected segment", _nearest, (4.0, (4.0, 0.0), 1))
```

## Hidden checks

```python
def _diag():
    t, pt = get("ray_segment_intersect")((0, 0), (1, 1), (0, 4), (4, 0))
    return (round(t, 6), (round(pt[0], 6), round(pt[1], 6)))
expect("diagonal ray hits slanted segment", _diag, (2.0, (2.0, 2.0)))
expect("ray passing beyond segment endpoint returns None", lambda: get("ray_segment_intersect")((0, 0), (1, 0), (5, 1), (5, 5)), None)
expect("cast_ray returns None when nothing hit", lambda: get("cast_ray")((0, 0), (0, 1), [((2, -2), (2, 2))]), None)
```

## Solution

```python
def _cross(ax, ay, bx, by):
    return ax * by - ay * bx


def ray_segment_intersect(origin, direction, a, b):
    ox, oy = origin
    rx, ry = direction
    ax, ay = a
    bx, by = b
    sx, sy = bx - ax, by - ay
    denom = _cross(rx, ry, sx, sy)
    if abs(denom) < 1e-12:
        return None
    qpx, qpy = ax - ox, ay - oy
    t = _cross(qpx, qpy, sx, sy) / denom
    u = _cross(qpx, qpy, rx, ry) / denom
    if t < -1e-12 or u < -1e-12 or u > 1.0 + 1e-12:
        return None
    t = max(0.0, t)
    return (t, (ox + t * rx, oy + t * ry))


def cast_ray(origin, direction, segments):
    best = None
    for idx, (a, b) in enumerate(segments):
        hit = ray_segment_intersect(origin, direction, a, b)
        if hit is not None:
            t, pt = hit
            if best is None or t < best[0]:
                best = (t, pt, idx)
    return best
```

## Restored

The ray deck now fires exact 2D lidar beams and pinpoints the closest obstructing wall.
