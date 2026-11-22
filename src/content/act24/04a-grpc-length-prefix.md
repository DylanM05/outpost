---
id: grpc-length-prefix
title: Frame and compress gRPC length-prefixed message streams
system: RPC bay
symbol: equipment
scene: tests
skills: protobuf-grpc
---

## Briefing

gRPC streams one or many Protobuf messages inside a single HTTP/2 body using a dead-simple **5-byte length-prefixed envelope**: 1 byte compression flag (`0` uncompressed, `1` gzip-compressed) + 4-byte big-endian unsigned payload length (`struct "!BI"`), followed by the payload bytes!

## Concept

1. **`encode_grpc_message(payload: bytes, compress=False)`:**
   - If `compress` is `True`: `body = gzip.compress(payload)`, `flag = 1`.
   - Else: `body = payload`, `flag = 0`.
   - Return `struct.pack("!BI", flag, len(body)) + body`.
2. **`decode_grpc_stream(stream_bytes, max_message_bytes=1048576)`:**
   - Decodes ALL consecutive gRPC envelopes from `stream_bytes` into a list of raw `bytes` payloads!
   - For each envelope:
     - Require at least 5 header bytes (else raise `ValueError("truncated gRPC header")`).
     - Unpack `flag, length = struct.unpack("!BI", ...)`.
     - Validate `flag in (0, 1)` (else raise `ValueError`) and `length <= max_message_bytes` (else raise `ValueError("RESOURCE_EXHAUSTED")`).
     - Validate `pos + length <= len(stream_bytes)` (else raise `ValueError("truncated gRPC body")`).
     - If `flag == 1`, decompress with `gzip.decompress(raw)` (and also verify decompressed length `<= max_message_bytes` to block zip-bomb payloads!).
   - Return the list of decoded `bytes` messages.

## Objective

Implement `encode_grpc_message(payload, compress=False)` and `decode_grpc_stream(stream_bytes, max_message_bytes=1048576)`.

## Hints

1. Checking `len(decompressed) > max_message_bytes` after `gzip.decompress` protects the RPC server from tiny gzip bombs expanding into gigabytes!

## Starter: guided

```python
import gzip
import struct


def encode_grpc_message(payload, compress=False):
    if not isinstance(payload, bytes):
        raise TypeError("payload must be bytes")
    body = gzip.compress(payload) if compress else payload
    return struct.pack("!BI", 1 if compress else 0, len(body)) + body


def decode_grpc_stream(stream_bytes, max_message_bytes=1048576):
    pass
```

## Starter: standard

```python
import gzip
import struct


def encode_grpc_message(payload, compress=False):
    pass


def decode_grpc_stream(stream_bytes, max_message_bytes=1048576):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _stream():
    m1 = get("encode_grpc_message")(b"ping", compress=False)
    m2 = get("encode_grpc_message")(b"telemetry-" * 20, compress=True)
    decoded = get("decode_grpc_stream")(m1 + m2)
    return (m1[:5], m2[0], len(m2) < 205, decoded)
expect("frames uncompressed and gzip-compressed messages in one gRPC stream", _stream, (
    b"\x00\x00\x00\x00\x04",
    1,
    True,
    [b"ping", b"telemetry-" * 20],
))
```

## Hidden checks

```python
def _zip_bomb_and_trunc():
    big = get("encode_grpc_message")(b"A" * 5000, compress=True)
    bomb_blocked = False
    try:
        get("decode_grpc_stream")(big, max_message_bytes=1000)
    except ValueError:
        bomb_blocked = True
    trunc_blocked = False
    try:
        get("decode_grpc_stream")(b"\x00\x00\x00\x00\x05abc")
    except ValueError:
        trunc_blocked = True
    return (bomb_blocked, trunc_blocked, get("decode_grpc_stream")(b""))
expect("blocks decompressed size limit violations and truncated frames", _zip_bomb_and_trunc, (True, True, []))
```

## Solution

```python
import gzip
import struct


def encode_grpc_message(payload, compress=False):
    if not isinstance(payload, bytes):
        raise TypeError("payload must be bytes")
    body = gzip.compress(payload) if compress else payload
    return struct.pack("!BI", 1 if compress else 0, len(body)) + body


def decode_grpc_stream(stream_bytes, max_message_bytes=1048576):
    pos = 0
    n = len(stream_bytes)
    out = []
    while pos < n:
        if pos + 5 > n:
            raise ValueError("truncated gRPC header")
        flag, length = struct.unpack("!BI", stream_bytes[pos : pos + 5])
        pos += 5
        if flag not in (0, 1):
            raise ValueError(f"invalid compression flag: {flag}")
        if length > max_message_bytes:
            raise ValueError("RESOURCE_EXHAUSTED: compressed frame exceeds limit")
        if pos + length > n:
            raise ValueError("truncated gRPC body")
        body = bytes(stream_bytes[pos : pos + length])
        pos += length
        if flag == 1:
            body = gzip.decompress(body)
            if len(body) > max_message_bytes:
                raise ValueError("RESOURCE_EXHAUSTED: decompressed payload exceeds limit")
        out.append(body)
    return out
```

## Restored

The RPC bay now streams length-prefixed, gzip-safe gRPC envelopes with strict size protection.
