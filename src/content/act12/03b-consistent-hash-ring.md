---
id: consistent-hash-ring
kind: code
title: Consistent hashing with virtual nodes
system: Service mesh
symbol: instrument
scene: tests
skills: distributed-systems
---

## Briefing

If you shard cache keys across `N` servers with `hash(key) % N`, adding or removing **one** server remaps ~90% of all keys — causing a massive cache stampede!

**Consistent hashing** places both servers (as multiple **virtual nodes** for even balance) and keys onto the same circular hash ring, routing every key clockwise to the next virtual node. When one server joins or leaves a 4-node cluster, only ~25% (`1/N`) of keys move!

## Objective

Write a class `HashRing`:

- `__init__(self, nodes=(), replicas=32)`:
  - `replicas` is the number of virtual nodes per physical node (`>= 1`).
  - Place each node `n` at `replicas` ring positions: `hash_int(f"{n}#{i}")` for `i in range(replicas)`, where `hash_int(s) = int.from_bytes(hashlib.sha256(s.encode("utf-8")).digest()[:8], "big")`.
  - Maintain sorted ring keys (`self._keys`) and a dict mapping ring position -> physical node name (`self._ring`).
- `add_node(self, node)` — inserts `node`'s virtual points into the ring (idempotent if already present).
- `remove_node(self, node)` — removes all virtual points belonging to `node` from the ring.
- `get_node(self, key)` — returns `None` if the ring is empty; otherwise computes `h = hash_int(key)`, uses `bisect.bisect_left(self._keys, h)` (wrapping to index `0` if past the last ring key!), and returns the physical node name!

## Concept

Using `bisect_left` on the sorted ring gives **$O(\log(N \cdot R))$** routing lookups, and `replicas=32` virtual nodes smooth out hash clustering so every node gets a balanced share of keys!

## Hints

1. Keep `self._nodes = set()`, `self._ring = {}`, and `self._keys = []`.
2. After adding or removing a node's points in `self._ring`, rebuild `self._keys = sorted(self._ring)` (add/remove is rare; `get_node` is the hot path!).
3. In `get_node(key)`: `idx = bisect.bisect_left(self._keys, h)`; `if idx == len(self._keys): idx = 0`; `return self._ring[self._keys[idx]]`.

## Starter: guided

```python
import bisect
import hashlib


def _h(text):
    return int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")


class HashRing:
    def __init__(self, nodes=(), replicas=32):
        self.replicas = replicas
        self._nodes = set()
        self._ring = {}
        self._keys = []
        for n in nodes:
            self.add_node(n)

    def add_node(self, node):
        if node in self._nodes:
            return
        self._nodes.add(node)
        for i in range(self.replicas):
            self._ring[_h(f"{node}#{i}")] = node
        self._keys = sorted(self._ring)

    def remove_node(self, node):
        # TODO: remove node and its virtual points, refresh self._keys
        pass

    def get_node(self, key):
        # TODO: bisect_left on self._keys (wrapping to 0) and return node name
        pass
```

## Starter: standard

```python
import bisect
import hashlib


class HashRing:
    def __init__(self, nodes=(), replicas=32):
        pass

    def add_node(self, node):
        pass

    def remove_node(self, node):
        pass

    def get_node(self, key):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
Ring = get("HashRing")
def test_minimal_disruption():
    ring = Ring(["n1", "n2", "n3", "n4"], replicas=64)
    keys = [f"sensor-{i}" for i in range(400)]
    before = {k: ring.get_node(k) for k in keys}
    # Every node gets a meaningful share
    counts = {n: sum(1 for v in before.values() if v == n) for n in ["n1", "n2", "n3", "n4"]}
    balanced = all(c >= 50 for c in counts.values())
    # Adding a 5th node moves roughly 1/5 of keys (far less than mod-N's ~80%!)
    ring.add_node("n5")
    moved = sum(1 for k in keys if ring.get_node(k) != before[k])
    return (balanced, 30 <= moved <= 140)

expect("distributes keys evenly and moves ~1/5 of keys on add_node", test_minimal_disruption, (True, True))

def test_remove():
    ring = Ring(["n1", "n2", "n3"], replicas=32)
    ring.remove_node("n2")
    return all(ring.get_node(f"k-{i}") in ("n1", "n3") for i in range(100))

expect("remove_node stops routing any key to removed node", test_remove, True)
```

## Hidden checks

```python
Ring = get("HashRing")
expect("empty ring returns None", lambda: Ring().get_node("any"), None)
def deterministic():
    r1 = Ring(["a", "b", "c"], replicas=16)
    r2 = Ring(["c", "a", "b"], replicas=16)
    return all(r1.get_node(f"x{i}") == r2.get_node(f"x{i}") for i in range(50))
check("insertion order does not change routing", deterministic)
```

## Solution

```python
import bisect
import hashlib


def _h(text):
    return int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")


class HashRing:
    def __init__(self, nodes=(), replicas=32):
        self.replicas = replicas
        self._nodes = set()
        self._ring = {}
        self._keys = []
        for node in nodes:
            self.add_node(node)

    def add_node(self, node):
        if node in self._nodes:
            return
        self._nodes.add(node)
        for i in range(self.replicas):
            self._ring[_h(f"{node}#{i}")] = node
        self._keys = sorted(self._ring)

    def remove_node(self, node):
        if node not in self._nodes:
            return
        self._nodes.remove(node)
        for i in range(self.replicas):
            self._ring.pop(_h(f"{node}#{i}"), None)
        self._keys = sorted(self._ring)

    def get_node(self, key):
        if not self._keys:
            return None
        idx = bisect.bisect_left(self._keys, _h(str(key)))
        if idx == len(self._keys):
            idx = 0
        return self._ring[self._keys[idx]]
```

## Restored

Adding or losing a node now moves only its fair `1/N` slice of traffic instead of triggering a cluster-wide cache miss storm.
