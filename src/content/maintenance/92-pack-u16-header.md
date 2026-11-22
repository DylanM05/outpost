---
id: maintenance-pack-u16-header
title: Pack big-endian 16-bit counters
system: Byte decoder
symbol: instrument
scene: tests
skills: encoding
reviewSkill: encoding
prerequisite: bitwise-mask
---

## Briefing

Telemetry frames pack sensor integers as compact 2-byte big-endian unsigned integers (`0`–`65535`). Implement packing and unpacking with bounds checking.

## Objective

Write two functions:

1. `pack_u16_list(nums)` — validates every integer is in `0 <= n <= 65535` (raising `ValueError` otherwise) and returns concatenated 2-byte big-endian `bytes`.
2. `unpack_u16_list(raw)` — validates `len(raw) % 2 == 0` (raising `ValueError` otherwise) and returns the list of unpacked integers.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `n.to_bytes(2, "big")` and `int.from_bytes(raw[i : i + 2], "big")`.

## Starter

```python
```

## Checks

```python
expect("packs big-endian u16 values", lambda: get("pack_u16_list")([0, 258, 65535]), b"\x00\x00\x01\x02\xff\xff")
expect("unpacks big-endian u16 values", lambda: get("unpack_u16_list")(b"\x00\x00\x01\x02\xff\xff"), [0, 258, 65535])
```

## Hidden checks

```python
def out_of_range():
    try:
        get("pack_u16_list")([65536])
        return False
    except ValueError:
        return True
check("value > 65535 raises ValueError", out_of_range)
def odd_len():
    try:
        get("unpack_u16_list")(b"\x01\x02\x03")
        return False
    except ValueError:
        return True
check("odd byte length raises ValueError", odd_len)
```

## Solution

```python
def pack_u16_list(nums):
    out = bytearray()
    for n in nums:
        if isinstance(n, bool) or not isinstance(n, int) or not (0 <= n <= 65535):
            raise ValueError("value out of u16 range")
        out.extend(n.to_bytes(2, "big"))
    return bytes(out)


def unpack_u16_list(raw):
    if len(raw) % 2 != 0:
        raise ValueError("byte length must be even")
    return [int.from_bytes(raw[i : i + 2], "big") for i in range(0, len(raw), 2)]
```

## Restored

Compact 16-bit telemetry frames pack and unpack cleanly in network byte order.
