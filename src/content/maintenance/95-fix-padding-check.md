---
id: maintenance-fix-padding-check
title: Fix a sloppy PKCS#7 unpadder
system: Block press
symbol: equipment
scene: tests
skills: symmetric-crypto
reviewSkill: symmetric-crypto
prerequisite: cbc-chain
---

## Briefing

`unpad_block(padded, block_size=16)` below only inspects `padded[-1]` without validating block alignment, range (`1..block_size`), or whether **all** trailing padding bytes match! Fix it so corrupted padding is rejected cleanly.

## Objective

Modify `unpad_block(padded, block_size=16)` to strictly validate PKCS#7 padding and raise `ValueError` on any invalid length, zero/oversized pad byte, or mismatched trailing padding bytes.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `not padded or len(padded) % block_size != 0`.
2. Check `1 <= pad <= block_size` and `padded[-pad:] == bytes([pad]) * pad`.

## Starter

```python
def unpad_block(padded, block_size=16):
    pad = padded[-1]
    return padded[:-pad]
```

## Checks

```python
expect("valid PKCS#7 unpads cleanly", lambda: get("unpad_block")(b"HELLO\x03\x03\x03", 8), b"HELLO")
def rejects(bad, bs=8):
    try:
        get("unpad_block")(bad, bs)
        return False
    except ValueError:
        return True
check("rejects mismatched trailing bytes", lambda: rejects(b"HELLO\x01\x02\x03", 8))
check("rejects zero pad byte", lambda: rejects(b"1234567\x00", 8))
```

## Hidden checks

```python
def rejects(bad, bs=8):
    try:
        get("unpad_block")(bad, bs)
        return False
    except ValueError:
        return True
check("rejects pad > block_size", lambda: rejects(b"1234567\x09", 8))
check("rejects unaligned length", lambda: rejects(b"abc\x01", 8))
expect("full block of padding unpads to b''", lambda: get("unpad_block")(b"\x04\x04\x04\x04", 4), b"")
```

## Solution

```python
def unpad_block(padded, block_size=16):
    if not (1 <= block_size <= 255) or not padded or len(padded) % block_size != 0:
        raise ValueError("invalid padded length")
    pad = padded[-1]
    if pad < 1 or pad > block_size or padded[-pad:] != bytes([pad]) * pad:
        raise ValueError("invalid PKCS#7 padding")
    return padded[:-pad]
```

## Restored

Every trailing padding byte is now verified before stripping, rejecting malformed blocks immediately.
