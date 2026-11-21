---
id: maintenance-validate-bst
title: Verify the elevation tree
system: Elevation tree
symbol: instrument
scene: tests
skills: trees
reviewSkill: trees
prerequisite: prefix-search
---

## Briefing

Before trusting a deserialized binary search tree, verify that **every** node satisfies the strict BST invariant — not just against its immediate parent, but against every ancestor above it!

## Objective

Given `Node(val, left=None, right=None)` in the starter, write `is_valid_bst(root)`. Return `True` if the tree rooted at `root` is a valid strict binary search tree (every value in `left` strictly `< node.val`, every value in `right` strictly `> node.val`, recursively), or `False` otherwise. An empty tree (`None`) is valid (`True`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Pass `(low, high)` bounds down recursively, starting at `(float("-inf"), float("inf"))`.
2. At each node, check `low < node.val < high`, then recurse left with `(low, node.val)` and right with `(node.val, high)`.

## Starter

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def is_valid_bst(root):
    return False
```

## Checks

```python
N = get("Node")
good = N(50, N(30, N(20), N(40)), N(70, N(60), N(80)))
tricky_bad = N(50, N(30, N(20), N(55)), N(70))
expect("valid BST returns True", lambda: get("is_valid_bst")(good), True)
expect("55 inside left subtree of 50 returns False", lambda: get("is_valid_bst")(tricky_bad), False, "Check ancestor bounds (low, high), not just direct children.")
```

## Hidden checks

```python
expect("None is valid", lambda: get("is_valid_bst")(None), True)
expect("duplicate value is invalid", lambda: get("is_valid_bst")(N(10, N(10), None)), False)
expect("right subtree violating root bound is invalid", lambda: get("is_valid_bst")(N(50, N(30), N(70, N(45), N(80)))), False)
```

## Solution

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def is_valid_bst(root):
    def check(node, low, high):
        if node is None:
            return True
        if not (low < node.val < high):
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, float("-inf"), float("inf"))
```

## Restored

Corrupt subtrees are caught across the entire depth of the elevation tree.
