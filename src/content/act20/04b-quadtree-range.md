---
id: quadtree-range
title: Partition uneven 2D space with a Quadtree
system: Spatial vault
symbol: equipment
scene: tests
skills: spatial-indexing
---

## Briefing

When sensors cluster densely around Kestrel Ridge while miles of tundra stay empty, a uniform grid wastes cells or overcrowds buckets. A **Quadtree** recursively splits only the crowded quadrants into four sub-boxes (`NW`, `NE`, `SW`, `SE`) and prunes entire empty subtrees during rectangular range queries.

## Concept

A `Quadtree(x, y, w, h, capacity=4, max_depth=8)` represents the inclusive box `[x, x + w] x [y, y + h]`:
- **`insert(entity_id, px, py)`:**
  - If `(px, py)` is outside `[x, x + w] x [y, y + h]`, return `False`.
  - If the node is not subdivided and (`len(points) < capacity` or `depth >= max_depth`), store `(entity_id, px, py)` here and return `True`.
  - Otherwise subdivide into 4 children of width `hw = w / 2`, height `hh = h / 2`:
    - `nw`: `(x, y, hw, hh)`
    - `ne`: `(x + hw, y, hw, hh)`
    - `sw`: `(x, y + hh, hw, hh)`
    - `se`: `(x + hw, y + hh, hw, hh)`
  - Insert into the first child whose bounds contain `(px, py)` (note: points sitting on the center seam belong to the first matching child so no point is duplicated!).
- **`query_rect(rx, ry, rw, rh)`:**
  - If the node's box does not overlap `(rx, ry, rw, rh)`, prune immediately and return `[]`.
  - Collect all stored points inside `[rx, rx + rw] x [ry, ry + rh]` plus results from any children, returning **sorted** `entity_id`s.

## Objective

Implement `Quadtree(x, y, w, h, capacity=4, max_depth=8)` with `insert(entity_id, px, py)` (returning `bool`) and `query_rect(rx, ry, rw, rh)` (returning sorted matching `entity_id`s).

## Hints

1. Checking `for child in self.children: if child.insert(entity_id, px, py): return True` automatically guarantees a boundary point goes into exactly one child!
2. Keeping points already stored in an internal node (or pushing them down on split) both work — keeping them in the node and checking `self.points` + `self.children` in `query_rect` is simpler and never duplicates points.
3. Use `max_depth` to guarantee identical coordinates never trigger infinite recursion!

## Starter: guided

```python
class Quadtree:
    def __init__(self, x, y, w, h, capacity=4, max_depth=8, _depth=0):
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.capacity = capacity
        self.max_depth = max_depth
        self._depth = _depth
        self.points = []
        self.children = None

    def _contains(self, px, py):
        return self.x <= px <= self.x + self.w and self.y <= py <= self.y + self.h

    def _overlaps(self, rx, ry, rw, rh):
        return (
            self.x <= rx + rw
            and rx <= self.x + self.w
            and self.y <= ry + rh
            and ry <= self.y + self.h
        )

    def insert(self, entity_id, px, py):
        pass

    def query_rect(self, rx, ry, rw, rh):
        pass
```

## Starter: standard

```python
class Quadtree:
    def __init__(self, x, y, w, h, capacity=4, max_depth=8):
        pass

    def insert(self, entity_id, px, py):
        pass

    def query_rect(self, rx, ry, rw, rh):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _qt_basic():
    qt = get("Quadtree")(0, 0, 100, 100, capacity=2)
    pts = [
        ("p1", 10, 10),
        ("p2", 15, 20),
        ("p3", 80, 80),
        ("p4", 50, 50),  # sits on exact midpoint seam!
        ("p5", 20, 85),
    ]
    inserted = [qt.insert(eid, x, y) for eid, x, y in pts]
    outside = qt.insert("out", 120, 50)
    nw = qt.query_rect(0, 0, 50, 50)
    se = qt.query_rect(50, 50, 50, 50)
    return (all(inserted), outside, nw, se)
expect("subdivides, rejects out-of-bounds, and queries without duplicating seam points", _qt_basic, (True, False, ["p1", "p2", "p4"], ["p3", "p4"]))
```

## Hidden checks

```python
def _qt_coincident():
    qt = get("Quadtree")(0, 0, 64, 64, capacity=1, max_depth=4)
    for i in range(6):
        qt.insert(f"dup{i}", 12.0, 12.0)
    return qt.query_rect(10, 10, 5, 5)
expect("handles many coincident points without infinite recursion", _qt_coincident, ["dup0", "dup1", "dup2", "dup3", "dup4", "dup5"])

def _qt_empty_query():
    qt = get("Quadtree")(0, 0, 100, 100, capacity=2)
    qt.insert("a", 5, 5)
    return qt.query_rect(60, 60, 10, 10)
expect("empty disjoint region returns empty list", _qt_empty_query, [])
```

## Solution

```python
class Quadtree:
    def __init__(self, x, y, w, h, capacity=4, max_depth=8, _depth=0):
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.capacity = capacity
        self.max_depth = max_depth
        self._depth = _depth
        self.points = []
        self.children = None

    def _contains(self, px, py):
        return self.x <= px <= self.x + self.w and self.y <= py <= self.y + self.h

    def _overlaps(self, rx, ry, rw, rh):
        return (
            self.x <= rx + rw
            and rx <= self.x + self.w
            and self.y <= ry + rh
            and ry <= self.y + self.h
        )

    def _subdivide(self):
        hw = self.w / 2.0
        hh = self.h / 2.0
        d = self._depth + 1
        self.children = [
            Quadtree(self.x, self.y, hw, hh, self.capacity, self.max_depth, d),
            Quadtree(self.x + hw, self.y, hw, hh, self.capacity, self.max_depth, d),
            Quadtree(self.x, self.y + hh, hw, hh, self.capacity, self.max_depth, d),
            Quadtree(self.x + hw, self.y + hh, hw, hh, self.capacity, self.max_depth, d),
        ]

    def insert(self, entity_id, px, py):
        if not self._contains(px, py):
            return False
        if self.children is None and (len(self.points) < self.capacity or self._depth >= self.max_depth):
            self.points.append((entity_id, px, py))
            return True
        if self.children is None:
            self._subdivide()
        for child in self.children:
            if child.insert(entity_id, px, py):
                return True
        return False

    def _collect(self, rx, ry, rw, rh, out):
        if not self._overlaps(rx, ry, rw, rh):
            return
        for eid, px, py in self.points:
            if rx <= px <= rx + rw and ry <= py <= ry + rh:
                out.append(eid)
        if self.children is not None:
            for child in self.children:
                child._collect(rx, ry, rw, rh, out)

    def query_rect(self, rx, ry, rw, rh):
        out = []
        self._collect(rx, ry, rw, rh, out)
        out.sort()
        return out
```

## Restored

The spatial vault now adapts to clustered telemetry with hierarchical Quadtree partitioning.
