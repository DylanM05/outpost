---
id: avalanche-effect
kind: predict
title: Properties of cryptographic hashes
system: Hash vault
symbol: instrument
scene: console
skills: asymmetric-crypto, reading-code
---

## Briefing

Cryptographic hash functions like **SHA-256** are one-way fingerprints: fixed-size output, completely deterministic, and wildly sensitive to even a single flipped bit (the **avalanche effect**).

## Objective

Read the program and predict **every line it prints**.

## Concept

Every cryptographic hash function (SHA-256, SHA-3, BLAKE2) guarantees four core properties:
1. **Fixed output size:** SHA-256 *always* outputs 256 bits = `32` bytes = `64` hex characters — whether you hash `b""` or a 10 GB disk image.
2. **Deterministic:** the same input always yields the exact same digest.
3. **Avalanche effect / preimage resistance:** changing one character completely scrambles roughly half the output bits, and you can't invert the digest back to the input.
4. **Collision resistance:** finding two different inputs with the same SHA-256 digest is computationally infeasible.

## Hints

1. `sha256(...).digest()` is always `32` bytes; `.hexdigest()` represents each byte as 2 hex digits (`64` characters).
2. `h1` and `h2` hash the exact same bytes; `h3` changes `"1"` to `"2"`.
3. Even `b""` and `b"A" * 10000` produce 32-byte digests!

## Program

```python
import hashlib

h1 = hashlib.sha256(b"kestrel-1").digest()
h2 = hashlib.sha256(b"kestrel-1").digest()
h3 = hashlib.sha256(b"kestrel-2").digest()

print(len(h1), len(h1.hex()))
print(h1 == h2, h1 == h3)
print(len(hashlib.sha256(b"").digest()), len(hashlib.sha256(b"A" * 10000).digest()))
```

## Output

```text
32 64
True False
32 32
```

## Restored

Fixed 32-byte fingerprints, exact determinism, and total sensitivity to single-bit edits — the hash vault is online.
