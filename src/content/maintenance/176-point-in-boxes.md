---
id: maintenance-point-in-boxes
title: Find every AABB containing a 2D sensor point
system: Collision bay
symbol: equipment
scene: tests
skills: spatial-geometry
reviewSkill: spatial-geometry
prerequisite: line-of-sight
---

## Briefing

When a drone reports its `(x, y)` coordinates, the observatory checks which station hazard zones `(x, y, w, h)` enclose that point (inclusive of zone edges).

## Objective

Write `containing_boxes(px, py, boxes)` where `boxes` is a list of `(x, y, w, h)` tuples, returning a sorted list of 0-based indices for every box with `x <= px <= x + w` and `y <= py <= y + h`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Loop with `enumerate(boxes)` and check `x <= px <= x + w and y <= py <= y + h`.

## Starter

```python
```

## Checks

```python
expect("returns all enclosing box indices including edges", lambda: get("containing_boxes")(5, 5, [(0, 0, 5, 5), (6, 6, 4, 4), (2, 2, 8, 8)]), [0, 2])
expect("returns empty list when outside all boxes", lambda: get("containing_boxes")(20, 20, [(0, 0, 5, 5)]), [])
```

## Hidden checks

```python
expect("handles negative coordinates", lambda: get("containing_boxes")(-3, -2, [(-5, -5, 4, 4), (-1, -1, 2, 2)]), [0])
expect("empty boxes list returns []", lambda: get("containing_boxes")(0, 0, []), [])
```

## Solution

```python
def containing_boxes(px, py, boxes):
    return [
        i
        for i, (x, y, w, h) in enumerate(boxes)
        if x <= px <= x + w and y <= py <= y + h
    ]
```

## Restored

Zone membership checks now report every enclosing AABB cleanly.
