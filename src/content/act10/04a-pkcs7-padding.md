---
id: pkcs7-padding
kind: code
title: PKCS#7 block padding
system: Block press
symbol: equipment
scene: tests
skills: symmetric-crypto
---

## Briefing

Block ciphers like AES encrypt fixed-size chunks (16 bytes at a time). When a message is 20 bytes long, you need to pad it to a multiple of 16 — and be able to strip the exact padding unambiguously on decryption, **even when the original message already ended on a block boundary**!

## Objective

Write two functions implementing **PKCS#7 padding**:

1. `pkcs7_pad(data, block_size=16)` — validate `1 <= block_size <= 255` (raise `ValueError` otherwise). Compute `pad_len = block_size - (len(data) % block_size)` (so an already-aligned message gets a **full extra block** of `block_size` bytes!) and append `bytes([pad_len]) * pad_len`.
2. `pkcs7_unpad(padded, block_size=16)` — validate:
   - `1 <= block_size <= 255`
   - `padded` is non-empty and `len(padded) % block_size == 0`
   - The last byte `pad_len = padded[-1]` satisfies `1 <= pad_len <= block_size`
   - **Every** one of the final `pad_len` bytes equals `pad_len`
   Raise `ValueError` if any check fails; otherwise return `padded[:-pad_len]`.

```python
pkcs7_pad(b"YELLOW SUBMARINE", 20)  # b"YELLOW SUBMARINE\x04\x04\x04\x04"
pkcs7_pad(b"ABCD", 4)               # b"ABCD\x04\x04\x04\x04"
```

## Concept

Why does PKCS#7 add a full extra block when `len(data)` is already a multiple of `block_size`?

Because without that extra block, the receiver couldn't tell whether the last byte `\x01` was real message data or 1 byte of padding! With PKCS#7, the final byte **always** tells you how many padding bytes to remove (`1` through `block_size`), and checking **every** padding byte rejects corrupted or tampered blocks immediately.

## Hints

1. `pad_len = block_size - (len(data) % block_size)` automatically gives `block_size` when `len(data) % block_size == 0`.
2. In `pkcs7_unpad`, check `padded[-pad_len:] != bytes([pad_len]) * pad_len` and raise `ValueError` if they differ.

## Starter: guided

```python
def pkcs7_pad(data, block_size=16):
    if not (1 <= block_size <= 255):
        raise ValueError("invalid block size")
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def pkcs7_unpad(padded, block_size=16):
    if not (1 <= block_size <= 255) or not padded or len(padded) % block_size != 0:
        raise ValueError("invalid padded length")
    pad_len = padded[-1]
    # TODO: check 1 <= pad_len <= block_size and verify all trailing pad_len bytes
    pass
```

## Starter: standard

```python
def pkcs7_pad(data, block_size=16):
    pass


def pkcs7_unpad(padded, block_size=16):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("pads to multiple of block_size", lambda: get("pkcs7_pad")(b"YELLOW SUBMARINE", 20), b"YELLOW SUBMARINE\x04\x04\x04\x04")
expect("aligned input gets a full padding block", lambda: get("pkcs7_pad")(b"ABCD", 4), b"ABCD\x04\x04\x04\x04")
expect("round-trip unpad recovers empty and exact-length messages", lambda: (get("pkcs7_unpad")(get("pkcs7_pad")(b"", 8), 8), get("pkcs7_unpad")(get("pkcs7_pad")(b"12345678", 8), 8)), (b"", b"12345678"))
```

## Hidden checks

```python
def rejects(bad, bs=8):
    try:
        get("pkcs7_unpad")(bad, bs)
        return False
    except ValueError:
        return True
check("rejects zero pad byte", lambda: rejects(b"1234567\x00", 8))
check("rejects inconsistent pad bytes", lambda: rejects(b"12345\x01\x02\x03", 8))
check("rejects pad byte > block_size", lambda: rejects(b"1234567\x09", 8))
check("rejects empty padded input", lambda: rejects(b"", 8))
```

## Solution

```python
def pkcs7_pad(data, block_size=16):
    if not (1 <= block_size <= 255):
        raise ValueError("invalid block size")
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def pkcs7_unpad(padded, block_size=16):
    if not (1 <= block_size <= 255) or not padded or len(padded) % block_size != 0:
        raise ValueError("invalid padded length")
    pad_len = padded[-1]
    if pad_len < 1 or pad_len > block_size:
        raise ValueError("invalid padding byte")
    if padded[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("corrupted padding")
    return padded[:-pad_len]
```

## Restored

Every message pads cleanly to block boundaries and strict unpadding refuses malformed blocks without guesswork.
