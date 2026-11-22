---
id: maintenance-vary-cache-key
title: Build normalized CDN cache keys honoring Vary headers
system: Edge cache
symbol: equipment
scene: tests
skills: cdn-caching
reviewSkill: cdn-caching
prerequisite: lifecycle-tiering
---

## Briefing

Serving a gzipped response to a client that did not ask for gzip breaks browsers! CDNs fold every header listed in `Vary` (case-insensitively and in sorted order) into the cache lookup key.

## Objective

Write `make_cache_key(method, path, request_headers, vary_headers)` returning a hashable tuple `(method.upper(), path, tuple_of_sorted_pairs)` where each pair is `(lower_name, value_or_empty_str)` for each unique lowercase header in `vary_headers` (sorted alphabetically, looking up `request_headers` case-insensitively).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Lowercase all keys of `request_headers` into a temporary lookup dict first, then build `tuple((h, lower_req.get(h, "")) for h in sorted({v.lower() for v in vary_headers}))`.

## Starter

```python
```

## Checks

```python
expect("normalizes method, case, and Vary header order", lambda: get("make_cache_key")("get", "/app.js", {"Accept-Encoding": "br", "Origin": "https://a.test"}, ["Origin", "accept-encoding"]), ("GET", "/app.js", (("accept-encoding", "br"), ("origin", "https://a.test"))))
expect("missing varied header defaults to empty string", lambda: get("make_cache_key")("GET", "/a", {}, ["Accept-Encoding"]), ("GET", "/a", (("accept-encoding", ""),)))
```

## Hidden checks

```python
expect("deduplicates repeated Vary headers", lambda: get("make_cache_key")("head", "/x", {"ACCEPT": "text/html"}, ["Accept", "accept"]), ("HEAD", "/x", (("accept", "text/html"),)))
```

## Solution

```python
def make_cache_key(method, path, request_headers, vary_headers):
    lower_req = {k.lower(): v for k, v in request_headers.items()}
    names = sorted({h.lower() for h in vary_headers})
    varied = tuple((name, lower_req.get(name, "")) for name in names)
    return (method.upper(), path, varied)
```

## Restored

CDN cache keys now separate compressed and cross-origin variants safely according to `Vary`.
