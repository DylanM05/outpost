---
id: wire-relay-server
kind: code
title: Build a raw-bytes HTTP/1.1 relay server
system: Wire audit
symbol: controller
scene: tests
skills: http-protocol, concurrency, crawling
assessment: true
---

## Briefing

Time to bring the entire wire room online! Build a raw-bytes **HTTP/1.1 Pipelined Server** (`RawHTTPServer`) that accepts raw TCP byte streams, handles keep-alive pipelining (both `Content-Length` and `Transfer-Encoding: chunked`), enforces RFC 9112 framing rules, routes requests cleanly (`404` vs `405`), protects against handler crashes (`500`), and returns compliant HTTP/1.1 wire responses.

This is the final independent mission for **The wire room**.

## Objective

Implement a class `RawHTTPServer`:

- `__init__(self)` initializes a route table.
- `route(self, method, path, handler)`:
  - Registers `handler(request) -> (status_code, body, headers_dict)` for exact `(method.upper(), path)`.
  - `request` passed to `handler` is `{"method", "path", "query", "headers", "body"}`, where `path` is the portion of `target` before `"?"` and `query` is the query string after `"?"` (or `""`).
- `handle_stream(self, raw_bytes)` -> `bytes`:
  - Parses back-to-back complete HTTP/1.1 requests from `raw_bytes` (supporting `Content-Length` and `Transfer-Encoding: chunked`, requiring `Host`, rejecting `CL + TE` together, rejecting bad request lines / header names / conflicting `Content-Length`).
  - For each valid parsed request:
    - Split `target` into `path` and `query`.
    - If `(method, path)` matches a registered handler: call it inside `try ... except Exception:` (returning `500 Internal Server Error` with body `b"Internal Server Error"` if the handler raises!).
    - Else if `path` is registered under at least one *other* method: respond with `405 Method Not Allowed` and an `Allow` header listing the allowed methods sorted alphabetically and joined by `", "`!
    - Else: respond with `404 Not Found`.
    - Serialize each response as compliant HTTP/1.1 bytes (`HTTP/1.1 <code> <reason>\r\n...Content-Length: ...\r\n\r\n<body>`).
  - If a request in the stream has a **protocol/framing error** (`ValueError`), append one `400 Bad Request` response with header `Connection: close` and **stop** processing the rest of the corrupted stream!
  - Return the concatenated response `bytes` for all processed requests.

## Concept

This independent finale ties together raw HTTP/1.1 framing, chunked decoding, request-smuggling defenses (`CL + TE`, header token validation, CRLF injection blocking), `404` vs `405 Allow`, exception isolation, and exact UTF-8 byte `Content-Length` serialization.

## Hints

1. Reuse the `parse_pipeline` incremental logic — process one request at a time in a loop so if request #2 is malformed, request #1's valid response is still kept and request #2 emits `400 Bad Request` (`Connection: close`) before breaking!
2. For `405 Method Not Allowed`, collect `sorted(m for (m, p) in self._routes if p == path)` and include `{"Allow": ", ".join(allowed)}`.
3. Make sure your response serializer overrides any stale `Content-Length` with `str(len(raw_body))` and rejects `\r`/`\n` in response headers (catching any error inside the `500` handler wrapper).

## Starter: guided

```python
```

## Starter: standard

```python
```

## Starter: challenge

```python
```

## Checks

```python
Srv = get("RawHTTPServer")

def build_test_server():
    srv = Srv()
    srv.route("GET", "/status", lambda req: (200, f"ok:{req['query']}", {"Content-Type": "text/plain"}))
    srv.route("POST", "/echo", lambda req: (201, req["body"], {"Content-Type": "application/octet-stream"}))
    def boom(req):
        raise RuntimeError("db down")
    srv.route("GET", "/crash", boom)
    return srv

def test_pipeline_and_chunked():
    srv = build_test_server()
    wire = (
        b"GET /status?unit=kr1 HTTP/1.1\r\nHost: ridge.local\r\n\r\n"
        b"POST /echo HTTP/1.1\r\nHost: ridge.local\r\nTransfer-Encoding: chunked\r\n\r\n4\r\nPING\r\n0\r\n\r\n"
    )
    resp = srv.handle_stream(wire)
    return (
        b"HTTP/1.1 200 OK\r\n" in resp,
        b"Content-Length: 11\r\n" in resp,
        b"\r\n\r\nok:unit=kr1" in resp,
        b"HTTP/1.1 201 Created\r\n" in resp,
        resp.endswith(b"\r\n\r\nPING"),
    )

expect("handles pipelined GET + chunked POST in one stream", test_pipeline_and_chunked, (True, True, True, True, True))

def test_404_405_500():
    srv = build_test_server()
    r404 = srv.handle_stream(b"GET /missing HTTP/1.1\r\nHost: kr\r\n\r\n")
    r405 = srv.handle_stream(b"DELETE /echo HTTP/1.1\r\nHost: kr\r\n\r\n")
    r500 = srv.handle_stream(b"GET /crash HTTP/1.1\r\nHost: kr\r\n\r\n")
    return (
        r404.startswith(b"HTTP/1.1 404 Not Found\r\n"),
        r405.startswith(b"HTTP/1.1 405 Method Not Allowed\r\n") and b"Allow: POST\r\n" in r405,
        r500.startswith(b"HTTP/1.1 500 Internal Server Error\r\n"),
    )

expect("returns accurate 404, 405 with Allow, and 500 on crash", test_404_405_500, (True, True, True))
```

