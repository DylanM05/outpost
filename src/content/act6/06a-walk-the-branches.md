---
id: walk-the-branches
kind: predict
title: Walk the branches
system: Elevation tree
symbol: instrument
scene: console
skills: trees, recursion, reading-code
---

## Briefing

Elevation markers arrive continuously from the field drones, and the survey office needs both fast lookups *and* sorted ranges without re-sorting a list after every new marker. A **binary search tree** keeps every left branch smaller than its node and every right branch larger. Trace how walking the tree in two different orders produces two very different sequences.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

In a **binary search tree (BST)**, every node has up to two children, `left` and `right`:

- Everything in the `left` subtree is smaller than `node.val`.
- Everything in the `right` subtree is larger than `node.val`.

Because of that rule, walking **left → node → right** (an **in-order traversal**) visits every value in sorted order! Walking **node → left → right** (**pre-order**) visits parents before their children.

## Hints

1. The tree has `50` at the root, `30` on its left (with `20` and `40` under `30`), and `70` on its right.
2. `preorder` prints the node *before* recursing left and right.
3. `inorder` recurses left first, then records the node, then recurses right — so it always comes out sorted.

## Program

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def preorder(node, out):
    if node is None:
        return
    out.append(node.val)
    preorder(node.left, out)
    preorder(node.right, out)


def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.val)
    inorder(node.right, out)


tree = Node(50, Node(30, Node(20), Node(40)), Node(70))
pre = []
ino = []
preorder(tree, pre)
inorder(tree, ino)
print(pre)
print(ino)
```

## Output

```text
[50, 30, 20, 40, 70]
[20, 30, 40, 50, 70]
```

## Restored

You traced both walks: pre-order mirrors the tree's shape, while in-order reads the elevations out from lowest to highest.
