---
id: maintenance-fix-stale-check
title: Fix a shared-cache TTL check that ignores s-maxage precedence
system: Edge cache
symbol: equipment
scene: tests
skills: cdn-caching
reviewSkill: cdn-caching
prerequisite: lifecycle-tiering
---

## Briefing

An edge cache policy function is checking `max-age` before `s-maxage` and forgetting to block `private` responses from shared caching!

## Objective

Fix `shared_ttl(directives)` so it returns `0` if `"no-store"` or `"private"` is in `directives`, otherwise returns `directives["s-maxage"]` if present, else `directives.get("max-age", 0)` (clamped to `>= 0`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `"no-store"` and `"private"` first, then check `"s-maxage"` before `"max-age"`.

## Starter

```python
def shared_ttl(directives):
    if "no-store" in directives:
        return 0
    return max(0, directives.get("max-age", directives.get("s-maxage", 0)))
```

## Checks

```python
expect("s-maxage overrides max-age for shared caches", lambda: get("shared_ttl")({"max-age": 30, "s-maxage": 300}), 300)
expect("private responses get 0 shared TTL", lambda: get("shared_ttl")({"private": True, "max-age": 120}), 0)
```

## Hidden checks

```python
expect("falls back to max-age when s-maxage absent", lambda: get("shared_ttl")({"public": True, "max-age": 45}), 45)
expect("s-maxage=0 overrides positive max-age", lambda: get("shared_ttl")({"max-age": 60, "s-maxage": 0}), 0)
```

## Solution

```python
def shared_ttl(directives):
    if "no-store" in directives or "private" in directives:
        return 0
    if "s-maxage" in directives:
        return max(0, directives["s-maxage"])
    return max(0, directives.get("max-age", 0))
```

## Restored

Shared-cache TTL calculation now respects `private` exclusions and `s-maxage` precedence.
