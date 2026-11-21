---
id: maintenance-fix-path-jail
title: Patch a vulnerable tool path jail
system: Safety gate
symbol: controller
scene: tests
skills: agent-loops
reviewSkill: agent-loops
prerequisite: eval-harness
---

## Briefing

The file-reading tool's sandbox check uses raw `path.startswith(root)`, which fails on two classic attacks: `..` directory traversal (`/srv/outpost/../etc/passwd`) and sibling-directory prefixes (`/srv/outpost_secret/key`). Patch it!

## Objective

Fix `is_inside_root(root, path)` in the editor so that it returns `True` iff:
- Both `root` and `path` are absolute POSIX paths starting with `"/"`, and
- After normalizing with `posixpath.normpath(...)`, `norm_path` is either equal to `norm_root` or strictly inside `norm_root` (starting with `norm_root + "/"` when `norm_root != "/"`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Import `posixpath`, reject any non-string or path not starting with `"/"`, and normalize both `root` and `path`.
2. Compute `prefix = "/" if norm_root == "/" else norm_root + "/"` and return `norm_path == norm_root or norm_path.startswith(prefix)`.

## Starter

```python
def is_inside_root(root, path):
    return path.startswith(root)
```

## Checks

```python
expect("allows file inside root", lambda: get("is_inside_root")("/srv/outpost", "/srv/outpost/logs/a.txt"), True)
expect("blocks parent traversal", lambda: get("is_inside_root")("/srv/outpost", "/srv/outpost/../etc/passwd"), False)
expect("blocks sibling directory sharing prefix", lambda: get("is_inside_root")("/srv/outpost", "/srv/outpost_secret/key"), False)
```

## Hidden checks

```python
expect("allows exact root match with trailing slash", lambda: get("is_inside_root")("/srv/outpost/", "/srv/outpost"), True)
expect("blocks relative paths", lambda: get("is_inside_root")("/srv/outpost", "logs/a.txt"), False)
```

## Solution

```python
import posixpath


def is_inside_root(root, path):
    if not isinstance(root, str) or not isinstance(path, str):
        return False
    if not root.startswith("/") or not path.startswith("/"):
        return False
    norm_root = posixpath.normpath(root)
    norm_path = posixpath.normpath(path)
    prefix = "/" if norm_root == "/" else norm_root + "/"
    return norm_path == norm_root or norm_path.startswith(prefix)
```

## Restored

The safety gate now normalizes POSIX paths and closes both traversal and sibling-prefix escapes.
