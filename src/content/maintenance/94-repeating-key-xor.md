---
id: maintenance-repeating-key-xor
title: Repeating-key XOR cipher
system: Cipher wheel
symbol: equipment
scene: tests
skills: symmetric-crypto
reviewSkill: symmetric-crypto
prerequisite: cbc-chain
---

## Briefing

An older relay logs messages using repeating-key XOR (cycling a short key byte by byte across the message). Implement it cleanly so the decoder can read legacy tapes.

## Objective

Write `repeating_xor(data, key)` accepting `data: bytes` and non-empty `key: bytes` (raise `ValueError` if `key` is empty). Return `bytes` where byte `i` is `data[i] ^ key[i % len(key)]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if not key: raise ValueError(...)`.
2. `bytes(b ^ key[i % len(key)] for i, b in enumerate(data))`.

## Starter

```python
```

## Checks

```python
ct = get("repeating_xor")(b"KESTREL RIDGE", b"ICE")
expect("symmetric round-trip recovers original", lambda: get("repeating_xor")(ct, b"ICE"), b"KESTREL RIDGE")
expect("first three bytes match direct XOR", lambda: ct[:3], bytes(a ^ b for a, b in zip(b"KES", b"ICE")))
```

## Hidden checks

```python
def empty_key():
    try:
        get("repeating_xor")(b"abc", b"")
        return False
    except ValueError:
        return True
check("empty key raises ValueError", empty_key)
expect("empty data returns b''", lambda: get("repeating_xor")(b"", b"KEY"), b"")
```

## Solution

```python
def repeating_xor(data, key):
    if not key:
        raise ValueError("key must not be empty")
    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
```

## Restored

Legacy XOR tapes decode cleanly, and empty keys fail fast instead of raising `ZeroDivisionError`.
