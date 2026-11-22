---
id: maintenance-circle-overlap
title: Check whether two 2D circles overlap
system: Collision bay
symbol: equipment
scene: tests
skills: spatial-geometry
reviewSkill: spatial-geometry
prerequisite: line-of-sight
---

## Briefing

Hull-to-hull collision checks test two circular footprints without wasting square roots by comparing squared center distance against the squared sum of radii.

## Objective

Write `circles_intersect(c1, c2)` where each circle is `(x, y, r)`. Raise `ValueError` if either radius is negative; otherwise return `True` if the circles overlap or touch edges, else `False`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Compare `(x1 - x2) ** 2 + (y1 - y2) ** 2 <= (r1 + r2) ** 2`.
2. Check `r1 < 0 or r2 < 0` first and raise `ValueError`.

## Starter

```python
```

## Checks

```python
expect("overlapping circles return True", lambda: get("circles_intersect")((0, 0, 3), (4, 0, 2)), True)
expect("separated circles return False", lambda: get("circles_intersect")((0, 0, 2), (6, 0, 2)), False)
expect("tangent circles touching at one point return True", lambda: get("circles_intersect")((0, 0, 2), (5, 0, 3)), True)
```

## Hidden checks

```python
expect("concentric circles return True", lambda: get("circles_intersect")((1, 1, 5), (1, 1, 1)), True)
def _neg():
    try:
        get("circles_intersect")((0, 0, -1), (0, 0, 1))
        return False
    except ValueError:
        return True
expect("negative radius raises ValueError", _neg, True)
```

## Solution

```python
def circles_intersect(c1, c2):
    x1, y1, r1 = c1
    x2, y2, r2 = c2
    if r1 < 0 or r2 < 0:
        raise ValueError("radius must be non-negative")
    dx = x1 - x2
    dy = y1 - y2
    rs = r1 + r2
    return dx * dx + dy * dy <= rs * rs
```

## Restored

Hull-to-hull circle overlap checks run cleanly with zero unnecessary square roots.
