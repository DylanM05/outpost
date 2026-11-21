---
id: vector-clocks
kind: code
title: Detect causal conflicts with vector clocks
system: Quorum vault
symbol: controller
scene: tests
skills: distributed-systems
---

## Briefing

Wall-clock timestamps lie across distributed nodes because hardware clocks drift! **Vector clocks** track logical event counts per node (`{"ridge": 2, "valley": 1}`) so replicas can tell **exact causality** apart from true **concurrent conflicts** that need merging.

## Objective

Write three pure functions (never mutating input dicts!):

1. `vc_tick(clock, node)` — returns a new dict with `clock.get(node, 0) + 1`.
2. `vc_merge(c1, c2)` — returns a new dict containing every key from `c1` and `c2`, with `max(c1.get(k, 0), c2.get(k, 0))`.
3. `vc_compare(c1, c2)` — compares `c1` and `c2` across all keys in `set(c1) | set(c2)` (treating missing keys as `0`):
   - `"equal"` if `c1[k] == c2[k]` for all `k`
   - `"before"` if `c1[k] <= c2[k]` for all `k` and strictly `<` for at least one `k` (`c1` causally precedes `c2`)
   - `"after"` if `c1[k] >= c2[k]` for all `k` and strictly `>` for at least one `k` (`c1` causally follows `c2`)
   - `"concurrent"` if `c1` is strictly greater on some key AND `c2` is strictly greater on another key (conflict!)

```python
vc_compare({"a": 1, "b": 0}, {"a": 1, "b": 2})  # "before"
vc_compare({"a": 2, "b": 1}, {"a": 1, "b": 2})  # "concurrent"
```

## Concept

When two disconnected outposts both edit the same supply record without seeing each other's update:
- Ridge produces `{"ridge": 2, "valley": 1}`.
- Valley produces `{"ridge": 1, "valley": 2}`.
- `vc_compare` returns `"concurrent"` — telling the cluster **not** to silently overwrite one with the other, and instead preserve both siblings or apply a merge rule!

## Hints

1. In `vc_compare`, compute `less = any(c1.get(k, 0) < c2.get(k, 0) for k in keys)` and `greater = any(c1.get(k, 0) > c2.get(k, 0) for k in keys)`.
2. Four cases map directly to `(less, greater)`: `(False, False)` -> `"equal"`, `(True, False)` -> `"before"`, `(False, True)` -> `"after"`, `(True, True)` -> `"concurrent"`!

## Starter: guided

```python
def vc_tick(clock, node):
    out = dict(clock)
    out[node] = out.get(node, 0) + 1
    return out


def vc_merge(c1, c2):
    keys = set(c1) | set(c2)
    return {k: max(c1.get(k, 0), c2.get(k, 0)) for k in keys}


def vc_compare(c1, c2):
    keys = set(c1) | set(c2)
    # TODO: check less and greater across keys -> equal / before / after / concurrent
    pass
```

## Starter: standard

```python
def vc_tick(clock, node):
    pass


def vc_merge(c1, c2):
    pass


def vc_compare(c1, c2):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("vc_tick increments without mutating", lambda: get("vc_tick")({"a": 1}, "a"), {"a": 2})
expect("vc_merge takes element-wise max", lambda: get("vc_merge")({"a": 2, "b": 1}, {"b": 3, "c": 1}), {"a": 2, "b": 3, "c": 1})
expect("vc_compare before (treats missing as 0)", lambda: get("vc_compare")({"a": 1}, {"a": 1, "b": 1}), "before")
expect("vc_compare after", lambda: get("vc_compare")({"a": 2, "b": 1}, {"a": 1, "b": 1}), "after")
expect("vc_compare concurrent conflict", lambda: get("vc_compare")({"a": 2, "b": 1}, {"a": 1, "b": 2}), "concurrent")
```

## Hidden checks

```python
expect("missing zero equals explicit zero", lambda: get("vc_compare")({"a": 1, "b": 0}, {"a": 1}), "equal")
orig = {"a": 1}
get("vc_tick")(orig, "a")
expect("vc_tick does not mutate input dict", lambda: orig, {"a": 1})
```

## Solution

```python
def vc_tick(clock, node):
    out = dict(clock)
    out[node] = out.get(node, 0) + 1
    return out


def vc_merge(c1, c2):
    keys = set(c1) | set(c2)
    return {k: max(c1.get(k, 0), c2.get(k, 0)) for k in keys}


def vc_compare(c1, c2):
    keys = set(c1) | set(c2)
    less = any(c1.get(k, 0) < c2.get(k, 0) for k in keys)
    greater = any(c1.get(k, 0) > c2.get(k, 0) for k in keys)
    if less and greater:
        return "concurrent"
    if less:
        return "before"
    if greater:
        return "after"
    return "equal"
```

## Restored

The quorum vault now distinguishes causal updates from genuine split-brain conflicts without trusting drifting wall clocks.
