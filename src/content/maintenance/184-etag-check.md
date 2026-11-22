---
id: maintenance-blob-etag-check
title: Compute strong ETags and handle If-None-Match 304 revalidation
system: Blob bench
symbol: instrument
scene: tests
skills: object-storage
reviewSkill: object-storage
prerequisite: presigned-urls
---

## Briefing

When a client already has a cached object, sending `If-None-Match` with its stored ETag lets the server answer `304 Not Modified` with zero body bytes if the object's content hash still matches.

## Objective

Write `check_etag(data, if_none_match=None)` where `data` is `bytes`:
- Compute strong ETag `etag = f'"{hashlib.sha256(data).hexdigest()}"'`.
- If `if_none_match` matches `etag` (or equals `"*"`, or contains `etag` in a comma-separated list after stripping whitespace), return `(304, etag)`.
- Otherwise return `(200, etag)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split `if_none_match` on `","`, strip each candidate, and check if `etag` or `"*"` is present.

## Starter

```python
```

## Checks

```python
def _match():
    s1, tag = get("check_etag")(b"hello", None)
    s2, tag2 = get("check_etag")(b"hello", tag)
    s3, _ = get("check_etag")(b"hello", '"other", ' + tag)
    return (s1, tag == tag2, s2, s3)
expect("returns 200 initially and 304 on matching ETag", _match, (200, True, 304, 304))
```

## Hidden checks

```python
expect("wildcard * matches as 304", lambda: get("check_etag")(b"abc", "*")[0], 304)
expect("mismatched ETag returns 200", lambda: get("check_etag")(b"abc", '"deadbeef"')[0], 200)
```

## Solution

```python
import hashlib


def check_etag(data, if_none_match=None):
    etag = f'"{hashlib.sha256(data).hexdigest()}"'
    if if_none_match is not None:
        candidates = [c.strip() for c in if_none_match.split(",")]
        if "*" in candidates or etag in candidates:
            return (304, etag)
    return (200, etag)
```

## Restored

ETag conditional validation now saves bandwidth with clean `304 Not Modified` responses.
