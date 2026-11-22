---
id: quorum-store
kind: code
title: Quorum replication and read repair
system: Quorum vault
symbol: controller
scene: tests
skills: distributed-systems
---

## Briefing

In a Dynamo-style replicated store with $N$ replicas, a write succeeds once $W$ replicas acknowledge it, and a read succeeds once $R$ replicas respond. Whenever **$W + R > N$** (for example, $N=3, W=2, R=2$), every read quorum is mathematically guaranteed to overlap with the latest write quorum — so you always see the newest version, **even if one node is down**! And when a read spots a stale replica, it heals it on the spot via **read repair**.

## Objective

Write a class `QuorumStore`:

- `__init__(self, node_names, w, r)`:
  - Validate `1 <= w <= len(node_names)` and `1 <= r <= len(node_names)` (raise `ValueError` otherwise).
  - Each replica starts online (`self._online = set(node_names)`) with an empty dict `{key: (version, value)}`.
  - Keep a monotonic version counter starting at `0`.
- `set_online(self, node, online: bool)` — marks `node` reachable or unreachable (simulating a crash or network partition).
- `put(self, key, value)`:
  - Check how many replicas are currently online. If `len(online) < w`, raise `RuntimeError("write quorum not met")` (do **not** write partial updates!).
  - Otherwise increment the version counter (`version += 1`), write `(version, value)` to every currently online replica, and return `version`.
- `get(self, key)`:
  - If fewer than `r` replicas are currently online, raise `RuntimeError("read quorum not met")`.
  - Query all currently online replicas for `key`. If none of them has `key`, return `None`.
  - Otherwise pick the entry `(best_ver, best_val)` with the **highest `version`**.
  - **Read repair:** update any online replica that is missing `key` or has an older `version < best_ver` with `(best_ver, best_val)`!
  - Return `best_val`.

## Concept

Trace what happens when $N=3, W=2, R=2$:
1. Node C goes offline. `put("freq", 147.33)` writes `(v=1, 147.33)` to Nodes A and B (`2 >= W`, succeeds!).
2. Node C comes back online (still missing `"freq"`!), and Node A goes offline.
3. `get("freq")` reads from B `(v=1, 147.33)` and C `(missing)` (`2 >= R`, succeeds!), returns `147.33`, AND immediately repairs C to `(v=1, 147.33)`!

## Hints

1. Store `self._data = {n: {} for n in node_names}` and `self._online = set(node_names)`.
2. In `get(key)`, collect `found = [(n, self._data[n][key]) for n in self._online if key in self._data[n]]`, find `best_ver, best_val = max((pair for _, pair in found), key=lambda pair: pair[0])`, and repair every `n in self._online` whose version is `< best_ver`.

## Starter: guided

```python
class QuorumStore:
    def __init__(self, node_names, w, r):
        names = list(node_names)
        if not names or not (1 <= w <= len(names)) or not (1 <= r <= len(names)):
            raise ValueError("invalid quorum settings")
        self.w = w
        self.r = r
        self._data = {n: {} for n in names}
        self._online = set(names)
        self._version = 0

    def set_online(self, node, online):
        if online:
            self._online.add(node)
        else:
            self._online.discard(node)

    def put(self, key, value):
        # TODO: check len(self._online) >= self.w, bump version, write to online nodes
        pass

    def get(self, key):
        # TODO: check len(self._online) >= self.r, pick highest version, read-repair stale online nodes
        pass
```

## Starter: standard

```python
class QuorumStore:
    def __init__(self, node_names, w, r):
        pass

    def set_online(self, node, online):
        pass

    def put(self, key, value):
        pass

    def get(self, key):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
QS = get("QuorumStore")
def test_quorum_and_read_repair():
    qs = QS(["n1", "n2", "n3"], w=2, r=2)
    qs.set_online("n3", False)
    v1 = qs.put("freq", "147.33")   # writes n1, n2
    qs.set_online("n3", True)
    qs.set_online("n1", False)
    val1 = qs.get("freq")           # reads n2 + stale n3 -> returns 147.33 AND repairs n3!
    # Now even if n2 goes down and n1 comes back, n3 alone has the repaired value
    qs.set_online("n2", False)
    qs.set_online("n1", True)
    val2 = qs.get("freq")
    return (v1, val1, val2)

expect("survives rolling node outages and heals stale replicas via read repair", test_quorum_and_read_repair, (1, "147.33", "147.33"))

def test_quorum_failure():
    qs = QS(["n1", "n2", "n3"], w=2, r=2)
    qs.set_online("n2", False)
    qs.set_online("n3", False)
    try:
        qs.put("k", "v")
        return False
    except RuntimeError:
        return True
check("put raises RuntimeError when fewer than W nodes are online", test_quorum_failure)
```

## Hidden checks

```python
QS = get("QuorumStore")
def test_read_repair_heals_older_version():
    qs = QS(["a", "b", "c"], w=2, r=2)
    qs.put("x", "old")
    qs.set_online("c", False)
    qs.put("x", "new")
    qs.set_online("c", True)
    qs.set_online("a", False)
    got = qs.get("x")           # repairs c from old -> new
    qs.set_online("b", False)
    qs.set_online("a", True)
    # Wait: verify c actually got repaired by disabling a and enabling b? Better: check directly with r=1!
    qs2 = QS(["a", "b", "c"], w=2, r=1)
    qs2.put("x", "old")
    qs2.set_online("c", False)
    qs2.put("x", "new")
    qs2.set_online("c", True)
    qs2.get("x")                # reads a, b, c and repairs c!
    qs2.set_online("a", False)
    qs2.set_online("b", False)
    return (got, qs2.get("x"))

expect("stale node c serves repaired 'new' value even when a and b go offline", test_read_repair_heals_older_version, ("new", "new"))
```

## Solution

```python
class QuorumStore:
    def __init__(self, node_names, w, r):
        names = list(node_names)
        if not names or not (1 <= w <= len(names)) or not (1 <= r <= len(names)):
            raise ValueError("invalid quorum configuration")
        self.w = w
        self.r = r
        self._data = {n: {} for n in names}
        self._online = set(names)
        self._version = 0

    def set_online(self, node, online):
        if node not in self._data:
            raise ValueError(f"unknown node: {node}")
        if online:
            self._online.add(node)
        else:
            self._online.discard(node)

    def put(self, key, value):
        if len(self._online) < self.w:
            raise RuntimeError("write quorum not met")
        self._version += 1
        entry = (self._version, value)
        for node in self._online:
            self._data[node][key] = entry
        return self._version

    def get(self, key):
        if len(self._online) < self.r:
            raise RuntimeError("read quorum not met")
        found = [self._data[n][key] for n in self._online if key in self._data[n]]
        if not found:
            return None
        best_ver, best_val = max(found, key=lambda pair: pair[0])
        for node in self._online:
            cur = self._data[node].get(key)
            if cur is None or cur[0] < best_ver:
                self._data[node][key] = (best_ver, best_val)
        return best_val
```

## Restored

Reads and writes stay consistent across node failures whenever $W + R > N$, and stale replicas heal automatically on read.
