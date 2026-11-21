---
id: escape-the-path
kind: predict
title: Escape the path
system: Shield wall
symbol: controller
scene: console
skills: security, reading-code
---

## Briefing

The exchange lets operators download CSV exports by filename (`/exports/<name>`). A classic web vulnerability — **path traversal** — happens when you glue an untrusted filename onto a base folder with `os.path.join` or string concatenation. Watch two sneaky inputs escape `/srv/exports` completely!

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

`os.path.join(base, user_input)` has **two** traps:

1. `..` segments climb out of `base`: `os.path.normpath("/srv/exports/../../etc/passwd")` becomes `"/etc/passwd"`.
2. If `user_input` starts with `"/"`, `os.path.join` **discards `base` completely**: `os.path.join("/srv/exports", "/etc/passwd")` is `"/etc/passwd"`!

Always resolve with `os.path.normpath` (or `os.path.realpath` on a real disk) and verify that the resolved path stays inside `base + "/"` (not just `startswith(base)` — because `"/srv/exports-secret"` also starts with `"/srv/exports"`!).

## Hints

1. `os.path.normpath(os.path.join("/srv/exports", "../secrets.env"))` resolves to `"/srv/secrets.env"`.
2. `os.path.join("/srv/exports", "/etc/passwd")` drops `"/srv/exports"` completely!
3. Look at the third line: `"/srv/exports-backup/a.csv".startswith("/srv/exports")` is `True`, even though it's a **different** directory!

## Program

```python
import os

base = "/srv/exports"
print(os.path.normpath(os.path.join(base, "../secrets.env")))
print(os.path.normpath(os.path.join(base, "/etc/passwd")))
print("/srv/exports-backup/a.csv".startswith(base))
print("/srv/exports-backup/a.csv".startswith(base + "/"))
```

## Output

```text
/srv/secrets.env
/etc/passwd
True
False
```

## Restored

You caught all three path-traversal traps: `..`, leading `/`, and the missing trailing `/` in prefix checks.
