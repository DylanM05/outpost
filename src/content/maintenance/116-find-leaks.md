---
id: maintenance-find-leaks
title: Detect unreachable heap cycles
system: Collector bay
symbol: equipment
scene: tests
skills: memory-management
reviewSkill: memory-management
prerequisite: copying-gc
---

## Briefing

Reference counting misses reference cycles (`A -> B -> A`) once no root points into the cycle. Write a tracing reachability pass that reports every leaked object ID.

## Objective

Write `find_unreachable(heap, roots)` where `heap` is a dict mapping each allocated object ID (`str`) to a list of referenced object IDs, and `roots` is an iterable of root object IDs.

Trace all objects reachable from `roots` (ignoring any root or child ID not present in `heap`), and return a **sorted** list of all object IDs in `heap` that are NOT reachable.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Run a DFS or BFS starting from `[r for r in roots if r in heap]`, keeping a `visited` set so cycles don't loop forever.
2. Return `sorted(obj for obj in heap if obj not in visited)`.

## Starter

```python
```

## Checks

```python
expect(
    "finds isolated cycle as unreachable",
    lambda: get("find_unreachable")({"r": ["a"], "a": [], "c1": ["c2"], "c2": ["c1"]}, ["r"]),
    ["c1", "c2"],
)
expect(
    "all reachable returns empty list",
    lambda: get("find_unreachable")({"a": ["b"], "b": ["a"]}, ["a"]),
    [],
)
```

## Hidden checks

```python
expect(
    "ignores dangling root and child pointers",
    lambda: get("find_unreachable")({"a": ["missing"], "b": []}, ["ghost", "a"]),
    ["b"],
)
expect("empty roots marks whole heap unreachable", lambda: get("find_unreachable")({"x": ["y"], "y": []}, []), ["x", "y"])
```

## Solution

```python
def find_unreachable(heap, roots):
    visited = set()
    stack = [r for r in roots if r in heap]
    while stack:
        obj = stack.pop()
        if obj in visited:
            continue
        visited.add(obj)
        for child in heap[obj]:
            if child in heap and child not in visited:
                stack.append(child)
    return sorted(obj for obj in heap if obj not in visited)
```

## Restored

Cyclic garbage is identified cleanly by tracing from live roots.
