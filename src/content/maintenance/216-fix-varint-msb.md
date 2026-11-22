---
id: maintenance-fix-varint-msb
title: Fix a varint decoder that forgets to strip the 0x80 continuation bit
system: Codec deck
symbol: instrument
scene: tests
skills: protobuf-grpc
reviewSkill: protobuf-grpc
prerequisite: grpc-deadline-router
---

## Briefing

A Base-128 varint decoder is corrupting every multi-byte integer because it shifts the raw byte `b` instead of stripping the continuation flag with `b & 0x7F`!

## Objective

Fix `read_varint(data)` so it returns the decoded unsigned integer from `data` (raising `ValueError` if truncated before a byte with MSB=0).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Mask the payload bits with `(b & 0x7F) << shift` instead of `b << shift`!

## Starter

```python
def read_varint(data):
    val = 0
    shift = 0
    for b in data:
        val |= b << shift
        if (b & 0x80) == 0:
            return val
        shift += 7
    raise ValueError("truncated varint")
```

## Checks

```python
expect("decodes multi-byte varint 300 from b'\\xac\\x02'", lambda: get("read_varint")(b"\xac\x02"), 300)
expect("decodes 150 from b'\\x96\\x01'", lambda: get("read_varint")(b"\x96\x01"), 150)
```

## Hidden checks

```python
expect("decodes single-byte varint 42", lambda: get("read_varint")(b"\x2a"), 42)
def _trunc():
    try:
        get("read_varint")(b"\x80")
        return False
    except ValueError:
        return True
expect("raises ValueError on truncated varint", _trunc, True)
```

## Solution

```python
def read_varint(data):
    val = 0
    shift = 0
    for b in data:
        val |= (b & 0x7F) << shift
        if (b & 0x80) == 0:
            return val
        shift += 7
    raise ValueError("truncated varint")
```

## Restored

The varint decoder now strips continuation bits cleanly before shifting.
