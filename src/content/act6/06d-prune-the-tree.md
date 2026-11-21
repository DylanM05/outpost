---
id: prune-the-tree
title: Prune the tree
system: Elevation tree
symbol: instrument
scene: tests
skills: trees, classes, recursion
---

## Briefing

When an outer marker gets buried or retired, it has to come out of the elevation tree without breaking the binary search ordering for every node beneath it. Removing a leaf is easy; removing a node with two branches takes care.

## Objective

Add `delete(self, val)` to `BSTNode`. It removes `val` from the subtree rooted at `self` (if present) and returns the new root of that subtree (or `None` if the subtree becomes empty).

```python
root = BSTNode()
for v in [50, 30, 70, 20, 40, 60, 80]:
    root.insert(v)
root = root.delete(50)
root.inorder()  # [20, 30, 40, 60, 70, 80]
```

## Concept

Deleting `val` from a BST node has three cases once you find `val == self.val`:

1. **No right child (`self.right is None`):** replace this node with `self.left` (which is `None` for a leaf, or the lone left child).
2. **No left child (`self.left is None`):** replace this node with `self.right`.
3. **Two children:** we need a replacement value that is larger than everything in `self.left` and smaller than everything left in `self.right`. The smallest value in `self.right` — the **in-order successor** — always fits! Copy that value into `self.val`, then recursively delete that successor value from `self.right`.

Because `delete` returns the (possibly replaced) subtree root, each recursive call assigns its result back:

```python
if val < self.val:
    if self.left is not None:
        self.left = self.left.delete(val)
    return self
```

## Hints

1. If `self.val is None`, return `None`.
2. If `val < self.val`, recurse on `self.left` (assigning `self.left = self.left.delete(val)` when `self.left` exists) and `return self`. Same for `val > self.val` on `self.right`.
3. When `val == self.val`: if `self.right is None`, `return self.left`. If `self.left is None`, `return self.right`. Otherwise walk `successor = self.right` left until `successor.left is None`, set `self.val = successor.val`, set `self.right = self.right.delete(successor.val)`, and `return self`.

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
        left = self.left.inorder() if self.left is not None else []
        right = self.right.inorder() if self.right is not None else []
        return left + [self.val] + right

    def delete(self, val):
        if self.val is None:
            return None
        if val < self.val:
            if self.left is not None:
                self.left = self.left.delete(val)
            return self
        if val > self.val:
            if self.right is not None:
                self.right = self.right.delete(val)
            return self
        # val == self.val: handle 0, 1, or 2 children.
        return self
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
        if self.val is None:
            return []
        left = self.left.inorder() if self.left is not None else []
        right = self.right.inorder() if self.right is not None else []
        return left + [self.val] + right

    def delete(self, val):
        return self
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

    def inorder(self):
        if self.val is None:
            return []
        left = self.left.inorder() if self.left is not None else []
        right = self.right.inorder() if self.right is not None else []
        return left + [self.val] + right
```

## Checks

```python
def make_tree(vals):
    t = get("BSTNode")()
    for v in vals:
        t.insert(v)
    return t

t = make_tree([50, 30, 70, 20, 40, 60, 80])
t = t.delete(20)
expect("delete a leaf (20)", lambda: t.inorder(), [30, 40, 50, 60, 70, 80])
t = t.delete(30)
expect("delete a node with one child (30)", lambda: t.inorder(), [40, 50, 60, 70, 80])
t = t.delete(50)
expect("delete root with two children (50)", lambda: t.inorder(), [40, 60, 70, 80])
```

## Hidden checks

```python
def is_bst(node, lo=float("-inf"), hi=float("inf")):
    if node is None or node.val is None:
        return True
    if not (lo < node.val < hi):
        return False
    return is_bst(node.left, lo, node.val) and is_bst(node.right, node.val, hi)

t2 = make_tree([50, 30, 70, 20, 40, 60, 80, 65, 55])
t2 = t2.delete(50)
t2 = t2.delete(70)
expect("remains valid BST after two-child deletes", lambda: (is_bst(t2), t2.inorder()), (True, [20, 30, 40, 55, 60, 65, 80]))

t2 = t2.delete(999)
expect("deleting missing value leaves tree unchanged", lambda: t2.inorder(), [20, 30, 40, 55, 60, 65, 80])

solo = make_tree([10])
expect("deleting the only node returns None", lambda: solo.delete(10), None)
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

    def delete(self, val):
        if self.val is None:
            return None
        if val < self.val:
            if self.left is not None:
                self.left = self.left.delete(val)
            return self
        if val > self.val:
            if self.right is not None:
                self.right = self.right.delete(val)
            return self
        if self.right is None:
            return self.left
        if self.left is None:
            return self.right
        successor = self.right
        while successor.left is not None:
            successor = successor.left
        self.val = successor.val
        self.right = self.right.delete(successor.val)
        return self
```

## Restored

Retired markers come cleanly out of the elevation tree without disturbing a single neighbor.
