---
id: maintenance-robots-disallow
title: Enforce robots.txt Disallow rules
system: Crawler desk
symbol: equipment
scene: tests
skills: crawling
reviewSkill: crawling
prerequisite: bounded-crawler
---

## Briefing

Polite crawlers respect a host's `robots.txt` rules. Given a parsed list of `Disallow` prefixes, decide whether a path may be fetched.

## Objective

Write `is_allowed(path, disallowed)` where `path` is a URL path string (e.g. `"/admin/status"`) and `disallowed` is a list of `Disallow` prefix strings (e.g. `["/admin", "/private/"]`).

Return `False` if `path` starts with any non-empty prefix in `disallowed`, otherwise return `True`. Empty strings (`""`) in `disallowed` mean "disallow nothing" and must be ignored.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Loop over `prefix` in `disallowed`, skip `if not prefix:`, and check `path.startswith(prefix)`.
2. If any non-empty prefix matches, return `False`; after the loop, return `True`.

## Starter

```python
```

## Checks

```python
expect("blocks matching prefix", lambda: get("is_allowed")("/admin/users", ["/admin", "/tmp/"]), False)
expect("allows non-matching path", lambda: get("is_allowed")("/docs/index.html", ["/admin", "/tmp/"]), True)
expect("empty disallow rule allows everything", lambda: get("is_allowed")("/anything", [""]), True)
```

## Hidden checks

```python
expect("root slash blocks everything", lambda: get("is_allowed")("/docs", ["/"]), False)
expect("empty disallowed list allows everything", lambda: get("is_allowed")("/secret", []), True)
```

## Solution

```python
def is_allowed(path, disallowed):
    for prefix in disallowed:
        if prefix and path.startswith(prefix):
            return False
    return True
```

## Restored

The crawler now checks `Disallow` rules before queueing any URL path.
