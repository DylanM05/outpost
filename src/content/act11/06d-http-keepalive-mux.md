---
id: http-keepalive-mux
kind: code
title: Parse pipelined keep-alive HTTP requests
system: Crawler desk
symbol: instrument
scene: tests
skills: http-protocol
---

## Briefing

HTTP/1.1 connections stay open (`keep-alive`) by default, so a client can send **multiple requests back to back** on the exact same TCP stream — some with `Content-Length`, some with `Transfer-Encoding: chunked`, and sometimes with an incomplete request still arriving at the end of the buffer!

## Objective

Write `parse_pipeline(stream)` accepting `stream: bytes`:

- Parse as many **complete** HTTP/1.1 requests as possible from the start of `stream`, supporting:
  - Fixed-length bodies via `Content-Length` (default `0` if neither `Content-Length` nor `Transfer-Encoding` is set).
  - Chunked bodies via `Transfer-Encoding: chunked` (case-insensitive).
  - **Reject** requests that include **both** `Transfer-Encoding` and `Content-Length` with `ValueError` (**CL.TE request smuggling defense**!).
- If the trailing bytes at the end of `stream` are simply **incomplete** (e.g., headers haven't reached `\r\n\r\n` yet, or fewer than `Content-Length` bytes have arrived, or the terminating `0\r\n\r\n` chunk hasn't arrived yet), stop cleanly and return `(parsed_requests, remaining_bytes)`!
- If any framing or syntax rule is **invalid** (bad request line, missing `Host`, invalid header name, conflicting `Content-Length`, invalid hex chunk size, or both `TE` and `CL`), raise `ValueError`.

## Concept

