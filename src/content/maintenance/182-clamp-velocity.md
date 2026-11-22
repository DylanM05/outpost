---
id: maintenance-clamp-velocity
title: Clamp a 2D velocity vector to a maximum speed
system: Navigation core
symbol: controller
scene: tests
skills: simulation-pathfinding
reviewSkill: simulation-pathfinding
prerequisite: steering-avoidance
---

## Briefing

Combining multiple steering forces can push a drone's desired speed past its thruster limit. Clamping the vector's length preserves direction while capping speed cleanly.

## Objective

Write `clamp_velocity(vx, vy, max_speed)` raising `ValueError` if `max_speed < 0`. If `hypot(vx, vy) <= max_speed`, return `(float(vx), float(vy))`; otherwise scale `(vx, vy)` to exact magnitude `max_speed`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if speed > max_speed:` (so zero vectors `(0, 0)` never divide by zero even when `max_speed == 0`!).

## Starter

```python
```

## Checks

```python
def _clamped():
    vx, vy = get("clamp_velocity")(6, 8, 5.0)
    return (round(vx, 6), round(vy, 6))
expect("scales down vector exceeding max_speed", _clamped, (3.0, 4.0))

def _under():
    vx, vy = get("clamp_velocity")(1, 2, 5.0)
    return (round(vx, 6), round(vy, 6))
expect("leaves vector under max_speed unchanged", _under, (1.0, 2.0))
```

## Hidden checks

```python
expect("handles zero vector with zero max_speed", lambda: get("clamp_velocity")(0, 0, 0.0), (0.0, 0.0))
def _neg():
    try:
        get("clamp_velocity")(1, 1, -2.0)
        return False
    except ValueError:
        return True
expect("negative max_speed raises ValueError", _neg, True)
```

## Solution

```python
import math


def clamp_velocity(vx, vy, max_speed):
    if max_speed < 0:
        raise ValueError("max_speed must be non-negative")
    speed = math.hypot(vx, vy)
    if speed > max_speed and speed > 0:
        scale = max_speed / speed
        return (vx * scale, vy * scale)
    return (float(vx), float(vy))
```

## Restored

Velocity clamping now protects thruster limits without zero-division hazards.
