---
id: keystream-generator
kind: code
title: Counter-mode stream cipher
system: Stream bench
symbol: controller
scene: tests
skills: symmetric-crypto
---

## Briefing

Instead of carrying gigabytes of random one-time pad tape, modern **stream ciphers** expand a short secret `key` and a per-message **nonce** ("number used once") into a pseudorandom keystream of any length, hashing `(key, nonce, counter)` block by block.

## Objective

Write two functions:

1. `keystream(key, nonce, length)` — accepts `key: bytes`, `nonce: bytes`, and `length: int` (`>= 0`). Generates blocks for `counter = 0, 1, 2, ...` where each 32-byte block is:
   ```python
   hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest()
   ```
   Concatenate enough blocks to reach `length` bytes and return the exact first `length` bytes.
2. `stream_xor(key, nonce, data)` — XORs `data: bytes` with `keystream(key, nonce, len(data))` and returns the resulting `bytes`. (Encrypting and decrypting call the same function!)

## Concept

Notice how clean a counter-mode stream cipher is:
- Different messages encrypted under the same `key` MUST use a **different `nonce`** (for example, a fresh random 16-byte nonce or a strictly increasing message counter).
- Because the keystream depends on `(key, nonce, counter)`, changing even one bit of the nonce generates an entirely unrelated keystream.
- You never need padding: the keystream is trimmed to the exact length of `data`.

*(Note: in production you would use a standard AEAD primitive like AES-GCM or ChaCha20-Poly1305 rather than rolling your own cipher — building a toy SHA-256 CTR stream here makes the exact mechanics transparent!)*

## Hints

1. Loop with `counter = 0`, appending `hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest()` to a `bytearray` while `len(buf) < length`, then return `bytes(buf[:length])`.
2. In `stream_xor`, generate `ks = keystream(key, nonce, len(data))` and return `bytes(d ^ k for d, k in zip(data, ks))`.

## Starter: guided

```python
import hashlib


def keystream(key, nonce, length):
    buf = bytearray()
    counter = 0
    while len(buf) < length:
        # TODO: hash key + nonce + 4-byte big-endian counter and extend buf
        counter += 1
        break
    return bytes(buf[:length])


def stream_xor(key, nonce, data):
    # TODO: XOR data with keystream(key, nonce, len(data))
    pass
```

## Starter: standard

```python
import hashlib


def keystream(key, nonce, length):
    pass


def stream_xor(key, nonce, data):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
key = b"kestrel-ridge-32-byte-secret-key"
n1 = b"\x00" * 12
n2 = b"\x00" * 11 + b"\x01"
msg = b"North relay battery at 84%; solar array nominal; snow depth 1.4m."
ct1 = get("stream_xor")(key, n1, msg)
ct2 = get("stream_xor")(key, n2, msg)
expect("decrypting with same key and nonce recovers plaintext", lambda: get("stream_xor")(key, n1, ct1), msg)
check("different nonces produce completely different ciphertexts", lambda: ct1 != ct2 and len(ct1) == len(msg))
```

## Hidden checks

```python
import hashlib
key = b"K" * 16
nonce = b"N" * 12
expected_first = hashlib.sha256(key + nonce + (0).to_bytes(4, "big")).digest()
expected_second = hashlib.sha256(key + nonce + (1).to_bytes(4, "big")).digest()
expect("matches exact SHA-256 counter block layout", lambda: get("keystream")(key, nonce, 40), (expected_first + expected_second)[:40])
expect("zero-length keystream is empty bytes", lambda: get("keystream")(key, nonce, 0), b"")
```

## Solution

```python
import hashlib


def keystream(key, nonce, length):
    buf = bytearray()
    counter = 0
    while len(buf) < length:
        buf.extend(hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest())
        counter += 1
    return bytes(buf[:length])


def stream_xor(key, nonce, data):
    ks = keystream(key, nonce, len(data))
    return bytes(d ^ k for d, k in zip(data, ks))
```

## Restored

The stream bench generates multi-block keystreams on demand, encrypting and decrypting any payload length without padding.
