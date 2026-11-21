---
id: parse-request-line
kind: code
title: Parse an HTTP/1.1 request line
system: Stream framer
symbol: instrument
scene: tests
skills: http-protocol
---

## Briefing

The very first line of every HTTP/1.1 request has a strict three-part wire format:

```text
METHOD SP request-target SP HTTP/1.1
```

For example: `b"POST /stations/KR-1/logs HTTP/1.1"`. Loose parsers that split with `.split()` accept extra spaces or tabs and open the door to HTTP request smuggling. Parse it strictly.

## Objective

Write `parse_request_line(line)` accepting `bytes` (or ASCII `str`):

- Decode as ASCII (raise `ValueError` on non-ASCII bytes).
- Split strictly on single ASCII space `" "` — there must be **exact 3 parts**: `method`, `target`, `version`.
- Validate:
  - `method`: non-empty and made exclusively of uppercase ASCII letters `A`–`Z` (e.g. `GET`, `POST`, `DELETE`).
  - `target`: non-empty, starts with `"/"`, and contains no whitespace or control characters.
  - `version`: must be exactly `"HTTP/1.1"`.
- Return `{"method": method, "target": target, "version": "1.1"}`. Raise `ValueError` if any rule fails.

## Concept

Why insist on `line.split(" ")` (exact single spaces) instead of `line.split()`?

Because `line.split()` silently collapses multiple spaces (`"GET   /   HTTP/1.1"`) and treats tabs (`\t`) as spaces! RFC 9112 requires a single `SP` (`0x20`) delimiter so reverse proxies and origin servers agree on the exact boundaries of the request target.

## Hints

1. Decode `text = line.decode("ascii")` if `isinstance(line, bytes)` (catch `UnicodeDecodeError` -> `ValueError`).
2. `parts = text.split(" ")` — reject if `len(parts) != 3`.
3. Validate `method` (`method.isascii() and method.isalpha() and method.isupper()`), `target` (`target.startswith("/")` and `all(32 < ord(c) < 127 for c in target)`), and `version == "HTTP/1.1"`.

## Starter: guided

```python
def parse_request_line(line):
    if isinstance(line, bytes):
        try:
            text = line.decode("ascii")
        except UnicodeDecodeError as exc:
            raise ValueError("non-ASCII request line") from exc
    else:
        text = line
    parts = text.split(" ")
    if len(parts) != 3:
        raise ValueError("request line must have 3 space-separated parts")
    method, target, version = parts
    # TODO: validate uppercase ASCII method, target starting with '/', and version == "HTTP/1.1"
    return {"method": method, "target": target, "version": "1.1"}
```

## Starter: standard

```python
def parse_request_line(line):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "parses valid GET request line",
    lambda: get("parse_request_line")(b"GET /stations/KR-1?full=1 HTTP/1.1"),
    {"method": "GET", "target": "/stations/KR-1?full=1", "version": "1.1"},
)
def rejects(bad):
    try:
        get("parse_request_line")(bad)
        return False
    except ValueError:
        return True
check("rejects lowercase method", lambda: rejects(b"get / HTTP/1.1"))
check("rejects unsupported HTTP/2.0", lambda: rejects(b"GET / HTTP/2.0"))
check("rejects extra spaces", lambda: rejects(b"GET  / HTTP/1.1"))
```

## Hidden checks

```python
def rejects(bad):
    try:
        get("parse_request_line")(bad)
        return False
    except ValueError:
        return True
check("rejects target not starting with /", lambda: rejects(b"GET stations HTTP/1.1"))
check("rejects tab inside target", lambda: rejects(b"GET /\tfoo HTTP/1.1"))
check("rejects non-ASCII bytes", lambda: rejects(b"GET /\xff HTTP/1.1"))
```

## Solution

```python
def parse_request_line(line):
    if isinstance(line, bytes):
        try:
            text = line.decode("ascii")
        except UnicodeDecodeError as exc:
            raise ValueError("non-ASCII request line") from exc
    elif isinstance(line, str):
        text = line
    else:
        raise ValueError("invalid request line type")

    parts = text.split(" ")
    if len(parts) != 3:
        raise ValueError("request line must have exactly 3 parts")
    method, target, version = parts
    if not method or not (method.isascii() and method.isalpha() and method.isupper()):
        raise ValueError("invalid HTTP method")
    if not target.startswith("/") or not all(32 < ord(ch) < 127 for ch in target):
        raise ValueError("invalid request target")
    if version != "HTTP/1.1":
        raise ValueError("unsupported HTTP version")
    return {"method": method, "target": target, "version": "1.1"}
```

## Restored

Malformed methods, double spaces, and unsupported versions bounce right at line one of the wire parser.
