---
id: build-protocol-gateway
title: Build a multi-protocol WebSocket, Protobuf/gRPC, and GraphQL gateway
system: Spire audit
symbol: controller
scene: tests
assessment: true
skills: websockets, protobuf-grpc, graphql-batching
---

## Briefing

Bring the protocol spire fully online in `ProtocolGateway(user_batch_fn, posts_data)`: a unified backend edge handling RFC 6455 WebSocket upgrades and binary frames, Protobuf-over-gRPC length-prefixed telemetry ingest, AND GraphQL queries backed by a per-request DataLoader so fetching 100 posts with authors executes just ONE batched user lookup!

## Concept

Implement `ProtocolGateway(user_batch_fn, posts_data)`:
- `posts_data`: list of dicts `{"id": int, "title": str, "author_id": int}`.
- `user_batch_fn(ids)`: takes a list of unique author IDs and returns a matching list of user dicts `{"id": int, "name": str}` (aligned 1-to-1).
- **1. WebSocket Upgrade & Frame Relay:**
  - `ws_upgrade(headers)` -> validates RFC 6455 upgrade headers (`Upgrade: websocket`, `Connection` contains `upgrade`, `Sec-WebSocket-Version: 13`, non-empty `Sec-WebSocket-Key`) and returns `(101, {"Upgrade": "websocket", "Connection": "Upgrade", "Sec-WebSocket-Accept": accept})` or `(400, {})`.
  - `ws_handle_frame(frame_bytes)` -> decodes one (possibly masked) RFC 6455 frame:
    - If `opcode == 9` (PING): returns an unmasked PONG frame (`opcode = 10`) echoing the exact same payload!
    - If `opcode == 1` (TEXT): records the UTF-8 decoded message in `self.ws_messages` and returns an unmasked TEXT frame (`opcode = 1`) with payload `b"ACK:" + payload`!
- **2. Protobuf-over-gRPC Telemetry Ingest:**
  - `grpc_ingest(grpc_stream_bytes)` -> decodes every 5-byte length-prefixed gRPC frame (supporting flag `0` raw and flag `1` gzip), decodes each frame's Protobuf payload using schema `{1: "varint", 2: "str"}` (ignoring unknown future fields!), stores `{"sensor_id": msg[1], "status": msg[2]}` into `self.telemetry`, and returns the count of ingested messages.
- **3. Batched GraphQL Query Endpoint:**
  - `graphql(query_str, max_depth=4)` -> parses `query_str` (same syntax as `parse_gql_query`), enforces `max_depth`, and executes against a fresh per-request `DataLoader(user_batch_fn)` supporting root field `posts` returning each post with `"id"`, `"title"`, and nested `"author"` resolved in a **single batched `user_batch_fn` call** for all posts in the query!
  - Returns `{"data": ..., "errors": [...]}`.

## Objective

Implement `ProtocolGateway` with `ws_upgrade`, `ws_handle_frame`, `grpc_ingest`, and `graphql`.

## Hints

1. To guarantee `graphql()` fires ONLY ONE call to `user_batch_fn` across all posts when `author` is selected, pre-warm the per-request DataLoader with `loader.load_many([p["author_id"] for p in self.posts_data])` whenever the `posts` selection includes an `author` sub-field!
2. Reuse the exact RFC 6455 GUID `"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"`, `struct.unpack("!BI", ...)`, and Base-128 varint decoder from earlier missions.

## Starter: guided

```python
import base64
import gzip
import hashlib
import re
import struct

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


class ProtocolGateway:
    def __init__(self, user_batch_fn, posts_data):
        self.user_batch_fn = user_batch_fn
        self.posts_data = list(posts_data)
        self.ws_messages = []
        self.telemetry = []

    def ws_upgrade(self, headers):
        pass

    def ws_handle_frame(self, frame_bytes):
        pass

    def grpc_ingest(self, grpc_stream_bytes):
        pass

    def graphql(self, query_str, max_depth=4):
        pass
```

## Starter: standard

