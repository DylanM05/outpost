---
id: btree-range-scan
kind: code
title: Pruned B-Tree range queries
system: B-tree vault
symbol: controller
scene: tests
skills: storage-engines
---

## Briefing

Why do SQL databases use B-Trees instead of hash tables for `WHERE timestamp BETWEEN 100 AND 120`? Because a B-Tree's sorted separator keys let you **prune** entire subtrees outside `[low, high]` and visit only the handful of nodes that actually overlap the range!

## Objective

Write `btree_range(root, low, high)`:

- `root` is a B-Tree node dict `{"keys": [...], "children": [...], "leaf": bool}` (where `children[i]` holds keys `< keys[i]`, and `children[-1]` holds keys `> keys[-1]`).
- Return all keys `k` in the tree with `low <= k <= high`, in ascending sorted order.
- **Prune branches!** Do NOT descend into `children[i]` if `keys[i] < low` (every key in `children[i]` is strictly `< keys[i] < low`!), and stop once a separator key `k > high` (you may still need `children[i]` right before `k`, which holds keys `< k`, but NEVER `children[i+1]` or later!).

## Concept

Look at the exact pruning rule at separator `k = node["keys"][i]`:
- Descend into `children[i]` **only if** `i == 0 or node["keys"][i - 1] <= high` AND `k >= low` (Wait: even simpler! Every key in `children[i]` lies in `(keys[i-1], keys[i])`, so `children[i]` can overlap `[low, high]` **only if** `(i == 0 or keys[i-1] < high)` and `low < keys[i]` — or conservatively `<=` / `>=`!)
- Notice for the rightmost child `children[-1]`: every key in it is `> keys[-1]`, so descend into `children[-1]` **only if** `keys[-1] <= high`!

## Hints

1. Walk `for i, k in enumerate(keys):`:
   - If not leaf and `k >= low` and `(i == 0 or keys[i - 1] <= high)`: recurse into `children[i]`.
   - If `low <= k <= high`: append `k`.
   - If `k > high`: `return` early (no later key or right child can possibly be `<= high`!).
2. After the loop, if not leaf and `(not keys or keys[-1] <= high)`: recurse into `children[-1]`.

## Starter: guided

```python
def btree_range(root, low, high):
    out = []

    def walk(node):
        keys = node["keys"]
        children = node["children"]
        leaf = node["leaf"]
        for i, k in enumerate(keys):
            # TODO: prune children[i], collect k if low <= k <= high, stop early if k > high
            pass
        if not leaf and (not keys or keys[-1] <= high):
            walk(children[-1])

    if low <= high:
        walk(root)
    return out
```

## Starter: standard

```python
def btree_range(root, low, high):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
# Track how many nodes get visited to prove pruning actually happens!
class CountingNode(dict):
    visits = 0
    def __getitem__(self, k):
        if k == "keys":
            CountingNode.visits += 1
        return super().__getitem__(k)

def build_big_btree():
    # Build a 2-level B-Tree with 20 leaves of 10 keys each (keys 1..220)
    sep_keys = []
    children = []
    cur = 1
    for b in range(20):
        leaf_keys = list(range(cur, cur + 10))
        children.append(CountingNode(keys=leaf_keys, children=[], leaf=True))
        cur += 10
        if b < 19:
            sep_keys.append(cur)
            cur += 1
    return CountingNode(keys=sep_keys, children=children, leaf=False)

tree = build_big_btree()
CountingNode.visits = 0
res = get("btree_range")(tree, 50, 62)
expect("returns exact inclusive range [50..62]", lambda: res, list(range(50, 63)))
check("prunes unrelated subtrees (visits <= 5 nodes out of 21)", lambda: CountingNode.visits <= 5, f"Visited {CountingNode.visits} nodes; prune children outside [low, high].")
```

## Hidden checks

```python
leaf_only = {"keys": [5, 10, 15, 20], "children": [], "leaf": True}
expect("single-leaf range query", lambda: get("btree_range")(leaf_only, 10, 15), [10, 15])
expect("empty range when low > high", lambda: get("btree_range")(leaf_only, 20, 10), [])
```

## Solution

```python
def btree_range(root, low, high):
    out = []

    def walk(node):
        keys = node["keys"]
        children = node["children"]
        leaf = node["leaf"]
        for i, k in enumerate(keys):
            if not leaf and k >= low and (i == 0 or keys[i - 1] <= high):
                walk(children[i])
            if low <= k <= high:
                out.append(k)
            if k > high:
                return
        if not leaf and (not keys or keys[-1] <= high):
            walk(children[-1])

    if low <= high:
        walk(root)
    return out
```

## Restored

Range scans skip irrelevant disk pages completely, visiting only the handful of B-Tree nodes touching `[low, high]`.
