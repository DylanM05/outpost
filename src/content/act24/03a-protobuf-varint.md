---
id: protobuf-varint
title: Implement Base-128 varint and ZigZag signed codecs
system: Codec deck
symbol: instrument
scene: tests
skills: protobuf-grpc
---

## Briefing

Unsigned LEB128 varints pack small positive numbers into 1 byte — but negative two's-complement numbers have leading `1` bits and balloon to 10 bytes! Protobuf's `sint32`/`sint64` fixes this with **ZigZag encoding**, interleaving positive and negative numbers (`0 -> 0`, `-1 -> 1`, `1 -> 2`, `-2 -> 3`, `2 -> 4`) before varint encoding.

## Concept

1. **`encode_varint(n)` / `decode_varint(data, offset=0)`:**
   - `encode_varint(n)`: requires integer `n >= 0` (else `ValueError`). Emits 7 bits per byte (LSB first) with bit `0x80` set on every byte except the last.
   - `decode_varint(data, offset=0)`: decodes one varint starting at `offset`, returning `(value, next_offset)` (raise `ValueError` if `data` ends before a byte with bit `0x80 == 0`!).
2. **`zigzag_encode(n)` / `zigzag_decode(u)`:**
   - For arbitrary signed Python ints:
     - `zigzag_encode(n)`: `2 * n` if `n >= 0` else `-2 * n - 1` (equivalently `(n << 1) ^ (-1 if n < 0 else 0)`).
     - `zigzag_decode(u)`: requires `u >= 0` (else `ValueError`); `(u >> 1) ^ -(u & 1)`.

## Objective

Implement `encode_varint`, `decode_varint`, `zigzag_encode`, and `zigzag_decode`.

## Hints

1. In `decode_varint`, track `shift = 0` and `val = 0`: for each byte `b = data[pos]`, add `(b & 0x7F) << shift`, advance `pos += 1`, `shift += 7`, and break once `(b & 0x80) == 0`!
2. Notice Python integers have arbitrary precision, so `2 * n if n >= 0 else -2 * n - 1` works for ALL signed integers without needing 32/64-bit sign-extension tricks!

## Starter: guided

```python
def encode_varint(n):
    if isinstance(n, bool) or not isinstance(n, int) or n < 0:
        raise ValueError("n must be a non-negative integer")
    out = bytearray()
    while True:
        chunk = n & 0x7F
        n >>= 7
        if n:
            out.append(chunk | 0x80)
        else:
            out.append(chunk)
            break
    return bytes(out)


def decode_varint(data, offset=0):
    pass


def zigzag_encode(n):
    pass


def zigzag_decode(u):
    pass
```

## Starter: standard

```python
def encode_varint(n):
    pass


def decode_varint(data, offset=0):
    pass


def zigzag_encode(n):
    pass


def zigzag_decode(u):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("encodes 300 as b'\\xac\\x02'", lambda: get("encode_varint")(300), b"\xac\x02")
expect("decodes varint at offset and returns next offset", lambda: get("decode_varint")(b"\xff\xac\x02\x99", 1), (300, 3))
expect("ZigZag maps small negatives to small unsigned ints", lambda: [get("zigzag_encode")(x) for x in [0, -1, 1, -2, 2, -50]], [0, 1, 2, 3, 4, 99])
expect("ZigZag round-trips signed integers", lambda: [get("zigzag_decode")(get("zigzag_encode")(x)) for x in [-100000, -1, 0, 1, 100000]], [-100000, -1, 0, 1, 100000])
```

## Hidden checks

```python
def _trunc_and_neg():
    trunc = False
    try:
        get("decode_varint")(b"\x80\x80")
    except ValueError:
        trunc = True
    neg = False
    try:
        get("encode_varint")(-1)
    except ValueError:
        neg = True
    return (trunc, neg, get("encode_varint")(0))
expect("rejects truncated varints and negative inputs, encodes 0 as single zero byte", _trunc_and_neg, (True, True, b"\x00"))
```

## Solution

```python
def encode_varint(n):
    if isinstance(n, bool) or not isinstance(n, int) or n < 0:
        raise ValueError("n must be a non-negative integer")
    out = bytearray()
    while True:
        chunk = n & 0x7F
        n >>= 7
        if n:
            out.append(chunk | 0x80)
        else:
            out.append(chunk)
            break
    return bytes(out)


def decode_varint(data, offset=0):
    val = 0
    shift = 0
    pos = offset
    while pos < len(data):
        b = data[pos]
        pos += 1
        val |= (b & 0x7F) << shift
        if (b & 0x80) == 0:
            return (val, pos)
        shift += 7
    raise ValueError("truncated varint")


def zigzag_encode(n):
    return 2 * n if n >= 0 else -2 * n - 1


def zigzag_decode(u):
    if u < 0:
        raise ValueError("u must be non-negative")
    return (u >> 1) ^ -(u & 1)
```

## Restored

The codec deck now packs unsigned and signed integers tightly using Protobuf Base-128 varints and ZigZag coding.
