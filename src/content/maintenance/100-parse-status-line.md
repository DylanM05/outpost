---
id: maintenance-parse-status-line
title: Parse an HTTP/1.1 status line
system: Stream framer
symbol: instrument
scene: tests
skills: http-protocol
reviewSkill: http-protocol
prerequisite: serialize-response
---

## Briefing

An HTTP/1.1 client must parse response status lines like `b"HTTP/1.1 503 Service Unavailable"` — where the reason phrase may contain spaces or even be empty (`b"HTTP/1.1 200 "`)!

## Objective

Write `parse_status_line(line)` accepting `bytes` (or ASCII `str`):

- Must start with `"HTTP/1.1 "` followed by a 3-digit integer status code (`100`–`599`), a single `" "`, and an optional reason phrase (which may contain spaces).
- Return `(int(code), reason)` or raise `ValueError` on any violation.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `text.split(" ", 2)` (at most 2 splits!) so spaces inside `"Service Unavailable"` stay intact!
2. Validate `version == "HTTP/1.1"`, `len(code_str) == 3 and code_str.isdigit()`, and `100 <= int(code_str) <= 599`.

## Starter

```python
```

## Checks

```python
expect("parses multi-word reason phrase", lambda: get("parse_status_line")(b"HTTP/1.1 503 Service Unavailable"), (503, "Service Unavailable"))
expect("allows empty reason phrase", lambda: get("parse_status_line")(b"HTTP/1.1 200 "), (200, ""))
def rejects(bad):
    try:
        get("parse_status_line")(bad)
        return False
    except ValueError:
        return True
check("rejects non-3-digit code", lambda: rejects(b"HTTP/1.1 20 OK"))
check("rejects HTTP/2", lambda: rejects(b"HTTP/2 200 OK"))
```

## Hidden checks

```python
def rejects(bad):
    try:
        get("parse_status_line")(bad)
        return False
    except ValueError:
        return True
check("rejects code 999", lambda: rejects(b"HTTP/1.1 999 Weird"))
check("rejects missing space after code", lambda: rejects(b"HTTP/1.1 200"))
```

## Solution

```python
def parse_status_line(line):
    text = line.decode("ascii") if isinstance(line, bytes) else line
    parts = text.split(" ", 2)
    if len(parts) != 3:
        raise ValueError("malformed status line")
    version, code_str, reason = parts
    if version != "HTTP/1.1":
        raise ValueError("unsupported HTTP version")
    if len(code_str) != 3 or not (code_str.isascii() and code_str.isdigit()):
        raise ValueError("invalid status code")
    code = int(code_str)
    if not (100 <= code <= 599):
        raise ValueError("status code out of range")
    return code, reason
```

## Restored

Response status lines with multi-word or empty reason phrases now parse cleanly per RFC 9112.
