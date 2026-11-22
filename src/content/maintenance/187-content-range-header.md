---
id: maintenance-content-range-header
title: Format and validate HTTP Content-Range headers
system: Range deck
symbol: instrument
scene: tests
skills: http-streaming
reviewSkill: http-streaming
prerequisite: mime-sniffing
---

## Briefing

Every `206 Partial Content` response must advertise an exact `Content-Range: bytes <start>-<end>/<total>` header with valid inclusive indices.

## Objective

Write `format_content_range(start, end, total)` returning `"bytes {start}-{end}/{total}"` if `0 <= start <= end < total`, or raising `ValueError` otherwise.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `total > 0` and `0 <= start <= end < total` (and reject booleans if needed).

## Starter

```python
```

## Checks

```python
expect("formats valid range", lambda: get("format_content_range")(0, 99, 500), "bytes 0-99/500")
expect("formats single-byte range", lambda: get("format_content_range")(4, 4, 5), "bytes 4-4/5")
```

## Hidden checks

```python
def _invalid():
    bad = 0
    for args in [(5, 4, 10), (0, 10, 10), (-1, 2, 10), (0, 0, 0)]:
        try:
            get("format_content_range")(*args)
        except ValueError:
            bad += 1
    return bad
expect("rejects inverted, out-of-bounds, negative, and empty ranges", _invalid, 4)
```

## Solution

```python
def format_content_range(start, end, total):
    if total <= 0 or start < 0 or end < start or end >= total:
        raise ValueError("invalid byte range")
    return f"bytes {start}-{end}/{total}"
```

## Restored

`Content-Range` headers now enforce strict inclusive byte bounds before leaving the server.
