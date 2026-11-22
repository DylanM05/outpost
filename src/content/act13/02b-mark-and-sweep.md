---
id: mark-and-sweep
kind: code
title: Mark-and-sweep garbage collection
system: Collector bay
symbol: controller
scene: tests
skills: memory-management
---

## Briefing

**Mark-and-sweep** (invented by John McCarthy in 1960 for Lisp, and still at the heart of Go, JavaScript, and Python's cycle GC!) solves reference cycles completely by asking one simple graph question:

> *"Starting from the **roots** (stack variables and globals), which objects are **reachable**?"*

Anything reachable gets **marked**; everything else — even a giant tangled cycle of objects pointing at each other — gets **swept**!

## Objective

Write `mark_and_sweep(heap, roots)`:

- `heap` is a dict mapping every allocated `obj_id -> list[child_ids]`.
- `roots` is an iterable of root `obj_id`s (ignore any root not present in `heap`).
- **Mark phase:** traverse from `roots` following outgoing `heap[obj_id]` references (tracking `marked = set()` so cycles in the reachable graph never loop forever!).
- **Sweep phase:** partition all keys in `heap` into `kept` (in `marked`) and `freed` (not in `marked`).
- Return `{"kept": sorted(kept), "freed": sorted(freed)}` without mutating `heap`.

## Concept

Notice the connection to Act II & VI graph search: a garbage collector's Mark phase is literally **DFS/BFS reachability** from the root set! Because unreachable cycles (`A -> B -> A`) have no path from `roots`, `marked` never visits them and the Sweep phase reclaims both in one pass.

## Hints

1. Initialize `stack = [r for r in roots if r in heap]` and `marked = set(stack)`.
2. While `stack`: pop `obj`, and for each `child` in `heap[obj]`, if `child in heap and child not in marked`: mark it and push it.
3. `freed = sorted(k for k in heap if k not in marked)`.

## Starter: guided

```python
def mark_and_sweep(heap, roots):
    stack = [r for r in roots if r in heap]
    marked = set(stack)
    while stack:
        obj = stack.pop()
        # TODO: visit every live child of obj not yet in marked
        pass
    kept = sorted(marked)
    freed = sorted(k for k in heap if k not in marked)
    return {"kept": kept, "freed": freed}
```

## Starter: standard

```python
def mark_and_sweep(heap, roots):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
heap = {
    "root": ["node1"],
    "node1": ["node2"],
    "node2": ["node1"],   # reachable cycle -> MUST BE KEPT!
    "leakA": ["leakB"],
    "leakB": ["leakA"],   # unreachable cycle -> MUST BE FREED!
    "orphan": [],
}
expect(
    "keeps reachable cycles and reclaims unreachable cycles and orphans",
    lambda: get("mark_and_sweep")(heap, ["root"]),
    {"kept": ["node1", "node2", "root"], "freed": ["leakA", "leakB", "orphan"]},
)
```

## Hidden checks

```python
expect("empty roots frees entire heap", lambda: get("mark_and_sweep")({"a": ["b"], "b": ["a"]}, []), {"kept": [], "freed": ["a", "b"]})
expect("ignores dangling root or child IDs not in heap", lambda: get("mark_and_sweep")({"a": ["missing"]}, ["a", "ghost"]), {"kept": ["a"], "freed": []})
```

## Solution

```python
def mark_and_sweep(heap, roots):
    stack = [r for r in roots if r in heap]
    marked = set(stack)
    while stack:
        obj = stack.pop()
        for child in heap[obj]:
            if child in heap and child not in marked:
                marked.add(child)
                stack.append(child)
    return {
        "kept": sorted(marked),
        "freed": sorted(k for k in heap if k not in marked),
    }
```

## Restored

Cyclic garbage islands are reclaimed cleanly in a single reachability pass while reachable graphs stay completely untouched.
