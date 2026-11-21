---
id: btree-node-split
kind: code
title: Self-balancing B-Tree inserts and splits
system: B-tree vault
symbol: controller
scene: tests
skills: storage-engines
---

## Briefing

Binary search trees are terrible on disk: each node holds only 1 key, so searching 1,000,000 rows takes ~20 random disk reads (and sorted inserts degenerate into a linked list!).

Databases like SQLite and PostgreSQL use **B-Trees**: fat multi-way nodes holding many sorted keys per disk page. When a node overflows `max_keys`, it **splits** right down the middle, pushing its median key up to its parent — keeping every single leaf at the **exact same depth** forever!

## Objective

Write a class `BTree`:

- `__init__(self, t=2)` — minimum degree `t >= 2` (so every node holds at most `2 * t - 1` keys, e.g. for `t = 2`, a 2-3-4 tree with `max_keys = 3`). Root starts as an empty leaf node `{"keys": [], "children": [], "leaf": True}`.
- `search(self, key)` — returns `True` if `key` is in the tree, else `False`.
- `insert(self, key)` — inserts `key` (no-op if already present), splitting full children proactively on the way down (CLRS standard B-Tree split!) so the tree stays **strictly balanced** even when inserting `1, 2, 3, ..., 200` in sorted order!
- `height(self)` — returns the height of the tree (`1` for just the root).
- `inorder(self)` — returns all keys in strictly ascending sorted order.

## Concept

Why split a full child (`len(keys) == 2*t - 1`) *before* descending into it?
- Because splitting a full node moves its middle key `keys[t - 1]` up into the parent (which is guaranteed to have room because we already split the parent if it was full!).
- That single top-down pass avoids ever walking back up the tree, and guarantees every root-to-leaf path has the **exact same height** $O(\log_t N)$!

## Hints

1. Write `_split_child(parent, idx)`: let `full = parent["children"][idx]`, `mid = full["keys"][t - 1]`, split `full["keys"]` into `[:t - 1]` (left) and `[t:]` (right), and if not leaf split `full["children"]` into `[:t]` and `[t:]`. Insert `mid` at `parent["keys"][idx]` and `right` at `parent["children"][idx + 1]`.
2. In `insert(key)`: if `search(key)` is already `True`, return early; if `len(root["keys"]) == 2 * t - 1`, create a new non-leaf root with `children=[old_root]`, call `_split_child(new_root, 0)`, and call `_insert_non_full(new_root, key)`.

## Starter: guided

```python
import bisect


class BTree:
    def __init__(self, t=2):
        if t < 2:
            raise ValueError("minimum degree t must be >= 2")
        self.t = t
        self.root = {"keys": [], "children": [], "leaf": True}

    def search(self, key, node=None):
        node = self.root if node is None else node
        i = bisect.bisect_left(node["keys"], key)
        if i < len(node["keys"]) and node["keys"][i] == key:
            return True
        if node["leaf"]:
            return False
        return self.search(key, node["children"][i])

    def _split_child(self, parent, i):
        t = self.t
        full = parent["children"][i]
        right = {
            "keys": full["keys"][t:],
            "children": [] if full["leaf"] else full["children"][t:],
            "leaf": full["leaf"],
        }
        mid = full["keys"][t - 1]
        full["keys"] = full["keys"][: t - 1]
        if not full["leaf"]:
            full["children"] = full["children"][:t]
        parent["keys"].insert(i, mid)
        parent["children"].insert(i + 1, right)

    def insert(self, key):
        if self.search(key):
            return
        # TODO: if root is full (2*t - 1), grow a new root and split; then _insert_non_full
        pass

    def height(self):
        h = 1
        node = self.root
        while not node["leaf"]:
            h += 1
            node = node["children"][0]
        return h

    def inorder(self, node=None):
        node = self.root if node is None else node
        if node["leaf"]:
            return list(node["keys"])
        out = []
        for i, k in enumerate(node["keys"]):
            out.extend(self.inorder(node["children"][i]))
            out.append(k)
        out.extend(self.inorder(node["children"][-1]))
        return out
```

