---
id: bitwise-mask
kind: code
title: XOR bytes and count differing bits
system: Byte decoder
symbol: instrument
scene: tests
skills: encoding
---

## Briefing

Almost every symmetric cipher and cryptographic check rests on one bitwise operation: **XOR** (`^`). XOR is reversible (`(a ^ k) ^ k == a`), and counting the `1` bits in `a ^ b` measures the **Hamming distance** — how many bits differ between two digests or packets.

## Objective

Write two functions:

1. `xor_bytes(a, b)` — given two `bytes` objects of equal length, return a new `bytes` object where byte `i` is `a[i] ^ b[i]`. Raise `ValueError` if their lengths differ.
2. `hamming_distance(a, b)` — given two `bytes` objects of equal length, return the total number of bit positions where they differ. Raise `ValueError` if their lengths differ.

```python
xor_bytes(b"\x0f\xf0", b"\xff\x0f")      # b"\xf0\xff"
hamming_distance(b"this is a test", b"wokka wokka!!!")  # 37
```

## Concept

XOR compares two bits and outputs `1` if they are **different**, `0` if they are the **same**:

| `a` | `b` | `a ^ b` |
|---|---|---|
| `0` | `0` | `0` |
| `0` | `1` | `1` |
| `1` | `0` | `1` |
| `1` | `1` | `0` |

Two properties make XOR indispensable in cryptography:
1. **Self-inverse:** `x ^ k ^ k == x` — applying the same key twice recovers the original bytes.
2. **Bit difference count:** `(x ^ y).bit_count()` counts how many bits differ between byte `x` and byte `y`.

## Hints

1. Check `if len(a) != len(b): raise ValueError(...)` in both functions.
2. `bytes(x ^ y for x, y in zip(a, b))` computes `xor_bytes` in one clean line.
3. `sum((x ^ y).bit_count() for x, y in zip(a, b))` computes `hamming_distance`.

## Starter: guided

```python
def xor_bytes(a, b):
    if len(a) != len(b):
        raise ValueError("inputs must have equal length")
    # TODO: XOR each byte pair and return bytes
    pass


def hamming_distance(a, b):
    if len(a) != len(b):
        raise ValueError("inputs must have equal length")
    # TODO: sum the 1-bits of (x ^ y) across all byte pairs
    pass
```

## Starter: standard

```python
def xor_bytes(a, b):
    pass


def hamming_distance(a, b):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("xor_bytes basic", lambda: get("xor_bytes")(b"\x0f\xf0", b"\xff\x0f"), b"\xf0\xff")
expect("xor_bytes is self-inverse", lambda: get("xor_bytes")(get("xor_bytes")(b"ridge", b"key!!"), b"key!!"), b"ridge")
expect("classic hamming_distance example", lambda: get("hamming_distance")(b"this is a test", b"wokka wokka!!!"), 37)
```

## Hidden checks

```python
expect("identical bytes have distance 0", lambda: get("hamming_distance")(b"abc", b"abc"), 0)
def mismatch():
    try:
        get("xor_bytes")(b"ab", b"abc")
        return False
    except ValueError:
        return True
check("mismatched lengths raise ValueError in xor_bytes", mismatch)
def mismatch_h():
    try:
        get("hamming_distance")(b"a", b"ab")
        return False
    except ValueError:
        return True
check("mismatched lengths raise ValueError in hamming_distance", mismatch_h)
```

## Solution

```python
def xor_bytes(a, b):
    if len(a) != len(b):
        raise ValueError("inputs must have equal length")
    return bytes(x ^ y for x, y in zip(a, b))


def hamming_distance(a, b):
    if len(a) != len(b):
        raise ValueError("inputs must have equal length")
    return sum((x ^ y).bit_count() for x, y in zip(a, b))
```

## Restored

The byte decoder now runs clean XOR masks and measures bit-level avalanche distances.
