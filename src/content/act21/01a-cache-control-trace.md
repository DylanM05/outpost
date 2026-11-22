---
id: cache-control-trace
kind: predict
title: Trace CDN edge vs. browser Cache-Control precedence
system: Blob bench
symbol: instrument
scene: console
skills: cdn-caching, reading-code
---

## Briefing

CDNs don't follow the same `Cache-Control` rules as browsers: shared caches prioritize `s-maxage` over `max-age`, refuse to store `private` or `no-store` responses, and may serve `stale-while-revalidate` responses during a grace window.

## Objective

Trace the shared-cache policy evaluator below and predict **every line it prints**.

## Concept

For a shared CDN edge cache:
- `no-store` or `private` -> `"BYPASS"` (never cached at the edge).
- Otherwise effective TTL is `s-maxage` if present, else `max-age` (default `0`).
- If `age < ttl`: `"HIT"` (fresh).
- Else if `age < ttl + swr`: `"STALE"` (serve stale while refreshing in background).
- Else: `"MISS"` (expired; must revalidate with origin).

## Hints

1. First response has `max-age=60, s-maxage=120` -> shared cache uses `120`, so `age=90` is `"HIT"`.
2. Second response has `private, max-age=300` -> shared cache must return `"BYPASS"`.
3. Third response has `max-age=60, stale-while-revalidate=30` -> at `age=75` (`60 <= 75 < 90`), it returns `"STALE"`.
4. Fourth response has `max-age=60, stale-while-revalidate=30` -> at `age=95` (`95 >= 90`), it returns `"MISS"`.

## Program

```python
def edge_status(directives, age):
    if "no-store" in directives or "private" in directives:
        return "BYPASS"
    ttl = directives.get("s-maxage", directives.get("max-age", 0))
    swr = directives.get("stale-while-revalidate", 0)
    if age < ttl:
        return "HIT"
    if age < ttl + swr:
        return "STALE"
    return "MISS"

cases = [
    ({"max-age": 60, "s-maxage": 120}, 90),
    ({"private": True, "max-age": 300}, 10),
    ({"max-age": 60, "stale-while-revalidate": 30}, 75),
    ({"max-age": 60, "stale-while-revalidate": 30}, 95),
]
for d, age in cases:
    print(edge_status(d, age))
```

## Output

```text
HIT
BYPASS
STALE
MISS
```

## Restored

You traced how shared CDN caches weigh `s-maxage`, `private`, and `stale-while-revalidate` windows.
