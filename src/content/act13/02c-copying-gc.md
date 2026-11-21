---
id: copying-gc
kind: code
title: Compacting copying garbage collector
system: Collector bay
symbol: controller
scene: tests
skills: memory-management
---

## Briefing

Mark-and-sweep leaves holes scattered across the heap. **Copying / compacting GC** (used in Java's young generation and V8's scavenger) copies every reachable object tightly together into a fresh `to-space` starting at address `0`, **updating every pointer** via a **forwarding table** (`old_addr -> new_addr`)! The result: zero fragmentation and instant bump-pointer allocation!

## Objective

Write `compact_heap(objects, roots)`:

- `objects` is a dict `{old_addr: {"size": int, "refs": list[int]}}` (where `old_addr` is an integer byte address).
- `roots` is a list of `old_addr` integers pointing to live root objects.
- Discover all reachable objects from `roots` (BFS/DFS, preserving traversal order or deterministic ascending `old_addr` order — specifically sort reachable `old_addr`s in **ascending `old_addr`** order so the compacted layout is 100% deterministic!).
- Assign each reachable object a brand-new contiguous address starting at `0` (`next_free = 0`; each object gets `new_addr = next_free`, then `next_free += obj["size"]`), building `forwarding[old_addr] = new_addr`.
- Rewrite every surviving object's `"refs"` and `roots` through `forwarding`!
- Return:
  ```python
  {
      "objects": new_objects,     # {new_addr: {"size": ..., "refs": [forwarded_addrs]}}
      "roots": new_roots,         # [forwarding[r] for r in roots]
      "forwarding": forwarding,   # {old_addr: new_addr}
      "next_free": next_free,     # total live bytes (new bump pointer!)
  }
  ```

## Concept

Look at what copying GC achieves in one sweep:
1. Unreachable garbage (including cycles!) is never even touched — work is proportional only to **live** objects!
2. Live objects pack tightly at `[0, next_free)` with zero holes, so subsequent allocations just bump `next_free`!
3. Every pointer (`roots` and `refs`) is rewritten through `forwarding` so the pointer graph remains isomorphic.

## Hints

1. First run reachability from `roots` to find `reachable = sorted(marked)`.
2. Walk `for old_addr in reachable:` assigning `forwarding[old_addr] = next_free` and advancing `next_free += objects[old_addr]["size"]`.
3. Build `new_objects` mapping `forwarding[old_addr]` -> `{"size": obj["size"], "refs": [forwarding[c] for c in obj["refs"] if c in forwarding]}` and `new_roots = [forwarding[r] for r in roots if r in forwarding]`.

## Starter: guided

```python
def compact_heap(objects, roots):
    stack = [r for r in roots if r in objects]
    marked = set(stack)
    while stack:
        addr = stack.pop()
        for child in objects[addr]["refs"]:
            if child in objects and child not in marked:
                marked.add(child)
                stack.append(child)

    forwarding = {}
    next_free = 0
    for old_addr in sorted(marked):
        # TODO: map old_addr -> next_free and bump next_free by size
        pass

    # TODO: rebuild new_objects and new_roots using forwarding
    pass
```

## Starter: standard

```python
def compact_heap(objects, roots):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
objs = {
    0: {"size": 16, "refs": []},         # dead garbage
    16: {"size": 8, "refs": [64]},       # live root -> points to 64
    32: {"size": 32, "refs": [32]},      # dead self-cycle
    64: {"size": 24, "refs": [16]},      # live cycle back to 16
}
expect(
    "compacts live objects to 0..32 and rewrites cyclic pointers cleanly",
    lambda: get("compact_heap")(objs, [16]),
    {
        "objects": {
            0: {"size": 8, "refs": [8]},
            8: {"size": 24, "refs": [0]},
        },
        "roots": [0],
        "forwarding": {16: 0, 64: 8},
        "next_free": 32,
    },
)
```

## Hidden checks

```python
expect(
    "empty roots compacts to empty heap at next_free=0",
    lambda: get("compact_heap")({10: {"size": 10, "refs": []}}, []),
    {"objects": {}, "roots": [], "forwarding": {}, "next_free": 0},
)
```

## Solution

```python
def compact_heap(objects, roots):
    stack = [r for r in roots if r in objects]
    marked = set(stack)
    while stack:
        addr = stack.pop()
        for child in objects[addr]["refs"]:
            if child in objects and child not in marked:
                marked.add(child)
                stack.append(child)

    forwarding = {}
    next_free = 0
    for old_addr in sorted(marked):
        forwarding[old_addr] = next_free
        next_free += objects[old_addr]["size"]

    new_objects = {}
    for old_addr in sorted(marked):
        obj = objects[old_addr]
        new_objects[forwarding[old_addr]] = {
            "size": obj["size"],
            "refs": [forwarding[c] for c in obj["refs"] if c in forwarding],
        }
    new_roots = [forwarding[r] for r in roots if r in forwarding]
    return {
        "objects": new_objects,
        "roots": new_roots,
        "forwarding": forwarding,
        "next_free": next_free,
    }
```

## Restored

Live objects pack tightly from address `0` with every cyclic pointer forwarded cleanly — zero fragmentation left behind.
