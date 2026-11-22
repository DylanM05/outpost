---
id: maintenance-bit-parity
title: Even parity and bit flips
system: Byte decoder
symbol: instrument
scene: tests
skills: encoding
reviewSkill: encoding
prerequisite: bitwise-mask
---

## Briefing

Low-level serial frames append an **even parity bit** (`0` if the byte already has an even number of `1` bits, `1` if odd) to catch single-bit radio noise.

## Objective

Write two functions:

1. `even_parity_bit(byte_val)` — validates `0 <= byte_val <= 255` (`ValueError` otherwise) and returns `0` if `byte_val` has an even number of `1` bits, or `1` if odd.
2. `bit_flips(a, b)` — given two equal-length `bytes` objects (raise `ValueError` if lengths differ), returns the total count of bit positions where `a` and `b` differ.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `byte_val.bit_count() % 2` gives `0` for even and `1` for odd!
2. `sum((x ^ y).bit_count() for x, y in zip(a, b))` counts all differing bits.

## Starter

```python
```

## Checks

```python
expect("even_parity_bit(0b10110000) == 1", lambda: get("even_parity_bit")(0b10110000), 1)
expect("even_parity_bit(0b10100000) == 0", lambda: get("even_parity_bit")(0b10100000), 0)
expect("bit_flips(b'\\x00\\xff', b'\\x0f\\xf0') == 8", lambda: get("bit_flips")(b"\x00\xff", b"\x0f\xf0"), 8)
```

## Hidden checks

```python
def bad_byte():
    try:
        get("even_parity_bit")(256)
        return False
    except ValueError:
        return True
check("byte > 255 raises ValueError", bad_byte)
expect("identical bytes have 0 bit flips", lambda: get("bit_flips")(b"kr", b"kr"), 0)
```

## Solution

```python
def even_parity_bit(byte_val):
    if isinstance(byte_val, bool) or not isinstance(byte_val, int) or not (0 <= byte_val <= 255):
        raise ValueError("byte must be 0..255")
    return byte_val.bit_count() % 2


def bit_flips(a, b):
    if len(a) != len(b):
        raise ValueError("inputs must have equal length")
    return sum((x ^ y).bit_count() for x, y in zip(a, b))
```

## Restored

Single-bit serial flips are caught immediately by the parity check.
