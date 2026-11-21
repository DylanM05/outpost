---
id: maintenance-simplify-path
title: Collapse a directory path
system: Command stack
symbol: equipment
scene: tests
skills: linear-structures
reviewSkill: linear-structures
prerequisite: wait-times
---

## Briefing

Logs from the relay terminal contain messy paths like `"/home/ranger/../ranger/./logs/"`. Collapse `.` and `..` segments cleanly using a stack.

## Objective

Write `simplify_path(path)` for a Unix absolute path starting with `"/"`. Ignore empty segments (`//`) and `"."`; pop the last directory on `".."` (if any); push normal names. Return the canonical path starting with `"/"` (e.g. `"/home/ranger/logs"`, or `"/"` if empty).

```python
simplify_path("/home/ranger/../ranger/./logs/")  # "/home/ranger/logs"
simplify_path("/a/../../b")                      # "/b"
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split on `"/"`, skipping `""` and `"."`.
2. On `".."`, pop from `stack` if non-empty; otherwise append the segment.
3. Return `"/" + "/".join(stack)`.

## Starter

```python
```

## Checks

```python
expect("normalizes .. and .", lambda: get("simplify_path")("/home/ranger/../ranger/./logs/"), "/home/ranger/logs")
expect("clamps extra .. at root", lambda: get("simplify_path")("/a/../../b"), "/b")
```

## Hidden checks

```python
expect("root stays /", lambda: get("simplify_path")("/"), "/")
expect("all popped returns /", lambda: get("simplify_path")("/x/y/../.."), "/")
expect("collapses multiple slashes", lambda: get("simplify_path")("///srv//archive///"), "/srv/archive")
```

## Solution

```python
def simplify_path(path):
    stack = []
    for part in path.split("/"):
        if not part or part == ".":
            continue
        if part == "..":
            if stack:
                stack.pop()
        else:
            stack.append(part)
    return "/" + "/".join(stack)
```

## Restored

Messy log paths collapse to canonical form in one stack pass.
