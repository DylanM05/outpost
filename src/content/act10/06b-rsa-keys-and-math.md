---
id: rsa-keys-and-math
kind: code
title: RSA keys, encryption, and signatures
system: Key exchange
symbol: controller
scene: tests
skills: asymmetric-crypto
---

## Briefing

Diffie-Hellman gives two parties a shared secret, but **asymmetric (public-key) cryptography** like **RSA** splits the key in two:
- Anyone can encrypt with your **public key** `(e, n)`, and only your **private key** `(d, n)` can decrypt.
- Conversely, only your **private key** can **sign** a message digest, and anyone with your **public key** can verify the signature!

## Objective

Write five functions implementing textbook RSA arithmetic:

1. `rsa_keygen(p, q, e=65537)` — given two distinct primes `p` and `q` and public exponent `e`:
   - Compute `n = p * q` and Euler's totient `phi = (p - 1) * (q - 1)`.
   - If `p == q` or `math.gcd(e, phi) != 1`, raise `ValueError`.
   - Compute the private exponent `d = pow(e, -1, phi)`.
   - Return `{"public": (e, n), "private": (d, n)}`.
2. `rsa_encrypt(msg_int, public_key)` — given `0 <= msg_int < n` (else raise `ValueError`) and `public_key = (e, n)`, return `pow(msg_int, e, n)`.
3. `rsa_decrypt(cipher_int, private_key)` — given `private_key = (d, n)`, return `pow(cipher_int, d, n)`.
4. `rsa_sign(message_bytes, private_key)` — compute `digest_int = int.from_bytes(hashlib.sha256(message_bytes).digest(), "big") % n` and sign it with `pow(digest_int, d, n)`.
5. `rsa_verify(message_bytes, signature_int, public_key)` — verify that `pow(signature_int, e, n) == int.from_bytes(hashlib.sha256(message_bytes).digest(), "big") % n`.

## Concept

RSA works because Euler's theorem guarantees that when $e \cdot d \equiv 1 \pmod{\phi(n)}$:

$$(m^e)^d \equiv m \pmod n \quad \text{and} \quad (h^d)^e \equiv h \pmod n$$

Computing `d = pow(e, -1, phi)` is instant when you know `p` and `q` — and infeasible for anyone who only knows their product `n = p * q` (for real 2048-bit+ primes).

*(In production, RSA always adds randomized padding schemes like OAEP for encryption and PSS for signatures, and encrypts a random symmetric key rather than bulk data — hybrid encryption!)*

## Hints

1. `pow(e, -1, phi)` computes the modular multiplicative inverse of `e` modulo `phi` natively in Python.
2. In `rsa_encrypt`, check `if not (0 <= msg_int < n): raise ValueError(...)`.
3. In `rsa_sign` / `rsa_verify`, compute the exact same `digest_int = int.from_bytes(hashlib.sha256(message_bytes).digest(), "big") % n`.

## Starter: guided

```python
import hashlib
import math


def rsa_keygen(p, q, e=65537):
    if p == q:
        raise ValueError("primes must be distinct")
    n = p * q
    phi = (p - 1) * (q - 1)
    if math.gcd(e, phi) != 1:
        raise ValueError("e must be coprime to phi")
    d = pow(e, -1, phi)
    return {"public": (e, n), "private": (d, n)}


def rsa_encrypt(msg_int, public_key):
    e, n = public_key
    # TODO: check 0 <= msg_int < n and return pow(msg_int, e, n)
    pass


def rsa_decrypt(cipher_int, private_key):
    d, n = private_key
    return pow(cipher_int, d, n)


def rsa_sign(message_bytes, private_key):
    # TODO: hash message_bytes with sha256, convert to int % n, raise to d mod n
    pass


def rsa_verify(message_bytes, signature_int, public_key):
    # TODO: compare pow(signature_int, e, n) to the same digest_int % n
    pass
```

## Starter: standard

```python
import hashlib
import math


def rsa_keygen(p, q, e=65537):
    pass


def rsa_encrypt(msg_int, public_key):
    pass


def rsa_decrypt(cipher_int, private_key):
    pass


def rsa_sign(message_bytes, private_key):
    pass


def rsa_verify(message_bytes, signature_int, public_key):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
# Two distinct 128-bit primes
p = 340282366920938463463374607431768211297
q = 340282366920938463463374607431768211283
keys = get("rsa_keygen")(p, q)
ct = get("rsa_encrypt")(1234567890123456789, keys["public"])
expect("RSA encrypt/decrypt round-trip", lambda: get("rsa_decrypt")(ct, keys["private"]), 1234567890123456789)
sig = get("rsa_sign")(b"DEPLOY RELEASE v2.0", keys["private"])
expect("RSA signature verifies on original message", lambda: get("rsa_verify")(b"DEPLOY RELEASE v2.0", sig, keys["public"]), True)
expect("RSA signature rejects tampered message", lambda: get("rsa_verify")(b"DEPLOY RELEASE v2.1", sig, keys["public"]), False)
```

## Hidden checks

```python
def bad_e():
    try:
        get("rsa_keygen")(61, 53, e=6)
        return False
    except ValueError:
        return True
check("non-coprime e raises ValueError", bad_e)
def too_big():
    keys = get("rsa_keygen")(61, 53, e=17)
    try:
        get("rsa_encrypt")(61 * 53, keys["public"])
        return False
    except ValueError:
        return True
check("msg_int >= n raises ValueError", too_big)
```

## Solution

```python
import hashlib
import math


def rsa_keygen(p, q, e=65537):
    if p == q:
        raise ValueError("primes must be distinct")
    n = p * q
    phi = (p - 1) * (q - 1)
    if math.gcd(e, phi) != 1:
        raise ValueError("e must be coprime to phi")
    d = pow(e, -1, phi)
    return {"public": (e, n), "private": (d, n)}


def rsa_encrypt(msg_int, public_key):
    e, n = public_key
    if not (0 <= msg_int < n):
        raise ValueError("message integer out of range")
    return pow(msg_int, e, n)


def rsa_decrypt(cipher_int, private_key):
    d, n = private_key
    return pow(cipher_int, d, n)


def _digest_mod(message_bytes, n):
    return int.from_bytes(hashlib.sha256(message_bytes).digest(), "big") % n


def rsa_sign(message_bytes, private_key):
    d, n = private_key
    return pow(_digest_mod(message_bytes, n), d, n)


def rsa_verify(message_bytes, signature_int, public_key):
    e, n = public_key
    return pow(signature_int, e, n) == _digest_mod(message_bytes, n)
```

## Restored

Public keys encrypt and verify; private keys decrypt and sign — the valley can now verify release signatures from Kestrel Ridge.
