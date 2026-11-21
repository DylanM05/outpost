---
id: maintenance-kth-smallest
title: Kth lowest elevation
system: Elevation tree
symbol: instrument
scene: tests
skills: trees
reviewSkill: trees
prerequisite: prefix-search
---

## Briefing

Find the `k`-th smallest elevation (1-indexed) stored in a binary search tree.

## Objective

Given `Node(val, left=None, right=None)` in the starter, write `kth_smallest(root, k)` returning the `k`-th smallest value in the BST (`k = 1` is the minimum). Return `None` if `k <= 0` or the tree has fewer than `k` nodes.

```python
# BST containing 20, 30, 40, 50, 70:
kth_smallest(tree, 1)  # 20
kth_smallest(tree, 3)  # 40
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. An in-order traversal visits BST values in ascending sorted order.
2. Stop as soon as you reach the `k`-th visited node (or take `values[k - 1]` if `1 <= k <= len(values)`).

## Starter

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def kth_smallest(root, k):
    return None
```

## Checks

```python
N = get("Node")
tree = N(50, N(30, N(20), N(40)), N(70))
expect("1st smallest is 20", lambda: get("kth_smallest")(tree, 1), 20)
expect("3rd smallest is 40", lambda: get("kth_smallest")(tree, 3), 40)
expect("5th smallest is 70", lambda: get("kth_smallest")(tree, 5), 70)
```

## Hidden checks

```python
expect("k out of range returns None", lambda: get("kth_smallest")(tree, 6), None)
expect("k <= 0 returns None", lambda: get("kth_smallest")(tree, 0), None)
expect("empty tree returns None", lambda: get("kth_smallest")(None, 1), None)
```

## Solution

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def kth_smallest(root, k):
    if k <= 0:
        return None
    stack = []
    curr = root
    count = 0
    while stack or curr is not None:
        while curr is not None:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        count += 1
        if count == k:
            return curr.val
        curr = curr.right
    return None
```

## Restored

The elevation tree reports any rank directly from its in-order walk.
