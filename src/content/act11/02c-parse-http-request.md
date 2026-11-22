---
id: parse-http-request
kind: code
title: Parse a complete raw HTTP/1.1 request
system: Header parser
symbol: equipment
scene: tests
skills: http-protocol
---

## Briefing

Wire together everything you've built so far to parse a complete raw HTTP/1.1 request straight off the socket:

```text
POST /alerts HTTP/1.1\r\n
Host: ridge.local\r\n
Content-Length: 11\r\n
\r\n
BATTERY LOW
```

## Objective

Write `parse_request(raw)` accepting `raw: bytes`:

- Split head and body at the first `b"\r\n\r\n"` (raise `ValueError` if missing).
- Split head lines on `b"\r\n"`:
  - First line: parse strictly as an HTTP/1.1 request line (`method`, `target`, `version`).
  - Remaining lines: parse strictly as HTTP headers (`dict[str, str]` with lowercased keys).
- Enforce HTTP/1.1 mandatory `host` header (raise `ValueError` if `"host"` is absent or empty).
- Determine body length from `"content-length"` (default `0` if absent):
  - Must be pure ASCII digits (`>= 0`); otherwise raise `ValueError`.
  - If `len(rest) < content_length`, raise `ValueError` (truncated body!).
  - Take exact `body = rest[:content_length]`.
- Return `{"method": ..., "target": ..., "version": "1.1", "headers": ..., "body": body}`.

## Concept

Notice why `body = rest[:content_length]` slices to exact `content_length` rather than taking all remaining bytes: on a persistent keep-alive TCP connection, bytes *after* `content_length` belong to the **next** HTTP request in the pipeline!

## Hints

1. `head, rest = raw.split(b"\r\n\r\n", 1)` separates headers from body cleanly.
2. `head_lines = head.split(b"\r\n")` gives `[request_line, *header_lines]`.
3. Validate `cl_str.isascii() and cl_str.isdigit()` before calling `int(cl_str)` so `"-5"` or `"+5"` or `" 5"` are rejected.

## Starter: guided

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def parse_request(raw):
    if b"\r\n\r\n" not in raw:
        raise ValueError("incomplete HTTP header block")
    head, rest = raw.split(b"\r\n\r\n", 1)
    lines = head.split(b"\r\n")
    # TODO: parse lines[0] as request line, lines[1:] as headers
    # TODO: require 'host', validate 'content-length', slice exact body bytes
    pass
```

## Starter: standard

```python
def parse_request(raw):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
raw_post = (
    b"POST /alerts HTTP/1.1\r\n"
    b"Host: ridge.local\r\n"
    b"Content-Type: text/plain\r\n"
    b"Content-Length: 11\r\n"
    b"\r\n"
    b"BATTERY LOW"
)
expect(
    "parses valid POST request with body",
    lambda: get("parse_request")(raw_post),
    {
        "method": "POST",
        "target": "/alerts",
        "version": "1.1",
        "headers": {"host": "ridge.local", "content-type": "text/plain", "content-length": "11"},
        "body": b"BATTERY LOW",
    },
)
def rejects(bad):
    try:
        get("parse_request")(bad)
        return False
    except ValueError:
        return True
check("missing Host header raises ValueError", lambda: rejects(b"GET / HTTP/1.1\r\n\r\n"))
check("truncated body raises ValueError", lambda: rejects(b"POST / HTTP/1.1\r\nHost: a\r\nContent-Length: 10\r\n\r\nshort"))
```

## Hidden checks

```python
raw_get = b"GET /healthz HTTP/1.1\r\nHost: ridge.local\r\n\r\n"
expect("GET without Content-Length has empty bytes body", lambda: get("parse_request")(raw_get)["body"], b"")
def rejects(bad):
    try:
        get("parse_request")(bad)
        return False
    except ValueError:
        return True
check("negative Content-Length raises ValueError", lambda: rejects(b"POST / HTTP/1.1\r\nHost: a\r\nContent-Length: -1\r\n\r\n"))
```

## Solution

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def _parse_req_line(line):
    try:
        text = line.decode("ascii")
    except UnicodeDecodeError as exc:
        raise ValueError("non-ASCII request line") from exc
    parts = text.split(" ")
    if len(parts) != 3:
        raise ValueError("malformed request line")
    method, target, version = parts
    if not method or not (method.isascii() and method.isalpha() and method.isupper()):
        raise ValueError("invalid method")
    if not target.startswith("/") or not all(32 < ord(ch) < 127 for ch in target):
        raise ValueError("invalid target")
    if version != "HTTP/1.1":
        raise ValueError("unsupported HTTP version")
    return method, target, "1.1"


def _parse_headers(lines):
    headers = {}
    for line in lines:
        text = line.decode("latin-1")
        if ":" not in text:
            raise ValueError("missing colon in header")
        name, value = text.split(":", 1)
        if not name or not all(ch in TOKEN_CHARS for ch in name):
            raise ValueError("invalid header name")
        key = name.lower()
        val = value.strip(" \t")
        if key in headers:
            if key == "content-length":
                if headers[key] != val:
                    raise ValueError("conflicting Content-Length")
            else:
                headers[key] = f"{headers[key]}, {val}"
        else:
            headers[key] = val
    return headers


def parse_request(raw):
    if b"\r\n\r\n" not in raw:
        raise ValueError("incomplete headers")
    head, rest = raw.split(b"\r\n\r\n", 1)
    lines = head.split(b"\r\n")
    method, target, version = _parse_req_line(lines[0])
    headers = _parse_headers(lines[1:])
    if not headers.get("host"):
        raise ValueError("missing Host header")
    cl_raw = headers.get("content-length", "0")
    if not (cl_raw.isascii() and cl_raw.isdigit()):
        raise ValueError("invalid Content-Length")
    cl = int(cl_raw)
    if len(rest) < cl:
        raise ValueError("truncated request body")
    return {
        "method": method,
        "target": target,
        "version": version,
        "headers": headers,
        "body": rest[:cl],
    }
```

## Restored

Raw HTTP/1.1 request bytes now decode cleanly into structured method, target, validated headers, and exact body bytes.
