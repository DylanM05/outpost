---
id: protobuf-messages
title: Serialize and decode tagged Protobuf wire messages with forward compatibility
system: Codec deck
symbol: instrument
scene: tests
skills: protobuf-grpc
---

## Briefing

Protocol Buffers achieves forward and backward schema compatibility without sending field names on the wire: every field is encoded as a **tag** `(field_number << 3) | wire_type` followed by its value — allowing older receivers to cleanly skip unknown future fields!

## Concept

Support the two core Protobuf wire types:
- **Wire type `0` (`VARINT`):** non-negative `int` value encoded via `encode_varint`.
- **Wire type `2` (`LEN`):** `bytes` or `str` (UTF-8 encoded) prefixed by `encode_varint(len(raw_bytes)) + raw_bytes`.

1. **`encode_proto(fields)`:**
   - `fields` is a dict `{field_number: value}` (sorted ascending by `field_number`; require `field_number >= 1`).
   - If `value` is `int` (not `bool`, `>= 0`): emit `encode_varint((field_num << 3) | 0) + encode_varint(value)`.
   - If `value` is `str`: UTF-8 encode to `raw`, emit `encode_varint((field_num << 3) | 2) + encode_varint(len(raw)) + raw`.
   - If `value` is `bytes`: emit `encode_varint((field_num << 3) | 2) + encode_varint(len(value)) + value`.
   - Skip `None` values (absent optional fields).
2. **`decode_proto(data, schema)`:**
   - `schema` maps `field_number -> ("varint" | "str" | "bytes")`.
   - Loop through tagged fields in `data`:
     - Unpack `tag` varint -> `field_num = tag >> 3`, `wire_type = tag & 0x07`.
     - If `wire_type == 0`: read varint `v`.
     - Else if `wire_type == 2`: read length `L` varint and slice `L` bytes (raise `ValueError` if truncated!).
     - Else: raise `ValueError(f"unsupported wire type: {wire_type}")`.
     - **Forward compatibility:** if `field_num` is NOT in `schema`, silently skip it!
     - Otherwise store into `result[field_num]` (decoding UTF-8 if schema type is `"str"`, keeping `bytes` for `"bytes"`, `int` for `"varint"`, and raising `ValueError` if wire type mismatches schema!).
   - Return `result`.

## Objective

Implement `encode_proto(fields)` and `decode_proto(data, schema)`.

## Hints

1. Because every wire type is self-delimiting (`0` stops on MSB=0; `2` starts with its exact byte length), a decoder can skip any unknown `field_num` safely without knowing its schema!

## Starter: guided

```python
def _enc_varint(n):
    out = bytearray()
    while True:
        c = n & 0x7F
        n >>= 7
        out.append(c | 0x80 if n else c)
        if not n:
            break
    return bytes(out)


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


def encode_proto(fields):
    pass


def decode_proto(data, schema):
    pass
```

## Starter: standard

```python
def encode_proto(fields):
    pass


def decode_proto(data, schema):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _roundtrip_and_unknown():
    # Producer sends v2 schema with extra field 3; older v1 reader only knows fields 1 & 2!
    wire = get("encode_proto")({1: 150, 2: "kestrel", 3: b"\xde\xad"})
    v1 = get("decode_proto")(wire, {1: "varint", 2: "str"})
    v2 = get("decode_proto")(wire, {1: "varint", 2: "str", 3: "bytes"})
    return (wire[:3], v1, v2)
expect("encodes compact Protobuf tags and skips unknown fields cleanly", _roundtrip_and_unknown, (
    b"\x08\x96\x01",
    {1: 150, 2: "kestrel"},
    {1: 150, 2: "kestrel", 3: b"\xde\xad"},
))
```

## Hidden checks

```python
def _wire_mismatch():
    wire = get("encode_proto")({1: "hello"})
    try:
        get("decode_proto")(wire, {1: "varint"})
        return False
    except ValueError:
        return True
expect("raises ValueError when wire type mismatches schema", _wire_mismatch, True)

expect("skips None fields during encoding", lambda: get("encode_proto")({1: None, 2: 5}), b"\x10\x05")
```

## Solution

```python
def _enc_varint(n):
    if isinstance(n, bool) or not isinstance(n, int) or n < 0:
        raise ValueError("varint must be non-negative int")
    out = bytearray()
    while True:
        c = n & 0x7F
        n >>= 7
        out.append(c | 0x80 if n else c)
        if not n:
            break
    return bytes(out)


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


def encode_proto(fields):
    out = bytearray()
    for fnum in sorted(fields):
        val = fields[fnum]
        if val is None:
            continue
        if fnum < 1:
            raise ValueError("field number must be >= 1")
        if isinstance(val, int) and not isinstance(val, bool):
            out.extend(_enc_varint((fnum << 3) | 0))
            out.extend(_enc_varint(val))
        elif isinstance(val, str):
            raw = val.encode("utf-8")
            out.extend(_enc_varint((fnum << 3) | 2))
            out.extend(_enc_varint(len(raw)))
            out.extend(raw)
        elif isinstance(val, bytes):
            out.extend(_enc_varint((fnum << 3) | 2))
            out.extend(_enc_varint(len(val)))
            out.extend(val)
        else:
            raise TypeError(f"unsupported value type for field {fnum}")
    return bytes(out)


def decode_proto(data, schema):
    pos = 0
    out = {}
    while pos < len(data):
        tag, pos = _dec_varint(data, pos)
        fnum = tag >> 3
        wtype = tag & 0x07
        if wtype == 0:
            val, pos = _dec_varint(data, pos)
        elif wtype == 2:
            length, pos = _dec_varint(data, pos)
            if pos + length > len(data):
                raise ValueError("truncated length-delimited field")
            val = bytes(data[pos : pos + length])
            pos += length
        else:
            raise ValueError(f"unsupported wire type: {wtype}")
        expected = schema.get(fnum)
        if expected is None:
            continue
        if expected == "varint":
            if wtype != 0:
                raise ValueError("wire type mismatch: expected varint")
            out[fnum] = val
        elif expected == "str":
            if wtype != 2:
                raise ValueError("wire type mismatch: expected str")
            out[fnum] = val.decode("utf-8")
        elif expected == "bytes":
            if wtype != 2:
                raise ValueError("wire type mismatch: expected bytes")
            out[fnum] = val
        else:
            raise ValueError(f"unknown schema type: {expected}")
    return out
```

## Restored

The codec deck now serializes tagged Protobuf messages that evolve forward-compatibly across versions.
