---
id: maintenance-normalize-posix
title: Normalize POSIX paths with dot and parent segments
system: Inode rack
symbol: equipment
scene: tests
skills: os-filesystems
reviewSkill: os-filesystems
prerequisite: symlink-resolve
---

## Briefing

Before checking permissions or looking up inodes, the VFS strips duplicate slashes (`//`), skips `.`, and collapses `..` cleanly without ever escaping above `/`.

## Objective

Write `normalize_posix(path)` (without importing `os` or `posixpath`) where `path` is an absolute POSIX path string starting with `"/"` (raise `ValueError` otherwise).

Return the canonical normalized path starting with `"/"` with no trailing slash (except `"/"` itself), no empty segments, no `"."`, and all `".."` collapsed (clamped at `"/"`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split `path` on `"/"` and maintain a stack `parts = []`.
2. Ignore `""` and `"."`; on `".."`, `if parts: parts.pop()`; otherwise `parts.append(seg)`. Return `"/" + "/".join(parts)`.

## Starter

```python
```

## Checks

```python
expect("collapses dots, parents, and repeated slashes", lambda: get("normalize_posix")("/srv//outpost/./logs/../data/"), "/srv/outpost/data")
expect("clamps parent traversal above root to /", lambda: get("normalize_posix")("/../../a/.."), "/")
```

## Hidden checks

```python
def _rel():
    try:
        get("normalize_posix")("relative/path")
        return False
    except ValueError:
        return True
expect("relative path raises ValueError", _rel, True)
```

## Solution

```python
def normalize_posix(path):
    if not isinstance(path, str) or not path.startswith("/"):
        raise ValueError("path must be an absolute POSIX path")
    parts = []
    for seg in path.split("/"):
        if not seg or seg == ".":
            continue
        if seg == "..":
            if parts:
                parts.pop()
        else:
            parts.append(seg)
    return "/" + "/".join(parts)
```

## Restored

Canonical POSIX path normalization resolves dots, parent segments, and repeated slashes cleanly.
