---
id: merge-headers
kind: code
title: Combine repeated headers safely
system: Header parser
symbol: equipment
scene: tests
skills: http-protocol
---

## Briefing

HTTP requests frequently send the same header name multiple times:

```text
Accept: text/html
Accept: application/json
```

RFC 9110 lets servers combine repeated headers with `", "` — **except** security-critical framing headers like `Content-Length`! If a request carries two *different* `Content-Length` values (`Content-Length: 10` and `Content-Length: 42`), you must reject it immediately with `ValueError`.

## Objective

Write `parse_headers(lines)` where `lines` is a list of raw header lines (`bytes` or `str`):

- Parse each line strictly (valid token name, no whitespace before `:`, lowercase name, trimmed value).
- If a header name repeats:
  - If `name == "content-length"`: raise `ValueError` if the new value differs from the existing value (if identical, keep it).
  - For any other header: join with `", "` (`headers[name] = f"{headers[name]}, {value}"`).
- Return the resulting lowercase-key `dict[str, str]`.

## Concept

Why reject conflicting duplicate `Content-Length` headers instead of picking the first or last one?

Because if Proxy A picks the *first* `Content-Length` and Server B picks the *last* `Content-Length`, an attacker can smuggle a second hidden HTTP request inside the body of the first! Rejecting ambiguous framing with `400 Bad Request` (`ValueError` here) is mandatory in RFC 9112.

## Hints

1. Reuse your strict `parse_header_line` logic for every line in `lines`.
2. When `name in headers`: if `name == "content-length"`, compare `value != headers[name]` -> `raise ValueError`, else leave as-is; otherwise combine `f"{headers[name]}, {value}"`.

## Starter: guided

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def _parse_line(line):
    text = line.decode("latin-1") if isinstance(line, bytes) else line
    if ":" not in text:
        raise ValueError("missing colon")
    name, value = text.split(":", 1)
    if not name or not all(ch in TOKEN_CHARS for ch in name):
        raise ValueError("invalid header name")
    return name.lower(), value.strip(" \t")


def parse_headers(lines):
    headers = {}
    for line in lines:
        name, value = _parse_line(line)
        # TODO: handle repeated content-length vs general comma-joining
        headers[name] = value
    return headers
```

## Starter: standard

```python
def parse_headers(lines):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "combines repeated non-framing headers with comma-space",
    lambda: get("parse_headers")([
        b"Host: ridge.local",
        b"Accept: text/plain",
        b"accept: application/json",
    ]),
    {"host": "ridge.local", "accept": "text/plain, application/json"},
)
def rejects_conflicting_cl():
    try:
        get("parse_headers")([b"Content-Length: 10", b"Content-Length: 20"])
        return False
    except ValueError:
        return True
check("conflicting duplicate Content-Length raises ValueError", rejects_conflicting_cl)
```

## Hidden checks

```python
expect(
    "identical duplicate Content-Length is tolerated",
    lambda: get("parse_headers")([b"Content-Length: 12", b"content-length: 12"]),
    {"content-length": "12"},
)
expect("empty list returns {}", lambda: get("parse_headers")([]), {})
```

## Solution

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


def _parse_line(line):
    text = line.decode("latin-1") if isinstance(line, bytes) else line
    if ":" not in text:
        raise ValueError("missing colon")
    name, value = text.split(":", 1)
    if not name or not all(ch in TOKEN_CHARS for ch in name):
        raise ValueError("invalid header name")
    return name.lower(), value.strip(" \t")


def parse_headers(lines):
    headers = {}
    for line in lines:
        name, value = _parse_line(line)
        if name in headers:
            if name == "content-length":
                if headers[name] != value:
                    raise ValueError("conflicting Content-Length headers")
            else:
                headers[name] = f"{headers[name]}, {value}"
        else:
            headers[name] = value
    return headers
```

## Restored

Multi-value headers merge cleanly per RFC 9110 while conflicting `Content-Length` smuggling attempts fail fast.
