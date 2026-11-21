---
id: maintenance-check-dockerfile-user
title: Verify final Dockerfile USER
system: Container bay
symbol: equipment
scene: tests
skills: containers
reviewSkill: containers
prerequisite: compose-topology
---

## Briefing

Containers run as `root` by default — and a Dockerfile that switches to `USER app` in a build stage or switches back to `USER root` at the end still ships as root! Inspect the final stage of a Dockerfile.

## Objective

Write `runs_as_non_root(dockerfile)` that scans a Dockerfile string and checks the **final** `USER` instruction (in the last `FROM` stage):

- Ignore blank lines and `#` comments; instruction keywords (`FROM`, `USER`) are case-insensitive.
- If the final stage has a `USER <spec>` instruction and its user part (before any `:group`) is **not** `"root"` or `"0"`, return `True`.
- Otherwise (no `USER` in the final stage, or the last `USER` is `root`/`0`/`0:0`/`root:app`), return `False`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Walk the lines in order. Reset `current_user = None` whenever you see a `FROM` line!
2. On a `USER` line, take the token after `USER`, strip any `:group` suffix (`spec.split(":", 1)[0]`), and update `current_user`.
3. At the end, return `current_user is not None and current_user not in ("root", "0")`.

## Starter

```python
```

## Checks

```python
good = """
FROM python:3.14-slim
RUN adduser --disabled-password app
USER app
CMD ["python", "server.py"]
"""
multi_reset = """
FROM python:3.14 AS build
USER app
FROM python:3.14-slim
COPY --from=build /app /app
"""
expect("final USER app returns True", lambda: get("runs_as_non_root")(good), True)
expect("new FROM stage without USER resets to root (False)", lambda: get("runs_as_non_root")(multi_reset), False)
```

## Hidden checks

```python
back_to_root = "FROM alpine\nUSER 1000:1000\nUSER 0:0\n"
uid_nonroot = "FROM alpine\nuser 1001:1001\n"
expect("switching back to 0:0 returns False", lambda: get("runs_as_non_root")(back_to_root), False)
expect("lowercase user 1001:1001 returns True", lambda: get("runs_as_non_root")(uid_nonroot), True)
```

## Solution

```python
def runs_as_non_root(dockerfile):
    current_user = None
    for raw in dockerfile.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        cmd = parts[0].upper()
        if cmd == "FROM":
            current_user = None
        elif cmd == "USER" and len(parts) >= 2:
            current_user = parts[1].split(":", 1)[0].lower()
    return current_user is not None and current_user not in ("root", "0")
```

## Restored

Multi-stage Dockerfiles can't silently drop back to root in the final runtime stage anymore.
