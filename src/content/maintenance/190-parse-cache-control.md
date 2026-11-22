---
id: maintenance-parse-cache-control
title: Parse an HTTP Cache-Control header into directives
system: Edge cache
symbol: equipment
scene: tests
skills: cdn-caching
reviewSkill: cdn-caching
prerequisite: lifecycle-tiering
---

## Briefing

CDN edges must parse raw `Cache-Control` strings like `"Public, max-age=60, s-maxage=300, no-transform"` into normalized lowercase directives before deciding how long to cache a response.

## Objective

Write `parse_cache_control(header)` returning a dict mapping lowercase directive names to `True` (for flag directives like `public` or `no-store`) or an `int` (when `key=value` has an integer value, otherwise the raw stripped string). Ignore empty segments.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split on `","`, strip each piece, and if `"="` is in the token split once (`k, v = tok.split("=", 1)`), converting `v` with `int(v)` when `v.isdigit()`.

## Starter

```python
```

## Checks

```python
expect("parses mixed flags and integer directives", lambda: get("parse_cache_control")("Public, max-age=60, s-maxage=300"), {"public": True, "max-age": 60, "s-maxage": 300})
expect("empty header returns empty dict", lambda: get("parse_cache_control")("  "), {})
```

## Hidden checks

```python
expect("handles stale-while-revalidate and extra commas", lambda: get("parse_cache_control")("no-store, , stale-while-revalidate=30"), {"no-store": True, "stale-while-revalidate": 30})
```

## Solution

```python
def parse_cache_control(header):
    out = {}
    for part in header.split(","):
        tok = part.strip()
        if not tok:
            continue
        if "=" in tok:
            k, v = tok.split("=", 1)
            k = k.strip().lower()
            v = v.strip().strip('"')
            out[k] = int(v) if v.isdigit() else v
        else:
            out[tok.lower()] = True
    return out
```

## Restored

The edge cache now normalizes raw `Cache-Control` directives cleanly.
