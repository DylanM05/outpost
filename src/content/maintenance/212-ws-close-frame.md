---
id: maintenance-ws-close-frame
title: Encode and decode WebSocket close frame payloads
system: Frame rack
symbol: equipment
scene: tests
skills: websockets
reviewSkill: websockets
prerequisite: ws-room-broker
---

## Briefing

A clean WebSocket close frame (opcode `8`) carries a 2-byte big-endian status code (like `1000` normal closure or `1001` going away) followed by an optional UTF-8 reason string.

## Objective

Implement:
1. `encode_close_payload(code, reason="")` returning `struct.pack("!H", code) + reason.encode("utf-8")` (raise `ValueError` if `not (1000 <= code <= 4999)`).
2. `decode_close_payload(payload)` returning `(code, reason_str)` (raise `ValueError` if `len(payload) < 2`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `struct.pack("!H", code)` and `struct.unpack("!H", payload[:2])[0]` for the 16-bit big-endian status code.

## Starter

```python
```

## Checks

```python
expect("encodes normal closure 1000 with reason", lambda: get("encode_close_payload")(1000, "bye"), b"\x03\xe8bye")
expect("decodes close payload back into (code, reason)", lambda: get("decode_close_payload")(b"\x03\xe9shutdown"), (1001, "shutdown"))
```

## Hidden checks

```python
expect("handles empty reason string", lambda: get("decode_close_payload")(get("encode_close_payload")(1000)), (1000, ""))
def _bad():
    try:
        get("decode_close_payload")(b"\x03")
        return False
    except ValueError:
        return True
expect("rejects 1-byte truncated close payload", _bad, True)
```

## Solution

```python
import struct


def encode_close_payload(code, reason=""):
    if not (1000 <= code <= 4999):
        raise ValueError("close code must be in 1000..4999")
    return struct.pack("!H", code) + reason.encode("utf-8")


def decode_close_payload(payload):
    if len(payload) < 2:
        raise ValueError("close payload must be at least 2 bytes")
    (code,) = struct.unpack("!H", payload[:2])
    return (code, payload[2:].decode("utf-8"))
```

## Restored

WebSocket close payloads now communicate clean shutdown codes and reasons.
