---
id: symlink-resolve
title: Resolve POSIX symbolic links with loop detection
system: Buddy slab
symbol: controller
scene: tests
skills: os-filesystems
---

## Briefing

Unlike hard links, symbolic links store a **target path string** — which can point to another directory, another symlink, a relative path `../v2`, or even back to itself (`a -> b -> a`)! Resolve arbitrary symlink chains while enforcing a hop limit (`ELOOP`).

## Concept

Walk an absolute POSIX `path` component by component using a queue of remaining parts:
- Maintain `resolved = []` (current canonical path components below `"/"`).
- Pop the next component `part`:
  - Skip `""` and `"."`.
  - If `part == ".."`: pop from `resolved` if non-empty.
  - Otherwise append `part` to `resolved`, build `current = "/" + "/".join(resolved)`.
  - If `current in symlinks`:
    - Increment `hops += 1`; if `hops > max_hops`, raise `RuntimeError("too many symbolic links")`.
    - Let `target = symlinks[current]`.
    - If `target.startswith("/")`: reset `resolved = []` (absolute symlink!).
    - Else: pop `part` from `resolved` (relative symlink resolves against the symlink's parent directory!).
    - Prepend `[p for p in target.split("/") if p]` to the front of the remaining queue so chained symlinks resolve in order!
- Return `"/" + "/".join(resolved)`.

## Objective

Write `resolve_symlinks(path, symlinks, max_hops=16)` where `path` starts with `"/"` (raise `ValueError` otherwise) and `symlinks` maps normalized absolute paths to target strings. Return the canonical resolved absolute path, raising `RuntimeError` if symlink expansion exceeds `max_hops`.

## Hints

1. Use a `collections.deque` of remaining path components; `extendleft(reversed(target_parts))` prepends target components in their exact left-to-right order!
2. Notice: a relative target like `symlinks["/srv/current"] = "../releases/v2"` pops `"current"` (leaving `["srv"]`), then prepends `["..", "releases", "v2"]`, which resolves cleanly to `"/releases/v2"`!

## Starter: guided

```python
from collections import deque


def resolve_symlinks(path, symlinks, max_hops=16):
    if not isinstance(path, str) or not path.startswith("/"):
        raise ValueError("path must be absolute")
    pending = deque(p for p in path.split("/") if p)
    resolved = []
    hops = 0
    while pending:
        part = pending.popleft()
        if part == ".":
            continue
        if part == "..":
            if resolved:
                resolved.pop()
            continue
        resolved.append(part)
        current = "/" + "/".join(resolved)
        # If current in symlinks: check hops, reset/pop resolved, prepend target parts to pending
    return "/" + "/".join(resolved)
```

## Starter: standard

```python
from collections import deque


def resolve_symlinks(path, symlinks, max_hops=16):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "resolves chained absolute and relative symlinks",
    lambda: get("resolve_symlinks")(
        "/srv/current/bin/app",
        {"/srv/current": "../releases/v2", "/releases/v2/bin": "/opt/tools"},
    ),
    "/opt/tools/app",
)
expect(
    "resolves dot and parent segments cleanly",
    lambda: get("resolve_symlinks")("/a/b/../c/./d", {}),
    "/a/c/d",
)
def _loop():
    try:
        get("resolve_symlinks")("/a/file", {"/a": "/b", "/b": "/a"}, max_hops=8)
        return False
    except RuntimeError:
        return True
expect("detects symlink cycle via hop limit", _loop, True)
```

## Hidden checks

```python
expect("parent above root stays at root", lambda: get("resolve_symlinks")("/../../etc/hosts", {}), "/etc/hosts")
```

## Solution

```python
from collections import deque


def resolve_symlinks(path, symlinks, max_hops=16):
    if not isinstance(path, str) or not path.startswith("/"):
        raise ValueError("path must be absolute")
    pending = deque(p for p in path.split("/") if p)
    resolved = []
    hops = 0
    while pending:
        part = pending.popleft()
        if not part or part == ".":
            continue
        if part == "..":
            if resolved:
                resolved.pop()
            continue
        resolved.append(part)
        current = "/" + "/".join(resolved)
        if current in symlinks:
            hops += 1
            if hops > max_hops:
                raise RuntimeError("too many symbolic links")
            target = symlinks[current]
            if target.startswith("/"):
                resolved = []
            else:
                resolved.pop()
            target_parts = [p for p in target.split("/") if p]
            for tp in reversed(target_parts):
                pending.appendleft(tp)
    return "/" + "/".join(resolved)
```

## Restored

POSIX symlink expansion now resolves absolute, relative, and chained links while halting symlink cycles cleanly.