## Hidden checks

```python
Srv = get("RawHTTPServer")

def test_bad_request_stops_stream():
    srv = Srv()
    srv.route("GET", "/ok", lambda req: (200, "fine", {}))
    wire = (
        b"GET /ok HTTP/1.1\r\nHost: kr\r\n\r\n"
        b"POST /ok HTTP/1.1\r\nHost: kr\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n"
        b"GET /ok HTTP/1.1\r\nHost: kr\r\n\r\n"
    )
    resp = srv.handle_stream(wire)
    return (
        resp.count(b"HTTP/1.1 200 OK") == 1,
        resp.count(b"HTTP/1.1 400 Bad Request") == 1,
        b"Connection: close\r\n" in resp,
    )

expect("malformed CL+TE request emits 400 Connection: close and halts stream", test_bad_request_stops_stream, (True, True, True))

def test_utf8_content_length():
    srv = Srv()
    srv.route("GET", "/temp", lambda req: (200, "4°C", {}))
    resp = srv.handle_stream(b"GET /temp HTTP/1.1\r\nHost: kr\r\n\r\n")
    return b"Content-Length: 4\r\n" in resp and resp.endswith(b"\r\n\r\n4\xc2\xb0C")

expect("uses UTF-8 byte length for Content-Length", test_utf8_content_length, True)
```

## Solution

```python
TOKEN_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-.^_`|~")
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


class _Incomplete(Exception):
    pass


def _serialize(status_code, body=b"", headers=None):
    raw_body = body.encode("utf-8") if isinstance(body, str) else body
    reason = REASONS.get(status_code, "Unknown")
    clean = {}
    for key, val in (headers or {}).items():
        k, v = str(key), str(val)
        if "\r" in k or "\n" in k or "\r" in v or "\n" in v:
            raise ValueError("header injection")
        if k.lower() != "content-length":
            clean[k] = v
    clean["Content-Length"] = str(len(raw_body))
    lines = [f"HTTP/1.1 {status_code} {reason}"]
    for k in sorted(clean, key=lambda s: s.lower()):
        lines.append(f"{k}: {clean[k]}")
    return ("\r\n".join(lines) + "\r\n\r\n").encode("latin-1") + raw_body


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
    return method, target


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


def _parse_one(stream, pos):
    end_head = stream.find(b"\r\n\r\n", pos)
    if end_head == -1:
        raise _Incomplete()
    lines = stream[pos:end_head].split(b"\r\n")
    method, target = _parse_req_line(lines[0])
    headers = _parse_headers(lines[1:])
    if not headers.get("host"):
        raise ValueError("missing Host header")
    has_te = "transfer-encoding" in headers
    has_cl = "content-length" in headers
    if has_te and has_cl:
        raise ValueError("CL and TE cannot both be set")
    body_start = end_head + 4
    if has_te:
        if headers["transfer-encoding"].lower() != "chunked":
            raise ValueError("unsupported Transfer-Encoding")
        body, next_pos = _decode_chunked_at(stream, body_start)
    else:
        cl_raw = headers.get("content-length", "0")
        if not (cl_raw.isascii() and cl_raw.isdigit()):
            raise ValueError("invalid Content-Length")
        cl = int(cl_raw)
        if len(stream) - body_start < cl:
            raise _Incomplete()
        body = stream[body_start : body_start + cl]
        next_pos = body_start + cl
    if "?" in target:
        path, query = target.split("?", 1)
    else:
        path, query = target, ""
    return {"method": method, "path": path, "query": query, "headers": headers, "body": body}, next_pos


class RawHTTPServer:
    def __init__(self):
        self._routes = {}

    def route(self, method, path, handler):
        self._routes[(method.upper(), path)] = handler

    def handle_stream(self, raw_bytes):
        responses = []
        pos = 0
        while pos < len(raw_bytes):
            try:
                req, pos = _parse_one(raw_bytes, pos)
            except _Incomplete:
                break
            except ValueError:
                responses.append(_serialize(400, b"Bad Request", {"Connection": "close"}))
                break

            key = (req["method"], req["path"])
            if key in self._routes:
                try:
                    status, body, hdrs = self._routes[key](req)
                    responses.append(_serialize(status, body, hdrs))
                except Exception:
                    responses.append(_serialize(500, b"Internal Server Error"))
            else:
                allowed = sorted(m for (m, p) in self._routes if p == req["path"])
                if allowed:
                    responses.append(_serialize(405, b"Method Not Allowed", {"Allow": ", ".join(allowed)}))
                else:
                    responses.append(_serialize(404, b"Not Found"))
        return b"".join(responses)
```

## Restored

The wire room's raw HTTP/1.1 server parses pipelined streams, decodes chunked uploads, isolates handler crashes, blocks request smuggling, and writes byte-exact responses back onto the wire.
