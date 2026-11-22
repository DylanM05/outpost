---
id: maintenance-fix-quad-bounds
title: Fix a Quadtree split that misplaces eastern and southern quadrants
system: Spatial vault
symbol: equipment
scene: tests
skills: spatial-indexing
reviewSkill: spatial-indexing
prerequisite: quadtree-range
---

## Briefing

A Quadtree subdivision helper is shifting its child boxes by the full parent `w` and `h` instead of half-width and half-height, placing three quadrants completely outside the parent box!

## Objective

Fix `subdivide_box(x, y, w, h)` so it returns `[nw, ne, sw, se]` where each quadrant is `(qx, qy, hw, hh)` covering exactly one quarter of `(x, y, w, h)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Offset `ne` by `x + hw`, `sw` by `y + hh`, and `se` by `(x + hw, y + hh)` instead of `x + w` and `y + h`.

## Starter

```python
def subdivide_box(x, y, w, h):
    hw = w / 2.0
    hh = h / 2.0
    return [
        (x, y, hw, hh),
        (x + w, y, hw, hh),
        (x, y + h, hw, hh),
        (x + w, y + h, hw, hh),
    ]
```

## Checks

```python
expect("splits unit square into 4 equal quadrants", lambda: get("subdivide_box")(0, 0, 10, 20), [
    (0, 0, 5.0, 10.0),
    (5.0, 0, 5.0, 10.0),
    (0, 10.0, 5.0, 10.0),
    (5.0, 10.0, 5.0, 10.0),
])
```

## Hidden checks

```python
expect("preserves non-zero origin offset", lambda: get("subdivide_box")(-10, 4, 8, 6), [
    (-10, 4, 4.0, 3.0),
    (-6.0, 4, 4.0, 3.0),
    (-10, 7.0, 4.0, 3.0),
    (-6.0, 7.0, 4.0, 3.0),
])
```

## Solution

```python
def subdivide_box(x, y, w, h):
    hw = w / 2.0
    hh = h / 2.0
    return [
        (x, y, hw, hh),
        (x + hw, y, hw, hh),
        (x, y + hh, hw, hh),
        (x + hw, y + hh, hw, hh),
    ]
```

## Restored

Quadtree splits now tile the parent region seamlessly with zero gaps or overflow.
