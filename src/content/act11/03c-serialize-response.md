---
id: serialize-response
kind: code
title: Serialize an HTTP/1.1 wire response
system: Chunked wire
symbol: controller
scene: tests
skills: http-protocol
---

## Briefing

Now build the outbound HTTP/1.1 response serializer that turns a status code, headers, and body into the exact raw bytes sent back over TCP.

## Objective

Write `build_response(status_code, body=b"", headers=None)`:

- `body` may be `bytes` or `str` (if `str`, encode as UTF-8).
- Map common status codes to standard reason phrases:
  - `200`: `"OK"`, `201`: `"Created"`, `204`: `"No Content"`, `400`: `"Bad Request"`, `401`: `"Unauthorized"`, `403`: `"Forbidden"`, `404`: `"Not Found"`, `405`: `"Method Not Allowed"`, `500`: `"Internal Server Error"`, and `"Unknown"` for any other code.
- Start with `f"HTTP/1.1 {status_code} {reason}\r\n"`.
- Copy any user-supplied `headers` (a `dict` or `None`).
  - **Reject** any header name or value containing `"\r"` or `"\n"` with `ValueError` (**HTTP header injection / response splitting defense**!).
  - Always set `"Content-Length"` to `str(len(raw_body))` (replacing any caller-supplied `Content-Length` regardless of casing so it can never disagree with the true byte count!).
  - Emit headers sorted by header name (case-insensitively) as `f"{name}: {value}\r\n"`.
- Finish with `b"\r\n" + raw_body` and return `bytes`.

## Concept

Two real-world wire bugs this function prevents:
1. **UTF-8 `Content-Length` bug:** `len("4°C")` is `3` characters, but `len("4°C".encode("utf-8"))` is **`4` bytes**! Setting `Content-Length: 3` truncates the last byte on the wire. Always measure `len(raw_body)` *after* encoding to `bytes`!
2. **CRLF header injection:** if an attacker sneaks `"\r\nSet-Cookie: admin=1"` into a header value, they can forge whole headers or a second HTTP response! Rejecting `\r` and `\n` in headers stops response splitting cold.

## Hints

1. Encode `raw_body = body.encode("utf-8") if isinstance(body, str) else body` first.
2. Build a clean dict skipping any existing `"content-length"` key (checked case-insensitively), then set `clean["Content-Length"] = str(len(raw_body))`.
3. Check `if "\r" in str(k) or "\n" in str(k) or "\r" in str(v) or "\n" in str(v): raise ValueError(...)`.

## Starter: guided

```python
REASONS = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    500: "Internal Server Error",
}


def build_response(status_code, body=b"", headers=None):
    raw_body = body.encode("utf-8") if isinstance(body, str) else body
    reason = REASONS.get(status_code, "Unknown")
    clean = {}
    for k, v in (headers or {}).items():
        # TODO: reject \r or \n in k or v, skip caller Content-Length
        clean[k] = str(v)
    clean["Content-Length"] = str(len(raw_body))
    # TODO: assemble status line + sorted headers + \r\n + raw_body as bytes
    pass
```

## Starter: standard

```python
def build_response(status_code, body=b"", headers=None):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "serializes 200 response with UTF-8 byte Content-Length",
    lambda: get("build_response")(200, "4°C", {"Content-Type": "text/plain"}),
    b"HTTP/1.1 200 OK\r\nContent-Length: 4\r\nContent-Type: text/plain\r\n\r\n4\xc2\xb0C",
)
expect(
    "overrides wrong caller Content-Length",
    lambda: get("build_response")(404, b"nope", {"content-length": "999"}),
    b"HTTP/1.1 404 Not Found\r\nContent-Length: 4\r\n\r\nnope",
)
def blocks_crlf_injection():
    try:
        get("build_response")(200, b"ok", {"X-Note": "hi\r\nSet-Cookie: evil=1"})
        return False
    except ValueError:
        return True
check("rejects CRLF header injection", blocks_crlf_injection)
```

## Hidden checks

```python
expect(
    "204 No Content with empty body",
    lambda: get("build_response")(204),
    b"HTTP/1.1 204 No Content\r\nContent-Length: 0\r\n\r\n",
)
def blocks_crlf_name():
    try:
        get("build_response")(200, b"ok", {"X-Bad\nName": "1"})
        return False
    except ValueError:
        return True
check("rejects LF in header name", blocks_crlf_name)
```

## Solution

```python
REASONS = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    500: "Internal Server Error",
}


def build_response(status_code, body=b"", headers=None):
    raw_body = body.encode("utf-8") if isinstance(body, str) else body
    reason = REASONS.get(status_code, "Unknown")
    clean = {}
    for key, val in (headers or {}).items():
        k, v = str(key), str(val)
        if "\r" in k or "\n" in k or "\r" in v or "\n" in v:
            raise ValueError("header contains CR or LF")
        if k.lower() != "content-length":
            clean[k] = v
    clean["Content-Length"] = str(len(raw_body))
    lines = [f"HTTP/1.1 {status_code} {reason}"]
    for k in sorted(clean, key=lambda s: s.lower()):
        lines.append(f"{k}: {clean[k]}")
    head = ("\r\n".join(lines) + "\r\n\r\n").encode("latin-1")
    return head + raw_body
```

## Restored

Responses hit the wire with exact UTF-8 byte lengths and CRLF injection locked shut.
