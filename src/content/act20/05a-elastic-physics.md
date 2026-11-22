---
id: elastic-physics
title: Step a bounded 2D body with semi-implicit Euler integration
system: Navigation core
symbol: controller
scene: tests
skills: simulation-pathfinding
---

## Briefing

Standard explicit Euler (`pos += vel * dt` before updating `vel`) injects phantom energy into oscillating systems. **Semi-implicit (symplectic) Euler** updates velocity first and position second — then reflects bodies cleanly off enclosing arena walls with configurable restitution.

## Concept

Given a circular body `(x, y)` with velocity `(vx, vy)`, constant acceleration `(ax, ay)`, timestep `dt > 0`, bounding box `bounds = (min_x, min_y, max_x, max_y)`, `radius >= 0`, and bounce factor `0 <= restitution <= 1`:
1. Update velocity: `vx += ax * dt`, `vy += ay * dt`.
2. Update position: `x += vx * dt`, `y += vy * dt`.
3. Effective center limits are `lo_x = min_x + radius`, `hi_x = max_x - radius`, `lo_y = min_y + radius`, `hi_y = max_y - radius`.
4. Reflect off walls:
   - If `x < lo_x`: `x = min(hi_x, lo_x + (lo_x - x))` and `vx = abs(vx) * restitution`.
   - If `x > hi_x`: `x = max(lo_x, hi_x - (x - hi_x))` and `vx = -abs(vx) * restitution`.
   - Apply the same reflection to `y` and `vy` against `lo_y` and `hi_y`.
5. Return `(x, y, vx, vy)`.

## Objective

Write `step_body(x, y, vx, vy, ax, ay, dt, bounds, radius=0.0, restitution=1.0)` returning the updated `(x, y, vx, vy)` tuple. Raise `ValueError` if `dt <= 0` or `radius < 0` or `lo_x > hi_x` or `lo_y > hi_y`.

## Hints

1. Always update `vx, vy` **before** updating `x, y` (that's what makes it semi-implicit Euler!).
2. Reflecting overshoot `lo_x + (lo_x - x)` preserves exact distance traveled during the tick instead of sticking the body flat on the wall.

## Starter: guided

```python
def step_body(x, y, vx, vy, ax, ay, dt, bounds, radius=0.0, restitution=1.0):
    if dt <= 0 or radius < 0:
        raise ValueError("dt must be positive and radius non-negative")
    min_x, min_y, max_x, max_y = bounds
    lo_x, hi_x = min_x + radius, max_x - radius
    lo_y, hi_y = min_y + radius, max_y - radius
    if lo_x > hi_x or lo_y > hi_y:
        raise ValueError("body does not fit in bounds")
    # 1. Update vx, vy then x, y (semi-implicit Euler).
    # 2. Reflect x, y off [lo_x, hi_x] and [lo_y, hi_y] with restitution.
    pass
```

## Starter: standard

```python
def step_body(x, y, vx, vy, ax, ay, dt, bounds, radius=0.0, restitution=1.0):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _free_fall():
    res = get("step_body")(5.0, 5.0, 0.0, 0.0, 0.0, 2.0, 0.5, (0.0, 0.0, 10.0, 10.0))
    return tuple(round(v, 6) for v in res)
expect("semi-implicit Euler updates velocity before position", _free_fall, (5.0, 5.5, 0.0, 1.0))

def _wall_bounce():
    # Moves from x=9 to x=11 -> bounces off x=10 back to x=9 with vx=-1.0 (restitution=0.5)
    res = get("step_body")(9.0, 5.0, 2.0, 0.0, 0.0, 0.0, 1.0, (0.0, 0.0, 10.0, 10.0), radius=0.0, restitution=0.5)
    return tuple(round(v, 6) for v in res)
expect("reflects overshoot off right wall with restitution", _wall_bounce, (9.0, 5.0, -1.0, 0.0))
```

## Hidden checks

```python
def _radius_bounce():
    # Effective left wall is min_x + radius = 1.0; moves from 1.5 to 0.5 -> reflects to 1.5
    res = get("step_body")(1.5, 5.0, -1.0, 0.0, 0.0, 0.0, 1.0, (0.0, 0.0, 10.0, 10.0), radius=1.0, restitution=1.0)
    return tuple(round(v, 6) for v in res)
expect("accounts for body radius against left wall", _radius_bounce, (1.5, 5.0, 1.0, 0.0))

def _bad_body():
    try:
        get("step_body")(0, 0, 0, 0, 0, 0, 0.0, (0, 0, 10, 10))
        return False
    except ValueError:
        return True
expect("rejects non-positive dt", _bad_body, True)
```

## Solution

```python
def step_body(x, y, vx, vy, ax, ay, dt, bounds, radius=0.0, restitution=1.0):
    if dt <= 0 or radius < 0:
        raise ValueError("dt must be positive and radius non-negative")
    min_x, min_y, max_x, max_y = bounds
    lo_x, hi_x = min_x + radius, max_x - radius
    lo_y, hi_y = min_y + radius, max_y - radius
    if lo_x > hi_x or lo_y > hi_y:
        raise ValueError("body does not fit in bounds")

    vx += ax * dt
    vy += ay * dt
    x += vx * dt
    y += vy * dt

    if x < lo_x:
        x = min(hi_x, lo_x + (lo_x - x))
        vx = abs(vx) * restitution
    elif x > hi_x:
        x = max(lo_x, hi_x - (x - hi_x))
        vx = -abs(vx) * restitution

    if y < lo_y:
        y = min(hi_y, lo_y + (lo_y - y))
        vy = abs(vy) * restitution
    elif y > hi_y:
        y = max(lo_y, hi_y - (y - hi_y))
        vy = -abs(vy) * restitution

    return (x, y, vx, vy)
```

## Restored

The navigation core now advances drones deterministically with symplectic Euler and exact wall reflections.
