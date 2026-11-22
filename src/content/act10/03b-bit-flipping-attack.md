---
id: bit-flipping-attack
kind: predict
title: Malleability and bit-flipping
system: Stream bench
symbol: controller
scene: console
skills: symmetric-crypto, reading-code
---

## Briefing

**Encryption alone provides secrecy, NOT integrity!** Because a stream cipher simply XORs plaintext with a keystream, an attacker who knows where a byte sits in the message can flip specific bits in the ciphertext — and flip the exact same bits in the decrypted plaintext without ever knowing the key!

## Objective

Trace the bit-flipping attack below and predict what the unauthenticated receiver prints after decrypting the tampered ciphertext.

## Concept

Look closely at the math at index `i`:

```text
c[i]      = p[i] ^ k[i]
tampered  = c[i] ^ (ord('1') ^ ord('9'))
decrypted = tampered ^ k[i]
          = p[i] ^ (ord('1') ^ ord('9'))
```

When `p[i]` was `ord('1')`, `ord('1') ^ ord('1') ^ ord('9') == ord('9')`! The secret keystream `k[i]` cancelled out completely.

This is why modern systems **always** authenticate ciphertexts (with a MAC like HMAC or an AEAD cipher like AES-GCM / ChaCha20-Poly1305) and refuse to decrypt tampered bytes.

## Hints

1. `msg` is `b"SEND 100 CRATES"`. Index `5` is `ord("1")`.
2. XORing `ct[5]` with `ord("1") ^ ord("9")` changes that single decrypted byte from `"1"` to `"9"`.
3. Every other byte is untouched.

## Program

```python
keystream = b"\x5a\x19\xc3\x44\x8b\x2f\x71\x0e\x99\xa2\x33\x10\xfe\x67\x41"
msg = b"SEND 100 CRATES"
ct = bytearray(m ^ k for m, k in zip(msg, keystream))

# Attacker never sees keystream, only knows index 5 is '1':
ct[5] ^= ord("1") ^ ord("9")

decrypted = bytes(c ^ k for c, k in zip(ct, keystream))
print(decrypted.decode("ascii"))
```

## Output

```text
SEND 900 CRATES
```

## Restored

One flipped byte turned 100 crates into 900 without touching the key — proving why encryption without authentication is half a lock.
