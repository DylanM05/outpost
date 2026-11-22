---
id: steering-avoidance
title: Combine goal-seeking and obstacle repulsion steering
system: Navigation core
symbol: controller
scene: tests
skills: simulation-pathfinding
---

## Briefing

Between grid waypoints, drones fly in continuous 2D space using **steering behaviors** (Craig Reynolds's classic model): a **seek** vector pulls toward the target, nearby hazards add linear **repulsion** vectors pushing away, and the summed velocity is clamped to the craft's `max_speed`.

## Concept

Given `pos = (px, py)`, `target = (tx, ty)`, `obstacles = [(ox, oy), ...]`, `max_speed >= 0`, and `avoid_radius > 0`:
1. **Seek vector:** Let `dx = tx - px`, `dy = ty - py`, `d = hypot(dx, dy)`.
   - If `d > 0`: `vx = (dx / d) * max_speed`, `vy = (dy / d) * max_speed`.
   - Else: `vx = 0.0`, `vy = 0.0`.
2. **Obstacle repulsion:** For each `(ox, oy)` in `obstacles`:
   - Let `rx = px - ox`, `ry = py - oy`, `dist = hypot(rx, ry)`.
   - If `0 < dist < avoid_radius`:
     - Linear falloff strength: `strength = max_speed * ((avoid_radius - dist) / avoid_radius)`.
     - Add `(rx / dist) * strength` to `vx` and `(ry / dist) * strength` to `vy`.
3. **Speed clamp:** Let `speed = hypot(vx, vy)`. If `speed > max_speed`:
   - Scale `(vx, vy)` by `max_speed / speed`.
4. Return `(vx, vy)`.

## Objective

Write `steer_velocity(pos, target, obstacles, max_speed, avoid_radius)` returning the clamped `(vx, vy)` velocity tuple. Raise `ValueError` if `max_speed < 0` or `avoid_radius <= 0`.

## Hints

1. Remember the repulsion vector points **away** from the obstacle: `(px - ox, py - oy)`, not `(ox - px, oy - py)`!
2. Skip obstacles with `dist == 0` or `dist >= avoid_radius` so you never divide by zero or add negative attraction forces.

## Starter: guided

```python
import math


def steer_velocity(pos, target, obstacles, max_speed, avoid_radius):
    if max_speed < 0 or avoid_radius <= 0:
        raise ValueError("invalid steering limits")
    px, py = pos
    tx, ty = target
    dx, dy = tx - px, ty - py
    dist_t = math.hypot(dx, dy)
    vx = (dx / dist_t) * max_speed if dist_t > 0 else 0.0
    vy = (dy / dist_t) * max_speed if dist_t > 0 else 0.0
    # Add repulsion from each obstacle inside avoid_radius, then clamp to max_speed.
    pass
```

## Starter: standard

```python
import math


def steer_velocity(pos, target, obstacles, max_speed, avoid_radius):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _pure_seek():
    vx, vy = get("steer_velocity")((0, 0), (3, 4), [], 10.0, 5.0)
    return (round(vx, 6), round(vy, 6))
expect("seeks straight toward target at max_speed when clear", _pure_seek, (6.0, 8.0))

def _avoid_below():
    # Seeking east (+x), obstacle directly south at (0, -2) within radius 4 -> pushes north (+y)
    vx, vy = get("steer_velocity")((0, 0), (10, 0), [(0, -2)], 10.0, 4.0)
    # Seek=(10, 0), Repulse=(0, 5) -> combined=(10, 5), clamped to mag 10
    speed = round((vx * vx + vy * vy) ** 0.5, 6)
    return (vx > 0, vy > 0, speed)
expect("deflects away from nearby obstacle while respecting max_speed", _avoid_below, (True, True, 10.0))
```

## Hidden checks

```python
def _far_obstacle():
    vx, vy = get("steer_velocity")((0, 0), (10, 0), [(0, -10)], 5.0, 4.0)
    return (round(vx, 6), round(vy, 6))
expect("ignores obstacles outside avoid_radius", _far_obstacle, (5.0, 0.0))

def _at_target_no_obs():
    vx, vy = get("steer_velocity")((3, 3), (3, 3), [], 5.0, 4.0)
    return (round(vx, 6), round(vy, 6))
expect("zero velocity when already at target with no threats", _at_target_no_obs, (0.0, 0.0))

def _bad_params():
    try:
        get("steer_velocity")((0, 0), (1, 1), [], 5.0, 0.0)
        return False
    except ValueError:
        return True
expect("rejects non-positive avoid_radius", _bad_params, True)
```

## Solution

```python
import math


def steer_velocity(pos, target, obstacles, max_speed, avoid_radius):
    if max_speed < 0 or avoid_radius <= 0:
        raise ValueError("invalid steering limits")
    px, py = pos
    tx, ty = target
    dx, dy = tx - px, ty - py
    dist_t = math.hypot(dx, dy)
    vx = (dx / dist_t) * max_speed if dist_t > 0 else 0.0
    vy = (dy / dist_t) * max_speed if dist_t > 0 else 0.0

    for ox, oy in obstacles:
        rx = px - ox
        ry = py - oy
        dist = math.hypot(rx, ry)
        if 0 < dist < avoid_radius:
            strength = max_speed * ((avoid_radius - dist) / avoid_radius)
            vx += (rx / dist) * strength
            vy += (ry / dist) * strength

    speed = math.hypot(vx, vy)
    if speed > max_speed and speed > 0:
        scale = max_speed / speed
        vx *= scale
        vy *= scale

    return (vx, vy)
```

## Restored

The navigation core smoothly blends target seeking with obstacle repulsion under strict speed envelopes.
