---
id: ordered-readings
title: Ordered readings
system: Elevation tree
symbol: instrument
scene: tests
skills: trees, recursion
---

## Briefing

A hash set can tell you whether an exact elevation exists, but it can't answer "give me every station between 1,000 m and 1,400 m in ascending order" without scanning everything and sorting. That is where a binary search tree earns its keep: an in-order walk reads values sorted, and range queries skip whole subtrees that fall outside the band.

## Objective

Extend `BSTNode` (already started for you with `insert`) with three methods:

1. `inorder(self)`: returns a list of all values in the tree in ascending sorted order (`[]` if empty).
2. `range_query(self, low, high)`: returns a sorted list of all values `v` with `low <= v <= high`, **without visiting subtrees that cannot contain any values in `[low, high]`**.
3. `height(self)`: returns the height of the tree — `0` for an empty node (`self.val is None`), `1` for a single leaf node, and `1 + max(left_height, right_height)` otherwise.

```python
# Tree containing 1200, 950, 1500, 800, 1100, 1400, 1800:
tree.inorder()                # [800, 950, 1100, 1200, 1400, 1500, 1800]
tree.range_query(1000, 1450)  # [1100, 1200, 1400]
tree.height()                 # 3
```

## Concept

A BST range query is an in-order walk with two guards:

- Only walk `self.left` if `self.left is not None` **and** `self.val > low` (if `self.val <= low`, every value in the left subtree is strictly smaller than `low`).
- Include `self.val` if `low <= self.val <= high`.
- Only walk `self.right` if `self.right is not None` **and** `self.val < high` (if `self.val >= high`, every value in the right subtree is strictly larger than `high`).

Checking `height()` also tells you how well-balanced the tree is: 1,000 nodes inserted in balanced order have height ~10; inserted in sorted order they form a chain of height 1,000.

## Hints

1. In `inorder(self)`, pass a shared `visited` list down a helper (or combine `left + [self.val] + right`). Return `[]` when `self.val is None`.
2. In `range_query(self, low, high)`, guard the left recursion with `if self.left is not None and self.val > low:` and the right recursion with `if self.right is not None and self.val < high:`.
3. In `height(self)`: if `self.val is None`, return `0`. Otherwise compute `left_h = self.left.height() if self.left else 0` and `right_h = self.right.height() if self.right else 0`, and return `1 + max(left_h, right_h)`.

## Starter: guided

```python
class BSTNode:
    def __init__(self, val=None):
        self.val = val
        self.left = None
        self.right = None

    def insert(self, val):
        if self.val is None:
            self.val = val
            return
        if val == self.val:
            return
        if val < self.val:
            if self.left is None:
                self.left = BSTNode(val)
            else:
                self.left.insert(val)
        else:
            if self.right is None:
                self.right = BSTNode(val)
            else:
                self.right.insert(val)

    def inorder(self):
        if self.val is None:
            return []
        # Return left inorder + [self.val] + right inorder.
        return []

    def range_query(self, low, high):
        if self.val is None:
            return []
        result = []
        # Visit left only if self.val > low, append self.val if in range, visit right only if self.val < high.
        return result

    def height(self):
        if self.val is None:
            return 0
        # Return 1 + max(left height, right height).
        return 0
```

## Starter: standard

```python
class BSTNode:
    def __init__(self, val=None):
        self.val = val
        self.left = None
        self.right = None

    def insert(self, val):
        if self.val is None:
            self.val = val
            return
        if val == self.val:
            return
        if val < self.val:
            if self.left is None:
                self.left = BSTNode(val)
            else:
                self.left.insert(val)
        else:
            if self.right is None:
                self.right = BSTNode(val)
            else:
                self.right.insert(val)

    def inorder(self):
        return []

    def range_query(self, low, high):
        return []

    def height(self):
        return 0
```

## Starter: challenge

```python
class BSTNode:
    def __init__(self, val=None):
        self.val = val
        self.left = None
        self.right = None

    def insert(self, val):
        if self.val is None:
            self.val = val
            return
        if val == self.val:
            return
        if val < self.val:
            if self.left is None:
                self.left = BSTNode(val)
            else:
                self.left.insert(val)
        else:
            if self.right is None:
                self.right = BSTNode(val)
            else:
                self.right.insert(val)
```

## Checks

```python
tree = get("BSTNode")()
for elev in [1200, 950, 1500, 800, 1100, 1400, 1800]:
    tree.insert(elev)
expect("inorder()", lambda: tree.inorder(), [800, 950, 1100, 1200, 1400, 1500, 1800])
expect("range_query(1000, 1450)", lambda: tree.range_query(1000, 1450), [1100, 1200, 1400])
expect("height()", lambda: tree.height(), 3)
```

## Hidden checks

```python
empty = get("BSTNode")()
expect("empty inorder()", lambda: empty.inorder(), [])
expect("empty range_query", lambda: empty.range_query(0, 100), [])
expect("empty height()", lambda: empty.height(), 0)

single = get("BSTNode")(50)
expect("single node height()", lambda: single.height(), 1)
expect("range_query inclusive endpoints", lambda: tree.range_query(950, 1500), [950, 1100, 1200, 1400, 1500])

# Verify pruning: build a balanced tree of 1023 nodes and check visits on a tiny range.
big = get("BSTNode")()
def _fill(lo, hi):
    if lo > hi:
        return
    mid = (lo + hi) // 2
    big.insert(mid)
    _fill(lo, mid - 1)
    _fill(mid + 1, hi)
_fill(1, 1023)
expect("balanced 1,023-node tree height is 10", lambda: big.height(), 10)
expect("range_query on 1,023 nodes", lambda: big.range_query(500, 505), [500, 501, 502, 503, 504, 505])

reads = [0]
cls = get("BSTNode")
orig_get = cls.__getattribute__
def _counted_get(self, name):
    if name in ("val", "left", "right"):
        reads[0] += 1
    return orig_get(self, name)
cls.__getattribute__ = _counted_get
try:
    pruned_res = big.range_query(500, 505)
finally:
    cls.__getattribute__ = orig_get
check(
    "range_query prunes out-of-range branches",
    lambda: pruned_res == [500, 501, 502, 503, 504, 505] and reads[0] < 300,
    f"Read node fields {reads[0]:,} times for 6 matches in a 1,023-node tree. Skip left when val <= low and right when val >= high instead of walking the whole tree.",
)
```

## Solution

```python
class BSTNode:
    def __init__(self, val=None):
        self.val = val
        self.left = None
        self.right = None

    def insert(self, val):
        if self.val is None:
            self.val = val
            return
        if val == self.val:
            return
        if val < self.val:
            if self.left is None:
                self.left = BSTNode(val)
            else:
                self.left.insert(val)
        else:
            if self.right is None:
                self.right = BSTNode(val)
            else:
                self.right.insert(val)

    def inorder(self):
        if self.val is None:
            return []
        left = self.left.inorder() if self.left is not None else []
        right = self.right.inorder() if self.right is not None else []
        return left + [self.val] + right

    def range_query(self, low, high):
        if self.val is None:
            return []
        result = []
        if self.left is not None and self.val > low:
            result.extend(self.left.range_query(low, high))
        if low <= self.val <= high:
            result.append(self.val)
        if self.right is not None and self.val < high:
            result.extend(self.right.range_query(low, high))
        return result

    def height(self):
        if self.val is None:
            return 0
        left_h = self.left.height() if self.left is not None else 0
        right_h = self.right.height() if self.right is not None else 0
        return 1 + max(left_h, right_h)
```

## Restored

The elevation tree now answers altitude-band queries without walking the whole ridge, and reports its own height.