```python
import base64
import gzip
import hashlib
import re
import struct


class ProtocolGateway:
    def __init__(self, user_batch_fn, posts_data):
        pass

    def ws_upgrade(self, headers):
        pass

    def ws_handle_frame(self, frame_bytes):
        pass

    def grpc_ingest(self, grpc_stream_bytes):
        pass

    def graphql(self, query_str, max_depth=4):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
import gzip as _gzip, struct as _struct

def _gateway_e2e():
    batch_calls = []
    users_db = {1: {"id": 1, "name": "Ada"}, 2: {"id": 2, "name": "Lin"}}
    def load_users(ids):
        batch_calls.append(list(ids))
        return [users_db[i] for i in ids]
    posts = [
        {"id": 10, "title": "Solar", "author_id": 1},
        {"id": 11, "title": "Wind", "author_id": 2},
        {"id": 12, "title": "Grid", "author_id": 1},
    ]
    gw = get("ProtocolGateway")(load_users, posts)

    # 1. WebSocket upgrade + masked text frame + ping frame
    status, hdrs = gw.ws_upgrade({
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
        "Sec-WebSocket-Version": "13",
    })
    mask = b"\x01\x02\x03\x04"
    raw_hi = b"hi"
    masked_hi = bytes(b ^ mask[i % 4] for i, b in enumerate(raw_hi))
    ws_text_frame = bytes([0x81, 0x80 | len(raw_hi)]) + mask + masked_hi
    ack_frame = gw.ws_handle_frame(ws_text_frame)
    pong_frame = gw.ws_handle_frame(bytes([0x89, 0x02]) + b"ok")

    # 2. Protobuf-over-gRPC (compressed frame with field 1=42, field 2="ok", unknown field 9=7)
    proto = b"\x08\x2a\x12\x02ok\x48\x07"
    gz = _gzip.compress(proto)
    grpc_bytes = _struct.pack("!BI", 1, len(gz)) + gz
    ingested = gw.grpc_ingest(grpc_bytes)

    # 3. GraphQL query with DataLoader batching (3 posts -> 1 batch call for [1, 2]!)
    gql = gw.graphql("{ posts { title author { name } } }")
    return (
        status,
        hdrs["Sec-WebSocket-Accept"],
        gw.ws_messages,
        ack_frame,
        pong_frame,
        ingested,
        gw.telemetry,
        gql,
        batch_calls,
    )
expect("handles WebSockets, Protobuf/gRPC streams, and batched GraphQL end to end", _gateway_e2e, (
    101,
    "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=",
    ["hi"],
    b"\x81\x06ACK:hi",
    b"\x8a\x02ok",
    1,
    [{"sensor_id": 42, "status": "ok"}],
    {
        "data": {
            "posts": [
                {"title": "Solar", "author": {"name": "Ada"}},
                {"title": "Wind", "author": {"name": "Lin"}},
                {"title": "Grid", "author": {"name": "Ada"}},
            ]
        },
        "errors": [],
    },
    [[1, 2]],
))
```

## Hidden checks

```python
def _depth_and_bad_ws():
    gw = get("ProtocolGateway")(lambda ids: [], [])
    s400, _ = gw.ws_upgrade({"Upgrade": "http"})
    deep = gw.graphql("{ a { b { c { d { e } } } } }", max_depth=3)
    return (s400, deep)
expect("rejects bad WebSocket upgrades and overly deep GraphQL queries", _depth_and_bad_ws, (
    400,
    {"data": None, "errors": ["query depth exceeded"]},
))
```

## Solution

