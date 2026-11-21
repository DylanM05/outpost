---
id: spot-ecb-penguin
kind: code
title: Detect ECB mode leaks
system: Block press
symbol: equipment
scene: tests
skills: symmetric-crypto
---

## Briefing

**ECB (Electronic Codebook)** is the simplest — and most famously broken — block cipher mode: it encrypts each 16-byte block completely independently with the same key. That means **identical plaintext blocks always produce identical ciphertext blocks**! Encrypt a bitmap image in ECB mode and you can still see the picture's silhouette right through the ciphertext (the famous "ECB penguin").

## Objective

Write two functions:

1. `has_repeated_blocks(ciphertext, block_size=16)` — splits `ciphertext` (`bytes`) into consecutive `block_size`-byte chunks and returns `True` if any block appears more than once (and `False` otherwise).
2. `find_ecb_ciphertexts(ciphertexts, block_size=16)` — given a list of ciphertext `bytes`, returns a list of indices `[i, ...]` (in ascending order) whose ciphertext has at least one repeated block.

## Concept

Why is detecting repeated blocks enough to spot ECB in real traffic?

With a secure mode like CBC (with random IV) or CTR/GCM (with unique nonce), the probability of two 16-byte ciphertext blocks matching by chance in a normal message is astronomically small (around $2^{-128}$). In ECB mode, any repeated 16-byte header, padding, whitespace, or structured JSON field leaks immediately as an identical 16-byte ciphertext block!

## Hints

1. Slice `blocks = [ciphertext[i:i + block_size] for i in range(0, len(ciphertext) - block_size + 1, block_size)]` (only full `block_size` blocks).
2. `len(set(blocks)) < len(blocks)` is `True` iff at least one block repeated!

## Starter: guided

```python
def has_repeated_blocks(ciphertext, block_size=16):
    blocks = [
        ciphertext[i : i + block_size]
        for i in range(0, len(ciphertext) - block_size + 1, block_size)
    ]
    # TODO: return True if any block appears more than once
    pass


def find_ecb_ciphertexts(ciphertexts, block_size=16):
    # TODO: return sorted indices i where has_repeated_blocks(ciphertexts[i], block_size) is True
    pass
```

## Starter: standard

```python
def has_repeated_blocks(ciphertext, block_size=16):
    pass


def find_ecb_ciphertexts(ciphertexts, block_size=16):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
b1 = b"\x01" * 16
b2 = b"\x02" * 16
b3 = b"\x03" * 16
expect("repeated 16-byte block detected", lambda: get("has_repeated_blocks")(b1 + b2 + b1), True)
expect("distinct blocks return False", lambda: get("has_repeated_blocks")(b1 + b2 + b3), False)
expect(
    "find_ecb_ciphertexts locates ECB entries",
    lambda: get("find_ecb_ciphertexts")([b1 + b2 + b3, b2 + b1 + b2, b3 + b1, b3 + b3]),
    [1, 3],
)
```

## Hidden checks

```python
expect("custom block_size=8 works", lambda: get("has_repeated_blocks")(b"12345678abcdefgh12345678", 8), True)
expect("short ciphertext returns False", lambda: get("has_repeated_blocks")(b"tiny", 16), False)
```

## Solution

```python
def has_repeated_blocks(ciphertext, block_size=16):
    seen = set()
    for i in range(0, len(ciphertext) - block_size + 1, block_size):
        block = ciphertext[i : i + block_size]
        if block in seen:
            return True
        seen.add(block)
    return False


def find_ecb_ciphertexts(ciphertexts, block_size=16):
    return [i for i, ct in enumerate(ciphertexts) if has_repeated_blocks(ct, block_size)]
```

## Restored

The block auditor spots ECB leaks instantly — next we chain blocks together properly with CBC mode.
