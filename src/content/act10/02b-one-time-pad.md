---
id: one-time-pad
kind: code
title: The one-time pad
system: Cipher wheel
symbol: equipment
scene: tests
skills: symmetric-crypto
---

## Briefing

At the opposite extreme from a 26-key Caesar wheel sits the **one-time pad (OTP)**: XOR every byte of plaintext with a truly random key byte that is at least as long as the message and **never reused**. Claude Shannon proved it is mathematically unbreakable — even with infinite computing power.

## Objective

Write two functions:

1. `otp_encrypt(plaintext, key)` — accepts `plaintext` (`bytes`) and `key` (`bytes`). Raise `ValueError` if `len(key) < len(plaintext)`. Otherwise return `bytes` where each byte is `plaintext[i] ^ key[i]`.
2. `otp_decrypt(ciphertext, key)` — accepts `ciphertext` (`bytes`) and `key` (`bytes`). Raise `ValueError` if `len(key) < len(ciphertext)`. Otherwise recover and return the original plaintext `bytes`.

## Concept

With a truly random, single-use key at least as long as the message:
- Every possible plaintext of the same length is equally likely to have produced the observed ciphertext.
- Because XOR is its own inverse, `otp_decrypt` is the exact same operation as `otp_encrypt`!

Why don't we use one-time pads for everything on the internet? Because **distributing a truly random key as big as all the data you'll ever send** — and never accidentally reusing a single byte of it — is impractical at scale. That's why modern stream ciphers expand a short secret key + unique nonce into a pseudorandom keystream.

## Hints

1. Check `if len(key) < len(plaintext): raise ValueError(...)`.
2. Notice `zip(plaintext, key)` naturally stops at `len(plaintext)` when `key` is longer!

## Starter: guided

```python
def otp_encrypt(plaintext, key):
    if len(key) < len(plaintext):
        raise ValueError("one-time pad key must be at least as long as plaintext")
    return bytes(p ^ k for p, k in zip(plaintext, key))


def otp_decrypt(ciphertext, key):
    # TODO: validate key length and reverse the XOR
    pass
```

## Starter: standard

```python
def otp_encrypt(plaintext, key):
    pass


def otp_decrypt(ciphertext, key):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
key = b"\x91\x4f\x22\xa8\x13\x77\xcc\x05\xee\x31"
msg = b"SEND FUEL"
ct = get("otp_encrypt")(msg, key)
check("ciphertext differs from plaintext", lambda: ct != msg and len(ct) == len(msg))
expect("otp_decrypt recovers original message", lambda: get("otp_decrypt")(ct, key), msg)
```

## Hidden checks

```python
def short_key():
    try:
        get("otp_encrypt")(b"hello", b"1234")
        return False
    except ValueError:
        return True
check("too-short key raises ValueError on encrypt", short_key)
def short_key_dec():
    try:
        get("otp_decrypt")(b"hello", b"1234")
        return False
    except ValueError:
        return True
check("too-short key raises ValueError on decrypt", short_key_dec)
```

## Solution

```python
def otp_encrypt(plaintext, key):
    if len(key) < len(plaintext):
        raise ValueError("key must be at least as long as plaintext")
    return bytes(p ^ k for p, k in zip(plaintext, key))


def otp_decrypt(ciphertext, key):
    if len(key) < len(ciphertext):
        raise ValueError("key must be at least as long as ciphertext")
    return bytes(c ^ k for c, k in zip(ciphertext, key))
```

## Restored

One-time pad encryption and decryption work cleanly — now let's see what happens the instant someone breaks its #1 rule.
