---
id: insert-and-find
title: Insert and find
system: Elevation tree
symbol: instrument
scene: tests
skills: trees, classes, recursion
---

## Briefing

Build the elevation index as a binary search tree. Each node holds an elevation (or `None` when empty) and links to a smaller `left` branch and a larger `right` branch, so inserting or finding an elevation skips half the remaining tree at each step.

## Objective

Write a `BSTNode` class with:

- `__init__(self, val=None)`: sets `self.val = val`, `self.left = None`, and `self.right = None`.
- `insert(self, val)`:
  - If `self.val is None`, stores `val` here.
  - If `val == self.val`, does nothing (no duplicates).
  - If `val < self.val`, inserts into `self.left` (creating `BSTNode(val)` if `self.left is None`).
  - If `val > self.val`, inserts into `self.right` (creating `BSTNode(val)` if `self.right is None`).
- `exists(self, val)`: returns `True` if `val` is in the tree, `False` otherwise.
- `get_min(self)`: returns the smallest value in the tree, or `None` if empty.
- `get_max(self)`: returns the largest value in the tree, or `None` if empty.

```python
tree = BSTNode()
for elev in [1200, 950, 1500, 800, 1100]:
    tree.insert(elev)
tree.exists(1100)  # True
tree.get_min()     # 800
tree.get_max()     # 1500
```

## Concept

Because every left child is smaller and every right child is larger:

- **Search (`exists`)** compares `val` with `self.val` and only follows *one* branch — `O(h)` steps, where `h` is the tree's height (`log₂ n` on a balanced tree).
- **Minimum (`get_min`)** just walks `left` until there is no left child.
- **Maximum (`get_max`)** walks `right` until there is no right child.

## Hints

1. In `insert(val)`: handle `self.val is None` first, then `val == self.val`, then `val < self.val` (left) and `val > self.val` (right).
2. In `exists(val)`: if `self.val is None`, return `False`. If `val == self.val`, return `True`. If `val < self.val`, return `self.left is not None and self.left.exists(val)` (and symmetrically for `right`).
3. In `get_min()`: start `current = self`, and `while current.left is not None: current = current.left`, then `return current.val`.

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
        # Route val < self.val to self.left and val > self.val to self.right.

    def exists(self, val):
        if self.val is None:
            return False
        if val == self.val:
            return True
        # Follow self.left or self.right.
        return False

    def get_min(self):
        return None

    def get_max(self):
        return None
```

## Starter: standard

```python
class BSTNode:
    def __init__(self, val=None):
        self.val = val
        self.left = None
        self.right = None

    def insert(self, val):
        pass

    def exists(self, val):
        return False

    def get_min(self):
        return None

    def get_max(self):
        return None
```

## Starter: challenge

```python
```

## Checks

```python
tree = get("BSTNode")()
for elev in [1200, 950, 1500, 800, 1100, 1400, 1800]:
    tree.insert(elev)
expect("exists(1100)", lambda: tree.exists(1100), True)
expect("exists(1800)", lambda: tree.exists(1800), True)
expect("exists(1000)", lambda: tree.exists(1000), False)
expect("get_min()", lambda: tree.get_min(), 800)
expect("get_max()", lambda: tree.get_max(), 1800)
```

## Hidden checks

```python
empty = get("BSTNode")()
expect("empty tree exists(10)", lambda: empty.exists(10), False)
expect("empty tree get_min()", lambda: empty.get_min(), None)
expect("empty tree get_max()", lambda: empty.get_max(), None)

dup = get("BSTNode")()
for v in [10, 5, 10, 5, 15]:
    dup.insert(v)
check(
    "ignores duplicate inserts",
    lambda: dup.left.val == 5 and dup.left.left is None and dup.left.right is None and dup.right.val == 15,
    "Do nothing when val == self.val.",
)
expect("handles zero value properly", lambda: (dup.insert(0), dup.exists(0), dup.get_min())[1:], (True, 0), "Check `self.val is None`, not `if not self.val`.")
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

    def exists(self, val):
        if self.val is None:
            return False
        if val == self.val:
            return True
        if val < self.val:
            return self.left is not None and self.left.exists(val)
        return self.right is not None and self.right.exists(val)

    def get_min(self):
        current = self
        while current.left is not None:
            current = current.left
        return current.val

    def get_max(self):
        current = self
        while current.right is not None:
            current = current.right
        return current.val
```

## Restored

The elevation tree accepts new survey points and answers lookups, lows, and peaks without scanning the whole index.
