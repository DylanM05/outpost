---
id: encode-radio-frame
kind: code
title: Encode and decode radio frames
system: Byte decoder
symbol: instrument
scene: tests
skills: encoding
---

## Briefing

Raw binary ciphertext contains unprintable bytes that break text-only radio teletypes and JSON packets. The cipher room wraps raw bytes in **Base64** (compact, 4 chars per 3 bytes) or **hex** (2 chars per byte, easy to read) before transmitting.

## Objective

Write two functions:

1. `pack_frame(payload)` — accepts `bytes` or `str` (if `str`, encode as UTF-8) and returns a JSON-safe ASCII `str` formatted as `"b64:<standard-base64>"`.
2. `unpack_frame(frame)` — accepts a string starting with `"b64:"` or `"hex:"`, decodes it, and returns the raw `bytes`. Raise `ValueError` if the prefix is unknown or the encoded data is malformed (for example, invalid Base64 characters or odd-length/non-hex characters).

```python
pack_frame(b"KR-1")          # "b64:S1ItMQ=="
unpack_frame("b64:S1ItMQ==") # b"KR-1"
unpack_frame("hex:4b52")     # b"KR"
```

## Concept

Binary-to-text encodings represent arbitrary bytes safely using printable ASCII characters — **encoding is NOT encryption**, because anyone can decode it without a key!

Python's standard library provides both:

```python
import base64

encoded = base64.b64encode(b"KR-1").decode("ascii")     # "S1ItMQ=="
raw = base64.b64decode(encoded, validate=True)          # b"KR-1" (raises binascii.Error / ValueError on bad input)

hex_str = b"KR".hex()                                   # "4b52"
raw2 = bytes.fromhex(hex_str)                           # b"KR" (raises ValueError on bad input)
```

Notice `validate=True` on `base64.b64decode`: without it, Python silently ignores invalid characters instead of rejecting corrupted frames! (`binascii.Error` is a subclass of `ValueError`.)

## Hints

1. In `pack_frame`, convert `str` to `bytes` via `payload.encode("utf-8")` before calling `base64.b64encode(...).decode("ascii")`.
2. In `unpack_frame`, split on the first `":"` (`scheme, data = frame.split(":", 1)`). If there is no `":"`, raise `ValueError`.
3. For `"b64"`, call `base64.b64decode(data, validate=True)`. For `"hex"`, make sure whitespace isn't silently accepted (reject if any char isn't hex or `len(data) % 2 != 0`) and call `bytes.fromhex(data)`.

## Starter: guided

```python
import base64


def pack_frame(payload):
    raw = payload.encode("utf-8") if isinstance(payload, str) else payload
    encoded = base64.b64encode(raw).decode("ascii")
    return f"b64:{encoded}"


def unpack_frame(frame):
    if not isinstance(frame, str) or ":" not in frame:
        raise ValueError("missing encoding prefix")
    scheme, data = frame.split(":", 1)
    if scheme == "b64":
        # TODO: decode data with validate=True
        pass
    if scheme == "hex":
        # TODO: reject whitespace and decode hex with bytes.fromhex
        pass
    raise ValueError(f"unknown scheme: {scheme}")
```

## Starter: standard

```python
import base64


def pack_frame(payload):
    pass


def unpack_frame(frame):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("pack_frame(b'KR-1')", lambda: get("pack_frame")(b"KR-1"), "b64:S1ItMQ==")
expect("unpack_frame round-trip UTF-8", lambda: get("unpack_frame")(get("pack_frame")("4°C")), "4°C".encode("utf-8"))
expect("unpack_frame hex", lambda: get("unpack_frame")("hex:4b52"), b"KR")
def bad_b64():
    try:
        get("unpack_frame")("b64:not!valid!b64")
        return False
    except ValueError:
        return True
check("malformed Base64 raises ValueError", bad_b64)
```

## Hidden checks

```python
expect("empty bytes round-trip", lambda: get("unpack_frame")(get("pack_frame")(b"")), b"")
def bad_scheme():
    try:
        get("unpack_frame")("rot13:abc")
        return False
    except ValueError:
        return True
check("unknown prefix raises ValueError", bad_scheme)
def bad_hex():
    try:
        get("unpack_frame")("hex:4b5")
        return False
    except ValueError:
        return True
check("odd-length hex raises ValueError", bad_hex)
def hex_whitespace():
    try:
        get("unpack_frame")("hex:4b 52")
        return False
    except ValueError:
        return True
check("hex with embedded spaces raises ValueError", hex_whitespace)
```

## Solution

```python
import base64


def pack_frame(payload):
    raw = payload.encode("utf-8") if isinstance(payload, str) else payload
    encoded = base64.b64encode(raw).decode("ascii")
    return f"b64:{encoded}"


def unpack_frame(frame):
    if not isinstance(frame, str) or ":" not in frame:
        raise ValueError("missing encoding prefix")
    scheme, data = frame.split(":", 1)
    if scheme == "b64":
        return base64.b64decode(data.encode("ascii"), validate=True)
    if scheme == "hex":
        if any(ch.isspace() for ch in data):
            raise ValueError("hex frame cannot contain whitespace")
        return bytes.fromhex(data)
    raise ValueError(f"unknown scheme: {scheme}")
```

## Restored

Binary packets pack cleanly into Base64 frames and corrupted encodings raise errors immediately instead of passing silently.
