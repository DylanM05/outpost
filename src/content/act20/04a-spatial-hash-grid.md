---
id: spatial-hash-grid
title: Build a uniform spatial hash grid for radius queries
system: Spatial vault
symbol: equipment
scene: tests
skills: spatial-indexing
---

## Briefing

Checking every drone against every other drone takes $O(n^2)$ work. A **spatial hash grid** buckets 2D entities into fixed-size cells keyed by `(floor(x / cell_size), floor(y / cell_size))` so a radius search only inspects the few neighboring cells intersecting the search circle.

## Concept

For a grid with `cell_size > 0`:
- Cell coordinate of `(x, y)` is `(math.floor(x / cell_size), math.floor(y / cell_size))`. Using `math.floor` (not `int()`) ensures negative coordinates bucket cleanly without a double-wide bucket around zero!
- Track:
  - `self.positions[entity_id] = (x, y)`
  - `self.entity_cell[entity_id] = (cx, cy)`
  - `self.cells[(cx, cy)] = set_of_entity_ids`
- **`insert(entity_id, x, y)`:** If `entity_id` is already stored, remove it from its old cell first (pruning empty cell sets), then insert it into its new cell!
- **`remove(entity_id)`:** Remove `entity_id` from `positions`, `entity_cell`, and its bucket; return `True` if it existed, else `False`.
- **`query_radius(qx, qy, radius)`:** Raise `ValueError` if `radius < 0`. Compute cell bounds:
  - `min_cx = math.floor((qx - radius) / cell_size)` .. `max_cx = math.floor((qx + radius) / cell_size)`
  - `min_cy = math.floor((qy - radius) / cell_size)` .. `max_cy = math.floor((qy + radius) / cell_size)`
  - Check only entities inside cells in that range, keep those with `(x - qx)**2 + (y - qy)**2 <= radius**2`, and return their IDs **sorted**.

## Objective

Implement `SpatialHashGrid(cell_size)` with `insert(entity_id, x, y)`, `remove(entity_id)`, and `query_radius(qx, qy, radius)` (raising `ValueError` if `cell_size <= 0` or `radius < 0`).

## Hints

1. Use `math.floor` for both inserting and computing `min_cx..max_cx` / `min_cy..max_cy` so negative coordinates work identically to positive ones.
2. When moving an existing entity in `insert`, delete its old bucket from `self.cells` if the bucket becomes empty so stale empty sets don't pile up.

## Starter: guided

```python
import math


class SpatialHashGrid:
    def __init__(self, cell_size):
        if cell_size <= 0:
            raise ValueError("cell_size must be positive")
        self.cell_size = cell_size
        self.cells = {}
        self.positions = {}
        self.entity_cell = {}

    def _cell(self, x, y):
        return (math.floor(x / self.cell_size), math.floor(y / self.cell_size))

    def insert(self, entity_id, x, y):
        pass

    def remove(self, entity_id):
        pass

    def query_radius(self, qx, qy, radius):
        pass
```

## Starter: standard

```python
import math


class SpatialHashGrid:
    def __init__(self, cell_size):
        pass

    def insert(self, entity_id, x, y):
        pass

    def remove(self, entity_id):
        pass

    def query_radius(self, qx, qy, radius):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _basic_grid():
    g = get("SpatialHashGrid")(10.0)
    g.insert("d1", 2, 2)
    g.insert("d2", 9, 9)
    g.insert("d3", 12, 12)
    g.insert("d4", 50, 50)
    r1 = g.query_radius(10, 10, 4.0)
    # Move d4 right next to (10, 10) and remove d2
    g.insert("d4", 10, 11)
    removed = g.remove("d2")
    r2 = g.query_radius(10, 10, 4.0)
    return (r1, removed, r2)
expect("queries across cell borders, updates moved entities, and removes cleanly", _basic_grid, (["d2", "d3"], True, ["d3", "d4"]))
```

## Hidden checks

```python
def _negative_coords():
    g = get("SpatialHashGrid")(5.0)
    g.insert("a", -1.0, -1.0)
    g.insert("b", 1.0, 1.0)
    g.insert("c", -6.0, -6.0)
    return (g.query_radius(0.0, 0.0, 2.0), g.remove("missing"))
expect("handles negative coordinates across origin", _negative_coords, (["a", "b"], False))

def _bad_args():
    bad_cs = False
    try:
        get("SpatialHashGrid")(0)
    except ValueError:
        bad_cs = True
    bad_r = False
    try:
        get("SpatialHashGrid")(10).query_radius(0, 0, -1)
    except ValueError:
        bad_r = True
    return (bad_cs, bad_r)
expect("rejects non-positive cell_size and negative radius", _bad_args, (True, True))
```

## Solution

```python
import math


class SpatialHashGrid:
    def __init__(self, cell_size):
        if cell_size <= 0:
            raise ValueError("cell_size must be positive")
        self.cell_size = cell_size
        self.cells = {}
        self.positions = {}
        self.entity_cell = {}

    def _cell(self, x, y):
        return (math.floor(x / self.cell_size), math.floor(y / self.cell_size))

    def insert(self, entity_id, x, y):
        if entity_id in self.entity_cell:
            self.remove(entity_id)
        cell = self._cell(x, y)
        self.positions[entity_id] = (x, y)
        self.entity_cell[entity_id] = cell
        self.cells.setdefault(cell, set()).add(entity_id)

    def remove(self, entity_id):
        cell = self.entity_cell.pop(entity_id, None)
        if cell is None:
            return False
        self.positions.pop(entity_id, None)
        bucket = self.cells.get(cell)
        if bucket is not None:
            bucket.discard(entity_id)
            if not bucket:
                del self.cells[cell]
        return True

    def query_radius(self, qx, qy, radius):
        if radius < 0:
            raise ValueError("radius must be non-negative")
        min_cx = math.floor((qx - radius) / self.cell_size)
        max_cx = math.floor((qx + radius) / self.cell_size)
        min_cy = math.floor((qy - radius) / self.cell_size)
        max_cy = math.floor((qy + radius) / self.cell_size)
        r_sq = radius * radius
        found = []
        for cx in range(min_cx, max_cx + 1):
            for cy in range(min_cy, max_cy + 1):
                for eid in self.cells.get((cx, cy), ()):
                    ex, ey = self.positions[eid]
                    dx = ex - qx
                    dy = ey - qy
                    if dx * dx + dy * dy <= r_sq:
                        found.append(eid)
        found.sort()
        return found
```

## Restored

The spatial vault now narrows proximity searches to just the surrounding grid buckets in $O(1)$ average time.