```python
import base64
import gzip
import hashlib
import re
import struct

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
_TOKEN_RE = re.compile(r'(\{|\}|\(|\)|:)|"([^"]*)"|(-?\d+)|([A-Za-z_][A-Za-z0-9_]*)|([\s,]+)|(\S)')


def _dec_varint(data, pos):
    val, shift = 0, 0
    while pos < len(data):
        b = data[pos]
        pos += 1
        val |= (b & 0x7F) << shift
        if (b & 0x80) == 0:
            return val, pos
        shift += 7
    raise ValueError("truncated varint")


def _encode_ws(opcode, payload):
    n = len(payload)
    out = bytearray([0x80 | (opcode & 0x0F)])
    if n < 126:
        out.append(n)
    elif n <= 0xFFFF:
        out.append(126)
        out.extend(struct.pack("!H", n))
    else:
        out.append(127)
        out.extend(struct.pack("!Q", n))
    out.extend(payload)
    return bytes(out)


def _decode_ws(data):
    if len(data) < 2:
        raise ValueError("truncated frame")
    opcode = data[0] & 0x0F
    masked = bool(data[1] & 0x80)
    length = data[1] & 0x7F
    pos = 2
    if length == 126:
        (length,) = struct.unpack("!H", data[pos : pos + 2])
        pos += 2
    elif length == 127:
        (length,) = struct.unpack("!Q", data[pos : pos + 8])
        pos += 8
    mask_key = None
    if masked:
        mask_key = data[pos : pos + 4]
        pos += 4
    raw = data[pos : pos + length]
    if len(raw) < length:
        raise ValueError("truncated payload")
    payload = bytes(b ^ mask_key[i % 4] for i, b in enumerate(raw)) if mask_key else bytes(raw)
    return opcode, payload


def _parse_gql(src):
    tokens = []
    for m in _TOKEN_RE.finditer(src):
        punct, string, num, ident, ws, bad = m.groups()
        if ws:
            continue
        if bad:
            raise ValueError(f"bad token: {bad}")
        if punct:
            tokens.append(("PUNCT", punct))
        elif string is not None:
            tokens.append(("STR", string))
        elif num is not None:
            tokens.append(("INT", int(num)))
        elif ident is not None:
            tokens.append(("IDENT", ident))
    pos = 0

    def peek():
        return tokens[pos] if pos < len(tokens) else (None, None)

    def eat(kind, val=None):
        nonlocal pos
        tk, tv = tokens[pos]
        if tk != kind or (val is not None and tv != val):
            raise ValueError(f"expected {val or kind}")
        pos += 1
        return tv

    def parse_args():
        eat("PUNCT", "(")
        args = {}
        while True:
            k = eat("IDENT")
            eat("PUNCT", ":")
            tk, tv = tokens[pos]
            pos += 1
            if tk in ("INT", "STR"):
                args[k] = tv
            elif tv == "true":
                args[k] = True
            elif tv == "false":
                args[k] = False
            elif tv == "null":
                args[k] = None
            else:
                raise ValueError("bad arg")
            if peek() == ("PUNCT", ")"):
                eat("PUNCT", ")")
                return args

    def parse_set():
        eat("PUNCT", "{")
        fields = []
        while peek() != ("PUNCT", "}"):
            name = eat("IDENT")
            args = parse_args() if peek() == ("PUNCT", "(") else {}
            sub = parse_set() if peek() == ("PUNCT", "{") else None
            fields.append({"name": name, "args": args, "fields": sub})
        eat("PUNCT", "}")
        return fields

    if peek() == ("IDENT", "query"):
        pos += 1
    return parse_set()


def _ast_depth(fields):
    if not fields:
        return 0
    return 1 + max((_ast_depth(f["fields"]) if f["fields"] else 0) for f in fields)


class ProtocolGateway:
    def __init__(self, user_batch_fn, posts_data):
        self.user_batch_fn = user_batch_fn
        self.posts_data = list(posts_data)
        self.ws_messages = []
        self.telemetry = []

    def ws_upgrade(self, headers):
        lower = {k.lower(): v for k, v in headers.items()}
        upgrade = lower.get("upgrade", "").strip().lower()
        conn = [t.strip().lower() for t in lower.get("connection", "").split(",")]
        ver = lower.get("sec-websocket-version", "").strip()
        key = lower.get("sec-websocket-key", "").strip()
        if upgrade != "websocket" or "upgrade" not in conn or ver != "13" or not key:
            return (400, {})
        accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode("ascii")).digest()).decode("ascii")
        return (101, {"Upgrade": "websocket", "Connection": "Upgrade", "Sec-WebSocket-Accept": accept})

    def ws_handle_frame(self, frame_bytes):
        opcode, payload = _decode_ws(frame_bytes)
        if opcode == 9:
            return _encode_ws(10, payload)
        if opcode == 1:
            self.ws_messages.append(payload.decode("utf-8"))
            return _encode_ws(1, b"ACK:" + payload)
        raise ValueError(f"unsupported opcode: {opcode}")

    def grpc_ingest(self, grpc_stream_bytes):
        pos = 0
        n = len(grpc_stream_bytes)
        count = 0
        while pos < n:
            flag, length = struct.unpack("!BI", grpc_stream_bytes[pos : pos + 5])
            pos += 5
            body = grpc_stream_bytes[pos : pos + length]
            pos += length
            if flag == 1:
                body = gzip.decompress(body)
            # Decode Protobuf fields {1: varint, 2: str}, skipping unknown fields
            p = 0
            rec = {}
            while p < len(body):
                tag, p = _dec_varint(body, p)
                fnum, wtype = tag >> 3, tag & 0x07
                if wtype == 0:
                    val, p = _dec_varint(body, p)
                    if fnum == 1:
                        rec["sensor_id"] = val
                elif wtype == 2:
                    ln, p = _dec_varint(body, p)
                    raw = body[p : p + ln]
                    p += ln
                    if fnum == 2:
                        rec["status"] = raw.decode("utf-8")
                else:
                    raise ValueError(f"unsupported wire type: {wtype}")
            self.telemetry.append(rec)
            count += 1
        return count

    def graphql(self, query_str, max_depth=4):
        ast = _parse_gql(query_str)
        if _ast_depth(ast) > max_depth:
            return {"data": None, "errors": ["query depth exceeded"]}

        cache = {}

        def load_many(keys):
            missing = []
            seen = set()
            for k in keys:
                if k not in cache and k not in seen:
                    seen.add(k)
                    missing.append(k)
            if missing:
                vals = self.user_batch_fn(missing)
                for k, v in zip(missing, vals):
                    cache[k] = v
            return [cache[k] for k in keys]

        errors = []

        def project(fields, obj):
            if obj is None:
                return None
            if isinstance(obj, list):
                return [project(fields, item) for item in obj]
            out = {}
            for f in fields:
                name = f["name"]
                sub = f["fields"]
                if name not in obj:
                    errors.append(f"unknown field: {name}")
                    out[name] = None
                    continue
                val = obj[name]
                out[name] = project(sub, val) if sub else val
            return out

        data = {}
        for f in ast:
            if f["name"] == "posts":
                sub = f["fields"] or []
                needs_author = any(sf["name"] == "author" for sf in sub)
                if needs_author:
                    load_many([p["author_id"] for p in self.posts_data])
                enriched = [
                    {**p, "author": cache.get(p["author_id"]) if needs_author else None}
                    for p in self.posts_data
                ]
                data["posts"] = project(sub, enriched)
            else:
                errors.append(f"unknown field: {f['name']}")
                data[f["name"]] = None
        return {"data": data, "errors": errors}
```

## Restored

The protocol spire's unified gateway now speaks RFC 6455 WebSockets, Protobuf/gRPC streams, and DataLoader-batched GraphQL on one edge.
