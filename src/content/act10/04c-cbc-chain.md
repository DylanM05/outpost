---
id: cbc-chain
kind: code
title: Chain blocks with CBC mode
system: Block press
symbol: equipment
scene: tests
skills: symmetric-crypto
---

## Briefing

**CBC (Cipher Block Chaining)** fixes ECB's repeating-block leak by XORing every plaintext block with the **previous ciphertext block** before encrypting it — starting with a random **IV (Initialization Vector)** for block 0:

```text
C[0] = E(key, P[0] ^ IV)
C[i] = E(key, P[i] ^ C[i-1])
```

Even if `P[0] == P[1]`, `C[0]` and `C[1]` look completely unrelated!

## Objective

Write two functions that wrap any fixed-size block cipher `(enc_block, dec_block)` in CBC mode with PKCS#7 padding:

1. `cbc_encrypt(enc_block, key, iv, plaintext)` — `block_size = len(iv)`. Pad `plaintext` using PKCS#7 to a multiple of `block_size`. For each block `P[i]`, compute `C[i] = enc_block(key, xor(P[i], prev))` (with `prev = iv` initially, then `prev = C[i]`). Return the concatenated ciphertext `bytes`.
2. `cbc_decrypt(dec_block, key, iv, ciphertext)` — validate `ciphertext` is non-empty and a multiple of `len(iv)` (else raise `ValueError`). For each block `C[i]`, compute `P[i] = xor(dec_block(key, C[i]), prev)` (with `prev = iv`, then `prev = C[i]`). Concatenate and strictly PKCS#7-unpad to recover the original plaintext `bytes`.

## Concept

Notice the symmetry between CBC encryption and decryption:
- **Encrypt:** XOR with `prev`, *then* call `enc_block(key, ...)` -> update `prev = c_block`.
- **Decrypt:** call `dec_block(key, c_block)`, *then* XOR with `prev` -> update `prev = c_block`.

Because each plaintext block depends on the IV (which must be fresh and unpredictable for every message), encrypting the exact same message twice with two different IVs produces two totally different ciphertexts with **zero** repeated blocks!

## Hints

1. Reuse your PKCS#7 pad/unpad helpers and byte-wise XOR helper.
2. Remember: during decryption, `prev` becomes the **ciphertext** block `c_block` (not the decrypted plaintext block!).

## Starter: guided

```python
def _xor(a, b):
    return bytes(x ^ y for x, y in zip(a, b))


def _pad(data, block_size):
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def _unpad(padded, block_size):
    if not padded or len(padded) % block_size != 0:
        raise ValueError("bad length")
    pad_len = padded[-1]
    if pad_len < 1 or pad_len > block_size or padded[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("bad padding")
    return padded[:-pad_len]


def cbc_encrypt(enc_block, key, iv, plaintext):
    bs = len(iv)
    padded = _pad(plaintext, bs)
    out = bytearray()
    prev = iv
    for i in range(0, len(padded), bs):
        # TODO: XOR block with prev, encrypt with enc_block, update prev, extend out
        pass
    return bytes(out)


def cbc_decrypt(dec_block, key, iv, ciphertext):
    # TODO: reverse each block using dec_block and prev, then _unpad
    pass
```

## Starter: standard

```python
def cbc_encrypt(enc_block, key, iv, plaintext):
    pass


def cbc_decrypt(dec_block, key, iv, ciphertext):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
# Simple invertible toy block cipher (keyed byte substitution + rotation)
def toy_enc(key, block):
    bs = len(block)
    rotated = block[1:] + block[:1]
    return bytes((b + key[i % len(key)]) % 256 for i, b in enumerate(rotated))

def toy_dec(key, block):
    unkeyed = bytes((b - key[i % len(key)]) % 256 for i, b in enumerate(block))
    return unkeyed[-1:] + unkeyed[:-1]

key = b"OUTPOST-KEY-1234"
iv1 = b"\x10" * 16
iv2 = b"\x20" * 16
msg = b"SAME BLOCK HERE!" * 3

ct1 = get("cbc_encrypt")(toy_enc, key, iv1, msg)
ct2 = get("cbc_encrypt")(toy_enc, key, iv2, msg)
expect("cbc_decrypt recovers repeated-block plaintext", lambda: get("cbc_decrypt")(toy_dec, key, iv1, ct1), msg)
check("repeated plaintext blocks produce distinct ciphertext blocks", lambda: ct1[0:16] != ct1[16:32] and ct1[16:32] != ct1[32:48])
check("different IVs produce different ciphertexts", lambda: ct1 != ct2)
```

## Hidden checks

```python
def toy_enc(key, block):
    return bytes((b ^ key[i % len(key)]) for i, b in enumerate(block[::-1]))

def toy_dec(key, block):
    return bytes((b ^ key[i % len(key)]) for i, b in enumerate(block))[::-1]

key = b"12345678"
iv = b"ABCDEFGH"
expect("empty plaintext round-trips cleanly", lambda: get("cbc_decrypt")(toy_dec, key, iv, get("cbc_encrypt")(toy_enc, key, iv, b"")), b"")
def bad_len():
    try:
        get("cbc_decrypt")(toy_dec, key, iv, b"short")
        return False
    except ValueError:
        return True
check("non-multiple ciphertext raises ValueError", bad_len)
```

## Solution

```python
def _xor(a, b):
    return bytes(x ^ y for x, y in zip(a, b))


def _pad(data, block_size):
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def _unpad(padded, block_size):
    if not padded or len(padded) % block_size != 0:
        raise ValueError("invalid ciphertext length")
    pad_len = padded[-1]
    if pad_len < 1 or pad_len > block_size or padded[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("invalid padding")
    return padded[:-pad_len]


def cbc_encrypt(enc_block, key, iv, plaintext):
    bs = len(iv)
    if bs < 1 or bs > 255:
        raise ValueError("invalid IV length")
    padded = _pad(plaintext, bs)
    out = bytearray()
    prev = iv
    for i in range(0, len(padded), bs):
        block = padded[i : i + bs]
        c_block = enc_block(key, _xor(block, prev))
        out.extend(c_block)
        prev = c_block
    return bytes(out)


def cbc_decrypt(dec_block, key, iv, ciphertext):
    bs = len(iv)
    if bs < 1 or bs > 255 or not ciphertext or len(ciphertext) % bs != 0:
        raise ValueError("invalid ciphertext length")
    out = bytearray()
    prev = iv
    for i in range(0, len(ciphertext), bs):
        c_block = ciphertext[i : i + bs]
        out.extend(_xor(dec_block(key, c_block), prev))
        prev = c_block
    return _unpad(bytes(out), bs)
```

## Restored

CBC chaining hides every repeated block behind the IV and previous ciphertext — no more penguins leaking out of the block press.
