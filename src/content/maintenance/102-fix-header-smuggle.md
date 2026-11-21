---
id: maintenance-fix-header-smuggle
title: Fix a smuggling-prone header parser
system: Header parser
symbol: equipment
scene: tests
skills: http-protocol
reviewSkill: http-protocol
prerequisite: serialize-response
---

## Briefing

`parse_raw_headers(lines)` below strips spaces around header names (allowing `"Transfer-Encoding : chunked"`) and silently overwrites conflicting `Content-Length` headers! Patch both request-smuggling holes.

## Objective

Fix `parse_raw_headers(lines)` so that:
1. Any whitespace or illegal token char in the header name before `:` raises `ValueError`.
2. Two `Content-Length` headers with *different* values raise `ValueError`.
3. Repeated non-framing headers combine with `", "`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `name` *before* calling `.lower()` (do NOT `.strip()` `name`!).
2. Handle `key == "content-length"` specially when `key in headers`.

## Starter

```python
def parse_raw_headers(lines):
    headers = {}
    for line in lines:
        name, val = line.decode("latin-1").split(":", 1)
        headers[name.strip().lower()] = val.strip()
    return headers
```

## Checks

```python
def rejects(lines):
    try:
        get("parse_raw_headers")(lines)
        return False
    except ValueError:
        return True
check("rejects space before colon", lambda: rejects([b"Host : ridge.local"]))
check("rejects conflicting Content-Length", lambda: rejects([b"Content-Length: 5", b"Content-Length: 9"]))
expect("merges repeated Accept headers", lambda: get("parse_raw_headers")([b"Accept: a", b"Accept: b"]), {"accept": "a, b"})
```

## Hidden checks

```python
expect("allows identical duplicate Content-Length", lambda: get("parse_raw_headers")([b"Content-Length: 8", b"content-length: 8"]), {"content-length": "8"})
```

## Solution

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def parse_raw_headers(lines):
    headers = {}
    for line in lines:
        text = line.decode("latin-1")
        if ":" not in text:
            raise ValueError("missing colon")
        name, val = text.split(":", 1)
        if not name or not all(ch in TOKEN_CHARS for ch in name):
            raise ValueError("invalid header name")
        key = name.lower()
        clean = val.strip(" \t")
        if key in headers:
            if key == "content-length":
                if headers[key] != clean:
                    raise ValueError("conflicting Content-Length")
            else:
                headers[key] = f"{headers[key]}, {clean}"
        else:
            headers[key] = clean
    return headers
```

## Restored

Header smuggling via whitespace-before-colon and conflicting `Content-Length` is shut tight.
