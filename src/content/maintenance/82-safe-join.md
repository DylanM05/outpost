---
id: maintenance-safe-join
title: Block path traversal escapes
system: Shield wall
symbol: controller
scene: tests
skills: security
reviewSkill: security
prerequisite: rate-limiter
---

## Briefing

A file-download handler joins a base folder `/srv/exports` with a user-supplied relative path. Without containment checks, `../../etc/passwd` or `/etc/shadow` escapes the folder completely.

## Objective

Write `safe_join(base_dir, user_path)` using `posixpath` (or `os.path`):

- Reject absolute `user_path` (starting with `/`) and any normalized path that leaves `base_dir` (including sibling-prefix tricks like `/srv/exports-secret/a.txt` when `base_dir` is `/srv/exports`!) by raising `ValueError`.
- Otherwise return the normalized joined path.

```python
safe_join("/srv/exports", "2026/log.csv")      # "/srv/exports/2026/log.csv"
safe_join("/srv/exports", "../secrets.env")    # raises ValueError
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if os.path.isabs(user_path): raise ValueError(...)` first! (`os.path.join("/srv/exports", "/etc/passwd")` silently discards the base!)
2. Normalize `base = os.path.normpath(base_dir)` and `full = os.path.normpath(os.path.join(base, user_path))`.
3. Verify `os.path.commonpath([base, full]) == base` (don't use `full.startswith(base)` without a trailing slash, which fails on `/srv/exports-secret`!).

## Starter

```python
```

## Checks

```python
expect("safe nested path allowed", lambda: get("safe_join")("/srv/exports", "2026/log.csv"), "/srv/exports/2026/log.csv")
def blocks_traversal():
    try:
        get("safe_join")("/srv/exports", "../secrets.env")
        return False
    except ValueError:
        return True
check("blocks ../ traversal", blocks_traversal)
def blocks_sibling_prefix():
    try:
        get("safe_join")("/srv/exports", "../exports-secret/key.pem")
        return False
    except ValueError:
        return True
check("blocks sibling prefix trick (/srv/exports-secret)", blocks_sibling_prefix)
```

## Hidden checks

```python
def blocks_absolute():
    try:
        get("safe_join")("/srv/exports", "/etc/passwd")
        return False
    except ValueError:
        return True
check("blocks absolute user_path", blocks_absolute)
expect("inner .. that stays inside base is allowed", lambda: get("safe_join")("/srv/exports", "a/../b.txt"), "/srv/exports/b.txt")
```

## Solution

```python
import os


def safe_join(base_dir, user_path):
    if not isinstance(user_path, str) or os.path.isabs(user_path):
        raise ValueError("path must be relative")
    base = os.path.normpath(base_dir)
    full = os.path.normpath(os.path.join(base, user_path))
    if os.path.commonpath([base, full]) != base:
        raise ValueError("path escapes base directory")
    return full
```

## Restored

Path traversal and sibling-prefix escapes are blocked cleanly before a file is ever opened.