## Starter: standard

```python
import bisect


class BTree:
    def __init__(self, t=2):
        pass

    def search(self, key):
        pass

    def insert(self, key):
        pass

    def height(self):
        pass

    def inorder(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
BT = get("BTree")
def test_sorted_inserts_stay_shallow():
    bt = BT(t=3)
    for k in range(1, 201):
        bt.insert(k)
    bt.insert(50)  # duplicate ignored
    return (
        bt.inorder() == list(range(1, 201)),
        bt.search(1),
        bt.search(137),
        bt.search(201),
        bt.height() <= 5,
    )

expect("200 sorted inserts stay shallow (height <= 5) and preserve sorted order", test_sorted_inserts_stay_shallow, (True, True, True, False, True))
```

## Hidden checks

```python
BT = get("BTree")
def test_all_leaves_equal_depth():
    bt = BT(t=2)
    for k in [50, 10, 90, 20, 80, 30, 70, 40, 60, 5, 95, 15, 85, 25, 75]:
        bt.insert(k)
    depths = set()
    def walk(node, d):
        assert len(node["keys"]) <= 3
        if node["leaf"]:
            depths.add(d)
        else:
            assert len(node["children"]) == len(node["keys"]) + 1
            for c in node["children"]:
                walk(c, d + 1)
    walk(bt.root, 1)
    return (len(depths) == 1, bt.inorder() == sorted([50, 10, 90, 20, 80, 30, 70, 40, 60, 5, 95, 15, 85, 25, 75]))

expect("every leaf sits at identical depth and obeys max_keys invariant", test_all_leaves_equal_depth, (True, True))
```

## Solution

```python
import bisect


class BTree:
    def __init__(self, t=2):
        if t < 2:
            raise ValueError("minimum degree t must be >= 2")
        self.t = t
        self.root = {"keys": [], "children": [], "leaf": True}

    def search(self, key, node=None):
        node = self.root if node is None else node
        i = bisect.bisect_left(node["keys"], key)
        if i < len(node["keys"]) and node["keys"][i] == key:
            return True
        if node["leaf"]:
            return False
        return self.search(key, node["children"][i])

    def _split_child(self, parent, i):
        t = self.t
        full = parent["children"][i]
        right = {
            "keys": full["keys"][t:],
            "children": [] if full["leaf"] else full["children"][t:],
            "leaf": full["leaf"],
        }
        mid = full["keys"][t - 1]
        full["keys"] = full["keys"][: t - 1]
        if not full["leaf"]:
            full["children"] = full["children"][:t]
        parent["keys"].insert(i, mid)
        parent["children"].insert(i + 1, right)

    def _insert_non_full(self, node, key):
        i = bisect.bisect_left(node["keys"], key)
        if node["leaf"]:
            node["keys"].insert(i, key)
            return
        if len(node["children"][i]["keys"]) == 2 * self.t - 1:
            self._split_child(node, i)
            if key > node["keys"][i]:
                i += 1
        self._insert_non_full(node["children"][i], key)

    def insert(self, key):
        if self.search(key):
            return
        if len(self.root["keys"]) == 2 * self.t - 1:
            new_root = {"keys": [], "children": [self.root], "leaf": False}
            self._split_child(new_root, 0)
            self.root = new_root
        self._insert_non_full(self.root, key)

    def height(self):
        h = 1
        node = self.root
        while not node["leaf"]:
            h += 1
            node = node["children"][0]
        return h

    def inorder(self, node=None):
        node = self.root if node is None else node
        if node["leaf"]:
            return list(node["keys"])
        out = []
        for i, k in enumerate(node["keys"]):
            out.extend(self.inorder(node["children"][i]))
            out.append(k)
        out.extend(self.inorder(node["children"][-1]))
        return out
```

## Restored

Even 200 strictly ascending inserts stay balanced at height 3–4 — the exact self-balancing property behind SQLite and PostgreSQL indexes.
