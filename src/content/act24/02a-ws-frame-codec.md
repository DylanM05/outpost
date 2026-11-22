---
id: ws-frame-codec
title: Encode and decode masked RFC 6455 WebSocket frames
system: Frame rack
symbol: equipment
scene: tests
skills: websockets
---

## Briefing

Once upgraded, WebSockets talk in lightweight binary frames: a 2-byte header carrying `FIN`, `opcode` (`1` = text, `2` = binary, `8` = close, `9` = ping, `10` = pong), a `MASK` bit, variable-length payload size (`<126`, `126` + 2-byte uint16, or `127` + 8-byte uint64), an optional 4-byte XOR mask key (mandatory for client-to-server frames!), and the payload.

## Concept

1. **`encode_ws_frame(opcode, payload, fin=True, mask_key=None)`:**
   - `byte0 = (0x80 if fin else 0) | (opcode & 0x0F)`.
   - `mask_bit = 0x80 if mask_key is not None else 0`. (If `mask_key is not None` and `len(mask_key) != 4`, raise `ValueError`.)
   - Payload length `n = len(payload)`:
     - `n < 126`: 1 byte `mask_bit | n`.
     - `126 <= n <= 65535`: byte `mask_bit | 126` + `struct.pack("!H", n)`.
     - `n > 65535`: byte `mask_bit | 127` + `struct.pack("!Q", n)`.
   - If `mask_key` is provided: append `mask_key` and XOR-mask payload (`bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))`), else append raw `payload`.
   - Return `bytes`.
2. **`decode_ws_frame(data)`:**
   - Parse one frame from `data` (raise `ValueError` if truncated!).
   - Return `{"fin": bool, "opcode": int, "masked": bool, "payload": bytes, "consumed": int}` with the payload **unmasked** if `masked` was `True`!

## Objective

Implement `encode_ws_frame(opcode, payload, fin=True, mask_key=None)` and `decode_ws_frame(data)`.

## Hints

1. Use `struct.pack("!H", n)` / `struct.unpack("!H", ...)` for 16-bit extended lengths and `"!Q"` for 64-bit extended lengths.
2. Remember XOR masking is symmetric: `bytes(b ^ mask[i % 4] for i, b in enumerate(raw))` both masks and unmasks!

## Starter: guided

```python
import struct


def encode_ws_frame(opcode, payload, fin=True, mask_key=None):
    if mask_key is not None and len(mask_key) != 4:
        raise ValueError("mask_key must be 4 bytes")
    b0 = (0x80 if fin else 0) | (opcode & 0x0F)
    # Encode length (0..125, 126+uint16, 127+uint64), optional 4-byte mask, and payload.
    pass


def decode_ws_frame(data):
    pass
```

## Starter: standard

```python
import struct


def encode_ws_frame(opcode, payload, fin=True, mask_key=None):
    pass


def decode_ws_frame(data):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _small_masked():
    frame = get("encode_ws_frame")(1, b"Hello", fin=True, mask_key=b"\x37\xfa\x21\x3d")
    dec = get("decode_ws_frame")(frame)
    return (frame[0], frame[1], dec)
expect("encodes and decodes masked small text frame", _small_masked, (
    0x81,
    0x85,
    {"fin": True, "opcode": 1, "masked": True, "payload": b"Hello", "consumed": 11},
))

def _medium_unmasked():
    body = b"x" * 300
    frame = get("encode_ws_frame")(2, body, fin=False, mask_key=None)
    dec = get("decode_ws_frame")(frame + b"TRAILING")
    return (frame[1], dec["fin"], dec["opcode"], dec["masked"], len(dec["payload"]), dec["consumed"])
expect("handles 16-bit extended length (126) and reports exact consumed bytes", _medium_unmasked, (126, False, 2, False, 300, 304))
```

## Hidden checks

```python
def _extended_64_and_truncated():
    body = b"A" * 70000
    frame = get("encode_ws_frame")(2, body)
    dec = get("decode_ws_frame")(frame)
    trunc_err = False
    try:
        get("decode_ws_frame")(frame[:-5])
    except ValueError:
        trunc_err = True
    return (frame[1], len(dec["payload"]), dec["consumed"], trunc_err)
expect("handles 64-bit extended length (127) and rejects truncated frames", _extended_64_and_truncated, (127, 70000, 70010, True))
```

## Solution

```python
import struct


def encode_ws_frame(opcode, payload, fin=True, mask_key=None):
    if mask_key is not None and len(mask_key) != 4:
        raise ValueError("mask_key must be 4 bytes")
    b0 = (0x80 if fin else 0) | (opcode & 0x0F)
    mask_bit = 0x80 if mask_key is not None else 0
    n = len(payload)
    out = bytearray([b0])
    if n < 126:
        out.append(mask_bit | n)
    elif n <= 0xFFFF:
        out.append(mask_bit | 126)
        out.extend(struct.pack("!H", n))
    else:
        out.append(mask_bit | 127)
        out.extend(struct.pack("!Q", n))
    if mask_key is not None:
        out.extend(mask_key)
        out.extend(b ^ mask_key[i % 4] for i, b in enumerate(payload))
    else:
        out.extend(payload)
    return bytes(out)


def decode_ws_frame(data):
    if len(data) < 2:
        raise ValueError("truncated frame header")
    b0, b1 = data[0], data[1]
    fin = bool(b0 & 0x80)
    opcode = b0 & 0x0F
    masked = bool(b1 & 0x80)
    length = b1 & 0x7F
    pos = 2
    if length == 126:
        if len(data) < pos + 2:
            raise ValueError("truncated 16-bit length")
        (length,) = struct.unpack("!H", data[pos : pos + 2])
        pos += 2
    elif length == 127:
        if len(data) < pos + 8:
            raise ValueError("truncated 64-bit length")
        (length,) = struct.unpack("!Q", data[pos : pos + 8])
        pos += 8
    mask_key = None
    if masked:
        if len(data) < pos + 4:
            raise ValueError("truncated mask key")
        mask_key = data[pos : pos + 4]
        pos += 4
    if len(data) < pos + length:
        raise ValueError("truncated payload")
    raw = data[pos : pos + length]
    if mask_key is not None:
        payload = bytes(b ^ mask_key[i % 4] for i, b in enumerate(raw))
    else:
        payload = bytes(raw)
    return {
        "fin": fin,
        "opcode": opcode,
        "masked": masked,
        "payload": payload,
        "consumed": pos + length,
    }
```

## Restored

The frame rack now encodes and unmasks RFC 6455 WebSocket frames across all payload length tiers.