Notice the critical distinction between **incomplete** (wait for more bytes from TCP!) and **malformed** (reject with `400 Bad Request` and close the connection!). Every production HTTP server (`nginx`, `uvicorn`, Go's `net/http`) splits those two states cleanly — and strictly forbids mixing `Content-Length` + `Transfer-Encoding` on the same request.

## Hints

1. Loop with `pos = 0`:
   - Look for `end_head = stream.find(b"\r\n\r\n", pos)`. If `end_head == -1`, break and return `(requests, stream[pos:])`!
   - Parse request line & headers (raising `ValueError` on syntax errors or missing `Host` or both `transfer-encoding` and `content-length`).
   - If chunked: try decoding starting at `body_start = end_head + 4`, distinguishing *truncated* (break and leave `stream[pos:]` untouched!) from *invalid hex/bad delimiter* (`raise ValueError`).
   - Else (`content-length`): if `len(stream) - body_start < cl`, break and leave `stream[pos:]`; otherwise consume `cl` bytes and advance `pos = body_start + cl`!

## Starter: guided

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


class _Incomplete(Exception):
    pass


def _decode_chunked_at(raw, start):
    out = bytearray()
    pos = start
    while True:
        crlf = raw.find(b"\r\n", pos)
        if crlf == -1:
            raise _Incomplete()
        size_bytes = raw[pos:crlf].split(b";", 1)[0].strip()
        if not size_bytes or size_bytes.startswith((b"+", b"-")):
            raise ValueError("invalid chunk size")
        try:
            size = int(size_bytes, 16)
        except ValueError as exc:
            raise ValueError("invalid hex chunk size") from exc
        pos = crlf + 2
        if size == 0:
            if len(raw) - pos < 2:
                raise _Incomplete()
            if raw[pos : pos + 2] != b"\r\n":
                raise ValueError("missing final CRLF")
            return bytes(out), pos + 2
        end = pos + size
        if len(raw) < end + 2:
            raise _Incomplete()
        if raw[end : end + 2] != b"\r\n":
            raise ValueError("missing chunk CRLF")
        out.extend(raw[pos:end])
        pos = end + 2


def parse_pipeline(stream):
    requests = []
    pos = 0
    while pos < len(stream):
        end_head = stream.find(b"\r\n\r\n", pos)
        if end_head == -1:
            break
        # TODO: parse request line, headers, reject CL+TE together, handle chunked vs Content-Length, stop on _Incomplete
        break
    return requests, stream[pos:]
```

## Starter: standard

```python
def parse_pipeline(stream):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
req1 = b"GET /ping HTTP/1.1\r\nHost: kr\r\n\r\n"
req2 = b"POST /chunk HTTP/1.1\r\nHost: kr\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello\r\n0\r\n\r\n"
partial = b"POST /next HTTP/1.1\r\nHost: kr\r\nContent-Length: 10\r\n\r\nabc"

reqs, rem = get("parse_pipeline")(req1 + req2 + partial)
expect("parses two complete requests (CL + chunked)", lambda: [(r["method"], r["target"], r["body"]) for r in reqs], [("GET", "/ping", b""), ("POST", "/chunk", b"hello")])
expect("leaves incomplete third request in remainder", lambda: rem, partial)

def rejects_cl_te():
    bad = b"POST / HTTP/1.1\r\nHost: kr\r\nContent-Length: 5\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n"
    try:
        get("parse_pipeline")(bad)
        return False
    except ValueError:
        return True
check("rejects CL + TE smuggling combination", rejects_cl_te)
```

## Hidden checks

```python
partial_chunk = b"POST /c HTTP/1.1\r\nHost: kr\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhel"
expect("incomplete chunked body stays buffered", lambda: get("parse_pipeline")(partial_chunk), ([], partial_chunk))
expect("empty stream returns ([], b'')", lambda: get("parse_pipeline")(b""), ([], b""))
```

## Solution

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")


class _Incomplete(Exception):
    pass


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
            raise ValueError("missing colon")
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


def _decode_chunked_at(raw, start):
    out = bytearray()
    pos = start
    while True:
        crlf = raw.find(b"\r\n", pos)
        if crlf == -1:
            raise _Incomplete()
        size_bytes = raw[pos:crlf].split(b";", 1)[0].strip()
        if not size_bytes or size_bytes.startswith((b"+", b"-")):
            raise ValueError("invalid chunk size")
        try:
            size = int(size_bytes, 16)
        except ValueError as exc:
            raise ValueError("invalid hex chunk size") from exc
        pos = crlf + 2
        if size == 0:
            if len(raw) - pos < 2:
                raise _Incomplete()
            if raw[pos : pos + 2] != b"\r\n":
                raise ValueError("missing final CRLF")
            return bytes(out), pos + 2
        end = pos + size
        if len(raw) < end + 2:
            raise _Incomplete()
        if raw[end : end + 2] != b"\r\n":
            raise ValueError("missing chunk CRLF")
        out.extend(raw[pos:end])
        pos = end + 2


def parse_pipeline(stream):
    requests = []
    pos = 0
    while pos < len(stream):
        end_head = stream.find(b"\r\n\r\n", pos)
        if end_head == -1:
            break
        lines = stream[pos:end_head].split(b"\r\n")
        method, target, version = _parse_req_line(lines[0])
        headers = _parse_headers(lines[1:])
        if not headers.get("host"):
            raise ValueError("missing Host header")
        has_te = "transfer-encoding" in headers
        has_cl = "content-length" in headers
        if has_te and has_cl:
            raise ValueError("cannot specify both Content-Length and Transfer-Encoding")
        body_start = end_head + 4
        if has_te:
            if headers["transfer-encoding"].lower() != "chunked":
                raise ValueError("unsupported Transfer-Encoding")
            try:
                body, next_pos = _decode_chunked_at(stream, body_start)
            except _Incomplete:
                break
        else:
            cl_raw = headers.get("content-length", "0")
            if not (cl_raw.isascii() and cl_raw.isdigit()):
                raise ValueError("invalid Content-Length")
            cl = int(cl_raw)
            if len(stream) - body_start < cl:
                break
            body = stream[body_start : body_start + cl]
            next_pos = body_start + cl
        requests.append({
            "method": method,
            "target": target,
            "version": version,
            "headers": headers,
            "body": body,
        })
        pos = next_pos
    return requests, stream[pos:]
```

## Restored

Pipelined keep-alive streams decode back-to-back fixed and chunked requests cleanly, buffer partial tails, and shut down CL.TE smuggling.
