---
id: parse-header-line
kind: code
title: Strict HTTP header field parsing
system: Header parser
symbol: equipment
scene: tests
skills: http-protocol
---

## Briefing

An HTTP/1.1 header line looks like `b"Content-Type: application/json"`. One subtle RFC 9110 rule catches careless parsers every time: **whitespace is allowed *after* the colon, NEVER *before* the colon!** (`b"Host : ridge.local"` MUST be rejected as malformed!)

## Objective

Write `parse_header_line(line)` accepting `bytes` (or `str`):

- Decode `bytes` using `"latin-1"` (or `"ascii"`).
- Split on the **first** `":"` (`name, value = text.split(":", 1)`). Raise `ValueError` if `":"` is missing.
- Validate `name`:
  - Must be non-empty.
  - Every character in `name` must be a valid HTTP token character: ASCII letter, digit, or one of `!#$%&'*+-.^_`|~` (so spaces, tabs, colons, or control chars before `:` are all rejected!).
- Normalize `name` to lowercase, and strip leading and trailing spaces/tabs (`" \t"`) from `value`.
- Return `(name.lower(), value.strip(" \t"))`.

```python
parse_header_line(b"X-Relay-ID:   KR-4  ")  # ("x-relay-id", "KR-4")
parse_header_line(b"Host : ridge.local")    # raises ValueError!
```

## Concept

Why does RFC 9110 forbid spaces between a header name and the colon (`Transfer-Encoding : chunked`)?

Because if a front-end proxy strips that space and honors `Transfer-Encoding`, while a back-end server ignores the weird header and honors `Content-Length`, the two servers disagree on where the request ends — enabling **HTTP Request Smuggling**! Strict header-name validation closes that whole class of bugs.

## Hints

1. Define `TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")`.
2. Split on `":"` with `maxsplit=1` so colons inside header values (like `Host: ridge.local:8080`) stay intact!
3. Check `if not name or not all(ch in TOKEN_CHARS for ch in name): raise ValueError(...)`.

## Starter: guided

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def parse_header_line(line):
    text = line.decode("latin-1") if isinstance(line, bytes) else line
    if ":" not in text:
        raise ValueError("missing colon in header")
    name, value = text.split(":", 1)
    # TODO: validate name is non-empty and all chars are in TOKEN_CHARS
    # TODO: return (name.lower(), value.strip(" \t"))
    pass
```

## Starter: standard

```python
def parse_header_line(line):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("normalizes name and trims value OWS", lambda: get("parse_header_line")(b"Content-Type:  application/json \t"), ("content-type", "application/json"))
expect("preserves colons inside header value", lambda: get("parse_header_line")(b"Host: ridge.local:8080"), ("host", "ridge.local:8080"))
def rejects(bad):
    try:
        get("parse_header_line")(bad)
        return False
    except ValueError:
        return True
check("rejects space before colon", lambda: rejects(b"Host : ridge.local"))
check("rejects missing colon", lambda: rejects(b"InvalidHeader"))
```

## Hidden checks

```python
def rejects(bad):
    try:
        get("parse_header_line")(bad)
        return False
    except ValueError:
        return True
check("rejects leading whitespace before header name", lambda: rejects(b" Host: ridge.local"))
check("rejects empty header name", lambda: rejects(b": value"))
expect("allows empty header value", lambda: get("parse_header_line")(b"X-Empty:"), ("x-empty", ""))
```

## Solution

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def parse_header_line(line):
    text = line.decode("latin-1") if isinstance(line, bytes) else line
    if ":" not in text:
        raise ValueError("missing colon")
    name, value = text.split(":", 1)
    if not name or not all(ch in TOKEN_CHARS for ch in name):
        raise ValueError("invalid header name")
    return name.lower(), value.strip(" \t")
```

## Restored

Spaces before colons and illegal token characters are rejected outright, keeping header parsing smuggling-resistant.
