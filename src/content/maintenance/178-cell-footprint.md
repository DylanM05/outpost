---
id: maintenance-cell-footprint
title: List spatial-hash cells overlapped by a query box
system: Spatial vault
symbol: equipment
scene: tests
skills: spatial-indexing
reviewSkill: spatial-indexing
prerequisite: quadtree-range
---

## Briefing

Every spatial-hash range query begins by turning a world-space bounding box into the exact set of integer grid cells `(cx, cy)` it touches, including across negative coordinates.

## Objective

Write `covered_cells(min_x, min_y, max_x, max_y, cell_size)` raising `ValueError` if `cell_size <= 0`, `min_x > max_x`, or `min_y > max_y`, and returning a sorted list of `(cx, cy)` integer grid cells spanned by `[floor(min_x/cell_size)..floor(max_x/cell_size)]` x `[floor(min_y/cell_size)..floor(max_y/cell_size)]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `math.floor` (never `int()`) so negative coordinates map to `-1`, `-2`, ... instead of collapsing into bucket `0`.

## Starter

```python
```

## Checks

```python
expect("spans positive cell border", lambda: get("covered_cells")(8, 2, 12, 4, 10), [(0, 0), (1, 0)])
expect("spans negative-to-positive origin cleanly", lambda: get("covered_cells")(-1, -1, 1, 1, 5), [(-1, -1), (-1, 0), (0, -1), (0, 0)])
```

## Hidden checks

```python
expect("single cell box", lambda: get("covered_cells")(1, 1, 2, 2, 10), [(0, 0)])
def _bad():
    try:
        get("covered_cells")(5, 0, 2, 2, 10)
        return False
    except ValueError:
        return True
expect("inverted bounds raise ValueError", _bad, True)
```

## Solution

```python
import math


def covered_cells(min_x, min_y, max_x, max_y, cell_size):
    if cell_size <= 0 or min_x > max_x or min_y > max_y:
        raise ValueError("invalid bounds or cell_size")
    x0 = math.floor(min_x / cell_size)
    x1 = math.floor(max_x / cell_size)
    y0 = math.floor(min_y / cell_size)
    y1 = math.floor(max_y / cell_size)
    return [(cx, cy) for cx in range(x0, x1 + 1) for cy in range(y0, y1 + 1)]
```

## Restored

Spatial cell footprints now compute cleanly across both positive and negative coordinates.
